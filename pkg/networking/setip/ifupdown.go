package setip

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

const interfacesFile = "/etc/network/interfaces"

// ifupdownConfigurator manages /etc/network/interfaces (legacy Debian / old RPi).
type ifupdownConfigurator struct{}

func (i *ifupdownConfigurator) Name() Backend { return BackendIfupdown }

func (i *ifupdownConfigurator) IsAvailable() bool {
	if _, err := os.Stat(interfacesFile); err != nil {
		return false
	}
	// At least one of ifup/ifdown should exist.
	_, errUp := exec.LookPath("ifup")
	_, errDown := exec.LookPath("ifdown")
	return errUp == nil || errDown == nil
}

func (i *ifupdownConfigurator) GetConnection(iface string) (*ConnectionInfo, error) {
	blocks, err := parseInterfacesFile()
	if err != nil {
		return nil, err
	}

	block, ok := blocks[iface]
	if !ok {
		return nil, fmt.Errorf("interface %q not found in %s", iface, interfacesFile)
	}

	info := &ConnectionInfo{
		Interface: iface,
		Backend:   BackendIfupdown,
	}

	if strings.Contains(block.method, "dhcp") {
		info.Method = "dhcp"
	} else {
		info.Method = "static"
	}
	info.Address = block.options["address"]
	if mask := block.options["netmask"]; mask != "" {
		info.Prefix = netmaskToPrefix(mask)
	}
	info.Gateway = block.options["gateway"]
	if dns := block.options["dns-nameservers"]; dns != "" {
		info.DNS = strings.Fields(dns)
	}

	return info, nil
}

func (i *ifupdownConfigurator) SetStatic(cfg StaticConfig) error {
	if err := validateStatic(cfg); err != nil {
		return err
	}

	block := ifaceBlock{
		method: "static",
		options: map[string]string{
			"address": cfg.Address,
			"netmask": prefixToNetmask(cfg.Prefix),
		},
	}
	if cfg.Gateway != "" {
		block.options["gateway"] = cfg.Gateway
	}
	if len(cfg.DNS) > 0 {
		block.options["dns-nameservers"] = strings.Join(cfg.DNS, " ")
	}

	if err := writeInterfaceBlock(cfg.Interface, block); err != nil {
		return err
	}

	return i.restart(cfg.Interface)
}

func (i *ifupdownConfigurator) SetDHCP(iface string) error {
	block := ifaceBlock{
		method:  "dhcp",
		options: map[string]string{},
	}

	if err := writeInterfaceBlock(iface, block); err != nil {
		return err
	}

	return i.restart(iface)
}

func (i *ifupdownConfigurator) restart(iface string) error {
	// ifdown + ifup to apply changes.
	_ = exec.Command("ifdown", iface).Run() // may fail if not up, that's ok
	if out, err := exec.Command("ifup", iface).CombinedOutput(); err != nil {
		return fmt.Errorf("ifup %s: %s: %w", iface, string(out), err)
	}
	return nil
}

// --- /etc/network/interfaces parser ---

type ifaceBlock struct {
	method  string
	options map[string]string
}

func parseInterfacesFile() (map[string]ifaceBlock, error) {
	f, err := os.Open(interfacesFile)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	blocks := make(map[string]ifaceBlock)
	var currentIface string

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		fields := strings.Fields(line)

		// "iface eth0 inet static" or "iface eth0 inet dhcp"
		if fields[0] == "iface" && len(fields) >= 4 {
			currentIface = fields[1]
			blocks[currentIface] = ifaceBlock{
				method:  fields[3],
				options: make(map[string]string),
			}
			continue
		}

		// Options like "  address 192.168.1.10"
		if currentIface != "" && len(fields) >= 2 {
			// auto, allow-hotplug, source, etc. start a new context
			switch fields[0] {
			case "auto", "allow-hotplug", "source", "source-directory", "mapping":
				currentIface = ""
				continue
			}
			if b, ok := blocks[currentIface]; ok {
				b.options[fields[0]] = strings.Join(fields[1:], " ")
				blocks[currentIface] = b
			}
		}
	}

	return blocks, scanner.Err()
}

// writeInterfaceBlock replaces or appends an interface block in /etc/network/interfaces.
func writeInterfaceBlock(iface string, block ifaceBlock) error {
	// Read existing file.
	data, err := os.ReadFile(interfacesFile)
	if err != nil {
		return fmt.Errorf("read %s: %w", interfacesFile, err)
	}

	lines := strings.Split(string(data), "\n")
	var result []string
	skip := false

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		fields := strings.Fields(trimmed)

		// Detect start of target iface block.
		if len(fields) >= 2 && fields[0] == "iface" && fields[1] == iface {
			skip = true
			continue
		}

		// Detect the "auto <iface>" line preceding the block.
		if len(fields) == 2 && (fields[0] == "auto" || fields[0] == "allow-hotplug") && fields[1] == iface {
			skip = false // keep scanning, we'll re-add this
			continue
		}

		// Stop skipping when we hit a new block.
		if skip && len(fields) > 0 {
			switch fields[0] {
			case "iface", "auto", "allow-hotplug", "source", "mapping":
				skip = false
			default:
				// Still part of the old block (indented option).
				if strings.HasPrefix(line, " ") || strings.HasPrefix(line, "\t") {
					continue
				}
				skip = false
			}
		}

		if !skip {
			result = append(result, line)
		}
	}

	// Remove trailing empty lines.
	for len(result) > 0 && strings.TrimSpace(result[len(result)-1]) == "" {
		result = result[:len(result)-1]
	}

	// Append the new block.
	result = append(result, "")
	result = append(result, fmt.Sprintf("auto %s", iface))
	result = append(result, fmt.Sprintf("iface %s inet %s", iface, block.method))

	// Write options in a consistent order.
	for _, key := range []string{"address", "netmask", "gateway", "dns-nameservers"} {
		if val, ok := block.options[key]; ok && val != "" {
			result = append(result, fmt.Sprintf("    %s %s", key, val))
		}
	}
	result = append(result, "")

	return os.WriteFile(interfacesFile, []byte(strings.Join(result, "\n")), 0644)
}
