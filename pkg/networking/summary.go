package networking

import (
	"fmt"
	"os"
	"strings"
)

// GetNetworkSummary returns a high-level overview of the host's networking.
// Set fetchPublicIP to true to also resolve the external/public IP (requires internet).
func GetNetworkSummary(fetchPublicIP bool) (*NetworkSummary, error) {
	ifaces, err := GetInterfaces()
	if err != nil {
		return nil, err
	}

	hostname, _ := os.Hostname()
	gw, _ := defaultGateway()
	dns := systemDNS()

	summary := &NetworkSummary{
		Hostname:   hostname,
		Interfaces: ifaces,
		DNS:        dns,
		DefaultGW:  gw,
	}

	if fetchPublicIP {
		summary.PublicIP = getPublicIP()
	}

	return summary, nil
}

// Summary returns a human-friendly multi-line string.
func (s *NetworkSummary) Summary() string {
	var b strings.Builder
	fmt.Fprintf(&b, "Host: %s  |  Gateway: %s  |  DNS: %s\n",
		s.Hostname, s.DefaultGW, strings.Join(s.DNS, ", "))
	if s.PublicIP != "" {
		fmt.Fprintf(&b, "Public IP: %s\n", s.PublicIP)
	}
	for _, iface := range s.Interfaces {
		if iface.IsLoopback {
			continue
		}
		fmt.Fprintf(&b, "  %s", iface.Summary())
	}
	return b.String()
}

// Summary returns a human-friendly one-liner for an interface.
func (i *Interface) Summary() string {
	var b strings.Builder
	status := "DOWN"
	if i.IsUp {
		status = "UP"
	}
	kind := "eth"
	if i.IsWireless {
		kind = "wifi"
	}
	fmt.Fprintf(&b, "%s (%s, %s)", i.Name, kind, status)
	if i.MAC != "" {
		fmt.Fprintf(&b, "  MAC: %s", i.MAC)
	}
	for _, ip := range i.IPv4 {
		fmt.Fprintf(&b, "  IPv4: %s/%d", ip.Address, ip.Prefix)
	}
	if i.Gateway != "" {
		fmt.Fprintf(&b, "  GW: %s", i.Gateway)
	}
	if i.Speed != "" {
		fmt.Fprintf(&b, "  Speed: %s", i.Speed)
	}
	fmt.Fprintf(&b, "  TX: %s  RX: %s",
		formatBytes(i.TxBytes), formatBytes(i.RxBytes))
	b.WriteString("\n")
	return b.String()
}

func formatBytes(b uint64) string {
	switch {
	case b >= 1<<30:
		return fmt.Sprintf("%.1f GB", float64(b)/(1<<30))
	case b >= 1<<20:
		return fmt.Sprintf("%.1f MB", float64(b)/(1<<20))
	case b >= 1<<10:
		return fmt.Sprintf("%.1f KB", float64(b)/(1<<10))
	default:
		return fmt.Sprintf("%d B", b)
	}
}
