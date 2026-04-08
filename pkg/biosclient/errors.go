package biosclient

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/go-resty/resty/v2"
)

// ErrorResponse is the standard JSON error payload returned by BIOS.
type ErrorResponse struct {
	Error string `json:"error"`
}

// APIError wraps non-2xx BIOS responses.
type APIError struct {
	StatusCode int
	Message    string
	Body       string
}

func (e *APIError) Error() string {
	if e.Message != "" {
		return fmt.Sprintf("bios API error (%d): %s", e.StatusCode, e.Message)
	}
	return fmt.Sprintf("bios API error (%d)", e.StatusCode)
}

func newAPIError(resp *resty.Response) error {
	if resp == nil {
		return &APIError{Message: "empty response"}
	}

	body := strings.TrimSpace(resp.String())
	var payload ErrorResponse
	if err := json.Unmarshal(resp.Body(), &payload); err == nil && payload.Error != "" {
		return &APIError{
			StatusCode: resp.StatusCode(),
			Message:    payload.Error,
			Body:       body,
		}
	}

	if body == "" {
		body = resp.Status()
	}

	return &APIError{
		StatusCode: resp.StatusCode(),
		Message:    body,
		Body:       body,
	}
}
