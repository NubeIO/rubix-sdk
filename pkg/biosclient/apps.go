package biosclient

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
)

// AppsClient provides BIOS app lifecycle and install operations.
type AppsClient struct {
	c *Client
}

// NewAppsClient creates an AppsClient.
func NewAppsClient(c *Client) *AppsClient {
	return &AppsClient{c: c}
}

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

// Start starts an app by name.
func (a *AppsClient) Start(name string) (*StatusResponse, error) {
	return a.postAction(name, "start")
}

// Stop stops an app by name.
func (a *AppsClient) Stop(name string) (*StatusResponse, error) {
	return a.postAction(name, "stop")
}

// Enable enables an app by name.
func (a *AppsClient) Enable(name string) (*StatusResponse, error) {
	return a.postAction(name, "enable")
}

// Disable disables an app by name.
func (a *AppsClient) Disable(name string) (*StatusResponse, error) {
	return a.postAction(name, "disable")
}

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
