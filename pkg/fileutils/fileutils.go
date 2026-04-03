package fileutils

import (
	"context"
	"time"
)

const (
	defaultFilePerm        = 0o644
	defaultDirPerm         = 0o755
	defaultConfirmationTTL = 15 * time.Minute
)

// New creates a new stdlib-only filesystem and archive manager.
func New(cfg Config) (*Manager, error) {
	root, err := normalizeRoot(cfg.Root)
	if err != nil {
		return nil, err
	}

	ttl := cfg.ConfirmationTTL
	if ttl <= 0 {
		ttl = defaultConfirmationTTL
	}

	return &Manager{
		root:            root,
		policy:          normalizePolicy(cfg.Policy),
		confirmationTTL: ttl,
		allowSymlinks:   cfg.AllowSymlinks,
		confirmations:   newConfirmationStore(),
	}, nil
}

// Root returns the normalized manager root, if configured.
func (m *Manager) Root() string {
	if m == nil {
		return ""
	}
	return m.root
}

// Policy returns the active policy.
func (m *Manager) Policy() Policy {
	return m.policy
}

// SetPolicy replaces the active policy.
func (m *Manager) SetPolicy(policy Policy) {
	m.policy = normalizePolicy(policy)
}

// PendingConfirmations returns all unexpired confirmation challenges.
func (m *Manager) PendingConfirmations() []PendingConfirmation {
	return m.confirmations.list()
}

// CancelConfirmation removes a pending confirmation token.
func (m *Manager) CancelConfirmation(token string) bool {
	return m.confirmations.cancel(token)
}

func normalizeContext(ctx context.Context) context.Context {
	if ctx != nil {
		return ctx
	}
	return context.Background()
}

func checkContext(ctx context.Context) error {
	ctx = normalizeContext(ctx)
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
		return nil
	}
}
