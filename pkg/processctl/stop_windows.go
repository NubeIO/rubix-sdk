//go:build windows

package processctl

import (
	"os"
	"os/exec"
	"strconv"
)

func gracefulStop(p *os.Process) {
	// Windows has no SIGTERM. Use taskkill for a graceful close attempt.
	_ = exec.Command("taskkill", "/PID", strconv.Itoa(p.Pid)).Run()
}
