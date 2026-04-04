package appbuilder

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// Build creates a zip at {outputDir}/{name}-{version}-{arch}.zip and returns the path.
func Build(spec BuildSpec, outputDir string) (string, error) {
	if err := ValidateSpec(spec); err != nil {
		return "", err
	}

	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		return "", fmt.Errorf("create output dir: %w", err)
	}

	zipName := fmt.Sprintf("%s-%s-%s.zip", spec.Name, spec.Version, spec.Arch)
	zipPath := filepath.Join(outputDir, zipName)

	f, err := os.Create(zipPath)
	if err != nil {
		return "", fmt.Errorf("create zip: %w", err)
	}
	defer f.Close()

	w := zip.NewWriter(f)
	defer w.Close()

	// Write manifest.
	manifestName := "app.yaml"
	if spec.Kind == "plugin" {
		manifestName = "plugin.json"
	}
	mw, err := w.Create(manifestName)
	if err != nil {
		return "", fmt.Errorf("write manifest: %w", err)
	}
	if _, err := mw.Write(spec.Manifest); err != nil {
		return "", fmt.Errorf("write manifest: %w", err)
	}

	// Write files.
	for _, entry := range spec.Files {
		if err := addToZip(w, entry); err != nil {
			return "", err
		}
	}

	return zipPath, nil
}

// ParseZipName extracts the name, version, and arch from a zip filename
// like "bacnet-server-2.1.0-amd64.zip".
func ParseZipName(filename string) (name, version, arch string, err error) {
	base := strings.TrimSuffix(filepath.Base(filename), ".zip")

	// Try each known arch suffix (longest first to match "amd64-win" before "amd64").
	archList := []string{"amd64-win", "amd64", "arm64", "armv7"}
	for _, a := range archList {
		suffix := "-" + a
		if strings.HasSuffix(base, suffix) {
			rest := strings.TrimSuffix(base, suffix)
			// Version is the last dash-separated segment of rest.
			idx := strings.LastIndex(rest, "-")
			if idx < 0 {
				return "", "", "", fmt.Errorf("invalid zip name %q: cannot find version", filename)
			}
			name = rest[:idx]
			version = rest[idx+1:]
			arch = a
			if err := ValidateName(name); err != nil {
				return "", "", "", fmt.Errorf("invalid zip name %q: %w", filename, err)
			}
			if err := ValidateVersion(version); err != nil {
				return "", "", "", fmt.Errorf("invalid zip name %q: %w", filename, err)
			}
			return name, version, arch, nil
		}
	}

	return "", "", "", fmt.Errorf("invalid zip name %q: unrecognised arch suffix", filename)
}

func addToZip(w *zip.Writer, entry FileEntry) error {
	info, err := os.Stat(entry.DiskPath)
	if err != nil {
		return fmt.Errorf("stat %s: %w", entry.DiskPath, err)
	}

	if info.IsDir() {
		return addDirToZip(w, entry.DiskPath, entry.ZipPath)
	}

	return addFileToZip(w, entry.DiskPath, entry.ZipPath, entry.Executable)
}

func addFileToZip(w *zip.Writer, diskPath, zipPath string, executable bool) error {
	src, err := os.Open(diskPath)
	if err != nil {
		return fmt.Errorf("open %s: %w", diskPath, err)
	}
	defer src.Close()

	info, _ := src.Stat()
	hdr, err := zip.FileInfoHeader(info)
	if err != nil {
		return err
	}
	hdr.Name = zipPath
	hdr.Method = zip.Deflate
	if executable {
		hdr.SetMode(0o755)
	}

	dst, err := w.CreateHeader(hdr)
	if err != nil {
		return err
	}
	_, err = io.Copy(dst, src)
	return err
}

func addDirToZip(w *zip.Writer, diskRoot, zipRoot string) error {
	return filepath.Walk(diskRoot, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(diskRoot, path)
		if err != nil {
			return err
		}
		zipPath := filepath.ToSlash(filepath.Join(zipRoot, rel))
		return addFileToZip(w, path, zipPath, false)
	})
}
