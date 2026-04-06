//go:build windows

package processctl

import (
	"os"
	"os/exec"
	"strconv"
)

func gracefulStop(p *os.Process) {
	// /T kills the entire process tree rooted at this PID.
	_ = exec.Command("taskkill", "/T", "/PID", strconv.Itoa(p.Pid)).Run()
}

func forceKillTree(p *os.Process) {
	// /F forces, /T kills the entire process tree.
	_ = exec.Command("taskkill", "/F", "/T", "/PID", strconv.Itoa(p.Pid)).Run()
}
