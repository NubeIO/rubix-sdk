package appbuilder

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// PluginOptions is the input for PackagePlugin.
type PluginOptions struct {
	Name       string   // required: plugin ID (e.g. "nube.github")
	Version    string   // required: semver
	Arch       string   // required: target arch
	Binary     string   // required: path to plugin binary on disk
	PluginJSON string   // required: path to existing plugin.json
	Files      []string // optional: extra files/dirs to include
	Dirs       []string // optional: extra directories to include
	OutputDir  string   // optional: output directory (default ".")
}

// PackagePlugin builds a distributable zip for a plugin.
// It reads the existing plugin.json, overrides the version if needed,
// and bundles everything into {name}-{version}-{arch}.zip.
func PackagePlugin(opts PluginOptions) (string, error) {
	if opts.OutputDir == "" {
		opts.OutputDir = "."
	}

	// Read and patch plugin.json.
	raw, err := os.ReadFile(opts.PluginJSON)
	if err != nil {
		return "", fmt.Errorf("read plugin.json: %w", err)
	}

	var manifest map[string]any
	if err := json.Unmarshal(raw, &manifest); err != nil {
		return "", fmt.Errorf("parse plugin.json: %w", err)
	}

	// Override version to match what we're packaging.
	manifest["version"] = opts.Version

	manifestBytes, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		return "", fmt.Errorf("render plugin.json: %w", err)
	}
	manifestBytes = append(manifestBytes, '\n')

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
		Kind:     "plugin",
		Manifest: manifestBytes,
		Files:    entries,
	}

	return Build(spec, opts.OutputDir)
}
