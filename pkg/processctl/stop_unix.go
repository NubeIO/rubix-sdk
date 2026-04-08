//go:build !windows

package processctl

import (
	"os"
	"syscall"
)

func gracefulStop(p *os.Process) {
	// Negative PID sends the signal to the entire process group,
	// killing all children spawned by this process.
	_ = syscall.Kill(-p.Pid, syscall.SIGTERM)
}

func forceKillTree(p *os.Process) {
	// SIGKILL the entire process group.
	_ = syscall.Kill(-p.Pid, syscall.SIGKILL)
}
