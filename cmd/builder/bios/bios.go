package bios

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/NubeIO/rubix-sdk/pkg/biosclient"
	"gopkg.in/yaml.v3"
)

// Host is a single BIOS instance defined in bios-client.yaml.
type Host struct {
	Name  string `yaml:"name"`
	IP    string `yaml:"ip"`
	Port  int    `yaml:"port"`
	Token string `yaml:"token,omitempty"`
}

// Config is the top-level bios-client.yaml structure.
type Config struct {
	Hosts []Host `yaml:"hosts"`
}

// configPath returns the path to bios-client.yaml next to the running binary
// or in the current working directory.
func configPath() string {
	// Try next to the executable first.
	if exe, err := os.Executable(); err == nil {
		p := filepath.Join(filepath.Dir(exe), "bios-client.yaml")
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return "bios-client.yaml"
}

func loadConfig() (*Config, error) {
	data, err := os.ReadFile(configPath())
	if err != nil {
		return nil, fmt.Errorf("read bios-client.yaml: %w", err)
	}
	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parse bios-client.yaml: %w", err)
	}
	return &cfg, nil
}

func findHost(cfg *Config, name string) (*Host, error) {
	for i := range cfg.Hosts {
		if cfg.Hosts[i].Name == name {
			return &cfg.Hosts[i], nil
		}
	}
	names := make([]string, len(cfg.Hosts))
	for i, h := range cfg.Hosts {
		names[i] = h.Name
	}
	return nil, fmt.Errorf("host %q not found (available: %v)", name, names)
}

func newClient(host *Host) *biosclient.Client {
	base := fmt.Sprintf("http://%s:%d", host.IP, host.Port)
	var opts []biosclient.Option
	if host.Token != "" {
		opts = append(opts, biosclient.WithToken(host.Token))
	}
	return biosclient.New(base, opts...)
}

// Run is the entry point for `builder bios <command> [flags]`.
func Run(args []string) {
	if len(args) == 0 {
		printUsage()
		os.Exit(1)
	}

	cmd := args[0]
	flags := args[1:]

	switch cmd {
	case "ping":
		runPing(flags)
	case "list":
		runList()
	default:
		fmt.Fprintf(os.Stderr, "unknown bios command: %s\n", cmd)
		printUsage()
		os.Exit(1)
	}
}

func runPing(flags []string) {
	hostName := parseHostFlag(flags)
	cfg, err := loadConfig()
	if err != nil {
		fatal(err)
	}
	host, err := findHost(cfg, hostName)
	if err != nil {
		fatal(err)
	}

	client := newClient(host)
	fmt.Printf("pinging %s (%s:%d) ...\n", host.Name, host.IP, host.Port)

	if err := client.Ping(); err != nil {
		fmt.Printf("FAIL: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("OK")
}

func runList() {
	cfg, err := loadConfig()
	if err != nil {
		fatal(err)
	}
	if len(cfg.Hosts) == 0 {
		fmt.Println("no hosts configured in bios-client.yaml")
		return
	}
	fmt.Printf("%-15s %-20s %s\n", "NAME", "ADDRESS", "TOKEN")
	for _, h := range cfg.Hosts {
		tok := "(none)"
		if h.Token != "" {
			tok = "****"
		}
		fmt.Printf("%-15s %-20s %s\n", h.Name, fmt.Sprintf("%s:%d", h.IP, h.Port), tok)
	}
}

func parseHostFlag(flags []string) string {
	for i, f := range flags {
		if (f == "--host" || f == "-h") && i+1 < len(flags) {
			return flags[i+1]
		}
	}
	// Default to first host if none specified.
	cfg, err := loadConfig()
	if err != nil {
		fatal(err)
	}
	if len(cfg.Hosts) == 0 {
		fmt.Fprintln(os.Stderr, "no hosts configured in bios-client.yaml")
		os.Exit(1)
	}
	return cfg.Hosts[0].Name
}

func fatal(err error) {
	fmt.Fprintf(os.Stderr, "error: %v\n", err)
	os.Exit(1)
}

func printUsage() {
	fmt.Fprintln(os.Stderr, `Usage: builder bios <command> [flags]

Commands:
  ping    Ping a BIOS host
  list    List configured hosts

Flags:
  --host <name>   Target host name from bios-client.yaml (default: first host)

Examples:
  builder bios list
  builder bios ping
  builder bios ping --host edge-1`)
}
