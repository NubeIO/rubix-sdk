package ui

import "github.com/charmbracelet/lipgloss"

var (
	BannerStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("99")).Bold(true)
	TitleStyle     = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("205"))
	HelpStyle      = lipgloss.NewStyle().Foreground(lipgloss.Color("240"))
	LabelStyle     = lipgloss.NewStyle().Foreground(lipgloss.Color("69")).Bold(true)
	ValueStyle     = lipgloss.NewStyle().Foreground(lipgloss.Color("252"))
	FocusRowStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("255")).Bold(true)
	FocusMarkStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("45")).Bold(true)
	IdleMarkStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("238"))
	CardStyle      = lipgloss.NewStyle().Border(lipgloss.RoundedBorder()).BorderForeground(lipgloss.Color("63")).Padding(1, 2)
	SectionStyle   = lipgloss.NewStyle().Border(lipgloss.RoundedBorder()).BorderForeground(lipgloss.Color("62")).Padding(0, 1)
	ErrorStyle     = lipgloss.NewStyle().Foreground(lipgloss.Color("196")).Bold(true)
	OkStyle        = lipgloss.NewStyle().Foreground(lipgloss.Color("42")).Bold(true)
	MutedStyle     = lipgloss.NewStyle().Foreground(lipgloss.Color("244"))
	InputTextStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("252"))
	InputHintStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("244"))
	PillStyle      = lipgloss.NewStyle().Foreground(lipgloss.Color("230")).Background(lipgloss.Color("57")).Padding(0, 1)
)
