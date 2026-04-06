//go:build windows

package processctl

import (
	"os/exec"
	"syscall"
)

// setProcAttr sets Windows creation flags so the child gets its own process group.
// Combined with taskkill /T in Stop/Kill, this ensures the entire tree is cleaned up.
func setProcAttr(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		CreationFlags: syscall.CREATE_NEW_PROCESS_GROUP,
	}
}
