package setip

// Backend identifies which network configuration system is in use.
type Backend string

const (
	BackendNetworkManager Backend = "networkmanager" // nmcli
	BackendNetplan        Backend = "netplan"         // /etc/netplan/*.yaml
	BackendIfupdown       Backend = "ifupdown"        // /etc/network/interfaces
)

// StaticConfig defines a static IP configuration to apply.
type StaticConfig struct {
	Interface string   `json:"interface"`           // e.g. "eth0"
	Address   string   `json:"address"`             // e.g. "192.168.1.10"
	Prefix    int      `json:"prefix"`              // CIDR prefix e.g. 24
	Gateway   string   `json:"gateway,omitempty"`   // e.g. "192.168.1.1"
	DNS       []string `json:"dns,omitempty"`       // e.g. ["8.8.8.8", "1.1.1.1"]
}

// ConnectionInfo is a snapshot of how an interface is currently configured
// from the backend's perspective.
type ConnectionInfo struct {
	Interface string   `json:"interface"`
	Method    string   `json:"method"`            // "static" or "dhcp"
	Address   string   `json:"address,omitempty"`
	Prefix    int      `json:"prefix,omitempty"`
	Gateway   string   `json:"gateway,omitempty"`
	DNS       []string `json:"dns,omitempty"`
	Backend   Backend  `json:"backend"`
}

// HostSupport describes what the host supports for network configuration.
type HostSupport struct {
	Available []Backend `json:"available"` // all detected backends
	Active    Backend   `json:"active"`    // the one that will be used
}
