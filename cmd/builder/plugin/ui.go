package plugin

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/common-nighthawk/go-figure"

	"github.com/NubeIO/rubix-sdk/cmd/builder/ui"
	"github.com/NubeIO/rubix-sdk/pkg/appbuilder"
)

type stage int

const (
	stageForm stage = iota
	stageConfirm
	stageBuilding
	stageDone
	stageError
)

type buildResultMsg struct {
	zipPath string
	err     error
}

type model struct {
	stage       stage
	fields      []ui.Field
	inputs      []textinput.Model
	pickerIndex map[string]int
	focus       int
	width       int
	height      int
	err         error
	zipPath     string
	startedAt   time.Time
	banner      string
}

func initialModel() model {
	fields := []ui.Field{
		{Label: "Plugin ID", Key: "name", Placeholder: "nube.github", Default: ""},
		{Label: "Version", Key: "version", Placeholder: "0.1.0", Default: "0.1.0"},
		{Label: "Arch", Key: "arch", Choices: []string{"amd64", "amd64-win", "arm64", "armv7"}},
		{Label: "Binary", Key: "binary", Placeholder: "./path/to/plugin-binary", Default: ""},
		{Label: "plugin.json", Key: "plugin-json", Placeholder: "./plugin.json", Default: "./plugin.json"},
		{Label: "Extra Files", Key: "files", Placeholder: "frontend/dist,assets", Default: ""},
		{Label: "Output Dir", Key: "output", Placeholder: "./dist", Default: "./dist"},
	}

	inputs := make([]textinput.Model, len(fields))
	pickers := map[string]int{}

	for i, f := range fields {
		if f.IsPicker() {
			pickers[f.Key] = 0
			continue
		}
		inputs[i] = ui.NewInput(f)
	}

	m := model{
		stage:       stageForm,
		fields:      fields,
		inputs:      inputs,
		pickerIndex: pickers,
		startedAt:   time.Now(),
		banner:      figure.NewFigure("BUILDER", "small", true).String(),
	}
	m.applyFocus()
	return m
}

func (m model) Init() tea.Cmd {
	return textinput.Blink
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.resizeInputs()
		return m, nil

	case tea.KeyMsg:
		switch m.stage {
		case stageForm:
			return m.updateForm(msg)
		case stageConfirm:
			return m.updateConfirm(msg)
		case stageDone, stageError:
			if ui.KeyMatches(msg, "q", "ctrl+c", "esc", "enter") {
				return m, tea.Quit
			}
		}

	case buildResultMsg:
		if msg.err != nil {
			m.err = msg.err
			m.stage = stageError
			return m, nil
		}
		m.zipPath = msg.zipPath
		m.stage = stageDone
		return m, nil
	}

	if m.stage == stageForm && !m.fields[m.focus].IsPicker() {
		var cmd tea.Cmd
		m.inputs[m.focus], cmd = m.inputs[m.focus].Update(msg)
		return m, cmd
	}

	return m, nil
}

func (m model) updateForm(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	if ui.KeyMatches(msg, "ctrl+c") {
		return m, tea.Quit
	}

	if ui.KeyMatches(msg, "up", "shift+tab") {
		if m.focus > 0 {
			m.focus--
			m.applyFocus()
		}
		return m, nil
	}

	if ui.KeyMatches(msg, "down", "tab") {
		if m.focus < len(m.fields)-1 {
			m.focus++
			m.applyFocus()
		}
		return m, nil
	}

	if ui.KeyMatches(msg, "enter") {
		if m.focus == len(m.fields)-1 {
			m.stage = stageConfirm
			return m, nil
		}
		m.focus++
		m.applyFocus()
		return m, nil
	}

	f := m.fields[m.focus]
	if f.IsPicker() {
		idx := m.pickerIndex[f.Key]
		if ui.KeyMatches(msg, "left", "h") {
			if idx > 0 {
				m.pickerIndex[f.Key] = idx - 1
			} else {
				m.pickerIndex[f.Key] = len(f.Choices) - 1
			}
			return m, nil
		}
		if ui.KeyMatches(msg, "right", "l") {
			m.pickerIndex[f.Key] = (idx + 1) % len(f.Choices)
			return m, nil
		}
		return m, nil
	}

	if ui.KeyMatches(msg, "ctrl+u") {
		m.inputs[m.focus].SetValue("")
		return m, nil
	}

	var cmd tea.Cmd
	m.inputs[m.focus], cmd = m.inputs[m.focus].Update(msg)
	return m, cmd
}

func (m model) updateConfirm(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	if ui.KeyMatches(msg, "ctrl+c", "q", "esc") {
		return m, tea.Quit
	}

	if ui.KeyMatches(msg, "e", "backspace") {
		m.stage = stageForm
		m.focus = 0
		m.applyFocus()
		return m, nil
	}

	if ui.KeyMatches(msg, "g", "enter") {
		opts, err := m.toOptions()
		if err != nil {
			m.err = err
			m.stage = stageError
			return m, nil
		}
		m.stage = stageBuilding
		return m, func() tea.Msg {
			zipPath, err := appbuilder.PackagePlugin(opts)
			return buildResultMsg{zipPath: zipPath, err: err}
		}
	}

	return m, nil
}

// ── View ──────────────────────────────────────────────

func (m model) View() string {
	header := ui.TitleStyle.Render("Plugin Packager")
	sub := ui.MutedStyle.Render("Package a rubix plugin into an installable .zip")
	banner := ui.BannerStyle.Render(strings.TrimRight(m.banner, "\n"))

	var body string
	switch m.stage {
	case stageForm:
		body = m.renderForm()
	case stageConfirm:
		body = m.renderConfirm()
	case stageBuilding:
		body = m.renderBuilding()
	case stageDone:
		body = m.renderDone()
	case stageError:
		body = m.renderError()
	}

	content := lipgloss.JoinVertical(lipgloss.Left, banner, "", header, sub, "", body)
	return ui.CardStyle.Render(content)
}

func (m model) renderForm() string {
	var lines []string
	lines = append(lines, ui.LabelStyle.Render("Step 1/2 · Configure your plugin package"))
	lines = append(lines, "")

	for i, f := range m.fields {
		left := fmt.Sprintf("%s:", f.Label)

		var value string
		if f.IsPicker() {
			idx := m.pickerIndex[f.Key]
			value = ui.PillStyle.Render(f.Choices[idx])
		} else {
			value = m.inputs[i].View()
		}

		prefix := ui.IdleMarkStyle.Render("  ")
		line := fmt.Sprintf("%s %-14s %s", prefix, left, value)
		if i == m.focus {
			prefix = ui.FocusMarkStyle.Render("› ")
			line = fmt.Sprintf("%s %-14s %s", prefix, left, value)
			line = ui.FocusRowStyle.Render(line)
		}
		lines = append(lines, line)
	}

	formBlock := ui.SectionStyle.Render(strings.Join(lines, "\n"))
	controls := lipgloss.JoinVertical(
		lipgloss.Left,
		ui.HelpStyle.Render("Tab/Shift+Tab move · Enter next · Ctrl+U clear field · Ctrl+C quit"),
		ui.HelpStyle.Render("On Arch: ←/→ (or h/l) to cycle options"),
	)
	return lipgloss.JoinVertical(lipgloss.Left, formBlock, "", controls)
}

func (m model) renderConfirm() string {
	var lines []string
	lines = append(lines, ui.LabelStyle.Render("Step 2/2 · Review"))
	lines = append(lines, "")
	for _, f := range m.fields {
		v := m.getFieldValue(f)
		if v == "" {
			v = "-"
		}
		lines = append(lines, fmt.Sprintf("%-14s %s", f.Label+":", ui.ValueStyle.Render(v)))
	}
	lines = append(lines, "")
	lines = append(lines, ui.HelpStyle.Render("Press g (or Enter) to build · e to edit · q to quit"))
	return strings.Join(lines, "\n")
}

func (m model) renderBuilding() string {
	elapsed := time.Since(m.startedAt).Round(time.Millisecond)
	spinnerFrames := []string{"⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"}
	idx := int(time.Now().UnixNano()/1e8) % len(spinnerFrames)
	return strings.Join([]string{
		ui.LabelStyle.Render("Packaging plugin..."),
		"",
		fmt.Sprintf("%s Creating zip", spinnerFrames[idx]),
		ui.MutedStyle.Render(fmt.Sprintf("elapsed: %s", elapsed)),
	}, "\n")
}

func (m model) renderDone() string {
	return strings.Join([]string{
		ui.OkStyle.Render("✔ Plugin packaged successfully"),
		"",
		fmt.Sprintf("Output: %s", ui.ValueStyle.Render(m.zipPath)),
		"",
		ui.HelpStyle.Render("Press Enter or q to exit"),
	}, "\n")
}

func (m model) renderError() string {
	msg := "unknown error"
	if m.err != nil {
		msg = m.err.Error()
	}
	return strings.Join([]string{
		ui.ErrorStyle.Render("✖ Packaging failed"),
		"",
		msg,
		"",
		ui.HelpStyle.Render("Press Enter or q to exit"),
	}, "\n")
}

// ── Helpers ───────────────────────────────────────────

func (m model) toOptions() (appbuilder.PluginOptions, error) {
	vals := map[string]string{}
	for _, f := range m.fields {
		vals[f.Key] = strings.TrimSpace(m.getFieldValue(f))
	}

	if vals["name"] == "" {
		return appbuilder.PluginOptions{}, fmt.Errorf("plugin ID is required")
	}
	if vals["binary"] == "" {
		return appbuilder.PluginOptions{}, fmt.Errorf("binary path is required")
	}
	if vals["plugin-json"] == "" {
		return appbuilder.PluginOptions{}, fmt.Errorf("plugin.json path is required")
	}

	opts := appbuilder.PluginOptions{
		Name:       vals["name"],
		Version:    ui.Fallback(vals["version"], "0.1.0"),
		Arch:       vals["arch"],
		Binary:     vals["binary"],
		PluginJSON: vals["plugin-json"],
		OutputDir:  ui.Fallback(vals["output"], "./dist"),
	}

	if vals["files"] != "" {
		for _, f := range strings.Split(vals["files"], ",") {
			f = strings.TrimSpace(f)
			if f != "" {
				opts.Files = append(opts.Files, f)
			}
		}
	}

	return opts, nil
}

func (m model) getFieldValue(f ui.Field) string {
	if f.IsPicker() {
		idx := m.pickerIndex[f.Key]
		return f.Choices[idx]
	}
	for i := range m.fields {
		if m.fields[i].Key == f.Key {
			return m.inputs[i].Value()
		}
	}
	return ""
}

func (m *model) applyFocus() {
	for i := range m.inputs {
		if m.fields[i].IsPicker() {
			continue
		}
		if i == m.focus {
			m.inputs[i].Focus()
			continue
		}
		m.inputs[i].Blur()
	}
}

func (m *model) resizeInputs() {
	width := 48
	if m.width > 0 {
		width = max(24, min(72, m.width-28))
	}
	for i := range m.inputs {
		if m.fields[i].IsPicker() {
			continue
		}
		m.inputs[i].Width = width
	}
}

// RunInteractive launches the TUI for plugin packaging.
func RunInteractive() {
	p := tea.NewProgram(initialModel(), tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		fmt.Println("error:", err)
		os.Exit(1)
	}
}
