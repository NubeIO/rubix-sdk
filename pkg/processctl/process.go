package processctl

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sync"
	"time"
)

var (
	ErrAlreadyRunning = errors.New("process already running")
	ErrNotRunning     = errors.New("process not running")
)

// Process manages the lifecycle of a single OS process.
// It is safe for concurrent use.
type Process struct {
	cfg      Config
	cmd      *exec.Cmd
	state    State
	logs     *ring
	mu       sync.RWMutex
	cancel   context.CancelFunc
	stopping bool
	bootTime time.Time
	exitCode int
	exitMsg  string
	done     chan struct{}
	onChange OnStateChange
}

// New creates a new managed process from the given config.
func New(cfg Config) *Process {
	return &Process{
		cfg:   cfg,
		state: StateStopped,
		logs:  newRing(cfg.maxLogLines()),
	}
}

// SetOnStateChange registers a callback invoked after every state transition.
func (p *Process) SetOnStateChange(fn OnStateChange) {
	p.mu.Lock()
	p.onChange = fn
	p.mu.Unlock()
}

func (p *Process) setState(s State) {
	p.mu.Lock()
	p.state = s
	cb := p.onChange
	snap := p.statusLocked(0)
	p.mu.Unlock()
	if cb != nil {
		cb(snap)
	}
}

// Start launches the process. Returns ErrAlreadyRunning if already alive.
func (p *Process) Start() error {
	p.mu.Lock()
	if p.state == StateRunning || p.state == StateStarting {
		p.mu.Unlock()
		return ErrAlreadyRunning
	}
	p.state = StateStarting
	p.stopping = false
	p.mu.Unlock()

	runCtx, cancel := context.WithCancel(context.Background())
	cmd := exec.CommandContext(runCtx, p.cfg.ExecPath, p.cfg.Args...)

	if p.cfg.Dir != "" {
		cmd.Dir = p.cfg.Dir
	}

	cmd.Env = os.Environ()
	for k, v := range p.cfg.Env {
		cmd.Env = append(cmd.Env, k+"="+v)
	}

	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		cancel()
		p.setState(StateCrashed)
		p.mu.Lock()
		p.exitMsg = fmt.Sprintf("start failed: %v", err)
		p.mu.Unlock()
		return err
	}

	p.mu.Lock()
	p.cmd = cmd
	p.cancel = cancel
	p.done = make(chan struct{})
	p.bootTime = time.Now()
	p.exitMsg = ""
	p.exitCode = 0
	p.mu.Unlock()

	go p.capture(stdout)
	go p.capture(stderr)
	go p.waitLoop(runCtx)

	p.setState(StateRunning)
	return nil
}

// Stop sends a graceful termination signal, then force-kills after the grace period.
// Returns ErrNotRunning if the process isn't alive.
func (p *Process) Stop() error {
	p.mu.Lock()
	cmd := p.cmd
	if cmd == nil || cmd.Process == nil {
		p.mu.Unlock()
		return ErrNotRunning
	}
	p.stopping = true
	doneCh := p.done
	p.mu.Unlock()

	gracefulStop(cmd.Process)

	select {
	case <-doneCh:
		return nil
	case <-time.After(p.cfg.gracePeriod()):
	}

	_ = cmd.Process.Kill()
	select {
	case <-doneCh:
	case <-time.After(1 * time.Second):
	}
	return nil
}

// Restart stops then starts the process.
func (p *Process) Restart() error {
	if p.IsRunning() {
		_ = p.Stop()
	}
	return p.Start()
}

// Kill forcefully kills the process immediately.
func (p *Process) Kill() error {
	p.mu.Lock()
	cmd := p.cmd
	if cmd == nil || cmd.Process == nil {
		p.mu.Unlock()
		return ErrNotRunning
	}
	p.stopping = true
	p.mu.Unlock()

	return cmd.Process.Kill()
}

// IsRunning returns true if the process is alive.
func (p *Process) IsRunning() bool {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.state == StateRunning
}

// State returns the current lifecycle state.
func (p *Process) State() State {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.state
}

// PID returns the OS process ID, or 0 if not running.
func (p *Process) PID() int {
	p.mu.RLock()
	defer p.mu.RUnlock()
	if p.cmd != nil && p.cmd.Process != nil {
		return p.cmd.Process.Pid
	}
	return 0
}

// Status returns a point-in-time snapshot. tail controls how many log lines to include.
func (p *Process) Status(tail int) Status {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.statusLocked(tail)
}

// Done returns a channel that is closed when the process exits.
// Returns nil if the process has not been started.
func (p *Process) Done() <-chan struct{} {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.done
}

// WasStopped returns true if the last exit was due to an intentional Stop/Kill call.
func (p *Process) WasStopped() bool {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.stopping
}

func (p *Process) statusLocked(tail int) Status {
	s := Status{
		Name:       p.cfg.Name,
		State:      p.state,
		ExitReason: p.exitMsg,
	}
	if p.cmd != nil && p.cmd.Process != nil {
		s.PID = p.cmd.Process.Pid
	}
	if !p.bootTime.IsZero() {
		s.StartedAt = p.bootTime.Format(time.RFC3339)
		if p.state == StateRunning {
			s.Uptime = time.Since(p.bootTime).Truncate(time.Second).String()
		}
	}
	if tail > 0 {
		s.Logs = p.logs.tail(tail)
	}
	return s
}

func (p *Process) capture(r io.Reader) {
	sc := bufio.NewScanner(r)
	for sc.Scan() {
		p.logs.add(sc.Text())
	}
}

func (p *Process) waitLoop(ctx context.Context) {
	err := p.cmd.Wait()

	p.mu.Lock()
	cancel := p.cancel
	stopping := p.stopping
	p.cmd = nil
	p.cancel = nil
	done := p.done
	p.mu.Unlock()

	if cancel != nil {
		cancel()
	}
	if done != nil {
		close(done)
	}

	if stopping || ctx.Err() != nil {
		p.mu.Lock()
		p.exitMsg = "stopped"
		p.mu.Unlock()
		p.setState(StateStopped)
		return
	}

	p.mu.Lock()
	if err != nil {
		p.exitMsg = fmt.Sprintf("crashed: %v", err)
	} else {
		p.exitMsg = "exited"
	}
	p.mu.Unlock()
	p.setState(StateCrashed)
}
