package biosclient

import "time"

// StatusResponse is returned by simple lifecycle actions.
type StatusResponse struct {
	Status string `json:"status"`
}

// InstallResponse is returned when an app upload/install job is accepted.
type InstallResponse struct {
	Token   string `json:"token"`
	Name    string `json:"name"`
	Version string `json:"version"`
	Stage   string `json:"stage"`
	Message string `json:"message"`
}

// RegisterResponse is returned when BIOS registers an orphaned app.
type RegisterResponse struct {
	Status  string `json:"status"`
	Name    string `json:"name"`
	Version string `json:"version"`
	State   string `json:"state"`
	PID     int    `json:"pid"`
}

// AppStatus is returned by the app status endpoint.
type AppStatus struct {
	Name          string `json:"name"`
	State         string `json:"state"`
	PID           int    `json:"pid,omitempty"`
	Port          int    `json:"port,omitempty"`
	Version       string `json:"version,omitempty"`
	Uptime        string `json:"uptime,omitempty"`
	ExitReason    string `json:"exitReason,omitempty"`
	RestartCount  int    `json:"restartCount,omitempty"`
	RestartPolicy string `json:"restartPolicy,omitempty"`
	CrashRate     string `json:"crashRate,omitempty"`
	Enabled       bool   `json:"enabled"`
	Failed        bool   `json:"failed"`
}

// AppList is returned by the list apps endpoint.
type AppList struct {
	Apps    []AppListEntry `json:"apps"`
	Orphans []OrphanEntry  `json:"orphans,omitempty"`
}

// AppListEntry is a single app in the list response.
type AppListEntry struct {
	Name          string `json:"name"`
	State         string `json:"state"`
	Version       string `json:"version,omitempty"`
	PID           int    `json:"pid,omitempty"`
	Port          int    `json:"port,omitempty"`
	Uptime        string `json:"uptime,omitempty"`
	Enabled       bool   `json:"enabled"`
	Failed        bool   `json:"failed"`
	InstalledAt   string `json:"installed_at,omitempty"`
	ExitReason    string `json:"exitReason,omitempty"`
	RestartCount  int    `json:"restartCount,omitempty"`
	RestartPolicy string `json:"restartPolicy,omitempty"`
}

// OrphanEntry is an unregistered app directory.
type OrphanEntry struct {
	Name        string   `json:"name"`
	Size        int64    `json:"size"`
	Files       []string `json:"files,omitempty"`
	HasManifest bool     `json:"has_manifest"`
}

// SnapshotResponse is returned when a snapshot is created.
type SnapshotResponse struct {
	Status  string `json:"status"`
	Archive string `json:"archive"`
}

// SnapshotEntry describes a backup archive.
type SnapshotEntry struct {
	Name    string `json:"name"`
	Path    string `json:"path"`
	Size    int64  `json:"size"`
	Created string `json:"created"`
}

// SnapshotList is returned by the list snapshots endpoint.
type SnapshotList struct {
	Backups []SnapshotEntry `json:"backups"`
	Count   int             `json:"count"`
}

// RecoverRequest is the body for the recover endpoint.
type RecoverRequest struct {
	Archive string `json:"archive"`
	All     bool   `json:"all,omitempty"`
	Binary  bool   `json:"binary,omitempty"`
	Config  bool   `json:"config,omitempty"`
	Db      bool   `json:"db,omitempty"`
}

// RecoverResponse is returned after recovery.
type RecoverResponse struct {
	Status     string   `json:"status"`
	Archive    string   `json:"archive"`
	Restored   []string `json:"restored"`
	StartError string   `json:"start_error,omitempty"`
}

// DbBackupResponse is returned when a database backup is created.
type DbBackupResponse struct {
	Status  string `json:"status"`
	Archive string `json:"archive"`
}

// VersionAppInfo describes a single app in the version response.
type VersionAppInfo struct {
	State   string `json:"state"`
	Version string `json:"version"`
}

// VersionResponse is returned by the version endpoint.
type VersionResponse struct {
	Bios    string                    `json:"bios"`
	Channel string                    `json:"channel,omitempty"`
	Apps    map[string]VersionAppInfo `json:"apps,omitempty"`
}

// PrimaryAppResponse is returned by the primary app config endpoint.
type PrimaryAppResponse struct {
	PrimaryApp string `json:"primary_app"`
}

// LogsResponse is returned by the logs endpoint.
type LogsResponse struct {
	Lines []string `json:"lines"`
	Count int      `json:"count"`
}

// Job describes an async BIOS job.
type Job struct {
	Token     string            `json:"token"`
	Kind      string            `json:"kind"`
	Stage     string            `json:"stage"`
	Message   string            `json:"message,omitempty"`
	Error     string            `json:"error,omitempty"`
	Meta      map[string]string `json:"meta,omitempty"`
	CreatedAt time.Time         `json:"created_at"`
	UpdatedAt time.Time         `json:"updated_at"`
}

// IsDone reports whether the job is finished successfully or with an error.
func (j *Job) IsDone() bool {
	return j != nil && (j.Stage == "done" || j.Stage == "error")
}
