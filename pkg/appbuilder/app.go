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
	Binary    string   // required: path to binary on disk
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
		Exec:      "./" + filepath.Base(opts.Binary),
		Args:      opts.Args,
		Port:      opts.Port,
		HealthURL: opts.HealthURL,
	}

	manifestBytes, err := WriteAppYAML(manifest)
	if err != nil {
		return "", fmt.Errorf("render manifest: %w", err)
	}

	// Resolve binary.
	binaryAbs, err := filepath.Abs(opts.Binary)
	if err != nil {
		return "", fmt.Errorf("resolve binary path: %w", err)
	}

	// Collect files.
	entries := []FileEntry{
		{DiskPath: binaryAbs, ZipPath: filepath.Base(opts.Binary), Executable: true},
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
