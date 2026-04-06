package system

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v4/process"
)

// GetProcessInfo returns a snapshot of the given PID.
func GetProcessInfo(pid int32) (*ProcessInfo, error) {
	return GetProcessInfoCtx(context.Background(), pid)
}

// GetProcessInfoCtx is the context-aware variant.
func GetProcessInfoCtx(ctx context.Context, pid int32) (*ProcessInfo, error) {
	p, err := process.NewProcessWithContext(ctx, pid)
	if err != nil {
		return nil, fmt.Errorf("process %d not found: %w", pid, err)
	}

	info := &ProcessInfo{PID: pid}

	if name, err := p.NameWithContext(ctx); err == nil {
		info.Name = name
	}
	if cmd, err := p.CmdlineWithContext(ctx); err == nil {
		info.CmdLine = cmd
	}
	if statuses, err := p.StatusWithContext(ctx); err == nil && len(statuses) > 0 {
		info.Status = strings.Join(statuses, ",")
	}

	// CPU — call once to prime, wait briefly, call again for a real reading.
	_, _ = p.CPUPercentWithContext(ctx)
	time.Sleep(200 * time.Millisecond)
	if pct, err := p.CPUPercentWithContext(ctx); err == nil {
		info.CPUPct = round2(pct)
	}

	if mi, err := p.MemoryInfoWithContext(ctx); err == nil && mi != nil {
		info.MemRSS = round2(float64(mi.RSS) / bytesToMB)
		info.MemVMS = round2(float64(mi.VMS) / bytesToMB)
	}
	if mp, err := p.MemoryPercentWithContext(ctx); err == nil {
		info.MemPct = round2(float64(mp))
	}
	if threads, err := p.NumThreadsWithContext(ctx); err == nil {
		info.Threads = threads
	}
	if ct, err := p.CreateTimeWithContext(ctx); err == nil {
		started := time.UnixMilli(ct)
		info.Uptime = formatDuration(time.Since(started))
	}

	return info, nil
}

// GetProcessInfoByName returns info for all processes matching the given name.
func GetProcessInfoByName(name string) ([]*ProcessInfo, error) {
	return GetProcessInfoByNameCtx(context.Background(), name)
}

// GetProcessInfoByNameCtx is the context-aware variant.
func GetProcessInfoByNameCtx(ctx context.Context, name string) ([]*ProcessInfo, error) {
	procs, err := process.ProcessesWithContext(ctx)
	if err != nil {
		return nil, fmt.Errorf("listing processes: %w", err)
	}

	var results []*ProcessInfo
	for _, p := range procs {
		n, err := p.NameWithContext(ctx)
		if err != nil {
			continue
		}
		if !strings.EqualFold(n, name) {
			continue
		}
		info, err := GetProcessInfoCtx(ctx, p.Pid)
		if err != nil {
			continue
		}
		results = append(results, info)
	}
	return results, nil
}
