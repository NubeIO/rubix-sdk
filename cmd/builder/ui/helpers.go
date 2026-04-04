package ui

import (
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	"github.com/charmbracelet/lipgloss"
)

// Field describes a form field for the TUI.
type Field struct {
	Label       string
	Key         string
	Placeholder string
	Default     string
	// Picker fields use Choices instead of text input.
	Choices []string
}

// IsPicker returns true if this field uses a left/right picker instead of text input.
func (f Field) IsPicker() bool {
	return len(f.Choices) > 0
}

// NewInput creates a textinput.Model from a Field.
func NewInput(f Field) textinput.Model {
	ti := textinput.New()
	ti.Prompt = ""
	ti.Placeholder = f.Placeholder
	ti.SetValue(f.Default)
	ti.CharLimit = 240
	ti.Cursor.Style = lipgloss.NewStyle().Foreground(lipgloss.Color("205"))
	ti.TextStyle = InputTextStyle
	ti.PlaceholderStyle = InputHintStyle
	return ti
}

// KeyMatches returns true if the key message matches any of the given key strings.
func KeyMatches(msg interface{ String() string }, keys ...string) bool {
	s := msg.String()
	for _, key := range keys {
		if s == key {
			return true
		}
	}
	return false
}

// Fallback returns v if non-empty, otherwise d.
func Fallback(v, d string) string {
	if strings.TrimSpace(v) == "" {
		return d
	}
	return v
}
