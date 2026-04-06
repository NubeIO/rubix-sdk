package system

import (
	"context"
	"fmt"
	"runtime"
	"time"

	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/disk"
	"github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/mem"
)

const bytesToMB = 1024 * 1024
const bytesToGB = 1024 * 1024 * 1024

// GetSystemInfo returns a snapshot of the host machine.
func GetSystemInfo() (*SystemInfo, error) {
	return GetSystemInfoCtx(context.Background())
}

// GetSystemInfoCtx is the context-aware variant.
func GetSystemInfoCtx(ctx context.Context) (*SystemInfo, error) {
	info := &SystemInfo{
		Arch: runtime.GOARCH,
	}

	// Host
	if h, err := host.InfoWithContext(ctx); err == nil {
		info.Hostname = h.Hostname
		info.OS = h.OS
		info.Platform = h.Platform + " " + h.PlatformVersion
		info.Uptime = formatDuration(time.Duration(h.Uptime) * time.Second)
	}

	// CPU
	if pcts, err := cpu.PercentWithContext(ctx, 500*time.Millisecond, false); err == nil && len(pcts) > 0 {
		info.CPU.UsedPct = round2(pcts[0])
	}
	if ci, err := cpu.InfoWithContext(ctx); err == nil && len(ci) > 0 {
		info.CPU.Model = ci[0].ModelName
	}
	if cores, err := cpu.CountsWithContext(ctx, true); err == nil {
		info.CPU.Cores = cores
	}

	// Memory
	if vm, err := mem.VirtualMemoryWithContext(ctx); err == nil {
		info.Memory = MemInfo{
			TotalBytes: vm.Total,
			UsedBytes:  vm.Used,
			TotalMB:    round2(float64(vm.Total) / bytesToMB),
			UsedMB:     round2(float64(vm.Used) / bytesToMB),
			FreeMB:     round2(float64(vm.Available) / bytesToMB),
			UsedPct:    round2(vm.UsedPercent),
		}
	}

	// Disks — skip read-only/virtual filesystems (snaps, squashfs, tmpfs, etc.)
	if parts, err := disk.PartitionsWithContext(ctx, false); err == nil {
		for _, p := range parts {
			if skipFS(p.Fstype) {
				continue
			}
			usage, err := disk.UsageWithContext(ctx, p.Mountpoint)
			if err != nil || usage.Total == 0 {
				continue
			}
			info.Disks = append(info.Disks, DiskInfo{
				Mount:   p.Mountpoint,
				Device:  p.Device,
				FSType:  p.Fstype,
				TotalGB: round2(float64(usage.Total) / bytesToGB),
				UsedGB:  round2(float64(usage.Used) / bytesToGB),
				FreeGB:  round2(float64(usage.Free) / bytesToGB),
				UsedPct: round2(usage.UsedPercent),
			})
		}
	}

	return info, nil
}

func formatDuration(d time.Duration) string {
	days := int(d.Hours()) / 24
	hours := int(d.Hours()) % 24
	mins := int(d.Minutes()) % 60
	if days > 0 {
		return fmt.Sprintf("%dd %dh %dm", days, hours, mins)
	}
	if hours > 0 {
		return fmt.Sprintf("%dh %dm", hours, mins)
	}
	return fmt.Sprintf("%dm", mins)
}

// skipFS returns true for virtual/read-only filesystems that clutter output.
func skipFS(fstype string) bool {
	switch fstype {
	case "squashfs", "tmpfs", "devtmpfs", "overlay", "proc", "sysfs",
		"devpts", "cgroup", "cgroup2", "autofs", "fusectl",
		"securityfs", "pstore", "debugfs", "tracefs", "configfs",
		"mqueue", "hugetlbfs", "binfmt_misc", "fuse.snapfuse":
		return true
	}
	return false
}

func round2(f float64) float64 {
	return float64(int(f*100)) / 100
}
