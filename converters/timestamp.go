package converters

import "time"

// TimeToRFC3339 converts time.Time to RFC3339 string (for proto)
func TimeToRFC3339(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.Format(time.RFC3339)
}

// RFC3339ToTime converts RFC3339 string to time.Time (from proto)
func RFC3339ToTime(s string) (time.Time, error) {
	if s == "" {
		return time.Time{}, nil
	}
	return time.Parse(time.RFC3339, s)
}
