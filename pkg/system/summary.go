package system

import (
	"fmt"
	"strings"
)

// Summary returns a human-friendly one-liner for the system info.
func (s *SystemInfo) Summary() string {
	var b strings.Builder
	fmt.Fprintf(&b, "CPU: %.0f%% (%d cores)", s.CPU.UsedPct, s.CPU.Cores)
	fmt.Fprintf(&b, "  |  RAM: %.0f/%.0f MB (%.0f%%)", s.Memory.UsedMB, s.Memory.TotalMB, s.Memory.UsedPct)
	for _, d := range s.Disks {
		fmt.Fprintf(&b, "  |  Disk %s: %.1f/%.1f GB (%.0f%%)", d.Mount, d.UsedGB, d.TotalGB, d.UsedPct)
	}
	fmt.Fprintf(&b, "  |  Uptime: %s", s.Uptime)
	return b.String()
}

// Summary returns a human-friendly one-liner for process info.
func (p *ProcessInfo) Summary() string {
	return fmt.Sprintf("[%d] %s — CPU: %.1f%%  RSS: %.0f MB  Threads: %d  Uptime: %s",
		p.PID, p.Name, p.CPUPct, p.MemRSS, p.Threads, p.Uptime)
}

// Summary returns a human-friendly one-liner for self info.
func (s *SelfInfo) Summary() string {
	return fmt.Sprintf("%s  |  Goroutines: %d  Heap: %.1f MB  GC: %d runs",
		s.ProcessInfo.Summary(), s.GoRoutines, s.HeapMB, s.NumGC)
}
