package fileutils

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestWriteFileConfirmationFlow(t *testing.T) {
	root := t.TempDir()
	m, err := New(Config{
		Root: root,
		Policy: Policy{
			DefaultMode:     ProtectionAllow,
			DestructiveMode: ProtectionConfirmRequired,
		},
		ConfirmationTTL: time.Minute,
	})
	if err != nil {
		t.Fatal(err)
	}

	ctx := context.Background()
	target := "data.txt"

	if err := m.WriteFile(ctx, target, []byte("first"), WriteOptions{}); err != nil {
		t.Fatal(err)
	}

	err = m.WriteFile(ctx, target, []byte("second"), WriteOptions{Overwrite: true})
	var required *ConfirmationRequiredError
	if !errors.As(err, &required) {
		t.Fatalf("expected confirmation required error, got %v", err)
	}
	if required.Token == "" {
		t.Fatal("expected confirmation token")
	}

	if err := m.WriteFile(ctx, target, []byte("second"), WriteOptions{
		Overwrite:         true,
		ConfirmationToken: required.Token,
	}); err != nil {
		t.Fatal(err)
	}

	data, err := os.ReadFile(filepath.Join(root, target))
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != "second" {
		t.Fatalf("expected overwritten data, got %q", string(data))
	}
}

func TestRootRestriction(t *testing.T) {
	root := t.TempDir()
	m, err := New(Config{Root: root})
	if err != nil {
		t.Fatal(err)
	}

	err = m.CreateFile(context.Background(), "../escape.txt", []byte("nope"), 0)
	if !errors.Is(err, ErrPathEscapesRoot) {
		t.Fatalf("expected root escape error, got %v", err)
	}
}

func TestZipRoundTripAndSlipProtection(t *testing.T) {
	root := t.TempDir()
	m, err := New(Config{Root: root})
	if err != nil {
		t.Fatal(err)
	}

	ctx := context.Background()
	sourceDir := filepath.Join(root, "src")
	if err := os.MkdirAll(sourceDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(sourceDir, "hello.txt"), []byte("world"), 0o644); err != nil {
		t.Fatal(err)
	}

	archivePath := filepath.Join(root, "sample.zip")
	if err := m.CreateZip(ctx, sourceDir, archivePath, ArchiveCreateOptions{}); err != nil {
		t.Fatal(err)
	}

	entries, err := m.ListZip(ctx, archivePath)
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) == 0 {
		t.Fatal("expected zip entries")
	}

	extractDir := filepath.Join(root, "out")
	if err := m.ExtractZip(ctx, archivePath, extractDir, ExtractOptions{}); err != nil {
		t.Fatal(err)
	}

	data, err := os.ReadFile(filepath.Join(extractDir, filepath.Base(sourceDir), "hello.txt"))
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != "world" {
		t.Fatalf("expected extracted data, got %q", string(data))
	}

	if _, err := safeArchivePath(extractDir, "../evil.txt"); !errors.Is(err, ErrUnsafeArchivePath) {
		t.Fatalf("expected unsafe archive path error, got %v", err)
	}
}

func TestTarGzRoundTrip(t *testing.T) {
	root := t.TempDir()
	m, err := New(Config{Root: root})
	if err != nil {
		t.Fatal(err)
	}

	ctx := context.Background()
	sourceDir := filepath.Join(root, "tree")
	if err := os.MkdirAll(filepath.Join(sourceDir, "nested"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(sourceDir, "nested", "file.txt"), []byte("tar-data"), 0o644); err != nil {
		t.Fatal(err)
	}

	archivePath := filepath.Join(root, "tree.tar.gz")
	if err := m.CreateTarGz(ctx, sourceDir, archivePath, ArchiveCreateOptions{}); err != nil {
		t.Fatal(err)
	}

	entries, err := m.ListTarGz(ctx, archivePath)
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) == 0 {
		t.Fatal("expected tar.gz entries")
	}

	extractDir := filepath.Join(root, "untarred")
	if err := m.ExtractTarGz(ctx, archivePath, extractDir, ExtractOptions{}); err != nil {
		t.Fatal(err)
	}

	data, err := os.ReadFile(filepath.Join(extractDir, filepath.Base(sourceDir), "nested", "file.txt"))
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != "tar-data" {
		t.Fatalf("expected extracted tar data, got %q", string(data))
	}
}
