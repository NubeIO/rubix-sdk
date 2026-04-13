// Package appversion provides a standard versioning system for rubix apps and plugins.
//
// Each project has a version.json at its root:
//
//	{
//	  "version": "1.2.0",
//	  "channel": "stable",
//	  "released": "2026-04-13"
//	}
//
// The builder reads this at build time and injects the version via ldflags.
// At runtime, the app reports the version in its healthz endpoint.
package appversion

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Info holds the version metadata for an app or plugin.
type Info struct {
	Version  string `json:"version"`            // semver: "1.2.0"
	Channel  string `json:"channel,omitempty"`   // "dev", "beta", "stable"
	Released string `json:"released,omitempty"`  // "2026-04-13"
}

// Load reads a version.json file from disk.
func Load(path string) (*Info, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read version file: %w", err)
	}
	var info Info
	if err := json.Unmarshal(data, &info); err != nil {
		return nil, fmt.Errorf("parse version file: %w", err)
	}
	if info.Version == "" {
		return nil, fmt.Errorf("version field is empty in %s", path)
	}
	return &info, nil
}

// Save writes the version info to a file.
func (v *Info) Save(path string) error {
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	data = append(data, '\n')
	return os.WriteFile(path, data, 0o644)
}

// String returns the version string.
func (v *Info) String() string {
	if v == nil {
		return "dev"
	}
	return v.Version
}

// ── Semver parsing and bumping ───────────────────────

// Semver holds parsed major.minor.patch components.
type Semver struct {
	Major int
	Minor int
	Patch int
}

// Parse parses a semver string like "1.2.3" or "v1.2.3".
func Parse(version string) (Semver, error) {
	v := strings.TrimPrefix(version, "v")
	parts := strings.SplitN(v, ".", 3)
	if len(parts) != 3 {
		return Semver{}, fmt.Errorf("invalid semver: %q (expected major.minor.patch)", version)
	}

	// Strip any pre-release suffix (e.g. "1.2.3-beta" -> patch="3")
	parts[2] = strings.SplitN(parts[2], "-", 2)[0]

	major, err := strconv.Atoi(parts[0])
	if err != nil {
		return Semver{}, fmt.Errorf("invalid major version: %w", err)
	}
	minor, err := strconv.Atoi(parts[1])
	if err != nil {
		return Semver{}, fmt.Errorf("invalid minor version: %w", err)
	}
	patch, err := strconv.Atoi(parts[2])
	if err != nil {
		return Semver{}, fmt.Errorf("invalid patch version: %w", err)
	}

	return Semver{Major: major, Minor: minor, Patch: patch}, nil
}

// String returns the semver as "major.minor.patch".
func (s Semver) String() string {
	return fmt.Sprintf("%d.%d.%d", s.Major, s.Minor, s.Patch)
}

// BumpMajor returns the next major version (2.0.0).
func (s Semver) BumpMajor() Semver {
	return Semver{Major: s.Major + 1}
}

// BumpMinor returns the next minor version (1.3.0).
func (s Semver) BumpMinor() Semver {
	return Semver{Major: s.Major, Minor: s.Minor + 1}
}

// BumpPatch returns the next patch version (1.2.1).
func (s Semver) BumpPatch() Semver {
	return Semver{Major: s.Major, Minor: s.Minor, Patch: s.Patch + 1}
}

// Compare returns -1 if s < other, 0 if equal, 1 if s > other.
func (s Semver) Compare(other Semver) int {
	if s.Major != other.Major {
		return cmp(s.Major, other.Major)
	}
	if s.Minor != other.Minor {
		return cmp(s.Minor, other.Minor)
	}
	return cmp(s.Patch, other.Patch)
}

func cmp(a, b int) int {
	if a < b {
		return -1
	}
	if a > b {
		return 1
	}
	return 0
}

// ── Bump helpers for Info ────────────────────────────

// Bump reads a version.json, bumps the specified component, updates the
// released date, and writes it back. Returns the new version string.
func Bump(path, component string) (string, error) {
	info, err := Load(path)
	if err != nil {
		return "", err
	}

	sv, err := Parse(info.Version)
	if err != nil {
		return "", err
	}

	switch component {
	case "major":
		sv = sv.BumpMajor()
	case "minor":
		sv = sv.BumpMinor()
	case "patch":
		sv = sv.BumpPatch()
	default:
		return "", fmt.Errorf("unknown component %q, use major/minor/patch", component)
	}

	info.Version = sv.String()
	info.Channel = "stable"
	info.Released = time.Now().Format("2006-01-02")

	if err := info.Save(path); err != nil {
		return "", err
	}
	return info.Version, nil
}
