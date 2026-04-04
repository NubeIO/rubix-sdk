package fileutils

import (
	"crypto/rand"
	"fmt"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type confirmationStore struct {
	mu    sync.Mutex
	items map[string]storedConfirmation
}

type storedConfirmation struct {
	pending     PendingConfirmation
	fingerprint string
}

func newConfirmationStore() *confirmationStore {
	return &confirmationStore{
		items: make(map[string]storedConfirmation),
	}
}

func (s *confirmationStore) request(op Operation, ttl time.Duration) (*ConfirmationRequiredError, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.purgeExpiredLocked(time.Now())

	token, err := generateToken()
	if err != nil {
		return nil, err
	}

	now := time.Now()
	pending := PendingConfirmation{
		Token:     token,
		Operation: op,
		CreatedAt: now,
		ExpiresAt: now.Add(ttl),
	}
	s.items[token] = storedConfirmation{
		pending:     pending,
		fingerprint: operationFingerprint(op),
	}

	return &ConfirmationRequiredError{
		Token:     token,
		Operation: op,
		ExpiresAt: pending.ExpiresAt,
	}, nil
}

func (s *confirmationStore) validate(token string, op Operation) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	item, ok := s.items[token]
	if !ok {
		return ErrConfirmationInvalid
	}

	now := time.Now()
	if now.After(item.pending.ExpiresAt) {
		delete(s.items, token)
		return ErrConfirmationExpired
	}

	if item.fingerprint != operationFingerprint(op) {
		return ErrConfirmationInvalid
	}

	delete(s.items, token)
	return nil
}

func (s *confirmationStore) cancel(token string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.items[token]; !ok {
		return false
	}
	delete(s.items, token)
	return true
}

func (s *confirmationStore) list() []PendingConfirmation {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.purgeExpiredLocked(time.Now())

	out := make([]PendingConfirmation, 0, len(s.items))
	for _, item := range s.items {
		out = append(out, item.pending)
	}
	return out
}

func (s *confirmationStore) purgeExpiredLocked(now time.Time) {
	for token, item := range s.items {
		if now.After(item.pending.ExpiresAt) {
			delete(s.items, token)
		}
	}
}

func generateToken() (string, error) {
	var raw [16]byte
	if _, err := rand.Read(raw[:]); err != nil {
		return "", err
	}
	raw[6] = (raw[6] & 0x0f) | 0x40
	raw[8] = (raw[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", raw[0:4], raw[4:6], raw[6:8], raw[8:10], raw[10:16]), nil
}

func operationFingerprint(op Operation) string {
	entries := normalizeEntries(op.Entries)
	return strings.Join([]string{
		string(op.Kind),
		canonicalFingerprintPath(op.Path),
		canonicalFingerprintPath(op.SourcePath),
		canonicalFingerprintPath(op.DestinationPath),
		strings.Join(entries, ","),
		fmt.Sprintf("%t", op.Recursive),
		fmt.Sprintf("%t", op.Overwrite),
	}, "|")
}

func canonicalFingerprintPath(path string) string {
	if path == "" {
		return ""
	}
	return filepath.Clean(path)
}

func (m *Manager) guardOperation(op Operation, token string) error {
	mode := m.modeFor(op)
	switch mode {
	case ProtectionAllow:
		return nil
	case ProtectionDeny:
		return &OperationDeniedError{Operation: op}
	case ProtectionConfirmRequired:
		if token != "" {
			return m.confirmations.validate(token, op)
		}
		required, err := m.confirmations.request(op, m.confirmationTTL)
		if err != nil {
			return err
		}
		return required
	default:
		return nil
	}
}

func (m *Manager) modeFor(op Operation) ProtectionMode {
	for _, rule := range m.policy.Rules {
		if rule.Operation != "" && rule.Operation != op.Kind {
			continue
		}
		if !m.ruleMatches(rule, op.Path) {
			continue
		}
		if rule.Mode == "" {
			return ProtectionAllow
		}
		return rule.Mode
	}

	if isDestructive(op.Kind) {
		return m.policy.DestructiveMode
	}
	return m.policy.DefaultMode
}

func (m *Manager) ruleMatches(rule Rule, target string) bool {
	if rule.ExactPath == "" && rule.PathPrefix == "" && rule.Extension == "" {
		return true
	}
	if target == "" {
		return false
	}

	if rule.ExactPath != "" {
		path, err := m.resolvePath(rule.ExactPath)
		if err != nil || !samePath(path, target) {
			return false
		}
	}

	if rule.PathPrefix != "" {
		prefix, err := m.resolvePath(rule.PathPrefix)
		if err != nil {
			return false
		}
		rel, err := filepath.Rel(prefix, target)
		if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
			return false
		}
	}

	if rule.Extension != "" {
		ext := rule.Extension
		if !strings.HasPrefix(ext, ".") {
			ext = "." + ext
		}
		if !strings.EqualFold(filepath.Ext(target), ext) {
			return false
		}
	}
	return true
}

func isDestructive(kind OperationKind) bool {
	switch kind {
	case OperationDeleteFile, OperationDeleteDir, OperationOverwritePath, OperationExtractArchive:
		return true
	default:
		return false
	}
}
