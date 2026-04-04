package fileutils

import (
	"io/fs"
	"os"
	"time"
)

// ProtectionMode controls whether an operation is allowed, denied, or gated.
type ProtectionMode string

const (
	ProtectionAllow           ProtectionMode = "allow"
	ProtectionDeny            ProtectionMode = "deny"
	ProtectionConfirmRequired ProtectionMode = "confirm_required"
)

// OperationKind identifies a protected operation category.
type OperationKind string

const (
	OperationDeleteFile     OperationKind = "delete_file"
	OperationDeleteDir      OperationKind = "delete_dir"
	OperationOverwritePath  OperationKind = "overwrite_path"
	OperationExtractArchive OperationKind = "extract_archive"
)

// Config configures a Manager.
type Config struct {
	Root            string
	Policy          Policy
	ConfirmationTTL time.Duration
	AllowSymlinks   bool
}

// Policy controls how protected operations are handled.
type Policy struct {
	DefaultMode     ProtectionMode
	DestructiveMode ProtectionMode
	Rules           []Rule
}

// Rule applies a mode to matching operations and paths.
type Rule struct {
	Operation  OperationKind
	Mode       ProtectionMode
	ExactPath  string
	PathPrefix string
	Extension  string
}

// Manager coordinates filesystem, archive, and protection behavior.
type Manager struct {
	root            string
	policy          Policy
	confirmationTTL time.Duration
	allowSymlinks   bool
	confirmations   *confirmationStore
}

// Operation represents a protected action fingerprint.
type Operation struct {
	Kind            OperationKind
	Path            string
	SourcePath      string
	DestinationPath string
	Entries         []string
	Recursive       bool
	Overwrite       bool
}

// PendingConfirmation stores a pending protected action token.
type PendingConfirmation struct {
	Token     string
	Operation Operation
	CreatedAt time.Time
	ExpiresAt time.Time
}

// PathInfo describes a filesystem path.
type PathInfo struct {
	Path       string
	Name       string
	Size       int64
	Mode       fs.FileMode
	ModifiedAt time.Time
	IsDir      bool
	IsSymlink  bool
}

// ArchiveEntry describes an archive member.
type ArchiveEntry struct {
	Name       string
	Size       int64
	Mode       fs.FileMode
	ModifiedAt time.Time
	IsDir      bool
	IsSymlink  bool
	LinkTarget string
}

// WriteOptions control file creation and overwrite behavior.
type WriteOptions struct {
	Perm              os.FileMode
	Overwrite         bool
	ConfirmationToken string
}

// DeleteOptions control destructive delete behavior.
type DeleteOptions struct {
	ConfirmationToken string
}

// CopyOptions control copy and replace behavior.
type CopyOptions struct {
	Overwrite         bool
	ConfirmationToken string
}

// MoveOptions control move and replace behavior.
type MoveOptions struct {
	Overwrite         bool
	ConfirmationToken string
}

// ExtractOptions control archive extraction behavior.
type ExtractOptions struct {
	Overwrite         bool
	ConfirmationToken string
}

// ArchiveCreateOptions control archive creation behavior.
type ArchiveCreateOptions struct {
	Overwrite         bool
	ConfirmationToken string
}

func (o WriteOptions) filePerm() os.FileMode {
	if o.Perm != 0 {
		return o.Perm
	}
	return defaultFilePerm
}

func normalizePolicy(policy Policy) Policy {
	if policy.DefaultMode == "" {
		policy.DefaultMode = ProtectionAllow
	}
	if policy.DestructiveMode == "" {
		policy.DestructiveMode = policy.DefaultMode
	}
	return policy
}
