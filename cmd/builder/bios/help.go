package bios

import (
	"encoding/json"
	"fmt"
	"os"
)

// cmdInfo describes a CLI command for help and discovery.
type cmdInfo struct {
	Name    string   `json:"name"`
	Args    string   `json:"args,omitempty"`
	Flags   []string `json:"flags,omitempty"`
	Desc    string   `json:"description"`
	Example string   `json:"example,omitempty"`
	Group   string   `json:"group"`
}

var commands = []cmdInfo{
	// Host management
	{Name: "list", Desc: "List configured hosts", Group: "host", Example: "builder bios list"},
	{Name: "ping", Desc: "Health check a host", Group: "host", Flags: []string{"--host"}, Example: "builder bios ping --host cloud"},
	{Name: "add", Desc: "Add a host to bios-client.yaml", Group: "host", Flags: []string{"--name", "--ip", "--port", "--token", "--tls"}, Example: "builder bios add --name edge-1 --ip 192.168.1.50 --port 8999 --token xxx"},
	{Name: "remove", Desc: "Remove a host from bios-client.yaml", Group: "host", Flags: []string{"--name"}, Example: "builder bios remove --name edge-1"},

	// App status
	{Name: "apps", Desc: "List all apps with state, version, pid, port, uptime", Group: "status", Example: "builder bios apps --host cloud --json"},
	{Name: "status", Args: "<app>", Desc: "Detailed status of a single app", Group: "status", Example: "builder bios status rubix --host cloud"},
	{Name: "logs", Args: "<app>", Desc: "Last N log lines from an app", Group: "status", Flags: []string{"--lines"}, Example: "builder bios logs rubix --lines 50 --host cloud"},
	{Name: "version", Desc: "Show bios version and all app versions", Group: "status", Example: "builder bios version --host cloud --json"},

	// Lifecycle
	{Name: "start", Args: "<app>", Desc: "Start an app", Group: "lifecycle", Example: "builder bios start rubix --host cloud"},
	{Name: "stop", Args: "<app>", Desc: "Stop an app", Group: "lifecycle", Example: "builder bios stop rubix --host cloud"},
	{Name: "restart", Args: "<app>", Desc: "Restart an app", Group: "lifecycle", Example: "builder bios restart rubix --host cloud"},
	{Name: "enable", Args: "<app>", Desc: "Enable auto-start for an app", Group: "lifecycle", Example: "builder bios enable rubix --host cloud"},
	{Name: "disable", Args: "<app>", Desc: "Disable auto-start for an app", Group: "lifecycle", Example: "builder bios disable rubix --host cloud"},

	// Install & Upgrade
	{Name: "install", Args: "<zipfile>", Desc: "Install app from zip. Blocks until complete, polls job internally.", Group: "deploy", Example: "builder bios install rubix-1.0.0-amd64.zip --host cloud"},
	{Name: "upgrade", Args: "<app> <zipfile>", Desc: "Safe upgrade: snapshot first, upload zip, poll job, verify running. Replaces binary + frontend, keeps db + config.", Group: "deploy", Flags: []string{"--keep", "--no-backup", "--timeout"}, Example: "builder bios upgrade rubix rubix-1.1.0-amd64.zip --host cloud"},
	{Name: "update-frontend", Args: "<app> <zipfile>", Desc: "Replace frontend files only. No restart needed. Zip should contain frontend/dist/client/ structure.", Group: "deploy", Example: "builder bios update-frontend rubix frontend.zip --host cloud"},

	// Backup & Recovery
	{Name: "snapshot", Args: "<app>", Desc: "Create a full backup of the app directory", Group: "backup", Example: "builder bios snapshot rubix --host cloud"},
	{Name: "snapshots", Args: "<app>", Desc: "List available snapshots with sizes and dates", Group: "backup", Example: "builder bios snapshots rubix --host cloud --json"},
	{Name: "recover", Args: "<app> <archive>", Desc: "Restore from snapshot. App is stopped, restored, restarted.", Group: "backup", Flags: []string{"--all", "--db", "--config", "--binary"}, Example: "builder bios recover rubix \"backups/rubix/rubix-2026-04-13.zip\" --all --host cloud"},
	{Name: "backup-db", Args: "<app>", Desc: "Quick database-only backup (smaller, faster than full snapshot)", Group: "backup", Example: "builder bios backup-db rubix --host cloud"},

	// Config
	{Name: "set-primary", Args: "<app>", Desc: "Set which app is served at the root URL (/)", Group: "config", Example: "builder bios set-primary rubix --host cloud"},
	{Name: "get-primary", Desc: "Show current primary app", Group: "config", Example: "builder bios get-primary --host cloud"},

	// Uninstall
	{Name: "uninstall", Args: "<app>", Desc: "Remove app and delete all files. Requires --confirm.", Group: "danger", Flags: []string{"--confirm"}, Example: "builder bios uninstall rubix --confirm --host cloud"},
}

// findCommand returns the cmdInfo for a command name, or nil.
func findCommand(name string) *cmdInfo {
	for i := range commands {
		if commands[i].Name == name {
			return &commands[i]
		}
	}
	return nil
}

// runHelp handles `builder bios help [command]` and `builder bios <cmd> --help`.
func runHelp(flags []string) {
	if len(flags) == 0 || flags[0] == "--json" {
		if jsonMode(flags) {
			printJSON(commands)
		} else {
			printUsage()
		}
		return
	}

	name := flags[0]
	cmd := findCommand(name)
	if cmd == nil {
		fmt.Fprintf(os.Stderr, "unknown command: %s\n", name)
		os.Exit(1)
	}

	if jsonMode(flags) {
		printJSON(cmd)
		return
	}

	fmt.Printf("builder bios %s", cmd.Name)
	if cmd.Args != "" {
		fmt.Printf(" %s", cmd.Args)
	}
	fmt.Println()
	fmt.Println()
	fmt.Printf("  %s\n", cmd.Desc)

	if len(cmd.Flags) > 0 {
		fmt.Println()
		fmt.Println("Flags:")
		for _, f := range cmd.Flags {
			fmt.Printf("  %s\n", f)
		}
	}

	fmt.Println()
	fmt.Println("Global flags:")
	fmt.Println("  --host <name>   Target host from bios-client.yaml")
	fmt.Println("  --url <url>     One-off connection URL")
	fmt.Println("  --token <tok>   Auth token for --url")
	fmt.Println("  --json          Machine-readable JSON output")

	if cmd.Example != "" {
		fmt.Println()
		fmt.Printf("Example:\n  %s\n", cmd.Example)
	}
}

// runCommands outputs command list as JSON for AI discovery.
func runCommands(flags []string) {
	// Always JSON — this command exists for machines.
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	enc.Encode(commands)
}
