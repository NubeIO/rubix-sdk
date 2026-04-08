package processctl

import (
	"io"
	"time"
)

// State represents the lifecycle state of a managed process
type State string

const (
	StateStopped  State = "stopped"
	StateStarting State = "starting"
	StateRunning  State = "running"
	StateCrashed  State = "crashed"
)

// Config describes how to launch and manage a process
type Config struct {
	Name        string            // human-readable label (for logs/status)
	ExecPath    string            // path to the binary
	Args        []string          // command-line arguments
	Dir         string            // working directory (empty = inherit)
	Env         map[string]string // extra env vars (merged with parent env)
	GracePeriod time.Duration    // SIGTERM→SIGKILL timeout (default 5s)
	MaxLogLines int              // stdout/stderr ring buffer size (default 200)
	LogWriter   io.Writer        // optional writer that receives every captured line (e.g. disk file)
}

// Status is a point-in-time snapshot of a managed process
type Status struct {
	Name       string   `json:"name"`
	State      State    `json:"state"`
	PID        int      `json:"pid"`
	ExitCode   int      `json:"exitCode,omitempty"`
	StartedAt  string   `json:"startedAt,omitempty"`
	Uptime     string   `json:"uptime,omitempty"`
	ExitReason string   `json:"exitReason,omitempty"`
	Logs       []string `json:"logs,omitempty"`
}

// OnStateChange is called after every state transition
type OnStateChange func(status Status)

func (c *Config) gracePeriod() time.Duration {
	if c.GracePeriod > 0 {
		return c.GracePeriod
	}
	return 5 * time.Second
}

func (c *Config) maxLogLines() int {
	if c.MaxLogLines > 0 {
		return c.MaxLogLines
	}
	return 200
}
