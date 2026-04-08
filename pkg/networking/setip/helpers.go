package setip

import (
	"fmt"
	"net"
	"strings"
)

// validateStatic checks that a StaticConfig has the minimum required fields.
func validateStatic(cfg StaticConfig) error {
	if cfg.Interface == "" {
		return fmt.Errorf("interface name is required")
	}
	if cfg.Address == "" {
		return fmt.Errorf("IP address is required")
	}
	if net.ParseIP(cfg.Address) == nil {
		return fmt.Errorf("invalid IP address: %q", cfg.Address)
	}
	if cfg.Prefix < 1 || cfg.Prefix > 32 {
		return fmt.Errorf("prefix must be between 1 and 32, got %d", cfg.Prefix)
	}
	if cfg.Gateway != "" && net.ParseIP(cfg.Gateway) == nil {
		return fmt.Errorf("invalid gateway: %q", cfg.Gateway)
	}
	for _, d := range cfg.DNS {
		if net.ParseIP(d) == nil {
			return fmt.Errorf("invalid DNS server: %q", d)
		}
	}
	return nil
}

// parseCIDR splits "192.168.1.10/24" into address and prefix.
func parseCIDR(s string) (string, int) {
	s = strings.TrimSpace(s)
	ip, ipnet, err := net.ParseCIDR(s)
	if err != nil {
		// Try as plain IP.
		if parsed := net.ParseIP(s); parsed != nil {
			return parsed.String(), 0
		}
		return s, 0
	}
	ones, _ := ipnet.Mask.Size()
	return ip.String(), ones
}

// splitCSV splits a comma or space separated string into trimmed tokens.
func splitCSV(s string) []string {
	s = strings.ReplaceAll(s, ",", " ")
	var out []string
	for _, f := range strings.Fields(s) {
		if f != "" {
			out = append(out, f)
		}
	}
	return out
}

// prefixToNetmask converts a CIDR prefix length to a dotted netmask string.
func prefixToNetmask(prefix int) string {
	mask := net.CIDRMask(prefix, 32)
	return net.IP(mask).String()
}

// netmaskToPrefix converts a dotted netmask to a CIDR prefix length.
func netmaskToPrefix(mask string) int {
	ip := net.ParseIP(mask)
	if ip == nil {
		return 0
	}
	ip4 := ip.To4()
	if ip4 == nil {
		return 0
	}
	ones, _ := net.IPMask(ip4).Size()
	return ones
}
