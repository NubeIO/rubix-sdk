package networking

import "github.com/NubeIO/rubix-sdk/pkg/networking/setip"

// ResolveConfigurator detects which network configuration backends are
// available on this host (NetworkManager, netplan, ifupdown, etc.).
func ResolveConfigurator() setip.HostSupport {
	return setip.Resolve()
}

// AutoConfigurator returns the highest-priority available configurator.
// The caller doesn't need to know which backend is in use.
func AutoConfigurator() (setip.Configurator, error) {
	return setip.Auto()
}

// ConfiguratorFor returns a specific backend by name.
func ConfiguratorFor(b setip.Backend) (setip.Configurator, error) {
	return setip.ForBackend(b)
}
