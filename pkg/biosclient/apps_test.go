package biosclient

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAppsStart(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got != "Bearer secret" {
			t.Fatalf("unexpected authorization header: %q", got)
		}
		if r.Method != http.MethodPost {
			t.Fatalf("unexpected method: %s", r.Method)
		}
		if r.URL.Path != "/api/bios/apps/demo/start" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"started"}`))
	}))
	defer server.Close()

	client := New(server.URL, WithToken("secret"))

	resp, err := client.Apps.Start("demo")
	if err != nil {
		t.Fatalf("start returned error: %v", err)
	}
	if resp.Status != "started" {
		t.Fatalf("unexpected status: %q", resp.Status)
	}
}

func TestAppsUploadReader(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("unexpected method: %s", r.Method)
		}
		if r.URL.Path != "/api/bios/apps/install" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		if got := r.Header.Get("Content-Type"); got != "application/zip" {
			t.Fatalf("unexpected content type: %q", got)
		}

		buf := new(bytes.Buffer)
		if _, err := buf.ReadFrom(r.Body); err != nil {
			t.Fatalf("read body: %v", err)
		}
		if got := buf.String(); got != "zip-bytes" {
			t.Fatalf("unexpected body: %q", got)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		_, _ = w.Write([]byte(`{"token":"abc","name":"demo","version":"1.2.3","stage":"uploaded","message":"zip received"}`))
	}))
	defer server.Close()

	client := New(server.URL, WithToken("secret"))

	resp, err := client.Apps.UploadReader(bytes.NewBufferString("zip-bytes"))
	if err != nil {
		t.Fatalf("upload returned error: %v", err)
	}
	if resp.Token != "abc" || resp.Name != "demo" || resp.Version != "1.2.3" {
		t.Fatalf("unexpected response: %+v", resp)
	}
}

func TestAppsRegister(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("unexpected method: %s", r.Method)
		}
		if r.URL.Path != "/api/bios/orphans/demo/register" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"registered","name":"demo","version":"1.0.0","state":"running","pid":42}`))
	}))
	defer server.Close()

	client := New(server.URL, WithToken("secret"))

	resp, err := client.Apps.Register("demo")
	if err != nil {
		t.Fatalf("register returned error: %v", err)
	}
	if resp.Status != "registered" || resp.PID != 42 {
		t.Fatalf("unexpected response: %+v", resp)
	}
}

func TestJobsGet(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			t.Fatalf("unexpected method: %s", r.Method)
		}
		if r.URL.Path != "/api/bios/jobs/job-123" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"token":"job-123","kind":"app-install","stage":"done","message":"installed","meta":{"name":"demo"}}`))
	}))
	defer server.Close()

	client := New(server.URL, WithToken("secret"))

	job, err := client.Jobs.Get("job-123")
	if err != nil {
		t.Fatalf("jobs get returned error: %v", err)
	}
	if !job.IsDone() {
		t.Fatalf("expected job to be done: %+v", job)
	}
}

func TestAPIErrorPlainText(t *testing.T) {
	t.Parallel()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
	}))
	defer server.Close()

	client := New(server.URL)

	_, err := client.Apps.Start("demo")
	if err == nil {
		t.Fatal("expected error")
	}

	apiErr, ok := err.(*APIError)
	if !ok {
		t.Fatalf("expected APIError, got %T", err)
	}
	if apiErr.StatusCode != http.StatusUnauthorized {
		t.Fatalf("unexpected status code: %d", apiErr.StatusCode)
	}
}
