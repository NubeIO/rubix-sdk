package systemd

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
)

const unitDir = "/etc/systemd/system"

// UnitFile represents a systemd unit file to install.
type UnitFile struct {
	Name    string // e.g. "bios-loader.service" or "bios-loader.timer"
	Content string // full unit file content
}

// InstallUnit writes a unit file to /etc/systemd/system and reloads systemd.
func (c *Client) InstallUnit(ctx context.Context, unit UnitFile) error {
	path := filepath.Join(unitDir, unit.Name)
	if err := os.WriteFile(path, []byte(unit.Content), 0644); err != nil {
		return fmt.Errorf("write unit %s: %w", unit.Name, err)
	}
	return c.DaemonReload(ctx)
}

// RemoveUnit stops, disables, and removes a unit file, then reloads systemd.
func (c *Client) RemoveUnit(ctx context.Context, name string) error {
	// Best-effort stop and disable before removing.
	_ = c.Stop(ctx, name)
	_ = c.Disable(ctx, name)

	path := filepath.Join(unitDir, name)
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove unit %s: %w", name, err)
	}
	return c.DaemonReload(ctx)
}

// UnitExists checks if a unit file is installed.
func (c *Client) UnitExists(name string) bool {
	path := filepath.Join(unitDir, name)
	_, err := os.Stat(path)
	return err == nil
}
