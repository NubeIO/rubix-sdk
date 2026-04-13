package bios

import (
	"fmt"
	"time"

	"github.com/NubeIO/rubix-sdk/pkg/biosclient"
)

const (
	defaultPollInterval = 2 * time.Second
	defaultPollTimeout  = 5 * time.Minute
)

// pollResult is the outcome of polling a job to completion.
type pollResult struct {
	Job *biosclient.Job
	Err error
}

// pollUntilDone polls a BIOS job until it reaches "done" or "error", or the
// timeout expires. It prints stage transitions in human mode.
func pollUntilDone(client *biosclient.Client, token string, timeout time.Duration, json bool) pollResult {
	if timeout == 0 {
		timeout = defaultPollTimeout
	}

	deadline := time.Now().Add(timeout)
	lastStage := ""

	for {
		if time.Now().After(deadline) {
			return pollResult{Err: fmt.Errorf("timeout after %s waiting for job %s", timeout, token)}
		}

		job, err := client.Jobs.Get(token)
		if err != nil {
			return pollResult{Err: fmt.Errorf("poll job %s: %w", token, err)}
		}

		if !json && job.Stage != lastStage {
			if lastStage != "" {
				fmt.Printf(" → %s", job.Stage)
			} else {
				fmt.Printf("  %s", job.Stage)
			}
			lastStage = job.Stage
		}

		if job.IsDone() {
			if !json {
				fmt.Println()
			}
			if job.Stage == "error" {
				return pollResult{Job: job, Err: fmt.Errorf("job failed: %s", job.Error)}
			}
			return pollResult{Job: job}
		}

		time.Sleep(defaultPollInterval)
	}
}
