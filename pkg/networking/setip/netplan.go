package setip

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

const netplanDir = "/etc/netplan"

// netplanConfigurator manages network config via netplan YAML files.
type netplanConfigurator struct{}

func (n *netplanConfigurator) Name() Backend { return BackendNetplan }

func (n *netplanConfigurator) IsAvailable() bool {
	if _, err := exec.LookPath("netplan"); err != nil {
		return false
	}
	// Must also have the config directory.
	info, err := os.Stat(netplanDir)
	return err == nil && info.IsDir()
}

func (n *netplanConfigurator) GetConnection(iface string) (*ConnectionInfo, error) {
	cfg, _, err := n.findInterface(iface)
	if err != nil {
		return nil, err
	}

	info := &ConnectionInfo{
		Interface: iface,
		Backend:   BackendNetplan,
	}

	if dhcp, ok := cfg["dhcp4"].(bool); ok && dhcp {
		info.Method = "dhcp"
		return info, nil
	}

	info.Method = "static"
	if addrs, ok := cfg["addresses"].([]interface{}); ok && len(addrs) > 0 {
		addr, prefix := parseCIDR(fmt.Sprint(addrs[0]))
		info.Address = addr
		info.Prefix = prefix
	}
	if routes, ok := cfg["routes"].([]interface{}); ok {
		for _, r := range routes {
			rm, ok := r.(map[string]interface{})
			if !ok {
				continue
			}
			if to, _ := rm["to"].(string); to == "default" || to == "0.0.0.0/0" {
				info.Gateway = fmt.Sprint(rm["via"])
				break
			}
		}
	}
	// Legacy gateway4 field.
	if info.Gateway == "" {
		if gw, ok := cfg["gateway4"].(string); ok {
			info.Gateway = gw
		}
	}
	if ns, ok := cfg["nameservers"].(map[string]interface{}); ok {
		if addrs, ok := ns["addresses"].([]interface{}); ok {
			for _, a := range addrs {
				info.DNS = append(info.DNS, fmt.Sprint(a))
			}
		}
	}

	return info, nil
}

func (n *netplanConfigurator) SetStatic(cfg StaticConfig) error {
	if err := validateStatic(cfg); err != nil {
		return err
	}

	ifaceCfg := map[string]interface{}{
		"dhcp4":     false,
		"addresses": []string{fmt.Sprintf("%s/%d", cfg.Address, cfg.Prefix)},
	}

	if cfg.Gateway != "" {
		ifaceCfg["routes"] = []map[string]string{
			{"to": "default", "via": cfg.Gateway},
		}
	}
	if len(cfg.DNS) > 0 {
		ifaceCfg["nameservers"] = map[string]interface{}{
			"addresses": cfg.DNS,
		}
	}

	return n.writeAndApply(cfg.Interface, ifaceCfg)
}

func (n *netplanConfigurator) SetDHCP(iface string) error {
	ifaceCfg := map[string]interface{}{
		"dhcp4": true,
	}
	return n.writeAndApply(iface, ifaceCfg)
}

// writeAndApply writes a netplan config file and applies it.
func (n *netplanConfigurator) writeAndApply(iface string, ifaceCfg map[string]interface{}) error {
	doc := map[string]interface{}{
		"network": map[string]interface{}{
			"version": 2,
			"ethernets": map[string]interface{}{
				iface: ifaceCfg,
			},
		},
	}

	data, err := yaml.Marshal(doc)
	if err != nil {
		return fmt.Errorf("marshal netplan yaml: %w", err)
	}

	// Write to a dedicated file per interface so we don't clobber other configs.
	path := filepath.Join(netplanDir, fmt.Sprintf("90-rubix-%s.yaml", iface))
	if err := os.WriteFile(path, data, 0600); err != nil {
		return fmt.Errorf("write %s: %w", path, err)
	}

	if out, err := exec.Command("netplan", "apply").CombinedOutput(); err != nil {
		return fmt.Errorf("netplan apply: %s: %w", string(out), err)
	}

	return nil
}

// findInterface searches all netplan YAML files for a given interface config.
func (n *netplanConfigurator) findInterface(iface string) (map[string]interface{}, string, error) {
	files, err := filepath.Glob(filepath.Join(netplanDir, "*.yaml"))
	if err != nil {
		return nil, "", err
	}

	for _, f := range files {
		data, err := os.ReadFile(f)
		if err != nil {
			continue
		}

		var doc map[string]interface{}
		if err := yaml.Unmarshal(data, &doc); err != nil {
			continue
		}

		network, ok := doc["network"].(map[string]interface{})
		if !ok {
			continue
		}

		// Check ethernets, wifis, bridges, etc.
		for _, section := range []string{"ethernets", "wifis", "bridges", "bonds"} {
			devices, ok := network[section].(map[string]interface{})
			if !ok {
				continue
			}
			if cfg, ok := devices[iface].(map[string]interface{}); ok {
				return cfg, f, nil
			}
		}
	}

	return nil, "", fmt.Errorf("interface %q not found in any netplan config", iface)
}

