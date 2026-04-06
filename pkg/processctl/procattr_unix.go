//go:build !windows

package processctl

import (
	"os/exec"
	"syscall"
)

// setProcAttr puts the child process into its own process group so that
// killing the group (negative PID) terminates all its descendants.
func setProcAttr(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
}
