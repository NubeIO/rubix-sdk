package healthcheck

import (
	"context"
	"fmt"
	"net/http"
	"time"
)

// Config controls how health checks are performed.
type Config struct {
	URL            string        // endpoint to poll (e.g. "http://localhost:9000/healthz")
	Interval       time.Duration // time between checks (default 10s)
	Timeout        time.Duration // per-request timeout (default 5s)
	StartupTimeout time.Duration // max wait for first healthy response (default 30s)
}

func (c *Config) interval() time.Duration {
	if c.Interval > 0 {
		return c.Interval
	}
	return 10 * time.Second
}

func (c *Config) timeout() time.Duration {
	if c.Timeout > 0 {
		return c.Timeout
	}
	return 5 * time.Second
}

func (c *Config) startupTimeout() time.Duration {
	if c.StartupTimeout > 0 {
		return c.StartupTimeout
	}
	return 30 * time.Second
}

// Check performs a single health check. Returns nil if healthy.
func Check(cfg Config) error {
	client := &http.Client{Timeout: cfg.timeout()}
	resp, err := client.Get(cfg.URL)
	if err != nil {
		return err
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unhealthy: status %d", resp.StatusCode)
	}
	return nil
}

// WaitReady blocks until the endpoint returns HTTP 200 or the context is
// cancelled or the startup timeout elapses. Returns nil on success.
func WaitReady(ctx context.Context, cfg Config) error {
	deadline := time.After(cfg.startupTimeout())
	tick := time.NewTicker(1 * time.Second)
	defer tick.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-deadline:
			return fmt.Errorf("startup timeout after %s waiting for %s", cfg.startupTimeout(), cfg.URL)
		case <-tick.C:
			if err := Check(cfg); err == nil {
				return nil
			}
		}
	}
}

// Monitor polls the endpoint at the configured interval. It calls onFailure
// when a check fails and returns when the context is cancelled.
func Monitor(ctx context.Context, cfg Config, onFailure func(err error)) {
	tick := time.NewTicker(cfg.interval())
	defer tick.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-tick.C:
			if err := Check(cfg); err != nil {
				onFailure(err)
			}
		}
	}
}
