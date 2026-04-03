package fileutils

import (
	"errors"
	"fmt"
	"time"
)

var (
	ErrInvalidPath             = errors.New("invalid path")
	ErrPathEscapesRoot         = errors.New("path escapes configured root")
	ErrOperationDenied         = errors.New("operation denied by policy")
	ErrConfirmationRequired    = errors.New("confirmation required")
	ErrConfirmationInvalid     = errors.New("confirmation token is invalid")
	ErrConfirmationExpired     = errors.New("confirmation token has expired")
	ErrUnsafeArchivePath       = errors.New("unsafe archive path")
	ErrSymlinkNotAllowed       = errors.New("symlinks are not allowed")
	ErrUnsupportedArchiveEntry = errors.New("unsupported archive entry")
	ErrAlreadyExists           = errors.New("path already exists")
	ErrNotFound                = errors.New("path not found")
)

// ConfirmationRequiredError reports a pending token the caller must resubmit.
type ConfirmationRequiredError struct {
	Token     string
	Operation Operation
	ExpiresAt time.Time
}

func (e *ConfirmationRequiredError) Error() string {
	return fmt.Sprintf("confirmation required for %s on %s with token %s", e.Operation.Kind, e.Operation.Path, e.Token)
}

func (e *ConfirmationRequiredError) Unwrap() error {
	return ErrConfirmationRequired
}

// OperationDeniedError reports a blocked operation.
type OperationDeniedError struct {
	Operation Operation
}

func (e *OperationDeniedError) Error() string {
	return fmt.Sprintf("operation denied for %s on %s", e.Operation.Kind, e.Operation.Path)
}

func (e *OperationDeniedError) Unwrap() error {
	return ErrOperationDenied
}
