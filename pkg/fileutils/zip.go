package fileutils

import (
	"archive/zip"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// CreateZip creates a zip archive from a file or directory.
func (m *Manager) CreateZip(ctx context.Context, sourcePath, archivePath string, opts ArchiveCreateOptions) error {
	ctx = normalizeContext(ctx)
	if err := checkContext(ctx); err != nil {
		return err
	}

	source, err := m.resolvePath(sourcePath)
	if err != nil {
		return err
	}
	archiveTarget, err := m.resolvePath(archivePath)
	if err != nil {
		return err
	}

	if _, err := os.Lstat(archiveTarget); err == nil {
		if !opts.Overwrite {
			return fmt.Errorf("%w: %s", ErrAlreadyExists, archiveTarget)
		}
		if err := m.guardOperation(Operation{
			Kind:       OperationOverwritePath,
			Path:       archiveTarget,
			SourcePath: source,
			Overwrite:  true,
		}, opts.ConfirmationToken); err != nil {
			return err
		}
	} else if !os.IsNotExist(err) {
		return err
	}

	if err := prepareParentDir(archiveTarget); err != nil {
		return err
	}
	if err := prepareReplaceTarget(archiveTarget, opts.Overwrite); err != nil {
		return err
	}

	out, err := os.Create(archiveTarget)
	if err != nil {
		return err
	}
	defer out.Close()

	zw := zip.NewWriter(out)
	defer zw.Close()

	root := archiveRoot(source)
	return filepath.Walk(source, func(current string, info os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if err := checkContext(ctx); err != nil {
			return err
		}
		if samePath(current, archiveTarget) {
			return nil
		}

		name, err := archiveName(root, current)
		if err != nil {
			return err
		}

		if info.Mode()&os.ModeSymlink != 0 {
			if !m.allowSymlinks {
				return ErrSymlinkNotAllowed
			}
			target, err := os.Readlink(current)
			if err != nil {
				return err
			}
			hdr, err := zip.FileInfoHeader(info)
			if err != nil {
				return err
			}
			hdr.Name = name
			hdr.Method = zip.Store
			hdr.SetMode(info.Mode())
			w, err := zw.CreateHeader(hdr)
			if err != nil {
				return err
			}
			_, err = io.WriteString(w, target)
			return err
		}

		hdr, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}
		hdr.Name = name
		if info.IsDir() && !strings.HasSuffix(hdr.Name, "/") {
			hdr.Name += "/"
		}
		hdr.Method = zip.Deflate

		w, err := zw.CreateHeader(hdr)
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		srcFile, err := os.Open(current)
		if err != nil {
			return err
		}
		_, err = copyWithContext(ctx, w, srcFile)
		closeErr := srcFile.Close()
		if err != nil {
			return err
		}
		return closeErr
	})
}

// ListZip lists the contents of a zip archive.
func (m *Manager) ListZip(ctx context.Context, archivePath string) ([]ArchiveEntry, error) {
	ctx = normalizeContext(ctx)
	if err := checkContext(ctx); err != nil {
		return nil, err
	}

	target, err := m.resolvePath(archivePath)
	if err != nil {
		return nil, err
	}

	reader, err := zip.OpenReader(target)
	if err != nil {
		return nil, err
	}
	defer reader.Close()

	entries := make([]ArchiveEntry, 0, len(reader.File))
	for _, file := range reader.File {
		if err := checkContext(ctx); err != nil {
			return nil, err
		}
		info := file.FileInfo()
		linkTarget := ""
		if info.Mode()&os.ModeSymlink != 0 {
			rc, err := file.Open()
			if err != nil {
				return nil, err
			}
			data, err := io.ReadAll(rc)
			rc.Close()
			if err != nil {
				return nil, err
			}
			linkTarget = string(data)
		}
		entries = append(entries, archiveEntry(file.Name, info, linkTarget))
	}
	return entries, nil
}

// ExtractZip extracts an entire zip archive.
func (m *Manager) ExtractZip(ctx context.Context, archivePath, destination string, opts ExtractOptions) error {
	return m.extractZip(ctx, archivePath, destination, nil, opts)
}

// ExtractZipEntries extracts selected zip entries.
func (m *Manager) ExtractZipEntries(ctx context.Context, archivePath, destination string, entries []string, opts ExtractOptions) error {
	return m.extractZip(ctx, archivePath, destination, entries, opts)
}

func (m *Manager) extractZip(ctx context.Context, archivePath, destination string, selected []string, opts ExtractOptions) error {
	ctx = normalizeContext(ctx)
	if err := checkContext(ctx); err != nil {
		return err
	}

	archiveTarget, err := m.resolvePath(archivePath)
	if err != nil {
		return err
	}
	destRoot, err := m.resolvePath(destination)
	if err != nil {
		return err
	}

	if err := m.guardOperation(Operation{
		Kind:            OperationExtractArchive,
		Path:            destRoot,
		SourcePath:      archiveTarget,
		DestinationPath: destRoot,
		Entries:         normalizeEntries(selected),
		Overwrite:       opts.Overwrite,
	}, opts.ConfirmationToken); err != nil {
		return err
	}

	if err := os.MkdirAll(destRoot, defaultDirPerm); err != nil {
		return err
	}

	filter := make(map[string]struct{}, len(selected))
	for _, entry := range normalizeEntries(selected) {
		filter[entry] = struct{}{}
	}

	reader, err := zip.OpenReader(archiveTarget)
	if err != nil {
		return err
	}
	defer reader.Close()

	for _, file := range reader.File {
		if err := checkContext(ctx); err != nil {
			return err
		}

		name := filepath.ToSlash(filepath.Clean(filepath.FromSlash(file.Name)))
		if len(filter) > 0 {
			if _, ok := filter[name]; !ok {
				continue
			}
		}

		target, err := safeArchivePath(destRoot, file.Name)
		if err != nil {
			return err
		}

		info := file.FileInfo()
		if info.IsDir() {
			if err := ensureDirPath(target, info.Mode().Perm(), opts.Overwrite); err != nil {
				return err
			}
			continue
		}

		if err := prepareParentDir(target); err != nil {
			return err
		}

		if info.Mode()&os.ModeSymlink != 0 {
			if !m.allowSymlinks {
				return ErrSymlinkNotAllowed
			}
			rc, err := file.Open()
			if err != nil {
				return err
			}
			data, err := io.ReadAll(rc)
			rc.Close()
			if err != nil {
				return err
			}
			if err := prepareReplaceTarget(target, opts.Overwrite); err != nil {
				return err
			}
			if err := os.Symlink(string(data), target); err != nil {
				return err
			}
			continue
		}

		if err := prepareReplaceTarget(target, opts.Overwrite); err != nil {
			return err
		}
		rc, err := file.Open()
		if err != nil {
			return err
		}
		dst, err := os.OpenFile(target, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, info.Mode().Perm())
		if err != nil {
			rc.Close()
			return err
		}

		_, copyErr := copyWithContext(ctx, dst, rc)
		closeErr := dst.Close()
		rc.Close()
		if copyErr != nil {
			return copyErr
		}
		if closeErr != nil {
			return closeErr
		}
		if err := preserveMode(target, info.Mode()); err != nil {
			return err
		}
	}

	return nil
}
