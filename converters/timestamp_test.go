package converters

import (
	"testing"
	"time"
)

func TestTimeToRFC3339(t *testing.T) {
	tests := []struct {
		name  string
		input time.Time
		want  string
	}{
		{"zero time", time.Time{}, ""},
		{"valid time", time.Date(2026, 3, 21, 10, 30, 0, 0, time.UTC), "2026-03-21T10:30:00Z"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := TimeToRFC3339(tt.input)
			if got != tt.want {
				t.Errorf("TimeToRFC3339() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestRFC3339ToTime(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
		wantStr string
	}{
		{"empty string", "", false, ""},
		{"valid RFC3339", "2026-03-21T10:30:00Z", false, "2026-03-21T10:30:00Z"},
		{"invalid format", "2026-03-21", true, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := RFC3339ToTime(tt.input)

			if tt.wantErr {
				if err == nil {
					t.Errorf("RFC3339ToTime() expected error, got nil")
				}
				return
			}

			if err != nil {
				t.Errorf("RFC3339ToTime() unexpected error: %v", err)
				return
			}

			if tt.wantStr == "" {
				if !got.IsZero() {
					t.Errorf("RFC3339ToTime() = %v, want zero time", got)
				}
			} else {
				gotStr := got.Format(time.RFC3339)
				if gotStr != tt.wantStr {
					t.Errorf("RFC3339ToTime() = %q, want %q", gotStr, tt.wantStr)
				}
			}
		})
	}
}

// Test round-trip conversion
func TestTimeRoundTrip(t *testing.T) {
	original := time.Date(2026, 3, 21, 10, 30, 45, 123456789, time.UTC)

	// Convert to string
	str := TimeToRFC3339(original)

	// Convert back to time
	result, err := RFC3339ToTime(str)
	if err != nil {
		t.Fatalf("RFC3339ToTime() error: %v", err)
	}

	// RFC3339 only preserves second precision, not nanoseconds
	if !result.Equal(original.Truncate(time.Second)) {
		t.Errorf("Round-trip conversion failed: got %v, want %v", result, original.Truncate(time.Second))
	}
}
