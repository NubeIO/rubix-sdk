package biosclient

import (
	"encoding/json"
	"fmt"
)

// JobsClient provides access to BIOS async job status endpoints.
type JobsClient struct {
	c *Client
}

// NewJobsClient creates a JobsClient.
func NewJobsClient(c *Client) *JobsClient {
	return &JobsClient{c: c}
}

// Get returns the current state of a BIOS job.
func (j *JobsClient) Get(token string) (*Job, error) {
	resp, err := j.c.newRequest().
		SetPathParam("token", token).
		Get(j.c.Prefix + "/jobs/{token}")
	if err != nil {
		return nil, err
	}
	if resp.IsError() {
		return nil, newAPIError(resp)
	}

	var out Job
	if err := json.Unmarshal(resp.Body(), &out); err != nil {
		return nil, fmt.Errorf("decode job response: %w", err)
	}
	return &out, nil
}
