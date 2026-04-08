package biosclient

import (
	"strings"

	"github.com/go-resty/resty/v2"
)

const defaultPrefix = "/api/bios"

// Client is the root BIOS API client.
type Client struct {
	R      *resty.Client
	Prefix string

	Apps *AppsClient
	Jobs *JobsClient
}

// Option customizes the underlying resty client.
type Option func(*resty.Client)

// New creates a BIOS API client rooted at baseURL.
func New(baseURL string, opts ...Option) *Client {
	r := resty.New().SetBaseURL(strings.TrimRight(baseURL, "/"))
	for _, opt := range opts {
		opt(r)
	}

	c := &Client{
		R:      r,
		Prefix: defaultPrefix,
	}
	c.Apps = NewAppsClient(c)
	c.Jobs = NewJobsClient(c)
	return c
}

// WithToken sets the bearer token used for BIOS protected routes.
func WithToken(token string) Option {
	return func(r *resty.Client) {
		r.SetAuthToken(token)
	}
}

// WithHeader adds a default header to every request.
func WithHeader(key, value string) Option {
	return func(r *resty.Client) {
		r.SetHeader(key, value)
	}
}

// Ping checks connectivity to the BIOS server.
// Returns nil if the server is reachable and responds with 2xx.
func (c *Client) Ping() error {
	resp, err := c.newRequest().Get(c.Prefix + "/ping")
	if err != nil {
		return err
	}
	if resp.IsError() {
		return newAPIError(resp)
	}
	return nil
}

func (c *Client) newRequest() *resty.Request {
	return c.R.R().SetHeader("Accept", "application/json")
}
