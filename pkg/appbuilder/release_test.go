package appbuilder

import (
	"archive/zip"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"gopkg.in/yaml.v3"
)

// setupTestRelease creates a minimal project layout and release.yaml
// that can be assembled without real builds (all binaries are fake files).
func setupTestRelease(t *testing.T) (rootDir, manifestPath string) {
	t.Helper()
	root := t.TempDir()

	// Fake bios binaries
	write(t, filepath.Join(root, "bios/bin/rubix-bios"), "bios-linux")
	write(t, filepath.Join(root, "bios/bin/rubix-bios.exe"), "bios-windows")

	// Fake rubix binaries
	write(t, filepath.Join(root, "bin/rubix"), "rubix-linux")
	write(t, filepath.Join(root, "bin/rubix.exe"), "rubix-windows")

	// Bios config
	write(t, filepath.Join(root, "desktop/scripts/bios.yaml"), "addr: \":8999\"\n")

	// App manifest
	write(t, filepath.Join(root, "desktop/scripts/rubix-app.yaml"),
		"name: rubix\nexec: ./rubix\nargs: [\"--addr\", \":9000\"]\nport: 9000\n")

	// Config file
	write(t, filepath.Join(root, "config/server.yaml"), "http:\n  addr: \":9000\"\n")

	// Shared: frontend
	write(t, filepath.Join(root, "frontend/dist/client/index.html"), "<html></html>")
	write(t, filepath.Join(root, "frontend/dist/client/assets/app.js"), "console.log('ok')")

	// Shared: configs
	write(t, filepath.Join(root, "configs/ras/admin.yaml"), "routes: []\n")

	// release.yaml — no build commands (binaries are pre-created above)
	manifest := `
bios:
  build: {}
  binary:
    linux: "bios/bin/rubix-bios"
    windows: "bios/bin/rubix-bios.exe"
  config: desktop/scripts/bios.yaml

apps:
  rubix:
    build: {}
    binary:
      linux: "bin/rubix"
      windows: "bin/rubix.exe"
    manifest: desktop/scripts/rubix-app.yaml
    config:
      - config/server.yaml
    dirs: [db, logs]
    shared: [configs, frontend]
    required: true

shared:
  - name: frontend
    src: frontend/dist/client
    output: frontend/dist/client

  - name: configs
    src: configs/ras

start_script: true
`
	manifestPath = filepath.Join(root, "release.yaml")
	write(t, manifestPath, manifest)

	return root, manifestPath
}

func write(t *testing.T, path, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0o755); err != nil {
		t.Fatal(err)
	}
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func dirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

func readFile(t *testing.T, path string) string {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read %s: %v", path, err)
	}
	return string(data)
}

// assembleTest runs AssembleRelease with the given target and returns the output dir.
func assembleTest(t *testing.T, target string, zipFlag bool) string {
	t.Helper()
	root, manifest := setupTestRelease(t)
	out := filepath.Join(t.TempDir(), "desktop-"+target)

	opts := ReleaseOptions{
		ManifestPath: manifest,
		Target:       target,
		OutputDir:    out,
		RootDir:      root,
		Zip:          zipFlag,
	}
	if err := AssembleRelease(opts); err != nil {
		t.Fatalf("AssembleRelease(%s): %v", target, err)
	}
	return out
}

// ── Tests ───────────────────────────────────────────────────────────

func TestWindowsAppManifestHasExe(t *testing.T) {
	out := assembleTest(t, "windows", false)

	appYaml := filepath.Join(out, "apps", "rubix", "app.yaml")
	if !fileExists(appYaml) {
		t.Fatal("apps/rubix/app.yaml not found")
	}

	data, err := os.ReadFile(appYaml)
	if err != nil {
		t.Fatal(err)
	}

	var manifest map[string]interface{}
	if err := yaml.Unmarshal(data, &manifest); err != nil {
		t.Fatal(err)
	}

	exec, ok := manifest["exec"].(string)
	if !ok {
		t.Fatal("exec field missing from app.yaml")
	}
	if !strings.HasSuffix(exec, ".exe") {
		t.Errorf("Windows app.yaml exec = %q, want suffix .exe", exec)
	}
}

func TestLinuxAppManifestNoExe(t *testing.T) {
	out := assembleTest(t, "linux", false)

	data, err := os.ReadFile(filepath.Join(out, "apps", "rubix", "app.yaml"))
	if err != nil {
		t.Fatal(err)
	}

	var manifest map[string]interface{}
	if err := yaml.Unmarshal(data, &manifest); err != nil {
		t.Fatal(err)
	}

	exec := manifest["exec"].(string)
	if strings.HasSuffix(exec, ".exe") {
		t.Errorf("Linux app.yaml exec = %q, should not end with .exe", exec)
	}
}

func TestWindowsKeepsSharedDirsAtRoot(t *testing.T) {
	out := assembleTest(t, "windows", false)

	// frontend and configs must exist at the output root (desktop portable mode needs them)
	if !dirExists(filepath.Join(out, "frontend")) {
		t.Error("top-level frontend/ dir missing in Windows build")
	}
	if !dirExists(filepath.Join(out, "configs")) {
		t.Error("top-level configs/ dir missing in Windows build")
	}

	// Also verify they exist inside apps/rubix/ (copied, not symlinked)
	if !fileExists(filepath.Join(out, "apps", "rubix", "frontend", "dist", "client", "index.html")) {
		t.Error("apps/rubix/frontend/dist/client/index.html missing")
	}
	if !fileExists(filepath.Join(out, "apps", "rubix", "configs", "admin.yaml")) {
		t.Error("apps/rubix/configs/admin.yaml missing")
	}
}

func TestLinuxUsesSymlinksForShared(t *testing.T) {
	out := assembleTest(t, "linux", false)

	// On Linux, apps/rubix/configs should be a symlink
	link := filepath.Join(out, "apps", "rubix", "configs")
	info, err := os.Lstat(link)
	if err != nil {
		t.Fatalf("apps/rubix/configs: %v", err)
	}
	if info.Mode()&os.ModeSymlink == 0 {
		t.Error("apps/rubix/configs should be a symlink on Linux, but isn't")
	}
}

func TestEmptyDirsExistInOutput(t *testing.T) {
	// Empty dirs (db, logs) must be present — rubix crashes without them
	for _, target := range []string{"linux", "windows"} {
		t.Run(target, func(t *testing.T) {
			out := assembleTest(t, target, false)

			for _, dir := range []string{"db", "logs"} {
				path := filepath.Join(out, "apps", "rubix", dir)
				if !dirExists(path) {
					t.Errorf("apps/rubix/%s dir missing in %s build", dir, target)
				}
			}
		})
	}
}

func TestWindowsZipIncludesEmptyDirs(t *testing.T) {
	out := assembleTest(t, "windows", true)

	// Find the zip file
	zipPath := out + ".zip"
	if !fileExists(zipPath) {
		t.Fatalf("zip not created at %s", zipPath)
	}

	r, err := zip.OpenReader(zipPath)
	if err != nil {
		t.Fatal(err)
	}
	defer r.Close()

	// Collect all zip entries
	entries := make(map[string]bool)
	for _, f := range r.File {
		entries[f.Name] = true
	}

	// Empty dirs should be in the zip (trailing slash = directory entry)
	base := filepath.Base(out)
	for _, dir := range []string{"apps/rubix/db/", "apps/rubix/logs/"} {
		key := base + "/" + dir
		if !entries[key] {
			t.Errorf("zip missing empty dir entry %q", key)
			t.Logf("zip entries: %v", sortedKeys(entries))
		}
	}
}

func TestWindowsStartBatUnblocksExe(t *testing.T) {
	out := assembleTest(t, "windows", false)

	bat := readFile(t, filepath.Join(out, "start.bat"))
	if !strings.Contains(bat, "Unblock-File") {
		t.Error("start.bat should contain Unblock-File command for Windows MOTW")
	}
	if !strings.Contains(bat, "rubix-bios.exe") {
		t.Error("start.bat should launch rubix-bios.exe")
	}
}

func TestLinuxStartScript(t *testing.T) {
	out := assembleTest(t, "linux", false)

	sh := readFile(t, filepath.Join(out, "start.sh"))
	if !strings.Contains(sh, "rubix-bios") {
		t.Error("start.sh should launch rubix-bios")
	}
}

func TestWindowsBinaryHasExeSuffix(t *testing.T) {
	out := assembleTest(t, "windows", false)

	if !fileExists(filepath.Join(out, "rubix-bios.exe")) {
		t.Error("rubix-bios.exe missing at output root")
	}
	if !fileExists(filepath.Join(out, "apps", "rubix", "rubix.exe")) {
		t.Error("apps/rubix/rubix.exe missing")
	}
}

func TestLinuxBinaryNoExeSuffix(t *testing.T) {
	out := assembleTest(t, "linux", false)

	if !fileExists(filepath.Join(out, "rubix-bios")) {
		t.Error("rubix-bios missing at output root")
	}
	if !fileExists(filepath.Join(out, "apps", "rubix", "rubix")) {
		t.Error("apps/rubix/rubix missing")
	}
}

func TestOutputStructureComplete(t *testing.T) {
	// Comprehensive check that everything needed to run is present
	for _, target := range []string{"linux", "windows"} {
		t.Run(target, func(t *testing.T) {
			out := assembleTest(t, target, false)

			exe := ""
			if target == "windows" {
				exe = ".exe"
			}

			required := []string{
				"rubix-bios" + exe,
				"bios.yaml",
				"apps/rubix/app.yaml",
				"apps/rubix/rubix" + exe,
				"apps/rubix/server.yaml",
				"frontend/dist/client/index.html",
				"configs/admin.yaml",
			}

			for _, rel := range required {
				if !fileExists(filepath.Join(out, rel)) {
					t.Errorf("missing required file: %s", rel)
				}
			}

			requiredDirs := []string{
				"apps/rubix/db",
				"apps/rubix/logs",
			}
			for _, rel := range requiredDirs {
				if !dirExists(filepath.Join(out, rel)) {
					t.Errorf("missing required dir: %s", rel)
				}
			}
		})
	}
}

func TestBiosYamlAtRootForPortableMode(t *testing.T) {
	// bios.yaml MUST exist at the output root — this is the portable mode trigger.
	// Without it, the desktop app falls through to installed mode and uses AppData.
	for _, target := range []string{"linux", "windows"} {
		t.Run(target, func(t *testing.T) {
			out := assembleTest(t, target, false)

			biosYaml := filepath.Join(out, "bios.yaml")
			if !fileExists(biosYaml) {
				t.Fatalf("bios.yaml MISSING at output root — desktop will use AppData instead of working directory!")
			}

			// Verify it's a valid yaml with addr field
			content := readFile(t, biosYaml)
			if !strings.Contains(content, "8999") {
				t.Errorf("bios.yaml should contain port 8999, got: %s", content)
			}
		})
	}
}

func TestPortableBuildSelfContained(t *testing.T) {
	// A portable build must be fully self-contained — everything rubix and bios
	// need must be under the output root. If anything is missing, the desktop app
	// may silently fall back to AppData or crash.
	for _, target := range []string{"linux", "windows"} {
		t.Run(target, func(t *testing.T) {
			out := assembleTest(t, target, false)

			exe := ""
			if target == "windows" {
				exe = ".exe"
			}

			// These files/dirs are required for a self-contained portable build
			critical := map[string]string{
				"bios.yaml":                          "portable mode detection",
				"rubix-bios" + exe:                   "process manager binary",
				"apps/rubix/rubix" + exe:             "main app binary",
				"apps/rubix/app.yaml":                "app manifest for bios",
				"apps/rubix/server.yaml":             "rubix server config",
				"frontend/dist/client/index.html":    "web UI",
				"configs/admin.yaml":                 "API configs",
			}

			for rel, why := range critical {
				if !fileExists(filepath.Join(out, rel)) {
					t.Errorf("MISSING %s — needed for: %s", rel, why)
				}
			}

			criticalDirs := map[string]string{
				"apps/rubix/db":   "rubix database storage",
				"apps/rubix/logs": "rubix log output",
			}

			for rel, why := range criticalDirs {
				if !dirExists(filepath.Join(out, rel)) {
					t.Errorf("MISSING dir %s — needed for: %s", rel, why)
				}
			}
		})
	}
}

// ── Helpers ─────────────────────────────────────────────────────────

func sortedKeys(m map[string]bool) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}
