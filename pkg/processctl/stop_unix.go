//go:build !windows

package processctl

import (
	"os"
	"syscall"
)

func gracefulStop(p *os.Process) {
	_ = p.Signal(syscall.SIGTERM)
}
