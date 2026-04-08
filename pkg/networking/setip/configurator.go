package setip

import "fmt"

// Configurator is the generic interface for any network configuration backend.
// Implement this to add new backends (e.g. systemd-networkd, wpa_supplicant, etc.).
type Configurator interface {
	// Name returns the backend identifier.
	Name() Backend

	// IsAvailable returns true if this backend is present and usable on the host.
	IsAvailable() bool

	// GetConnection returns the current configuration for an interface.
	GetConnection(iface string) (*ConnectionInfo, error)

	// SetStatic applies a static IP configuration. Persists across reboots.
	SetStatic(cfg StaticConfig) error

	// SetDHCP switches an interface to DHCP. Persists across reboots.
	SetDHCP(iface string) error
}

// registry holds all known configurators in priority order.
var registry []Configurator

func init() {
	// Priority order: NetworkManager > Netplan > ifupdown.
	// Register them here so Resolve() picks the best available.
	registry = []Configurator{
		&nmcliConfigurator{},
		&netplanConfigurator{},
		&ifupdownConfigurator{},
	}
}

// Register adds a custom Configurator to the registry. It will be checked
// after the built-in backends (append to end). Use this to add support for
// additional backends like systemd-networkd, etc.
func Register(c Configurator) {
	registry = append(registry, c)
}

// Resolve detects which backends are available on this host and returns info
// about what's supported.
func Resolve() HostSupport {
	var hs HostSupport
	for _, c := range registry {
		if c.IsAvailable() {
			hs.Available = append(hs.Available, c.Name())
			if hs.Active == "" {
				hs.Active = c.Name()
			}
		}
	}
	return hs
}

// Auto returns the highest-priority available Configurator.
func Auto() (Configurator, error) {
	for _, c := range registry {
		if c.IsAvailable() {
			return c, nil
		}
	}
	return nil, fmt.Errorf("no supported network configurator found on this host")
}

// ForBackend returns a specific Configurator by name, regardless of priority.
func ForBackend(b Backend) (Configurator, error) {
	for _, c := range registry {
		if c.Name() == b && c.IsAvailable() {
			return c, nil
		}
	}
	return nil, fmt.Errorf("backend %q is not available on this host", b)
}
