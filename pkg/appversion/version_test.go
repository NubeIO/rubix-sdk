package appversion

import (
	"os"
	"path/filepath"
	"testing"
)

func TestParse(t *testing.T) {
	tests := []struct {
		input string
		want  Semver
	}{
		{"1.0.0", Semver{1, 0, 0}},
		{"0.1.2", Semver{0, 1, 2}},
		{"10.20.30", Semver{10, 20, 30}},
		{"v1.2.3", Semver{1, 2, 3}},
		{"1.2.3-beta", Semver{1, 2, 3}},
	}

	for _, tt := range tests {
		got, err := Parse(tt.input)
		if err != nil {
			t.Errorf("Parse(%q) error: %v", tt.input, err)
			continue
		}
		if got != tt.want {
			t.Errorf("Parse(%q) = %v, want %v", tt.input, got, tt.want)
		}
	}
}

func TestParseInvalid(t *testing.T) {
	bad := []string{"", "1", "1.2", "abc", "1.2.x"}
	for _, s := range bad {
		if _, err := Parse(s); err == nil {
			t.Errorf("Parse(%q) should fail", s)
		}
	}
}

func TestBump(t *testing.T) {
	sv := Semver{1, 2, 3}

	if got := sv.BumpPatch(); got != (Semver{1, 2, 4}) {
		t.Errorf("BumpPatch = %v", got)
	}
	if got := sv.BumpMinor(); got != (Semver{1, 3, 0}) {
		t.Errorf("BumpMinor = %v", got)
	}
	if got := sv.BumpMajor(); got != (Semver{2, 0, 0}) {
		t.Errorf("BumpMajor = %v", got)
	}
}

func TestCompare(t *testing.T) {
	tests := []struct {
		a, b string
		want int
	}{
		{"1.0.0", "1.0.0", 0},
		{"1.0.0", "1.0.1", -1},
		{"2.0.0", "1.9.9", 1},
		{"1.1.0", "1.0.9", 1},
	}

	for _, tt := range tests {
		a, _ := Parse(tt.a)
		b, _ := Parse(tt.b)
		if got := a.Compare(b); got != tt.want {
			t.Errorf("%s.Compare(%s) = %d, want %d", tt.a, tt.b, got, tt.want)
		}
	}
}

func TestLoadSave(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "version.json")

	info := &Info{Version: "1.0.0", Channel: "stable", Released: "2026-04-13"}
	if err := info.Save(path); err != nil {
		t.Fatalf("Save: %v", err)
	}

	loaded, err := Load(path)
	if err != nil {
		t.Fatalf("Load: %v", err)
	}

	if loaded.Version != "1.0.0" || loaded.Channel != "stable" || loaded.Released != "2026-04-13" {
		t.Errorf("loaded = %+v", loaded)
	}
}

func TestBumpFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "version.json")

	os.WriteFile(path, []byte(`{"version":"1.2.3","channel":"dev"}`), 0o644)

	newVer, err := Bump(path, "minor")
	if err != nil {
		t.Fatalf("Bump: %v", err)
	}
	if newVer != "1.3.0" {
		t.Errorf("Bump minor = %q, want 1.3.0", newVer)
	}

	loaded, _ := Load(path)
	if loaded.Channel != "stable" {
		t.Errorf("channel should be stable after bump, got %q", loaded.Channel)
	}
}
