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
	TLS   bool   `yaml:"tls,omitempty"`
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
	scheme := "http"
	if host.TLS {
		scheme = "https"
	}
	base := fmt.Sprintf("%s://%s:%d", scheme, host.IP, host.Port)
	var opts []biosclient.Option
	if host.Token != "" {
		opts = append(opts, biosclient.WithToken(host.Token))
	}
	return biosclient.New(base, opts...)
}

// resolveClient builds a biosclient.Client from flags.
// Supports --host (from config), or --url + --token for one-off connections.
func resolveClient(flags []string) *biosclient.Client {
	// One-off connection: --url takes priority over --host.
	if url := parseFlag(flags, "--url", ""); url != "" {
		token := parseFlag(flags, "--token", "")
		var opts []biosclient.Option
		if token != "" {
			opts = append(opts, biosclient.WithToken(token))
		}
		return biosclient.New(url, opts...)
	}

	hostName := parseHostFlag(flags)
	cfg, err := loadConfig()
	if err != nil {
		fatal(err)
	}
	host, err := findHost(cfg, hostName)
	if err != nil {
		fatal(err)
	}
	return newClient(host)
}

// Run is the entry point for `builder bios <command> [flags]`.
func Run(args []string) {
	if len(args) == 0 {
		printUsage()
		os.Exit(1)
	}

	cmd := args[0]
	flags := args[1:]

	// Set global JSON mode early so errors are structured.
	setGlobalJSON(append([]string{cmd}, flags...))

	// Handle help everywhere: `--help`, `help`, `<cmd> --help`.
	if cmd == "--help" || cmd == "-h" || cmd == "help" {
		runHelp(flags)
		return
	}
	if hasFlag(flags, "--help") || hasFlag(flags, "-h") {
		runHelp(append([]string{cmd}, flags...))
		return
	}

	switch cmd {
	// Discovery (for AI agents)
	case "commands":
		runCommands(flags)

	// Host management
	case "ping":
		runPing(flags)
	case "list":
		runList()
	case "add":
		runAddHost(flags)
	case "remove":
		runRemoveHost(flags)

	// App status
	case "apps":
		runApps(flags, resolveClient(flags))
	case "status":
		runStatus(flags, resolveClient(flags))
	case "logs":
		runLogs(flags, resolveClient(flags))
	case "version":
		runVersion(flags, resolveClient(flags))

	// Lifecycle
	case "start":
		runStart(flags, resolveClient(flags))
	case "stop":
		runStop(flags, resolveClient(flags))
	case "restart":
		runRestart(flags, resolveClient(flags))
	case "enable":
		runEnable(flags, resolveClient(flags))
	case "disable":
		runDisable(flags, resolveClient(flags))

	// Install & Upgrade
	case "install":
		runInstall(flags, resolveClient(flags))
	case "upgrade":
		runUpgrade(flags, resolveClient(flags))
	case "update-frontend":
		runUpdateFrontend(flags, resolveClient(flags))

	// Backup & Recovery
	case "snapshot":
		runSnapshot(flags, resolveClient(flags))
	case "snapshots":
		runSnapshots(flags, resolveClient(flags))
	case "recover":
		runRecover(flags, resolveClient(flags))
	case "backup-db":
		runBackupDb(flags, resolveClient(flags))

	// Config
	case "set-primary":
		runSetPrimary(flags, resolveClient(flags))
	case "get-primary":
		runGetPrimary(flags, resolveClient(flags))

	// Uninstall
	case "uninstall":
		runUninstall(flags, resolveClient(flags))

	default:
		fatalCode(exitCmdError, fmt.Errorf("unknown command: %s (run 'builder bios help' or 'builder bios commands --json')", cmd))
	}
}

func runPing(flags []string) {
	// Support --url mode for ping too.
	if url := parseFlag(flags, "--url", ""); url != "" {
		token := parseFlag(flags, "--token", "")
		var opts []biosclient.Option
		if token != "" {
			opts = append(opts, biosclient.WithToken(token))
		}
		client := biosclient.New(url, opts...)
		fmt.Printf("pinging %s ...\n", url)
		if err := client.Ping(); err != nil {
			fmt.Printf("FAIL: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("OK")
		return
	}

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
	fmt.Printf("%-15s %-20s %-5s %s\n", "NAME", "ADDRESS", "TLS", "TOKEN")
	for _, h := range cfg.Hosts {
		tok := "(none)"
		if h.Token != "" {
			tok = "****"
		}
		tls := "no"
		if h.TLS {
			tls = "yes"
		}
		fmt.Printf("%-15s %-20s %-5s %s\n", h.Name, fmt.Sprintf("%s:%d", h.IP, h.Port), tls, tok)
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
	fatalCode(exitCmdError, err)
}

func printUsage() {
	fmt.Fprintln(os.Stderr, `Usage: builder bios <command> [flags]

Host Management:
  list                          List configured hosts
  ping [--host name]            Health check a host
  add --name <n> --ip <ip>      Add a host to config
  remove --name <n>             Remove a host from config

App Status:
  apps                          List all apps with state
  status <app>                  Single app detail
  logs <app> [--lines 50]       Last N log lines
  version                       BIOS + app versions

App Lifecycle:
  start <app>                   Start an app
  stop <app>                    Stop an app
  restart <app>                 Restart an app
  enable <app>                  Enable an app
  disable <app>                 Disable an app

Install & Upgrade:
  install <zipfile>             Install app from zip (blocks until done)
  upgrade <app> <zipfile>       Safe upgrade (snapshot → upload → verify)
  update-frontend <app> <zip>   Replace frontend files only (no restart)

Backup & Recovery:
  snapshot <app>                Create full backup
  snapshots <app>               List available snapshots
  recover <app> <archive>       Restore from snapshot
  backup-db <app>               Database-only backup

Config:
  set-primary <app>             Set primary app for root proxy
  get-primary                   Show current primary app

Uninstall:
  uninstall <app> --confirm     Remove app and delete files

Global Flags:
  --host <name>   Target host from bios-client.yaml (default: first host)
  --url <url>     One-off connection URL (overrides --host)
  --token <tok>   Auth token for --url connections
  --json          Machine-readable JSON output

Examples:
  builder bios list
  builder bios apps --host cloud --json
  builder bios upgrade rubix rubix-1.1.0.zip --host cloud
  builder bios apps --url https://rubix-bios.fly.dev --token abc123`)
}
