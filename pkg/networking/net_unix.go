//go:build !windows

package networking

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

// defaultGateway returns the default gateway IP and the interface name it's on.
func defaultGateway() (gateway string, iface string) {
	// Try `ip route` first (Linux / Raspberry Pi / Debian).
	out, err := exec.Command("ip", "route", "show", "default").Output()
	if err == nil {
		// default via 192.168.1.1 dev eth0 proto dhcp metric 100
		fields := strings.Fields(string(out))
		for i, f := range fields {
			if f == "via" && i+1 < len(fields) {
				gateway = fields[i+1]
			}
			if f == "dev" && i+1 < len(fields) {
				iface = fields[i+1]
			}
		}
		if gateway != "" {
			return gateway, iface
		}
	}

	// Fallback: `route -n get default` (macOS / BSD).
	out, err = exec.Command("route", "-n", "get", "default").Output()
	if err == nil {
		for _, line := range strings.Split(string(out), "\n") {
			line = strings.TrimSpace(line)
			if strings.HasPrefix(line, "gateway:") {
				gateway = strings.TrimSpace(strings.TrimPrefix(line, "gateway:"))
			}
			if strings.HasPrefix(line, "interface:") {
				iface = strings.TrimSpace(strings.TrimPrefix(line, "interface:"))
			}
		}
	}
	return gateway, iface
}

// systemDNS reads /etc/resolv.conf for nameservers.
func systemDNS() []string {
	f, err := os.Open("/etc/resolv.conf")
	if err != nil {
		return nil
	}
	defer f.Close()

	var servers []string
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if strings.HasPrefix(line, "nameserver") {
			fields := strings.Fields(line)
			if len(fields) >= 2 {
				servers = append(servers, fields[1])
			}
		}
	}
	return servers
}

// isWireless checks if the interface is a wireless adapter.
func isWireless(name string) bool {
	// Linux: /sys/class/net/<name>/wireless exists for wifi interfaces.
	if _, err := os.Stat(fmt.Sprintf("/sys/class/net/%s/wireless", name)); err == nil {
		return true
	}
	// Heuristic fallback.
	return strings.HasPrefix(name, "wl")
}

// linkSpeed reads the negotiated link speed from sysfs (Linux only).
func linkSpeed(name string) string {
	path := fmt.Sprintf("/sys/class/net/%s/speed", name)
	data, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	speed := strings.TrimSpace(string(data))
	// Kernel returns -1 or 0 for unknown/down.
	if speed == "" || speed == "-1" || speed == "0" {
		return ""
	}
	return speed + " Mb/s"
}
