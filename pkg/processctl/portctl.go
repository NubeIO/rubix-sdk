package processctl

import (
	"bufio"
	"bytes"
	"fmt"
	"os/exec"
	"strconv"
	"strings"
	"syscall"
	"time"
)

// PortProto specifies the network protocol to search.
type PortProto string

const (
	ProtoTCP PortProto = "tcp"
	ProtoUDP PortProto = "udp"
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
			continue // skip ports with no listener
		}
		results = append(results, *info)
	}
	return results, nil
}

// KillByPID sends SIGKILL to the given PID.
func KillByPID(pid int) error {
	return syscall.Kill(pid, syscall.SIGKILL)
}

// KillByPort finds the process listening on the given port and kills it.
func KillByPort(port int, proto PortProto) (int, error) {
	pid, err := FindPIDByPort(port, proto)
	if err != nil {
		return 0, err
	}
	return pid, KillByPID(pid)
}

// GracefulStopByPID sends SIGTERM to the given PID.
func GracefulStopByPID(pid int) error {
	return syscall.Kill(pid, syscall.SIGTERM)
}

// GracefulStopByPort finds the process on the given port and sends SIGTERM.
func GracefulStopByPort(port int, proto PortProto) (int, error) {
	pid, err := FindPIDByPort(port, proto)
	if err != nil {
		return 0, err
	}
	return pid, GracefulStopByPID(pid)
}

// findByPortProto uses ss to find a listening process on a specific port and protocol.
func findByPortProto(port int, proto string) (*PortProcessInfo, error) {
	pid, name, err := pidFromSS(port, proto)
	if err != nil {
		return nil, err
	}
	info := &PortProcessInfo{
		Port:  port,
		Proto: proto,
		PID:   pid,
		Name:  name,
	}
	populateUptime(info)
	return info, nil
}

// pidFromSS parses ss output to extract PID and process name.
func pidFromSS(port int, proto string) (int, string, error) {
	// ss -tlnp (TCP) or ss -ulnp (UDP) shows listening sockets with process info.
	flag := "-tlnp"
	if proto == "udp" {
		flag = "-ulnp"
	}
	out, err := exec.Command("ss", flag, "sport", "=", ":"+strconv.Itoa(port)).Output()
	if err != nil {
		return 0, "", fmt.Errorf("ss command failed: %w", err)
	}
	return parseSS(out)
}

// parseSS extracts PID and process name from ss output.
func parseSS(out []byte) (int, string, error) {
	scanner := bufio.NewScanner(bytes.NewReader(out))
	for scanner.Scan() {
		line := scanner.Text()
		// Look for users:(("name",pid=123,...))
		idx := strings.Index(line, "pid=")
		if idx < 0 {
			continue
		}
		// Extract PID
		pidStr := line[idx+4:]
		if end := strings.IndexAny(pidStr, ",)"); end > 0 {
			pidStr = pidStr[:end]
		}
		pid, err := strconv.Atoi(strings.TrimSpace(pidStr))
		if err != nil || pid <= 0 {
			continue
		}
		// Extract process name from users:(("name",...))
		name := extractProcessName(line)
		return pid, name, nil
	}
	return 0, "", fmt.Errorf("no matching process found")
}

// extractProcessName pulls the process name from ss users:((\"name\",...)) format.
func extractProcessName(line string) string {
	idx := strings.Index(line, "((\"")
	if idx < 0 {
		return ""
	}
	rest := line[idx+3:]
	end := strings.Index(rest, "\"")
	if end < 0 {
		return ""
	}
	return rest[:end]
}

// populateUptime reads /proc/<pid>/stat to get process start time.
func populateUptime(info *PortProcessInfo) {
	startTime, err := processStartTime(info.PID)
	if err != nil {
		return
	}
	info.StartedAt = startTime
	info.Uptime = time.Since(startTime).Truncate(time.Second).String()
}

// processStartTime reads the start time of a process from /proc.
func processStartTime(pid int) (time.Time, error) {
	path := fmt.Sprintf("/proc/%d/stat", pid)
	out, err := exec.Command("cat", path).Output()
	if err != nil {
		return time.Time{}, err
	}
	// /proc/<pid>/stat field 22 (0-indexed: 21) is starttime in clock ticks since boot.
	fields := strings.Fields(string(out))
	// The comm field (index 1) can contain spaces inside parens, so find the closing paren.
	full := string(out)
	closeParen := strings.LastIndex(full, ")")
	if closeParen < 0 || closeParen+2 >= len(full) {
		return time.Time{}, fmt.Errorf("unexpected /proc/pid/stat format")
	}
	afterComm := strings.Fields(full[closeParen+2:])
	// starttime is field 20 after the comm field (0-indexed)
	if len(afterComm) < 20 {
		return time.Time{}, fmt.Errorf("unexpected /proc/pid/stat format")
	}
	_ = fields // not used after re-parsing

	startTicks, err := strconv.ParseUint(afterComm[19], 10, 64)
	if err != nil {
		return time.Time{}, err
	}

	clkTck, err := getClockTicks()
	if err != nil {
		return time.Time{}, err
	}

	bootTime, err := getBootTime()
	if err != nil {
		return time.Time{}, err
	}

	startSec := bootTime.Add(time.Duration(startTicks) * time.Second / time.Duration(clkTck))
	return startSec, nil
}

// getBootTime reads system boot time from /proc/stat.
func getBootTime() (time.Time, error) {
	out, err := exec.Command("cat", "/proc/stat").Output()
	if err != nil {
		return time.Time{}, err
	}
	scanner := bufio.NewScanner(bytes.NewReader(out))
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "btime ") {
			secs, err := strconv.ParseInt(strings.TrimPrefix(line, "btime "), 10, 64)
			if err != nil {
				return time.Time{}, err
			}
			return time.Unix(secs, 0), nil
		}
	}
	return time.Time{}, fmt.Errorf("btime not found in /proc/stat")
}

// getClockTicks returns the system clock ticks per second (usually 100).
func getClockTicks() (uint64, error) {
	out, err := exec.Command("getconf", "CLK_TCK").Output()
	if err != nil {
		return 100, nil // fallback to common default
	}
	v, err := strconv.ParseUint(strings.TrimSpace(string(out)), 10, 64)
	if err != nil {
		return 100, nil
	}
	return v, nil
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
