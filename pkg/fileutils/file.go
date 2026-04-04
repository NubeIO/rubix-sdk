package fileutils

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// CreateFile creates a new file and fails if it already exists.
func (m *Manager) CreateFile(ctx context.Context, path string, data []byte, perm os.FileMode) error {
	ctx = normalizeContext(ctx)
	if err := checkContext(ctx); err != nil {
		return err
	}

	target, err := m.resolvePath(path)
	if err != nil {
		return err
	}
	if perm == 0 {
		perm = defaultFilePerm
	}

	f, err := os.OpenFile(target, os.O_CREATE|os.O_EXCL|os.O_WRONLY, perm)
	if err != nil {
		if errors.Is(err, os.ErrExist) {
			return fmt.Errorf("%w: %s", ErrAlreadyExists, target)
		}
		if errors.Is(err, os.ErrNotExist) {
			return fmt.Errorf("%w: %s", ErrNotFound, target)
		}
		return err
	}
	defer f.Close()

	if len(data) == 0 {
		return nil
	}
	_, err = f.Write(data)
	return err
}

// ReadFile reads a file into memory.
func (m *Manager) ReadFile(ctx context.Context, path string) ([]byte, error) {
	ctx = normalizeContext(ctx)
	if err := checkContext(ctx); err != nil {
		return nil, err
	}

	target, err := m.resolvePath(path)
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(target)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, fmt.Errorf("%w: %s", ErrNotFound, target)
		}
		return nil, err
	}
	return data, nil
}

// WriteFile writes a file, optionally replacing an existing file.
func (m *Manager) WriteFile(ctx context.Context, path string, data []byte, opts WriteOptions) error {
	ctx = normalizeContext(ctx)
	if err := checkContext(ctx); err != nil {
		return err
	}

	target, err := m.resolvePath(path)
	if err != nil {
		return err
	}

	if info, err := os.Lstat(target); err == nil {
		if info.IsDir() {
			return fmt.Errorf("%w: %s", ErrAlreadyExists, target)
		}
		if !opts.Overwrite {
			return fmt.Errorf("%w: %s", ErrAlreadyExists, target)
		}
		if err := m.guardOperation(Operation{
			Kind:      OperationOverwritePath,
			Path:      target,
			Overwrite: true,
		}, opts.ConfirmationToken); err != nil {
			return err
		}
		if err := prepareReplaceTarget(target, true); err != nil {
			return err
		}
	} else if !os.IsNotExist(err) {
		return err
	}

	if err := prepareParentDir(target); err != nil {
		return err
	}
	return os.WriteFile(target, data, opts.filePerm())
}

// AppendFile appends data to a file, creating it if needed.
func (m *Manager) AppendFile(ctx context.Context, path string, data []byte, perm os.FileMode) error {
	ctx = normalizeContext(ctx)
	if err := checkContext(ctx); err != nil {
		return err
	}

	target, err := m.resolvePath(path)
	if err != nil {
		return err
	}
	if perm == 0 {
		perm = defaultFilePerm
	}
	if err := prepareParentDir(target); err != nil {
		return err
	}

	f, err := os.OpenFile(target, os.O_CREATE|os.O_APPEND|os.O_WRONLY, perm)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = f.Write(data)
	return err
}

// DeleteFile deletes a file or symlink after policy checks.
func (m *Manager) DeleteFile(ctx context.Context, path string, opts DeleteOptions) error {
	ctx = normalizeContext(ctx)
	if err := checkContext(ctx); err != nil {
		return err
	}

	target, err := m.resolvePath(path)
	if err != nil {
		return err
	}

	info, err := os.Lstat(target)
	if err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("%w: %s", ErrNotFound, target)
		}
		return err
	}
	if info.IsDir() {
		return fmt.Errorf("%w: %s", ErrAlreadyExists, target)
	}

	if err := m.guardOperation(Operation{
		Kind: OperationDeleteFile,
		Path: target,
	}, opts.ConfirmationToken); err != nil {
		return err
	}

	return os.Remove(target)
}

// CopyFile copies a file or symlink to a new path.
func (m *Manager) CopyFile(ctx context.Context, srcPath, dstPath string, opts CopyOptions) error {
	ctx = normalizeContext(ctx)
	if err := checkContext(ctx); err != nil {
		return err
	}

	src, err := m.resolvePath(srcPath)
	if err != nil {
		return err
	}
	dst, err := m.resolvePath(dstPath)
	if err != nil {
		return err
	}
	if samePath(src, dst) {
		return fmt.Errorf("%w: source and destination are the same", ErrInvalidPath)
	}

	info, err := os.Lstat(src)
	if err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("%w: %s", ErrNotFound, src)
		}
		return err
	}
	if info.IsDir() {
		return fmt.Errorf("%w: %s", ErrInvalidPath, src)
	}

	if _, err := os.Lstat(dst); err == nil {
		if !opts.Overwrite {
			return fmt.Errorf("%w: %s", ErrAlreadyExists, dst)
		}
		if err := m.guardOperation(Operation{
			Kind:       OperationOverwritePath,
			Path:       dst,
			SourcePath: src,
			Overwrite:  true,
		}, opts.ConfirmationToken); err != nil {
			return err
		}
	} else if !os.IsNotExist(err) {
		return err
	}

	return m.copyFileInternal(ctx, src, dst, opts.Overwrite)
}

// MoveFile moves a file or symlink, falling back to copy and delete if needed.
func (m *Manager) MoveFile(ctx context.Context, srcPath, dstPath string, opts MoveOptions) error {
	ctx = normalizeContext(ctx)
	if err := checkContext(ctx); err != nil {
		return err
	}

	src, err := m.resolvePath(srcPath)
	if err != nil {
		return err
	}
	dst, err := m.resolvePath(dstPath)
	if err != nil {
		return err
	}
	if samePath(src, dst) {
		return fmt.Errorf("%w: source and destination are the same", ErrInvalidPath)
	}

	info, err := os.Lstat(src)
	if err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("%w: %s", ErrNotFound, src)
		}
		return err
	}
	if info.IsDir() {
		return fmt.Errorf("%w: %s", ErrInvalidPath, src)
	}

	if _, err := os.Lstat(dst); err == nil {
		if !opts.Overwrite {
			return fmt.Errorf("%w: %s", ErrAlreadyExists, dst)
		}
		if err := m.guardOperation(Operation{
			Kind:            OperationOverwritePath,
			Path:            dst,
			SourcePath:      src,
			DestinationPath: dst,
			Overwrite:       true,
		}, opts.ConfirmationToken); err != nil {
			return err
		}
		if err := prepareReplaceTarget(dst, true); err != nil {
			return err
		}
	} else if !os.IsNotExist(err) {
		return err
	}

	if err := prepareParentDir(dst); err != nil {
		return err
	}
	if err := os.Rename(src, dst); err == nil {
		return nil
	}

	if err := m.copyFileInternal(ctx, src, dst, true); err != nil {
		return err
	}
	return os.Remove(src)
}

// Stat returns metadata for a path without following symlinks.
func (m *Manager) Stat(ctx context.Context, path string) (PathInfo, error) {
	ctx = normalizeContext(ctx)
	if err := checkContext(ctx); err != nil {
		return PathInfo{}, err
	}

	target, err := m.resolvePath(path)
	if err != nil {
		return PathInfo{}, err
	}
	info, err := os.Lstat(target)
	if err != nil {
		if os.IsNotExist(err) {
			return PathInfo{}, fmt.Errorf("%w: %s", ErrNotFound, target)
		}
		return PathInfo{}, err
	}
	return pathInfo(target, info), nil
}

// Exists reports whether a path exists.
func (m *Manager) Exists(ctx context.Context, path string) (bool, error) {
	ctx = normalizeContext(ctx)
	if err := checkContext(ctx); err != nil {
		return false, err
	}

	target, err := m.resolvePath(path)
	if err != nil {
		return false, err
	}
	_, err = os.Lstat(target)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

func (m *Manager) copyFileInternal(ctx context.Context, src, dst string, overwrite bool) error {
	info, err := os.Lstat(src)
	if err != nil {
		return err
	}

	if info.Mode()&os.ModeSymlink != 0 {
		if !m.allowSymlinks {
			return ErrSymlinkNotAllowed
		}
		return copySymlink(src, dst, overwrite)
	}

	if err := prepareParentDir(dst); err != nil {
		return err
	}
	if err := prepareReplaceTarget(dst, overwrite); err != nil {
		return err
	}

	srcFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	dstFile, err := os.OpenFile(dst, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, info.Mode().Perm())
	if err != nil {
		return err
	}

	_, copyErr := copyWithContext(ctx, dstFile, srcFile)
	closeErr := dstFile.Close()
	if copyErr != nil {
		return copyErr
	}
	if closeErr != nil {
		return closeErr
	}

	return preserveMode(dst, info.Mode())
}

func copySymlink(src, dst string, overwrite bool) error {
	linkTarget, err := os.Readlink(src)
	if err != nil {
		return err
	}
	if err := prepareParentDir(dst); err != nil {
		return err
	}
	if err := prepareReplaceTarget(dst, overwrite); err != nil {
		return err
	}
	return os.Symlink(linkTarget, dst)
}

func removeFile(path string) error {
	info, err := os.Lstat(path)
	if err != nil {
		return err
	}
	if info.IsDir() {
		return os.RemoveAll(path)
	}
	return os.Remove(path)
}

func openFileReader(path string) (io.ReadCloser, os.FileInfo, error) {
	info, err := os.Lstat(path)
	if err != nil {
		return nil, nil, err
	}
	file, err := os.Open(path)
	if err != nil {
		return nil, nil, err
	}
	return file, info, nil
}

func isInsideDir(root, target string) bool {
	rel, err := filepath.Rel(root, target)
	if err != nil {
		return false
	}
	return rel != ".." && rel != "." && !strings.HasPrefix(rel, ".."+string(os.PathSeparator))
}
