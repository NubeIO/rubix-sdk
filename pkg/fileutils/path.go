package fileutils

import (
	"context"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"runtime"
	"slices"
	"strings"
)

func normalizeRoot(root string) (string, error) {
	root = strings.TrimSpace(root)
	if root == "" {
		return "", nil
	}
	abs, err := filepath.Abs(root)
	if err != nil {
		return "", fmt.Errorf("%w: %s: %v", ErrInvalidPath, root, err)
	}
	return filepath.Clean(abs), nil
}

func (m *Manager) resolvePath(path string) (string, error) {
	path = strings.TrimSpace(path)
	if path == "" {
		return "", ErrInvalidPath
	}

	if m.root != "" && !filepath.IsAbs(path) {
		path = filepath.Join(m.root, path)
	}

	abs, err := filepath.Abs(path)
	if err != nil {
		return "", fmt.Errorf("%w: %s: %v", ErrInvalidPath, path, err)
	}
	abs = filepath.Clean(abs)

	if m.root != "" {
		if err := ensureWithinRoot(m.root, abs); err != nil {
			return "", err
		}
	}

	return abs, nil
}

func ensureWithinRoot(root, target string) error {
	rel, err := filepath.Rel(root, target)
	if err != nil {
		return fmt.Errorf("%w: %s", ErrPathEscapesRoot, target)
	}
	if rel == ".." || strings.HasPrefix(rel, ".."+string(os.PathSeparator)) {
		return fmt.Errorf("%w: %s", ErrPathEscapesRoot, target)
	}
	return nil
}

func safeArchivePath(destinationRoot, entryName string) (string, error) {
	entryName = strings.TrimSpace(entryName)
	if entryName == "" {
		return "", fmt.Errorf("%w: empty archive entry", ErrUnsafeArchivePath)
	}
	if strings.Contains(entryName, "\x00") {
		return "", fmt.Errorf("%w: %s", ErrUnsafeArchivePath, entryName)
	}

	cleanEntry := filepath.Clean(filepath.FromSlash(entryName))
	if cleanEntry == "." || cleanEntry == string(os.PathSeparator) || filepath.IsAbs(cleanEntry) {
		return "", fmt.Errorf("%w: %s", ErrUnsafeArchivePath, entryName)
	}
	if cleanEntry == ".." || strings.HasPrefix(cleanEntry, ".."+string(os.PathSeparator)) {
		return "", fmt.Errorf("%w: %s", ErrUnsafeArchivePath, entryName)
	}

	target := filepath.Join(destinationRoot, cleanEntry)
	target = filepath.Clean(target)
	if err := ensureWithinRoot(destinationRoot, target); err != nil {
		return "", fmt.Errorf("%w: %s", ErrUnsafeArchivePath, entryName)
	}
	return target, nil
}

func samePath(a, b string) bool {
	a = filepath.Clean(a)
	b = filepath.Clean(b)
	if runtime.GOOS == "windows" {
		return strings.EqualFold(a, b)
	}
	return a == b
}

func pathInfo(path string, info os.FileInfo) PathInfo {
	return PathInfo{
		Path:       path,
		Name:       info.Name(),
		Size:       info.Size(),
		Mode:       info.Mode(),
		ModifiedAt: info.ModTime(),
		IsDir:      info.IsDir(),
		IsSymlink:  info.Mode()&os.ModeSymlink != 0,
	}
}

func archiveEntry(name string, info fs.FileInfo, linkTarget string) ArchiveEntry {
	return ArchiveEntry{
		Name:       name,
		Size:       info.Size(),
		Mode:       info.Mode(),
		ModifiedAt: info.ModTime(),
		IsDir:      info.IsDir(),
		IsSymlink:  info.Mode()&os.ModeSymlink != 0,
		LinkTarget: linkTarget,
	}
}

func archiveRoot(source string) string {
	return filepath.Dir(source)
}

func archiveName(root, target string) (string, error) {
	rel, err := filepath.Rel(root, target)
	if err != nil {
		return "", err
	}
	return filepath.ToSlash(rel), nil
}

func copyWithContext(ctx context.Context, dst io.Writer, src io.Reader) (int64, error) {
	ctx = normalizeContext(ctx)
	buf := make([]byte, 32*1024)
	var written int64
	for {
		if err := checkContext(ctx); err != nil {
			return written, err
		}
		nr, er := src.Read(buf)
		if nr > 0 {
			nw, ew := dst.Write(buf[:nr])
			written += int64(nw)
			if ew != nil {
				return written, ew
			}
			if nw != nr {
				return written, io.ErrShortWrite
			}
		}
		if er == io.EOF {
			return written, nil
		}
		if er != nil {
			return written, er
		}
	}
}

func prepareParentDir(path string) error {
	return os.MkdirAll(filepath.Dir(path), defaultDirPerm)
}

func prepareReplaceTarget(path string, overwrite bool) error {
	info, err := os.Lstat(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	if !overwrite {
		return fmt.Errorf("%w: %s", ErrAlreadyExists, path)
	}
	if info.IsDir() {
		return os.RemoveAll(path)
	}
	return os.Remove(path)
}

func ensureDirPath(path string, perm os.FileMode, overwrite bool) error {
	info, err := os.Lstat(path)
	if err == nil {
		if info.IsDir() {
			return nil
		}
		if !overwrite {
			return fmt.Errorf("%w: %s", ErrAlreadyExists, path)
		}
		if err := os.Remove(path); err != nil {
			return err
		}
	} else if !os.IsNotExist(err) {
		return err
	}
	if perm == 0 {
		perm = defaultDirPerm
	}
	return os.MkdirAll(path, perm)
}

func preserveMode(path string, mode fs.FileMode) error {
	if err := os.Chmod(path, mode.Perm()); err != nil && runtime.GOOS != "windows" {
		return err
	}
	return nil
}

func normalizeEntries(entries []string) []string {
	if len(entries) == 0 {
		return nil
	}
	out := make([]string, 0, len(entries))
	for _, entry := range entries {
		entry = filepath.ToSlash(filepath.Clean(filepath.FromSlash(strings.TrimSpace(entry))))
		if entry == "." || entry == "" {
			continue
		}
		out = append(out, entry)
	}
	slices.Sort(out)
	return slices.Compact(out)
}
