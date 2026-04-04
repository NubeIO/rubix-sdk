package fileutils

import (
	"context"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
)

// CreateDir creates a single directory.
func (m *Manager) CreateDir(ctx context.Context, path string, perm os.FileMode) error {
	ctx = normalizeContext(ctx)
	if err := checkContext(ctx); err != nil {
		return err
	}

	target, err := m.resolvePath(path)
	if err != nil {
		return err
	}
	if perm == 0 {
		perm = defaultDirPerm
	}
	return os.Mkdir(target, perm)
}

// CreateDirs creates a directory tree.
func (m *Manager) CreateDirs(ctx context.Context, path string, perm os.FileMode) error {
	ctx = normalizeContext(ctx)
	if err := checkContext(ctx); err != nil {
		return err
	}

	target, err := m.resolvePath(path)
	if err != nil {
		return err
	}
	if perm == 0 {
		perm = defaultDirPerm
	}
	return os.MkdirAll(target, perm)
}

// ListDir lists direct children of a directory.
func (m *Manager) ListDir(ctx context.Context, path string) ([]PathInfo, error) {
	ctx = normalizeContext(ctx)
	if err := checkContext(ctx); err != nil {
		return nil, err
	}

	target, err := m.resolvePath(path)
	if err != nil {
		return nil, err
	}

	entries, err := os.ReadDir(target)
	if err != nil {
		return nil, err
	}

	out := make([]PathInfo, 0, len(entries))
	for _, entry := range entries {
		if err := checkContext(ctx); err != nil {
			return nil, err
		}
		fullPath := filepath.Join(target, entry.Name())
		info, err := os.Lstat(fullPath)
		if err != nil {
			return nil, err
		}
		out = append(out, pathInfo(fullPath, info))
	}
	return out, nil
}

// DeleteDir removes an empty directory after policy checks.
func (m *Manager) DeleteDir(ctx context.Context, path string, opts DeleteOptions) error {
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
		return err
	}
	if !info.IsDir() {
		return fmt.Errorf("%w: %s", ErrInvalidPath, target)
	}

	if err := m.guardOperation(Operation{
		Kind: OperationDeleteDir,
		Path: target,
	}, opts.ConfirmationToken); err != nil {
		return err
	}
	return os.Remove(target)
}

// DeleteDirAll removes a directory tree after policy checks.
func (m *Manager) DeleteDirAll(ctx context.Context, path string, opts DeleteOptions) error {
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
		return err
	}
	if !info.IsDir() {
		return fmt.Errorf("%w: %s", ErrInvalidPath, target)
	}

	if err := m.guardOperation(Operation{
		Kind:      OperationDeleteDir,
		Path:      target,
		Recursive: true,
	}, opts.ConfirmationToken); err != nil {
		return err
	}
	return os.RemoveAll(target)
}

// CopyDir copies a directory tree.
func (m *Manager) CopyDir(ctx context.Context, srcPath, dstPath string, opts CopyOptions) error {
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
		return err
	}
	if !info.IsDir() {
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
		if err := os.RemoveAll(dst); err != nil {
			return err
		}
	} else if !os.IsNotExist(err) {
		return err
	}

	return m.copyDirInternal(ctx, src, dst)
}

// MoveDir moves a directory tree, falling back to copy and delete.
func (m *Manager) MoveDir(ctx context.Context, srcPath, dstPath string, opts MoveOptions) error {
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
		return err
	}
	if !info.IsDir() {
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
		if err := os.RemoveAll(dst); err != nil {
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

	if err := m.copyDirInternal(ctx, src, dst); err != nil {
		return err
	}
	return os.RemoveAll(src)
}

// WalkDir walks a directory tree with context cancellation support.
func (m *Manager) WalkDir(ctx context.Context, root string, fn fs.WalkDirFunc) error {
	ctx = normalizeContext(ctx)
	target, err := m.resolvePath(root)
	if err != nil {
		return err
	}

	return filepath.WalkDir(target, func(path string, d fs.DirEntry, err error) error {
		if ctxErr := checkContext(ctx); ctxErr != nil {
			return ctxErr
		}
		return fn(path, d, err)
	})
}

func (m *Manager) copyDirInternal(ctx context.Context, src, dst string) error {
	return filepath.WalkDir(src, func(current string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if err := checkContext(ctx); err != nil {
			return err
		}

		info, err := os.Lstat(current)
		if err != nil {
			return err
		}

		rel, err := filepath.Rel(src, current)
		if err != nil {
			return err
		}

		target := dst
		if rel != "." {
			target = filepath.Join(dst, rel)
		}

		switch {
		case info.Mode()&os.ModeSymlink != 0:
			if !m.allowSymlinks {
				return ErrSymlinkNotAllowed
			}
			return copySymlink(current, target, false)
		case info.IsDir():
			return ensureDirPath(target, info.Mode().Perm(), false)
		default:
			return m.copyFileInternal(ctx, current, target, false)
		}
	})
}
