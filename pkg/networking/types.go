package networking

import "net"

// Interface represents a single network interface with its addresses and stats.
type Interface struct {
	Name       string   `json:"name"`                 // e.g. "eth0", "wlan0", "Ethernet"
	Index      int      `json:"index"`                // OS-assigned index
	MAC        string   `json:"mac"`                  // hardware address
	MTU        int      `json:"mtu"`                  // maximum transmission unit
	Flags      []string `json:"flags"`                // UP, BROADCAST, MULTICAST, etc.
	IsUp       bool     `json:"isUp"`                 // link is up
	IsLoopback bool     `json:"isLoopback"`           // loopback interface
	IsWireless bool     `json:"isWireless"`           // wifi adapter (best-effort detection)
	IPv4       []IPNET  `json:"ipv4,omitempty"`       // assigned IPv4 addresses
	IPv6       []IPNET  `json:"ipv6,omitempty"`       // assigned IPv6 addresses
	Gateway    string   `json:"gateway,omitempty"`    // default gateway via this interface
	DNS        []string `json:"dns,omitempty"`        // DNS servers (system-wide on most OS)
	Speed      string   `json:"speed,omitempty"`      // link speed e.g. "1000Mb/s" (linux only)
	TxBytes    uint64   `json:"txBytes"`              // total bytes sent
	RxBytes    uint64   `json:"rxBytes"`              // total bytes received
	TxPackets  uint64   `json:"txPackets"`            // total packets sent
	RxPackets  uint64   `json:"rxPackets"`            // total packets received
	TxErrors   uint64   `json:"txErrors"`             // transmit errors
	RxErrors   uint64   `json:"rxErrors"`             // receive errors
}

// IPNET is an IP address with its subnet mask.
type IPNET struct {
	Address string `json:"address"` // e.g. "192.168.1.10"
	Prefix  int    `json:"prefix"`  // CIDR prefix length e.g. 24
	Netmask string `json:"netmask"` // e.g. "255.255.255.0"
}

// NetworkSummary is a high-level overview of the host's networking.
type NetworkSummary struct {
	Hostname   string      `json:"hostname"`
	Interfaces []Interface `json:"interfaces"`
	DNS        []string    `json:"dns"`              // system-wide DNS servers
	DefaultGW  string      `json:"defaultGateway"`   // primary default gateway
	PublicIP   string      `json:"publicIP,omitempty"` // external IP (optional, requires internet)
}

// ipNetFromStdlib converts a stdlib net.IPNet to our IPNET type.
func ipNetFromStdlib(ip net.IP, mask net.IPMask) IPNET {
	ones, _ := mask.Size()
	return IPNET{
		Address: ip.String(),
		Prefix:  ones,
		Netmask: net.IP(mask).String(),
	}
}
