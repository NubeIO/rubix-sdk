package appbuilder

import (
	"fmt"
	"path/filepath"
)

// AppOptions is the input for PackageApp. All the caller needs to provide.
type AppOptions struct {
	Name      string   // required: app name
	Version   string   // required: semver
	Arch      string   // required: target arch
	Binary    string   // required: path to binary on disk (empty for static apps)
	Static    bool     // if true, creates a static file-serving app (no binary)
	StaticDir string   // subdirectory name in the zip to serve (e.g. "web")
	Files     []string // optional: extra files to include
	Dirs      []string // optional: extra directories to include
	Port      int      // optional: app port
	HealthURL string   // optional: health check URL
	Args      []string // optional: app arguments
	OutputDir string   // optional: output directory (default ".")
}

// PackageApp builds a distributable zip from the given options.
// Returns the path to the created zip file.
func PackageApp(opts AppOptions) (string, error) {
	if opts.OutputDir == "" {
		opts.OutputDir = "."
	}

	// Build manifest.
	manifest := AppManifest{
		Name:      opts.Name,
		Version:   opts.Version,
		Args:      opts.Args,
		Port:      opts.Port,
		HealthURL: opts.HealthURL,
	}

	var entries []FileEntry

	if opts.Static {
		manifest.Exec = "static"
		manifest.StaticDir = opts.StaticDir
		if manifest.HealthURL == "" && opts.Port > 0 {
			manifest.HealthURL = fmt.Sprintf("http://localhost:%d/", opts.Port)
		}
	} else {
		manifest.Exec = "./" + filepath.Base(opts.Binary)

		binaryAbs, err := filepath.Abs(opts.Binary)
		if err != nil {
			return "", fmt.Errorf("resolve binary path: %w", err)
		}
		entries = append(entries, FileEntry{DiskPath: binaryAbs, ZipPath: filepath.Base(opts.Binary), Executable: true})
	}

	manifestBytes, err := WriteAppYAML(manifest)
	if err != nil {
		return "", fmt.Errorf("render manifest: %w", err)
	}

	for _, f := range opts.Files {
		abs, err := filepath.Abs(f)
		if err != nil {
			return "", fmt.Errorf("resolve file path %s: %w", f, err)
		}
		entries = append(entries, FileEntry{DiskPath: abs, ZipPath: filepath.Base(f)})
	}

	for _, d := range opts.Dirs {
		abs, err := filepath.Abs(d)
		if err != nil {
			return "", fmt.Errorf("resolve dir path %s: %w", d, err)
		}
		entries = append(entries, FileEntry{DiskPath: abs, ZipPath: filepath.Base(d)})
	}

	spec := BuildSpec{
		Name:     opts.Name,
		Version:  opts.Version,
		Arch:     opts.Arch,
		Kind:     "app",
		Manifest: manifestBytes,
		Files:    entries,
	}

	return Build(spec, opts.OutputDir)
}
