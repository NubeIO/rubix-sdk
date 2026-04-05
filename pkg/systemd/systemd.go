// Package systemd provides a reusable client for managing systemd services
// and timers via the systemctl CLI.
package systemd

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"strings"
	"time"
)

// UnitState represents the active state of a systemd unit.
type UnitState string

const (
	StateActive       UnitState = "active"
	StateInactive     UnitState = "inactive"
	StateFailed       UnitState = "failed"
	StateActivating   UnitState = "activating"
	StateDeactivating UnitState = "deactivating"
	StateUnknown      UnitState = "unknown"
)

// UnitStatus holds the status of a systemd unit.
type UnitStatus struct {
	Name        string    `json:"name"`
	State       UnitState `json:"state"`
	SubState    string    `json:"sub_state"`
	Description string    `json:"description"`
	Enabled     bool      `json:"enabled"`
	Running     bool      `json:"running"`
}

// Client manages systemd units via systemctl.
type Client struct {
	// Timeout for systemctl commands. Zero means no timeout.
	Timeout time.Duration
}

// New creates a new systemd client with sensible defaults.
func New() *Client {
	return &Client{Timeout: 30 * time.Second}
}

// Start starts a systemd unit.
func (c *Client) Start(ctx context.Context, unit string) error {
	_, err := c.run(ctx, "start", unit)
	return err
}

// Stop stops a systemd unit.
func (c *Client) Stop(ctx context.Context, unit string) error {
	_, err := c.run(ctx, "stop", unit)
	return err
}

// Restart restarts a systemd unit.
func (c *Client) Restart(ctx context.Context, unit string) error {
	_, err := c.run(ctx, "restart", unit)
	return err
}

// Enable enables a unit to start on boot.
func (c *Client) Enable(ctx context.Context, unit string) error {
	_, err := c.run(ctx, "enable", unit)
	return err
}

// Disable disables a unit from starting on boot.
func (c *Client) Disable(ctx context.Context, unit string) error {
	_, err := c.run(ctx, "disable", unit)
	return err
}

// DaemonReload reloads systemd manager configuration.
func (c *Client) DaemonReload(ctx context.Context) error {
	_, err := c.run(ctx, "daemon-reload")
	return err
}

// IsActive returns true if the unit is currently active (running).
func (c *Client) IsActive(ctx context.Context, unit string) bool {
	out, err := c.run(ctx, "is-active", unit)
	if err != nil {
		return false
	}
	return strings.TrimSpace(out) == "active"
}

// IsEnabled returns true if the unit is enabled for boot.
func (c *Client) IsEnabled(ctx context.Context, unit string) bool {
	out, err := c.run(ctx, "is-enabled", unit)
	if err != nil {
		return false
	}
	return strings.TrimSpace(out) == "enabled"
}

// Status returns detailed status of a systemd unit.
func (c *Client) Status(ctx context.Context, unit string) (UnitStatus, error) {
	st := UnitStatus{Name: unit}

	// ActiveState
	out, err := c.run(ctx, "show", unit, "--property=ActiveState", "--value")
	if err != nil {
		st.State = StateUnknown
		return st, fmt.Errorf("get active state: %w", err)
	}
	state := strings.TrimSpace(out)
	switch UnitState(state) {
	case StateActive, StateInactive, StateFailed, StateActivating, StateDeactivating:
		st.State = UnitState(state)
	default:
		st.State = StateUnknown
	}
	st.Running = st.State == StateActive

	// SubState
	out, _ = c.run(ctx, "show", unit, "--property=SubState", "--value")
	st.SubState = strings.TrimSpace(out)

	// Description
	out, _ = c.run(ctx, "show", unit, "--property=Description", "--value")
	st.Description = strings.TrimSpace(out)

	// Enabled
	st.Enabled = c.IsEnabled(ctx, unit)

	return st, nil
}

// EnableAndStart enables and starts a unit in one call.
func (c *Client) EnableAndStart(ctx context.Context, unit string) error {
	_, err := c.run(ctx, "enable", "--now", unit)
	return err
}

// DisableAndStop disables and stops a unit in one call.
func (c *Client) DisableAndStop(ctx context.Context, unit string) error {
	_, err := c.run(ctx, "disable", "--now", unit)
	return err
}

// Logs returns the last n journal lines for a unit via journalctl.
func (c *Client) Logs(ctx context.Context, unit string, lines int) (string, error) {
	if c.Timeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, c.Timeout)
		defer cancel()
	}

	cmd := exec.CommandContext(ctx, "journalctl",
		"-u", unit,
		"-n", fmt.Sprintf("%d", lines),
		"--no-pager",
		"-o", "short-iso",
	)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("journalctl -u %s: %s: %w", unit, strings.TrimSpace(stderr.String()), err)
	}
	return stdout.String(), nil
}

// run executes a systemctl command and returns stdout.
func (c *Client) run(ctx context.Context, args ...string) (string, error) {
	if c.Timeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, c.Timeout)
		defer cancel()
	}

	cmd := exec.CommandContext(ctx, "systemctl", args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("systemctl %s: %s: %w", strings.Join(args, " "), strings.TrimSpace(stderr.String()), err)
	}
	return stdout.String(), nil
}
