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
