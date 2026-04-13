package biosclient

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strconv"
)

// AppsClient provides BIOS app lifecycle, backup, and install operations.
type AppsClient struct {
	c *Client
}

// NewAppsClient creates an AppsClient.
func NewAppsClient(c *Client) *AppsClient {
	return &AppsClient{c: c}
}

// ── List & Status ────────────────────────────────────

// List returns all apps and orphans.
func (a *AppsClient) List() (*AppList, error) {
	resp, err := a.c.newRequest().Get(a.c.Prefix + "/apps")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, newAPIError(resp)
	}
	var out AppList
	if err := json.Unmarshal(resp.Body(), &out); err != nil {
		return nil, fmt.Errorf("decode list response: %w", err)
	}
	return &out, nil
}

// Status returns the current status of a single app.
func (a *AppsClient) Status(name string) (*AppStatus, error) {
	resp, err := a.c.newRequest().
		SetPathParam("name", name).
		Get(a.c.Prefix + "/apps/{name}/status")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, newAPIError(resp)
	}
	var out AppStatus
	if err := json.Unmarshal(resp.Body(), &out); err != nil {
		return nil, fmt.Errorf("decode status response: %w", err)
	}
	return &out, nil
}

// Logs returns the last n log lines for an app.
func (a *AppsClient) Logs(name string, n int) (*LogsResponse, error) {
	resp, err := a.c.newRequest().
		SetPathParam("name", name).
		SetQueryParam("n", strconv.Itoa(n)).
		Get(a.c.Prefix + "/apps/{name}/logs")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, newAPIError(resp)
	}
	var out LogsResponse
	if err := json.Unmarshal(resp.Body(), &out); err != nil {
		return nil, fmt.Errorf("decode logs response: %w", err)
	}
	return &out, nil
}

// ── Lifecycle ────────────────────────────────────────

// Start starts an app by name.
func (a *AppsClient) Start(name string) (*StatusResponse, error) {
	return a.postAction(name, "start")
}

// Stop stops an app by name.
func (a *AppsClient) Stop(name string) (*StatusResponse, error) {
	return a.postAction(name, "stop")
}

// Restart restarts an app by name.
func (a *AppsClient) Restart(name string) (*StatusResponse, error) {
	return a.postAction(name, "restart")
}

// Enable enables an app by name.
func (a *AppsClient) Enable(name string) (*StatusResponse, error) {
	return a.postAction(name, "enable")
}

// Disable disables an app by name.
func (a *AppsClient) Disable(name string) (*StatusResponse, error) {
	return a.postAction(name, "disable")
}

// ClearFailure resets the failed state of an app.
func (a *AppsClient) ClearFailure(name string) (*StatusResponse, error) {
	return a.postAction(name, "clear-failure")
}

// Uninstall removes an app and deletes its files.
func (a *AppsClient) Uninstall(name string) error {
	resp, err := a.c.newRequest().
		SetPathParam("name", name).
		SetQueryParam("delete_files", "true").
		Delete(a.c.Prefix + "/apps/{name}")
	if err != nil {
		return err
	}
	if resp.IsError() {
		return newAPIError(resp)
	}
	return nil
}

// ── Install & Upgrade ────────────────────────────────

// Upload uploads an app zip to BIOS and starts the async install flow.
func (a *AppsClient) Upload(path string) (*InstallResponse, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open upload file: %w", err)
	}
	defer file.Close()

	return a.UploadReader(file)
}

// UploadReader uploads a zip stream to BIOS and starts the async install flow.
func (a *AppsClient) UploadReader(body io.Reader) (*InstallResponse, error) {
	resp, err := a.c.newRequest().
		SetHeader("Content-Type", "application/zip").
		SetBody(body).
		Post(a.c.Prefix + "/apps/install")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, newAPIError(resp)
	}

	var out InstallResponse
	if err := json.Unmarshal(resp.Body(), &out); err != nil {
		return nil, fmt.Errorf("decode install response: %w", err)
	}
	return &out, nil
}

// UpgradeOpts controls upgrade behavior.
type UpgradeOpts struct {
	Keep   string // comma-separated: "all", "db,config", etc. Default: "all"
	Backup bool   // create a backup before upgrading
}

// Upgrade uploads an app zip to BIOS and starts the async upgrade flow.
func (a *AppsClient) Upgrade(name, path string, opts *UpgradeOpts) (*InstallResponse, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open upload file: %w", err)
	}
	defer file.Close()

	return a.UpgradeReader(name, file, opts)
}

// UpgradeReader uploads a zip stream to BIOS and starts the async upgrade flow.
func (a *AppsClient) UpgradeReader(name string, body io.Reader, opts *UpgradeOpts) (*InstallResponse, error) {
	keep := "all"
	backup := "false"
	if opts != nil {
		if opts.Keep != "" {
			keep = opts.Keep
		}
		if opts.Backup {
			backup = "true"
		}
	}

	resp, err := a.c.newRequest().
		SetHeader("Content-Type", "application/zip").
		SetBody(body).
		SetPathParam("name", name).
		SetQueryParam("keep", keep).
		SetQueryParam("backup", backup).
		Post(a.c.Prefix + "/apps/{name}/upgrade")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, newAPIError(resp)
	}

	var out InstallResponse
	if err := json.Unmarshal(resp.Body(), &out); err != nil {
		return nil, fmt.Errorf("decode upgrade response: %w", err)
	}
	return &out, nil
}

// ── Frontend ────────────────────────────────────────

// FrontendResponse is returned by the frontend update endpoint.
type FrontendResponse struct {
	Status string `json:"status"`
	App    string `json:"app"`
	Files  int    `json:"files"`
}

// UpdateFrontend uploads a zip of frontend files and replaces the
// frontend directory inside an app without restarting it.
func (a *AppsClient) UpdateFrontend(name, path string) (*FrontendResponse, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open frontend zip: %w", err)
	}
	defer file.Close()

	resp, err := a.c.newRequest().
		SetHeader("Content-Type", "application/zip").
		SetBody(file).
		SetPathParam("name", name).
		Post(a.c.Prefix + "/apps/{name}/frontend")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, newAPIError(resp)
	}

	var out FrontendResponse
	if err := json.Unmarshal(resp.Body(), &out); err != nil {
		return nil, fmt.Errorf("decode frontend response: %w", err)
	}
	return &out, nil
}

// ── Backup & Recovery ────────────────────────────────

// Snapshot creates a full backup of an app.
func (a *AppsClient) Snapshot(name string) (*SnapshotResponse, error) {
	resp, err := a.c.newRequest().
		SetPathParam("name", name).
		Post(a.c.Prefix + "/apps/{name}/snapshot")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, newAPIError(resp)
	}
	var out SnapshotResponse
	if err := json.Unmarshal(resp.Body(), &out); err != nil {
		return nil, fmt.Errorf("decode snapshot response: %w", err)
	}
	return &out, nil
}

// ListSnapshots returns all available snapshots for an app.
func (a *AppsClient) ListSnapshots(name string) (*SnapshotList, error) {
	resp, err := a.c.newRequest().
		SetPathParam("name", name).
		Get(a.c.Prefix + "/apps/{name}/snapshots")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, newAPIError(resp)
	}
	var out SnapshotList
	if err := json.Unmarshal(resp.Body(), &out); err != nil {
		return nil, fmt.Errorf("decode snapshots response: %w", err)
	}
	return &out, nil
}

// Recover restores an app from a snapshot. The app is stopped, restored, and restarted.
func (a *AppsClient) Recover(name string, req RecoverRequest) (*RecoverResponse, error) {
	resp, err := a.c.newRequest().
		SetPathParam("name", name).
		SetHeader("Content-Type", "application/json").
		SetBody(req).
		Post(a.c.Prefix + "/apps/{name}/recover")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, newAPIError(resp)
	}
	var out RecoverResponse
	if err := json.Unmarshal(resp.Body(), &out); err != nil {
		return nil, fmt.Errorf("decode recover response: %w", err)
	}
	return &out, nil
}

// BackupDb creates a database-only backup.
func (a *AppsClient) BackupDb(name string) (*DbBackupResponse, error) {
	resp, err := a.c.newRequest().
		SetPathParam("name", name).
		Post(a.c.Prefix + "/apps/{name}/db/backup")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, newAPIError(resp)
	}
	var out DbBackupResponse
	if err := json.Unmarshal(resp.Body(), &out); err != nil {
		return nil, fmt.Errorf("decode db backup response: %w", err)
	}
	return &out, nil
}

// DeleteDb deletes the database (auto-creates a backup first).
func (a *AppsClient) DeleteDb(name string) (*StatusResponse, error) {
	resp, err := a.c.newRequest().
		SetPathParam("name", name).
		Delete(a.c.Prefix + "/apps/{name}/db")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, newAPIError(resp)
	}
	var out StatusResponse
	if err := json.Unmarshal(resp.Body(), &out); err != nil {
		return nil, fmt.Errorf("decode db delete response: %w", err)
	}
	return &out, nil
}

// ── Orphans ──────────────────────────────────────────

// Register registers an orphaned app by name.
func (a *AppsClient) Register(name string) (*RegisterResponse, error) {
	resp, err := a.c.newRequest().
		SetPathParam("name", name).
		Post(a.c.Prefix + "/orphans/{name}/register")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, newAPIError(resp)
	}

	var out RegisterResponse
	if err := json.Unmarshal(resp.Body(), &out); err != nil {
		return nil, fmt.Errorf("decode register response: %w", err)
	}
	return &out, nil
}

// DeleteOrphan deletes an orphaned app directory.
func (a *AppsClient) DeleteOrphan(name string) error {
	resp, err := a.c.newRequest().
		SetPathParam("name", name).
		Delete(a.c.Prefix + "/orphans/{name}")
	if err != nil {
		return err
	}
	if resp.IsError() {
		return newAPIError(resp)
	}
	return nil
}

// ── Internal ─────────────────────────────────────────

func (a *AppsClient) postAction(name, action string) (*StatusResponse, error) {
	resp, err := a.c.newRequest().
		SetPathParams(map[string]string{
			"name":   name,
			"action": action,
		}).
		Post(a.c.Prefix + "/apps/{name}/{action}")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, newAPIError(resp)
	}

	var out StatusResponse
	if err := json.Unmarshal(resp.Body(), &out); err != nil {
		return nil, fmt.Errorf("decode %s response: %w", action, err)
	}
	return &out, nil
}
