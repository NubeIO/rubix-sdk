package networking

import (
	"io"
	"net/http"
	"strings"
	"time"
)

// getPublicIP fetches the external/public IP using a plain-text API.
func getPublicIP() string {
	client := &http.Client{Timeout: 3 * time.Second}

	// Try multiple providers in case one is down.
	endpoints := []string{
		"https://ifconfig.me/ip",
		"https://api.ipify.org",
		"https://icanhazip.com",
	}

	for _, url := range endpoints {
		resp, err := client.Get(url)
		if err != nil {
			continue
		}
		body, err := io.ReadAll(io.LimitReader(resp.Body, 64))
		resp.Body.Close()
		if err != nil || resp.StatusCode != http.StatusOK {
			continue
		}
		ip := strings.TrimSpace(string(body))
		if ip != "" {
			return ip
		}
	}
	return ""
}
