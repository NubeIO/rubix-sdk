package system

import (
	"context"
	"fmt"
	"os"
	"runtime"
	"time"
)

// GetSelfInfo returns a snapshot of this Go process including runtime stats.
func GetSelfInfo() (*SelfInfo, error) {
	return GetSelfInfoCtx(context.Background())
}

// GetSelfInfoCtx is the context-aware variant.
func GetSelfInfoCtx(ctx context.Context) (*SelfInfo, error) {
	pid := int32(os.Getpid())
	proc, err := GetProcessInfoCtx(ctx, pid)
	if err != nil {
		return nil, fmt.Errorf("reading self process: %w", err)
	}

	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	var lastPause string
	if m.NumGC > 0 {
		lastPause = time.Duration(m.PauseNs[(m.NumGC+255)%256]).String()
	}

	return &SelfInfo{
		ProcessInfo: *proc,
		GoRoutines:  runtime.NumGoroutine(),
		HeapMB:      round2(float64(m.HeapAlloc) / bytesToMB),
		HeapSysMB:   round2(float64(m.HeapSys) / bytesToMB),
		StackMB:     round2(float64(m.StackInuse) / bytesToMB),
		SysMB:       round2(float64(m.Sys) / bytesToMB),
		NumGC:       m.NumGC,
		LastGCPause: lastPause,
	}, nil
}
