package fileutils

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// CreateTar creates a tar archive from a file or directory.
func (m *Manager) CreateTar(ctx context.Context, sourcePath, archivePath string, opts ArchiveCreateOptions) error {
	return m.createTarArchive(ctx, sourcePath, archivePath, opts, false)
}

// CreateTarGz creates a gzip-compressed tar archive from a file or directory.
func (m *Manager) CreateTarGz(ctx context.Context, sourcePath, archivePath string, opts ArchiveCreateOptions) error {
	return m.createTarArchive(ctx, sourcePath, archivePath, opts, true)
}

// ListTar lists the contents of a tar archive.
func (m *Manager) ListTar(ctx context.Context, archivePath string) ([]ArchiveEntry, error) {
	return m.listTarArchive(ctx, archivePath, false)
}

// ListTarGz lists the contents of a tar.gz archive.
func (m *Manager) ListTarGz(ctx context.Context, archivePath string) ([]ArchiveEntry, error) {
	return m.listTarArchive(ctx, archivePath, true)
}

// ExtractTar extracts a tar archive.
func (m *Manager) ExtractTar(ctx context.Context, archivePath, destination string, opts ExtractOptions) error {
	return m.extractTarArchive(ctx, archivePath, destination, opts, false)
}

// ExtractTarGz extracts a tar.gz archive.
func (m *Manager) ExtractTarGz(ctx context.Context, archivePath, destination string, opts ExtractOptions) error {
	return m.extractTarArchive(ctx, archivePath, destination, opts, true)
}

func (m *Manager) createTarArchive(ctx context.Context, sourcePath, archivePath string, opts ArchiveCreateOptions, gzipEnabled bool) error {
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

	var writer io.Writer = out
	var gz *gzip.Writer
	if gzipEnabled {
		gz = gzip.NewWriter(out)
		writer = gz
		defer gz.Close()
	}

	tw := tar.NewWriter(writer)
	defer tw.Close()

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

		linkTarget := ""
		if info.Mode()&os.ModeSymlink != 0 {
			if !m.allowSymlinks {
				return ErrSymlinkNotAllowed
			}
			linkTarget, err = os.Readlink(current)
			if err != nil {
				return err
			}
		}

		hdr, err := tar.FileInfoHeader(info, linkTarget)
		if err != nil {
			return err
		}
		hdr.Name = name

		if err := tw.WriteHeader(hdr); err != nil {
			return err
		}
		if info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
			return nil
		}

		file, err := os.Open(current)
		if err != nil {
			return err
		}
		_, err = copyWithContext(ctx, tw, file)
		closeErr := file.Close()
		if err != nil {
			return err
		}
		return closeErr
	})
}

func (m *Manager) listTarArchive(ctx context.Context, archivePath string, gzipEnabled bool) ([]ArchiveEntry, error) {
	ctx = normalizeContext(ctx)
	if err := checkContext(ctx); err != nil {
		return nil, err
	}

	target, err := m.resolvePath(archivePath)
	if err != nil {
		return nil, err
	}

	reader, closer, err := openTarReader(target, gzipEnabled)
	if err != nil {
		return nil, err
	}
	defer closer.Close()

	var entries []ArchiveEntry
	for {
		if err := checkContext(ctx); err != nil {
			return nil, err
		}
		hdr, err := reader.Next()
		if err == io.EOF {
			return entries, nil
		}
		if err != nil {
			return nil, err
		}
		info := hdr.FileInfo()
		entries = append(entries, archiveEntry(hdr.Name, info, hdr.Linkname))
	}
}

func (m *Manager) extractTarArchive(ctx context.Context, archivePath, destination string, opts ExtractOptions, gzipEnabled bool) error {
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
		Overwrite:       opts.Overwrite,
	}, opts.ConfirmationToken); err != nil {
		return err
	}

	if err := os.MkdirAll(destRoot, defaultDirPerm); err != nil {
		return err
	}

	reader, closer, err := openTarReader(archiveTarget, gzipEnabled)
	if err != nil {
		return err
	}
	defer closer.Close()

	for {
		if err := checkContext(ctx); err != nil {
			return err
		}
		hdr, err := reader.Next()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}

		target, err := safeArchivePath(destRoot, hdr.Name)
		if err != nil {
			return err
		}

		info := hdr.FileInfo()
		switch hdr.Typeflag {
		case tar.TypeDir:
			if err := ensureDirPath(target, info.Mode().Perm(), opts.Overwrite); err != nil {
				return err
			}
		case tar.TypeReg, tar.TypeRegA:
			if err := prepareParentDir(target); err != nil {
				return err
			}
			if err := prepareReplaceTarget(target, opts.Overwrite); err != nil {
				return err
			}
			out, err := os.OpenFile(target, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, info.Mode().Perm())
			if err != nil {
				return err
			}
			_, copyErr := copyWithContext(ctx, out, reader)
			closeErr := out.Close()
			if copyErr != nil {
				return copyErr
			}
			if closeErr != nil {
				return closeErr
			}
			if err := preserveMode(target, info.Mode()); err != nil {
				return err
			}
		case tar.TypeSymlink:
			if !m.allowSymlinks {
				return ErrSymlinkNotAllowed
			}
			if err := prepareParentDir(target); err != nil {
				return err
			}
			if err := prepareReplaceTarget(target, opts.Overwrite); err != nil {
				return err
			}
			if err := os.Symlink(hdr.Linkname, target); err != nil {
				return err
			}
		default:
			return fmt.Errorf("%w: %s", ErrUnsupportedArchiveEntry, hdr.Name)
		}
	}
}

type tarReadCloser struct {
	file *os.File
	gzip *gzip.Reader
}

func (r *tarReadCloser) Close() error {
	if r.gzip != nil {
		_ = r.gzip.Close()
	}
	return r.file.Close()
}

func openTarReader(path string, gzipEnabled bool) (*tar.Reader, io.Closer, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, nil, err
	}

	if !gzipEnabled {
		return tar.NewReader(file), file, nil
	}

	gz, err := gzip.NewReader(file)
	if err != nil {
		file.Close()
		return nil, nil, err
	}
	return tar.NewReader(gz), &tarReadCloser{file: file, gzip: gz}, nil
}
