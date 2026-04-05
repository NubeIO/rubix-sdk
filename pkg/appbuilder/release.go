package appbuilder

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

// ── Manifest types ───────────────────────────────────────────────────

// ReleaseManifest is the top-level release.yaml structure.
type ReleaseManifest struct {
	Bios        ReleaseBios           `yaml:"bios"`
	Apps        map[string]ReleaseApp `yaml:"apps"`
	Shared      []ReleaseShared       `yaml:"shared,omitempty"`
	Desktop     *ReleaseDesktop       `yaml:"desktop,omitempty"`
	StartScript bool                  `yaml:"start_script"`
}

// ReleaseBios describes the bios process manager.
type ReleaseBios struct {
	Build  map[string]string `yaml:"build"`  // target → shell command
	Binary map[string]string `yaml:"binary"` // target → artifact path
	Config string            `yaml:"config"` // config file path
}

// ReleaseApp describes a bios-managed app.
type ReleaseApp struct {
	Build    map[string]string `yaml:"build"`            // target → shell command
	Binary   map[string]string `yaml:"binary"`           // target → artifact path
	Manifest string            `yaml:"manifest"`
	Config   []string          `yaml:"config,omitempty"`
	Dirs     []string          `yaml:"dirs,omitempty"`
	Shared   []string          `yaml:"shared,omitempty"` // names of shared resources to link
	Required bool              `yaml:"required"`
}

// ReleaseShared maps a shared resource (may have a build step).
type ReleaseShared struct {
	Name  string `yaml:"name"`
	Build string `yaml:"build,omitempty"` // shell command (optional)
	Src   string `yaml:"src"`            // path to artifact directory
}

// ReleaseDesktop describes the optional Tauri desktop binary.
type ReleaseDesktop struct {
	Build  map[string]string `yaml:"build"`  // target → shell command
	Binary map[string]string `yaml:"binary"` // target → artifact path
}

// ── Options ──────────────────────────────────────────────────────────

// ReleaseOptions are the CLI inputs for building + assembling a release.
type ReleaseOptions struct {
	ManifestPath string // path to release.yaml
	Target       string // "linux", "windows", "pi", "pi32"
	OutputDir    string // output folder
	RootDir      string // project root (build commands run here)
	Exclude      string // comma-separated component names to skip
	Reuse        string // comma-separated component:timestamp pairs
	Zip          bool   // create archive after assembly
	CacheDir     string // cache root (default: dist/cache)
	// Legacy compat (used if Target is empty)
	OS   string
	Arch string
}

// resolvedTarget returns the target string, falling back to OS+Arch mapping.
func (o ReleaseOptions) resolvedTarget() string {
	if o.Target != "" {
		return o.Target
	}
	// Map legacy --os/--arch to target names.
	switch {
	case o.OS == "windows":
		return "windows"
	case o.Arch == "arm64":
		return "pi"
	case o.Arch == "armv7" || o.Arch == "arm":
		return "pi32"
	default:
		return "linux"
	}
}

// targetOS returns "linux" or "windows" for the resolved target.
func (o ReleaseOptions) targetOS() string {
	if o.resolvedTarget() == "windows" {
		return "windows"
	}
	return "linux"
}

// ── Cache helpers ────────────────────────────────────────────────────

func cacheTimestamp() string {
	return time.Now().Format("060102-150405")
}

func parseCacheDir(opts ReleaseOptions) string {
	base := opts.CacheDir
	if base == "" {
		base = filepath.Join(filepath.Dir(opts.OutputDir), "cache")
	}
	return filepath.Join(base, opts.resolvedTarget())
}

func parseExclude(exclude string) map[string]bool {
	set := make(map[string]bool)
	if exclude == "" {
		return set
	}
	for _, name := range strings.Split(exclude, ",") {
		name = strings.TrimSpace(name)
		if name != "" {
			set[name] = true
		}
	}
	return set
}

type reuseEntry struct {
	Component string
	Timestamp string
}

func parseReuse(reuse string) ([]reuseEntry, error) {
	if reuse == "" {
		return nil, nil
	}
	var entries []reuseEntry
	for _, part := range strings.Split(reuse, ",") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		idx := strings.Index(part, ":")
		if idx < 0 {
			return nil, fmt.Errorf("invalid --reuse format %q: expected component:YYMMDD-HHmmss", part)
		}
		entries = append(entries, reuseEntry{
			Component: part[:idx],
			Timestamp: part[idx+1:],
		})
	}
	return entries, nil
}

func cacheComponentDir(cacheDir, component, timestamp string) string {
	return filepath.Join(cacheDir, fmt.Sprintf("%s-%s", component, timestamp))
}

func findCachedComponent(cacheDir, component, timestamp string) (string, error) {
	dir := cacheComponentDir(cacheDir, component, timestamp)
	if _, err := os.Stat(dir); err != nil {
		return "", fmt.Errorf("no cache for %s-%s in %s", component, timestamp, cacheDir)
	}
	return dir, nil
}

func listCachedTimestamps(cacheDir, component string) []string {
	entries, err := os.ReadDir(cacheDir)
	if err != nil {
		return nil
	}
	prefix := component + "-"
	var timestamps []string
	for _, e := range entries {
		if e.IsDir() && strings.HasPrefix(e.Name(), prefix) {
			ts := strings.TrimPrefix(e.Name(), prefix)
			timestamps = append(timestamps, ts)
		}
	}
	sort.Sort(sort.Reverse(sort.StringSlice(timestamps)))
	return timestamps
}

// cacheArtifact copies a file or directory into the cache.
func cacheArtifact(cacheDir, component, timestamp, srcPath string) error {
	dst := cacheComponentDir(cacheDir, component, timestamp)
	if err := os.MkdirAll(dst, 0o755); err != nil {
		return err
	}
	info, err := os.Stat(srcPath)
	if err != nil {
		return err
	}
	if info.IsDir() {
		return copyDir(srcPath, dst)
	}
	return copyFilePreserveMode(srcPath, filepath.Join(dst, filepath.Base(srcPath)))
}

// ── Build runner ─────────────────────────────────────────────────────

// runBuild executes a shell command from the project root.
func runBuild(rootDir, command string) error {
	fmt.Printf("  build: %s\n", command)
	cmd := exec.Command("bash", "-c", command)
	cmd.Dir = rootDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	// Pass through environment (GO_TAGS, PATH, etc.)
	cmd.Env = os.Environ()
	return cmd.Run()
}

// ── AssembleRelease — the main entry point ───────────────────────────

func AssembleRelease(opts ReleaseOptions) error {
	raw, err := os.ReadFile(opts.ManifestPath)
	if err != nil {
		return fmt.Errorf("read manifest: %w", err)
	}

	var manifest ReleaseManifest
	if err := yaml.Unmarshal(raw, &manifest); err != nil {
		return fmt.Errorf("parse manifest: %w", err)
	}

	target := opts.resolvedTarget()
	isWindows := opts.targetOS() == "windows"
	exeSuffix := ""
	if isWindows {
		exeSuffix = ".exe"
	}

	root := opts.RootDir
	out := opts.OutputDir

	excludeSet := parseExclude(opts.Exclude)
	reuseEntries, err := parseReuse(opts.Reuse)
	if err != nil {
		return err
	}
	reuseMap := make(map[string]string)
	for _, e := range reuseEntries {
		reuseMap[e.Component] = e.Timestamp
	}

	cacheDir := parseCacheDir(opts)
	ts := cacheTimestamp()

	fmt.Printf("target: %s | cache: %s | timestamp: %s\n", target, cacheDir, ts)

	// Clean and create output dir.
	if err := os.RemoveAll(out); err != nil {
		return fmt.Errorf("clean output dir: %w", err)
	}
	if err := os.MkdirAll(out, 0o755); err != nil {
		return fmt.Errorf("create output dir: %w", err)
	}

	// ── Shared resources (build first — apps may depend on them) ─────
	sharedMap := make(map[string]ReleaseShared) // name → shared for app linking
	for _, s := range manifest.Shared {
		sharedMap[s.Name] = s

		if excludeSet[s.Name] {
			fmt.Printf("  skip: %s (excluded)\n", s.Name)
			continue
		}

		dst := filepath.Join(out, s.Name)

		if reuseTS, ok := reuseMap[s.Name]; ok {
			cached, err := findCachedComponent(cacheDir, s.Name, reuseTS)
			if err != nil {
				return fmt.Errorf("reuse %s: %w", s.Name, err)
			}
			fmt.Printf("  reuse: %s from cache (%s)\n", s.Name, reuseTS)
			if err := copyDir(cached, dst); err != nil {
				return fmt.Errorf("restore %s from cache: %w", s.Name, err)
			}
			continue
		}

		// Build if build command exists.
		if s.Build != "" {
			if err := runBuild(root, s.Build); err != nil {
				return fmt.Errorf("build %s: %w", s.Name, err)
			}
		}

		src := resolvePath(root, s.Src)
		if _, err := os.Stat(src); err != nil {
			fmt.Fprintf(os.Stderr, "warning: shared %q not found at %s, skipping\n", s.Name, src)
			continue
		}
		if err := copyDir(src, dst); err != nil {
			return fmt.Errorf("copy shared %q: %w", s.Name, err)
		}

		// Cache.
		if err := cacheArtifact(cacheDir, s.Name, ts, src); err != nil {
			fmt.Fprintf(os.Stderr, "warning: cache %s: %v\n", s.Name, err)
		}
	}

	// ── Bios ─────────────────────────────────────────────────────────
	if !excludeSet["bios"] {
		if reuseTS, ok := reuseMap["bios"]; ok {
			cached, err := findCachedComponent(cacheDir, "bios", reuseTS)
			if err != nil {
				return fmt.Errorf("reuse bios: %w", err)
			}
			fmt.Printf("  reuse: bios from cache (%s)\n", reuseTS)
			// Cache contains rubix-bios + bios.yaml — copy all files to output root.
			if err := copyDir(cached, out); err != nil {
				return fmt.Errorf("restore bios from cache: %w", err)
			}
		} else {
			// Build bios.
			if buildCmd, ok := manifest.Bios.Build[target]; ok {
				if err := runBuild(root, buildCmd); err != nil {
					return fmt.Errorf("build bios: %w", err)
				}
			}

			biosBinPath, ok := manifest.Bios.Binary[target]
			if !ok {
				return fmt.Errorf("bios: no binary path for target %q", target)
			}
			biosBin := resolvePath(root, biosBinPath)
			if err := requireFile(biosBin); err != nil {
				return fmt.Errorf("bios binary: %w", err)
			}
			if err := copyExecutable(biosBin, filepath.Join(out, "rubix-bios"+exeSuffix)); err != nil {
				return fmt.Errorf("copy bios: %w", err)
			}

			biosConfig := resolvePath(root, manifest.Bios.Config)
			if err := requireFile(biosConfig); err != nil {
				return fmt.Errorf("bios config: %w", err)
			}
			if err := copyFile(biosConfig, filepath.Join(out, "bios.yaml")); err != nil {
				return fmt.Errorf("copy bios config: %w", err)
			}

			// Cache bios (binary + config in a temp dir).
			tmpCache, _ := os.MkdirTemp("", "builder-bios-cache")
			copyExecutable(biosBin, filepath.Join(tmpCache, "rubix-bios"+exeSuffix))
			copyFile(biosConfig, filepath.Join(tmpCache, "bios.yaml"))
			if err := cacheArtifact(cacheDir, "bios", ts, tmpCache); err != nil {
				fmt.Fprintf(os.Stderr, "warning: cache bios: %v\n", err)
			}
			os.RemoveAll(tmpCache)
		}
	} else {
		fmt.Printf("  skip: bios (excluded)\n")
	}

	// ── Apps ─────────────────────────────────────────────────────────
	for name, app := range manifest.Apps {
		if excludeSet[name] {
			fmt.Printf("  skip: app %s (excluded)\n", name)
			continue
		}

		appDir := filepath.Join(out, "apps", name)

		if reuseTS, ok := reuseMap[name]; ok {
			cached, err := findCachedComponent(cacheDir, name, reuseTS)
			if err != nil {
				return fmt.Errorf("reuse app %s: %w", name, err)
			}
			fmt.Printf("  reuse: app %s from cache (%s)\n", name, reuseTS)
			if err := os.MkdirAll(filepath.Join(out, "apps"), 0o755); err != nil {
				return fmt.Errorf("create apps dir: %w", err)
			}
			if err := copyDir(cached, appDir); err != nil {
				return fmt.Errorf("restore app %s from cache: %w", name, err)
			}
			continue
		}

		// Build app.
		if buildCmd, ok := app.Build[target]; ok {
			if err := runBuild(root, buildCmd); err != nil {
				if app.Required {
					return fmt.Errorf("build app %s: %w", name, err)
				}
				fmt.Fprintf(os.Stderr, "warning: build app %s failed: %v, skipping\n", name, err)
				continue
			}
		}

		appBinPath, ok := app.Binary[target]
		if !ok {
			if app.Required {
				return fmt.Errorf("app %s: no binary path for target %q", name, target)
			}
			fmt.Printf("  skip: app %s (no binary for target %s)\n", name, target)
			continue
		}
		appBin := resolvePath(root, appBinPath)
		if _, err := os.Stat(appBin); err != nil {
			if app.Required {
				return fmt.Errorf("required app %s: binary not found at %s", name, appBin)
			}
			fmt.Fprintf(os.Stderr, "warning: optional app %s binary not found at %s, skipping\n", name, appBin)
			continue
		}

		if err := os.MkdirAll(appDir, 0o755); err != nil {
			return fmt.Errorf("create app dir %s: %w", name, err)
		}

		// Binary
		binBase := filepath.Base(appBinPath)
		if err := copyExecutable(appBin, filepath.Join(appDir, binBase)); err != nil {
			return fmt.Errorf("copy %s binary: %w", name, err)
		}

		// Manifest (app.yaml)
		if app.Manifest != "" {
			manifestSrc := resolvePath(root, app.Manifest)
			if err := requireFile(manifestSrc); err != nil {
				return fmt.Errorf("app %s manifest: %w", name, err)
			}
			if err := copyFile(manifestSrc, filepath.Join(appDir, "app.yaml")); err != nil {
				return fmt.Errorf("copy %s manifest: %w", name, err)
			}
		}

		// Config files
		for _, cfg := range app.Config {
			cfgSrc := resolvePath(root, cfg)
			if _, err := os.Stat(cfgSrc); err != nil {
				fmt.Fprintf(os.Stderr, "warning: app %s config %q not found, skipping\n", name, cfg)
				continue
			}
			if err := copyFile(cfgSrc, filepath.Join(appDir, filepath.Base(cfg))); err != nil {
				return fmt.Errorf("copy %s config %q: %w", name, cfg, err)
			}
		}

		// Empty dirs
		for _, d := range app.Dirs {
			if err := os.MkdirAll(filepath.Join(appDir, d), 0o755); err != nil {
				return fmt.Errorf("create %s dir %q: %w", name, d, err)
			}
		}

		// Shared resources (symlink on linux, copy on windows)
		for _, sharedName := range app.Shared {
			if excludeSet[sharedName] {
				continue
			}
			rootSrc := filepath.Join(out, sharedName)
			appDst := filepath.Join(appDir, sharedName)

			if _, err := os.Stat(rootSrc); err != nil {
				// Fallback: copy from source path if defined in shared map.
				if s, ok := sharedMap[sharedName]; ok {
					src := resolvePath(root, s.Src)
					if _, serr := os.Stat(src); serr == nil {
						if err := copyDir(src, appDst); err != nil {
							return fmt.Errorf("copy %s shared %s: %w", name, sharedName, err)
						}
						continue
					}
				}
				fmt.Fprintf(os.Stderr, "warning: app %s shared %q not found, skipping\n", name, sharedName)
				continue
			}

			if isWindows {
				if err := copyDir(rootSrc, appDst); err != nil {
					return fmt.Errorf("copy %s shared %s: %w", name, sharedName, err)
				}
			} else {
				rel, err := filepath.Rel(appDir, rootSrc)
				if err != nil {
					return fmt.Errorf("relative path for %s shared %s: %w", name, sharedName, err)
				}
				if err := os.Symlink(rel, appDst); err != nil {
					return fmt.Errorf("symlink %s shared %s: %w", name, sharedName, err)
				}
			}
		}

		// Cache the assembled app directory.
		if err := cacheArtifact(cacheDir, name, ts, appDir); err != nil {
			fmt.Fprintf(os.Stderr, "warning: cache app %s: %v\n", name, err)
		}
	}

	// ── Windows: remove root-level shared (already copied into apps) ─
	if isWindows {
		for _, s := range manifest.Shared {
			if !excludeSet[s.Name] {
				os.RemoveAll(filepath.Join(out, s.Name))
			}
		}
	}

	// ── Desktop (Tauri binary) — optional ────────────────────────────
	if manifest.Desktop != nil && !excludeSet["desktop"] {
		if reuseTS, ok := reuseMap["desktop"]; ok {
			cached, err := findCachedComponent(cacheDir, "desktop", reuseTS)
			if err != nil {
				return fmt.Errorf("reuse desktop: %w", err)
			}
			fmt.Printf("  reuse: desktop from cache (%s)\n", reuseTS)
			// Copy all files from cache to output root.
			if err := copyDir(cached, out); err != nil {
				return fmt.Errorf("restore desktop from cache: %w", err)
			}
		} else {
			// Build desktop.
			if buildCmd, ok := manifest.Desktop.Build[target]; ok {
				if err := runBuild(root, buildCmd); err != nil {
					return fmt.Errorf("build desktop: %w", err)
				}
			}

			if desktopBinPath, ok := manifest.Desktop.Binary[target]; ok {
				desktopBin := resolvePath(root, desktopBinPath)
				if _, err := os.Stat(desktopBin); err == nil {
					dstName := "rubix-desktop" + exeSuffix
					if err := copyExecutable(desktopBin, filepath.Join(out, dstName)); err != nil {
						return fmt.Errorf("copy desktop binary: %w", err)
					}

					// Cache desktop binary.
					tmpCache, _ := os.MkdirTemp("", "builder-desktop-cache")
					copyExecutable(desktopBin, filepath.Join(tmpCache, dstName))
					if err := cacheArtifact(cacheDir, "desktop", ts, tmpCache); err != nil {
						fmt.Fprintf(os.Stderr, "warning: cache desktop: %v\n", err)
					}
					os.RemoveAll(tmpCache)
				} else {
					fmt.Fprintf(os.Stderr, "warning: desktop binary not found at %s\n", desktopBin)
				}
			} else {
				fmt.Printf("  skip: desktop (no binary for target %s)\n", target)
			}
		}
	} else if excludeSet["desktop"] {
		fmt.Printf("  skip: desktop (excluded)\n")
	}

	// ── Start script ─────────────────────────────────────────────────
	if manifest.StartScript {
		if isWindows {
			script := "@echo off\r\n\"%~dp0rubix-bios.exe\" %*\r\n"
			if err := os.WriteFile(filepath.Join(out, "start.bat"), []byte(script), 0o644); err != nil {
				return fmt.Errorf("write start.bat: %w", err)
			}
		} else {
			script := "#!/bin/bash\nDIR=\"$(cd \"$(dirname \"$0\")\" && pwd)\"\ncd \"$DIR\"\nexec \"$DIR/rubix-bios\" \"$@\"\n"
			if err := os.WriteFile(filepath.Join(out, "start.sh"), []byte(script), 0o755); err != nil {
				return fmt.Errorf("write start.sh: %w", err)
			}
		}
	}

	fmt.Printf("\nrelease assembled → %s\n", out)

	// ── Zip / archive ────────────────────────────────────────────────
	if opts.Zip {
		if err := archiveRelease(out, opts.targetOS()); err != nil {
			return fmt.Errorf("archive: %w", err)
		}
	}

	// ── Build snapshot ───────────────────────────────────────────────
	buildDir := filepath.Join(filepath.Dir(out), "build")
	buildName := fmt.Sprintf("%s-%s", target, ts)
	buildDst := filepath.Join(buildDir, buildName)
	if err := os.MkdirAll(buildDir, 0o755); err == nil {
		os.RemoveAll(buildDst)
		if err := copyDir(out, buildDst); err != nil {
			fmt.Fprintf(os.Stderr, "warning: build snapshot: %v\n", err)
		} else {
			fmt.Printf("build snapshot → %s\n", buildDst)
		}
	}

	// Print cache info.
	fmt.Printf("\ncache timestamp: %s\n", ts)
	fmt.Printf("  reuse with: --reuse component:%s\n", ts)

	return nil
}

// ── Archive helpers ──────────────────────────────────────────────────

func archiveRelease(outDir, targetOS string) error {
	base := filepath.Base(outDir)
	parent := filepath.Dir(outDir)

	if targetOS == "windows" {
		archivePath := filepath.Join(parent, base+".zip")
		return createZip(outDir, archivePath, base)
	}
	archivePath := filepath.Join(parent, base+".tar.gz")
	return createTarGz(outDir, archivePath, base)
}

func createTarGz(srcDir, archivePath, archiveRoot string) error {
	f, err := os.Create(archivePath)
	if err != nil {
		return err
	}
	defer f.Close()

	gw := gzip.NewWriter(f)
	defer gw.Close()

	tw := tar.NewWriter(gw)
	defer tw.Close()

	err = filepath.Walk(srcDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && strings.HasSuffix(info.Name(), ".map") {
			return nil
		}

		rel, err := filepath.Rel(srcDir, path)
		if err != nil {
			return err
		}
		archiveName := filepath.Join(archiveRoot, rel)

		if info.Mode()&os.ModeSymlink != 0 {
			link, err := os.Readlink(path)
			if err != nil {
				return err
			}
			return tw.WriteHeader(&tar.Header{
				Name:     archiveName,
				Typeflag: tar.TypeSymlink,
				Linkname: link,
			})
		}

		header, err := tar.FileInfoHeader(info, "")
		if err != nil {
			return err
		}
		header.Name = archiveName
		if err := tw.WriteHeader(header); err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()
		_, err = io.Copy(tw, file)
		return err
	})

	if err == nil {
		fmt.Printf("archive → %s\n", archivePath)
	}
	return err
}

func createZip(srcDir, archivePath, archiveRoot string) error {
	f, err := os.Create(archivePath)
	if err != nil {
		return err
	}
	defer f.Close()

	zw := zip.NewWriter(f)
	defer zw.Close()

	err = filepath.Walk(srcDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() || strings.HasSuffix(info.Name(), ".map") {
			return nil
		}

		rel, err := filepath.Rel(srcDir, path)
		if err != nil {
			return err
		}
		w, err := zw.Create(filepath.Join(archiveRoot, rel))
		if err != nil {
			return err
		}
		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()
		_, err = io.Copy(w, file)
		return err
	})

	if err == nil {
		fmt.Printf("archive → %s\n", archivePath)
	}
	return err
}

// ── File helpers ─────────────────────────────────────────────────────

func resolvePath(root, path string) string {
	if filepath.IsAbs(path) {
		return path
	}
	return filepath.Join(root, path)
}

func requireFile(path string) error {
	if _, err := os.Stat(path); err != nil {
		return fmt.Errorf("not found: %s", path)
	}
	return nil
}

func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0o644)
}

func copyExecutable(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0o755)
}

func copyFilePreserveMode(src, dst string) error {
	info, err := os.Stat(src)
	if err != nil {
		return err
	}
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return err
	}
	return os.WriteFile(dst, data, info.Mode())
}

func copyDir(src, dst string) error {
	if err := os.MkdirAll(dst, 0o755); err != nil {
		return err
	}
	return copyDirWalk(src, dst, src)
}

func copyDirWalk(root, dstRoot, dir string) error {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return err
	}
	for _, e := range entries {
		path := filepath.Join(dir, e.Name())
		rel, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dstRoot, rel)

		info, err := os.Lstat(path)
		if err != nil {
			return err
		}

		if info.Mode()&os.ModeSymlink != 0 {
			link, err := os.Readlink(path)
			if err != nil {
				return err
			}
			if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
				return err
			}
			if err := os.Symlink(link, target); err != nil {
				return err
			}
			continue
		}

		if info.IsDir() {
			if err := os.MkdirAll(target, 0o755); err != nil {
				return err
			}
			if err := copyDirWalk(root, dstRoot, path); err != nil {
				return err
			}
			continue
		}

		if info.Mode()&0o111 != 0 {
			if err := copyExecutable(path, target); err != nil {
				return err
			}
		} else {
			if err := copyFile(path, target); err != nil {
				return err
			}
		}
	}
	return nil
}

// ── Compat exports ───────────────────────────────────────────────────

func ReleaseArchForTarget(goos, goarch string) string {
	if goos == "" {
		goos = runtime.GOOS
	}
	if goarch == "" {
		goarch = runtime.GOARCH
	}
	switch {
	case goos == "windows" && goarch == "amd64":
		return "amd64-win"
	case goarch == "arm64":
		return "arm64"
	case goarch == "arm":
		return "armv7"
	default:
		return goarch
	}
}

func BinarySuffix(path, targetOS string) string {
	if targetOS == "windows" && !strings.HasSuffix(path, ".exe") {
		return path + ".exe"
	}
	return path
}
