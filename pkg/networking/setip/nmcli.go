package setip

import (
	"fmt"
	"os/exec"
	"strings"
)

// nmcliConfigurator uses NetworkManager's nmcli tool.
type nmcliConfigurator struct{}

func (n *nmcliConfigurator) Name() Backend { return BackendNetworkManager }

func (n *nmcliConfigurator) IsAvailable() bool {
	out, err := exec.Command("nmcli", "-v").Output()
	if err != nil {
		return false
	}
	return strings.Contains(string(out), "nmcli")
}

func (n *nmcliConfigurator) GetConnection(iface string) (*ConnectionInfo, error) {
	connName, err := n.connectionName(iface)
	if err != nil {
		return nil, err
	}

	out, err := exec.Command("nmcli", "-t", "-f",
		"ipv4.method,ipv4.addresses,ipv4.gateway,ipv4.dns",
		"connection", "show", connName).Output()
	if err != nil {
		return nil, fmt.Errorf("nmcli show %q: %w", connName, err)
	}

	info := &ConnectionInfo{
		Interface: iface,
		Backend:   BackendNetworkManager,
	}

	for _, line := range strings.Split(string(out), "\n") {
		parts := strings.SplitN(line, ":", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])
		if val == "" || val == "--" {
			continue
		}

		switch key {
		case "ipv4.method":
			if val == "manual" {
				info.Method = "static"
			} else {
				info.Method = val // "auto" = dhcp
			}
		case "ipv4.addresses":
			// e.g. "192.168.1.10/24"
			addr, prefix := parseCIDR(val)
			info.Address = addr
			info.Prefix = prefix
		case "ipv4.gateway":
			info.Gateway = val
		case "ipv4.dns":
			info.DNS = splitCSV(val)
		}
	}

	return info, nil
}

func (n *nmcliConfigurator) SetStatic(cfg StaticConfig) error {
	if err := validateStatic(cfg); err != nil {
		return err
	}

	connName, err := n.connectionName(cfg.Interface)
	if err != nil {
		return err
	}

	cidr := fmt.Sprintf("%s/%d", cfg.Address, cfg.Prefix)

	args := []string{"connection", "modify", connName,
		"ipv4.method", "manual",
		"ipv4.addresses", cidr,
	}
	if cfg.Gateway != "" {
		args = append(args, "ipv4.gateway", cfg.Gateway)
	}
	if len(cfg.DNS) > 0 {
		args = append(args, "ipv4.dns", strings.Join(cfg.DNS, ","))
	}

	if out, err := exec.Command("nmcli", args...).CombinedOutput(); err != nil {
		return fmt.Errorf("nmcli modify: %s: %w", string(out), err)
	}

	// Reactivate the connection to apply changes.
	if out, err := exec.Command("nmcli", "connection", "up", connName).CombinedOutput(); err != nil {
		return fmt.Errorf("nmcli up: %s: %w", string(out), err)
	}

	return nil
}

func (n *nmcliConfigurator) SetDHCP(iface string) error {
	connName, err := n.connectionName(iface)
	if err != nil {
		return err
	}

	args := []string{"connection", "modify", connName,
		"ipv4.method", "auto",
		"ipv4.addresses", "",
		"ipv4.gateway", "",
		"ipv4.dns", "",
	}

	if out, err := exec.Command("nmcli", args...).CombinedOutput(); err != nil {
		return fmt.Errorf("nmcli modify: %s: %w", string(out), err)
	}

	if out, err := exec.Command("nmcli", "connection", "up", connName).CombinedOutput(); err != nil {
		return fmt.Errorf("nmcli up: %s: %w", string(out), err)
	}

	return nil
}

// connectionName finds the NM connection name for a device.
func (n *nmcliConfigurator) connectionName(iface string) (string, error) {
	out, err := exec.Command("nmcli", "-t", "-f", "NAME,DEVICE",
		"connection", "show", "--active").Output()
	if err != nil {
		// Fallback: try all connections (not just active).
		out, err = exec.Command("nmcli", "-t", "-f", "NAME,DEVICE",
			"connection", "show").Output()
		if err != nil {
			return "", fmt.Errorf("nmcli list connections: %w", err)
		}
	}

	for _, line := range strings.Split(string(out), "\n") {
		parts := strings.SplitN(line, ":", 2)
		if len(parts) == 2 && strings.TrimSpace(parts[1]) == iface {
			return strings.TrimSpace(parts[0]), nil
		}
	}

	// If no connection exists, use the interface name as a default connection name.
	return iface, nil
}
