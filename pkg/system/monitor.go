package system

import (
	"context"
	"time"
)

// MonitorCallback is invoked on each tick with the latest snapshot.
type MonitorCallback func(snap MonitorSnapshot)

// MonitorOpts configures what the monitor collects.
type MonitorOpts struct {
	Interval      time.Duration // polling interval (default 5s)
	IncludeSystem bool          // collect system-wide stats
	IncludeSelf   bool          // collect this process + Go runtime stats
}

// Monitor periodically collects system and/or self stats.
type Monitor struct {
	opts     MonitorOpts
	callback MonitorCallback
}

// NewMonitor creates a monitor. Both IncludeSystem and IncludeSelf default to
// true if neither is explicitly set.
func NewMonitor(opts MonitorOpts, cb MonitorCallback) *Monitor {
	if opts.Interval <= 0 {
		opts.Interval = 5 * time.Second
	}
	if !opts.IncludeSystem && !opts.IncludeSelf {
		opts.IncludeSystem = true
		opts.IncludeSelf = true
	}
	return &Monitor{opts: opts, callback: cb}
}

// Start begins polling. It blocks until ctx is cancelled.
func (m *Monitor) Start(ctx context.Context) {
	ticker := time.NewTicker(m.opts.Interval)
	defer ticker.Stop()

	// Collect immediately on start.
	m.collect(ctx)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			m.collect(ctx)
		}
	}
}

func (m *Monitor) collect(ctx context.Context) {
	snap := MonitorSnapshot{Timestamp: time.Now()}

	if m.opts.IncludeSystem {
		if sys, err := GetSystemInfoCtx(ctx); err == nil {
			snap.System = sys
		}
	}
	if m.opts.IncludeSelf {
		if self, err := GetSelfInfoCtx(ctx); err == nil {
			snap.Self = self
		}
	}

	m.callback(snap)
}
