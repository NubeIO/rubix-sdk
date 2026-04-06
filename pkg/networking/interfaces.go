package networking

import (
	"fmt"
	"net"
	"strings"

	psnet "github.com/shirou/gopsutil/v4/net"
)

// GetInterfaces returns info for all network interfaces.
func GetInterfaces() ([]Interface, error) {
	stdIfaces, err := net.Interfaces()
	if err != nil {
		return nil, fmt.Errorf("listing interfaces: %w", err)
	}

	// Grab IO counters keyed by interface name.
	counters := make(map[string]psnet.IOCountersStat)
	if ioc, err := psnet.IOCounters(true); err == nil {
		for _, c := range ioc {
			counters[c.Name] = c
		}
	}

	gateway, gwIface := defaultGateway()
	dns := systemDNS()

	var result []Interface
	for _, si := range stdIfaces {
		iface := Interface{
			Name:       si.Name,
			Index:      si.Index,
			MTU:        si.MTU,
			MAC:        si.HardwareAddr.String(),
			IsUp:       si.Flags&net.FlagUp != 0,
			IsLoopback: si.Flags&net.FlagLoopback != 0,
			IsWireless: isWireless(si.Name),
		}

		for _, f := range strings.Split(si.Flags.String(), "|") {
			if f != "" {
				iface.Flags = append(iface.Flags, f)
			}
		}

		// Addresses
		addrs, err := si.Addrs()
		if err == nil {
			for _, a := range addrs {
				ipnet, ok := a.(*net.IPNet)
				if !ok {
					// Parse CIDR string as fallback.
					if ip, cidr, err := net.ParseCIDR(a.String()); err == nil {
						ipnet = &net.IPNet{IP: ip, Mask: cidr.Mask}
					} else {
						continue
					}
				}
				entry := ipNetFromStdlib(ipnet.IP, ipnet.Mask)
				if ipnet.IP.To4() != nil {
					iface.IPv4 = append(iface.IPv4, entry)
				} else {
					iface.IPv6 = append(iface.IPv6, entry)
				}
			}
		}

		// Gateway
		if si.Name == gwIface && gateway != "" {
			iface.Gateway = gateway
		}

		// DNS (system-wide, attached to every interface for convenience)
		iface.DNS = dns

		// IO counters
		if c, ok := counters[si.Name]; ok {
			iface.TxBytes = c.BytesSent
			iface.RxBytes = c.BytesRecv
			iface.TxPackets = c.PacketsSent
			iface.RxPackets = c.PacketsRecv
			iface.TxErrors = c.Errout
			iface.RxErrors = c.Errin
		}

		// Link speed (linux only, best-effort)
		iface.Speed = linkSpeed(si.Name)

		result = append(result, iface)
	}

	return result, nil
}

// GetInterfaceByName returns a single interface by name.
func GetInterfaceByName(name string) (*Interface, error) {
	ifaces, err := GetInterfaces()
	if err != nil {
		return nil, err
	}
	for _, iface := range ifaces {
		if strings.EqualFold(iface.Name, name) {
			return &iface, nil
		}
	}
	return nil, fmt.Errorf("interface %q not found", name)
}
