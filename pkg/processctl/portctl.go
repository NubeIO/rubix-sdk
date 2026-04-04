package processctl

import (
	"fmt"
	"time"
)

// PortProto specifies the network protocol to search.
type PortProto string

const (
	ProtoTCP  PortProto = "tcp"
	ProtoUDP  PortProto = "udp"
	ProtoBoth PortProto = "both" // search TCP then UDP
)

// PortProcessInfo holds information about a process listening on a port.
type PortProcessInfo struct {
	Port      int       `json:"port"`
	Proto     string    `json:"proto"`
	PID       int       `json:"pid"`
	Name      string    `json:"name,omitempty"`
	StartedAt time.Time `json:"startedAt,omitempty"`
	Uptime    string    `json:"uptime,omitempty"`
}

// FindPIDByPort returns the PID of the process listening on the given port.
// proto can be ProtoTCP, ProtoUDP, or ProtoBoth.
func FindPIDByPort(port int, proto PortProto) (int, error) {
	info, err := FindProcessByPort(port, proto)
	if err != nil {
		return 0, err
	}
	return info.PID, nil
}

// FindProcessByPort returns process info for the process listening on the given port.
func FindProcessByPort(port int, proto PortProto) (*PortProcessInfo, error) {
	protos := protosToSearch(proto)
	for _, p := range protos {
		info, err := findByPortProto(port, p)
		if err == nil {
			return info, nil
		}
	}
	return nil, fmt.Errorf("no process found on port %d/%s", port, proto)
}

// FindProcessesByPorts returns process info for each requested port.
// Ports with no listener are omitted from the result (no error for missing).
func FindProcessesByPorts(ports []int, proto PortProto) ([]PortProcessInfo, error) {
	var results []PortProcessInfo
	for _, port := range ports {
		info, err := FindProcessByPort(port, proto)
		if err != nil {
			continue
		}
		results = append(results, *info)
	}
	return results, nil
}

// KillByPort finds the process listening on the given port and kills it.
func KillByPort(port int, proto PortProto) (int, error) {
	pid, err := FindPIDByPort(port, proto)
	if err != nil {
		return 0, err
	}
	return pid, KillByPID(pid)
}

// GracefulStopByPort finds the process on the given port and sends a graceful stop signal.
func GracefulStopByPort(port int, proto PortProto) (int, error) {
	pid, err := FindPIDByPort(port, proto)
	if err != nil {
		return 0, err
	}
	return pid, GracefulStopByPID(pid)
}

func protosToSearch(proto PortProto) []string {
	switch proto {
	case ProtoTCP:
		return []string{"tcp"}
	case ProtoUDP:
		return []string{"udp"}
	default:
		return []string{"tcp", "udp"}
	}
}
