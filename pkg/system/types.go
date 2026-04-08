package system

import "time"

// SystemInfo is a point-in-time snapshot of the host machine.
type SystemInfo struct {
	Hostname string  `json:"hostname"`
	OS       string  `json:"os"`       // e.g. "linux", "windows", "darwin"
	Platform string  `json:"platform"` // e.g. "ubuntu", "windows 11"
	Arch     string  `json:"arch"`
	Uptime   string  `json:"uptime"`
	CPU      CPUInfo `json:"cpu"`
	Memory   MemInfo `json:"memory"`
	Disks    []DiskInfo `json:"disks"`
}

// CPUInfo reports overall CPU usage.
type CPUInfo struct {
	Model      string  `json:"model"`
	Cores      int     `json:"cores"`       // logical cores
	UsedPct    float64 `json:"usedPct"`     // 0-100
}

// MemInfo reports system RAM.
type MemInfo struct {
	TotalBytes uint64  `json:"totalBytes"`
	UsedBytes  uint64  `json:"usedBytes"`
	FreeMB     float64 `json:"freeMB"`
	TotalMB    float64 `json:"totalMB"`
	UsedMB     float64 `json:"usedMB"`
	UsedPct    float64 `json:"usedPct"` // 0-100
}

// DiskInfo reports a single mounted volume.
type DiskInfo struct {
	Mount   string  `json:"mount"`
	Device  string  `json:"device"`
	FSType  string  `json:"fsType"`
	TotalGB float64 `json:"totalGB"`
	UsedGB  float64 `json:"usedGB"`
	FreeGB  float64 `json:"freeGB"`
	UsedPct float64 `json:"usedPct"` // 0-100
}

// ProcessInfo is a snapshot of any OS process by PID.
type ProcessInfo struct {
	PID     int32   `json:"pid"`
	Name    string  `json:"name"`
	CmdLine string  `json:"cmdLine,omitempty"`
	Status  string  `json:"status"`  // Running, Sleeping, Stopped, etc.
	CPUPct  float64 `json:"cpuPct"`  // 0-100
	MemRSS  float64 `json:"memRSS"`  // MB
	MemVMS  float64 `json:"memVMS"`  // MB
	MemPct  float64 `json:"memPct"`  // 0-100
	Threads int32   `json:"threads"`
	Uptime  string  `json:"uptime,omitempty"`
}

// SelfInfo is this Go process — includes ProcessInfo plus Go runtime stats.
type SelfInfo struct {
	ProcessInfo

	// Go runtime
	GoRoutines int     `json:"goRoutines"`
	HeapMB     float64 `json:"heapMB"`    // heap in use
	HeapSysMB  float64 `json:"heapSysMB"` // heap obtained from OS
	StackMB    float64 `json:"stackMB"`   // stack in use
	SysMB      float64 `json:"sysMB"`     // total memory from OS
	NumGC      uint32  `json:"numGC"`
	LastGCPause string `json:"lastGCPause"` // human-readable
}

// MonitorSnapshot is emitted by the periodic monitor.
type MonitorSnapshot struct {
	Timestamp time.Time   `json:"timestamp"`
	System    *SystemInfo `json:"system,omitempty"`
	Self      *SelfInfo   `json:"self,omitempty"`
}
