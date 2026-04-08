// Package logstreamer provides log-file streaming with automatic rotation.
// It is designed to capture stdout/stderr from managed processes and write
// them to disk so that logs survive restarts and crashes.
package logstreamer

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// DefaultMaxBytes is the default max size per log file (10 MB).
const DefaultMaxBytes int64 = 10 * 1024 * 1024

// DefaultMaxFiles is the default number of rotated files to keep.
const DefaultMaxFiles = 3

// Config controls log file behaviour.
type Config struct {
	// Dir is the directory where log files are written.
	Dir string
	// FilePrefix is the base name (e.g. "rubix" produces rubix.log, rubix.1.log …).
	FilePrefix string
	// MaxBytes per file before rotation (default 10 MB).
	MaxBytes int64
	// MaxFiles is how many rotated files to keep (default 3).
	MaxFiles int
}

func (c *Config) maxBytes() int64 {
	if c.MaxBytes > 0 {
		return c.MaxBytes
	}
	return DefaultMaxBytes
}

func (c *Config) maxFiles() int {
	if c.MaxFiles > 0 {
		return c.MaxFiles
	}
	return DefaultMaxFiles
}

func (c *Config) currentPath() string {
	return filepath.Join(c.Dir, c.FilePrefix+".log")
}

func (c *Config) rotatedPath(n int) string {
	return filepath.Join(c.Dir, fmt.Sprintf("%s.%d.log", c.FilePrefix, n))
}

// Writer is a thread-safe, rotating log file writer that implements io.Writer.
type Writer struct {
	cfg  Config
	mu   sync.Mutex
	f    *os.File
	size int64
}

// New creates a Writer. The log directory is created if it does not exist.
// It opens (or creates) the current log file in append mode.
func New(cfg Config) (*Writer, error) {
	if err := os.MkdirAll(cfg.Dir, 0o755); err != nil {
		return nil, fmt.Errorf("logstreamer: mkdir %s: %w", cfg.Dir, err)
	}

	w := &Writer{cfg: cfg}
	if err := w.openFile(); err != nil {
		return nil, err
	}
	return w, nil
}

// Write implements io.Writer. It appends data to the current log file and
// rotates when the file exceeds MaxBytes.
func (w *Writer) Write(p []byte) (int, error) {
	w.mu.Lock()
	defer w.mu.Unlock()

	if w.size+int64(len(p)) > w.cfg.maxBytes() && w.size > 0 {
		if err := w.rotate(); err != nil {
			// Best-effort: keep writing to the current file.
			_, _ = fmt.Fprintf(os.Stderr, "logstreamer: rotate: %v\n", err)
		}
	}

	n, err := w.f.Write(p)
	w.size += int64(n)
	return n, err
}

// Close flushes and closes the log file.
func (w *Writer) Close() error {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.f != nil {
		return w.f.Close()
	}
	return nil
}

// WriteString is a convenience that adds a timestamp prefix and newline.
func (w *Writer) WriteString(s string) {
	line := fmt.Sprintf("%s  %s\n", time.Now().Format(time.RFC3339), s)
	_, _ = w.Write([]byte(line))
}

// openFile opens the current log file in append mode, creating it if needed.
func (w *Writer) openFile() error {
	path := w.cfg.currentPath()
	f, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return fmt.Errorf("logstreamer: open %s: %w", path, err)
	}
	info, err := f.Stat()
	if err != nil {
		f.Close()
		return fmt.Errorf("logstreamer: stat %s: %w", path, err)
	}
	w.f = f
	w.size = info.Size()
	return nil
}

// rotate closes the current file and shifts rotated files.
// current.log → current.1.log → current.2.log → … (oldest deleted).
func (w *Writer) rotate() error {
	if w.f != nil {
		w.f.Close()
		w.f = nil
	}

	max := w.cfg.maxFiles()

	// Remove the oldest file.
	_ = os.Remove(w.cfg.rotatedPath(max))

	// Shift existing rotated files up by one.
	for i := max - 1; i >= 1; i-- {
		_ = os.Rename(w.cfg.rotatedPath(i), w.cfg.rotatedPath(i+1))
	}

	// Move current to .1
	_ = os.Rename(w.cfg.currentPath(), w.cfg.rotatedPath(1))

	return w.openFile()
}
