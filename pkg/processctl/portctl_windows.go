//go:build windows

package processctl

import (
	"fmt"
	"os/exec"
	"strconv"
	"strings"
)

// KillByPID forcefully terminates the process with the given PID.
func KillByPID(pid int) error {
	return exec.Command("taskkill", "/F", "/PID", strconv.Itoa(pid)).Run()
}

// GracefulStopByPID attempts a graceful stop of the process with the given PID.
func GracefulStopByPID(pid int) error {
	return exec.Command("taskkill", "/PID", strconv.Itoa(pid)).Run()
}

// findByPortProto uses netstat to find a listening process on a specific port and protocol.
func findByPortProto(port int, proto string) (*PortProcessInfo, error) {
	protoFlag := "TCP"
	if proto == "udp" {
		protoFlag = "UDP"
	}
	// netstat -ano shows all connections with PIDs.
	out, err := exec.Command("netstat", "-ano", "-p", protoFlag).Output()
	if err != nil {
		return nil, fmt.Errorf("netstat command failed: %w", err)
	}
	portStr := ":" + strconv.Itoa(port)
	for _, line := range strings.Split(string(out), "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 5 {
			continue
		}
		// fields: Proto, Local Address, Foreign Address, State, PID
		localAddr := fields[1]
		if !strings.HasSuffix(localAddr, portStr) {
			continue
		}
		// For UDP there is no State column, PID is fields[3]
		pidIdx := len(fields) - 1
		pid, err := strconv.Atoi(fields[pidIdx])
		if err != nil || pid <= 0 {
			continue
		}
		info := &PortProcessInfo{
			Port:  port,
			Proto: proto,
			PID:   pid,
		}
		populateUptime(info)
		return info, nil
	}
	return nil, fmt.Errorf("no process found on port %d/%s", port, proto)
}

// populateUptime uses wmic to get process name and creation date on Windows.
func populateUptime(info *PortProcessInfo) {
	out, err := exec.Command("wmic", "process", "where",
		fmt.Sprintf("ProcessId=%d", info.PID),
		"get", "Name,CreationDate", "/format:list").Output()
	if err != nil {
		return
	}
	for _, line := range strings.Split(string(out), "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "Name=") {
			info.Name = strings.TrimPrefix(line, "Name=")
		}
	}
}
