//go:build windows

package networking

import (
	"os/exec"
	"strings"
)

// defaultGateway returns the default gateway IP and the interface name.
func defaultGateway() (gateway string, iface string) {
	// Use PowerShell to get the default route.
	out, err := exec.Command("powershell", "-Command",
		"(Get-NetRoute -DestinationPrefix '0.0.0.0/0' | Select-Object -First 1 | Format-List NextHop, InterfaceAlias)").Output()
	if err != nil {
		return "", ""
	}
	for _, line := range strings.Split(string(out), "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "NextHop") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				gateway = strings.TrimSpace(parts[1])
			}
		}
		if strings.HasPrefix(line, "InterfaceAlias") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				iface = strings.TrimSpace(parts[1])
			}
		}
	}
	return gateway, iface
}

// systemDNS returns DNS servers configured on the system.
func systemDNS() []string {
	out, err := exec.Command("powershell", "-Command",
		"(Get-DnsClientServerAddress -AddressFamily IPv4 | Select-Object -ExpandProperty ServerAddresses) -join ','").Output()
	if err != nil {
		return nil
	}
	raw := strings.TrimSpace(string(out))
	if raw == "" {
		return nil
	}

	// Deduplicate.
	seen := make(map[string]bool)
	var servers []string
	for _, s := range strings.Split(raw, ",") {
		s = strings.TrimSpace(s)
		if s != "" && !seen[s] {
			seen[s] = true
			servers = append(servers, s)
		}
	}
	return servers
}

// isWireless checks if the interface is a wireless adapter.
func isWireless(name string) bool {
	// Heuristic: common Windows wifi adapter naming.
	lower := strings.ToLower(name)
	return strings.Contains(lower, "wi-fi") || strings.Contains(lower, "wireless") || strings.Contains(lower, "wlan")
}

// linkSpeed is not easily available on Windows without WMI; return empty.
func linkSpeed(_ string) string {
	return ""
}
