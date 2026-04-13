package bios

import (
	"fmt"
	"os"
	"strconv"

	"github.com/NubeIO/rubix-sdk/pkg/biosclient"
	"gopkg.in/yaml.v3"
)

func runSetPrimary(flags []string, client *biosclient.Client) {
	app := requireArg(flags, "<app>")

	if err := client.SetPrimaryApp(app); err != nil {
		fatalCode(exitAPIError, err)
	}

	if jsonMode(flags) {
		printJSON(map[string]string{"primary_app": app})
	} else {
		fmt.Printf("primary app set to %s\n", app)
	}
}

func runGetPrimary(flags []string, client *biosclient.Client) {
	app, err := client.GetPrimaryApp()
	if err != nil {
		fatalCode(exitAPIError, err)
	}

	if jsonMode(flags) {
		printJSON(map[string]string{"primary_app": app})
	} else {
		fmt.Printf("primary app: %s\n", app)
	}
}

func runAddHost(flags []string) {
	name := parseFlag(flags, "--name", "")
	ip := parseFlag(flags, "--ip", "")
	portStr := parseFlag(flags, "--port", "1660")
	token := parseFlag(flags, "--token", "")
	tls := hasFlag(flags, "--tls")

	if name == "" || ip == "" {
		fmt.Fprintln(os.Stderr, "usage: builder bios add --name <name> --ip <ip> [--port 1660] [--token xxx] [--tls]")
		os.Exit(exitCmdError)
	}

	port, err := strconv.Atoi(portStr)
	if err != nil {
		fatalCode(exitCmdError, fmt.Errorf("invalid port: %s", portStr))
	}

	cfg, err := loadConfig()
	if err != nil {
		// No config yet — create one.
		cfg = &Config{}
	}

	// Check for duplicate.
	for _, h := range cfg.Hosts {
		if h.Name == name {
			fatalCode(exitCmdError, fmt.Errorf("host %q already exists", name))
		}
	}

	cfg.Hosts = append(cfg.Hosts, Host{
		Name:  name,
		IP:    ip,
		Port:  port,
		Token: token,
		TLS:   tls,
	})

	if err := saveConfig(cfg); err != nil {
		fatal(err)
	}

	if jsonMode(flags) {
		printJSON(map[string]string{"status": "added", "name": name})
	} else {
		fmt.Printf("host %s added (%s:%d)\n", name, ip, port)
	}
}

func runRemoveHost(flags []string) {
	name := parseFlag(flags, "--name", "")
	if name == "" {
		fmt.Fprintln(os.Stderr, "usage: builder bios remove --name <name>")
		os.Exit(exitCmdError)
	}

	cfg, err := loadConfig()
	if err != nil {
		fatal(err)
	}

	found := false
	var kept []Host
	for _, h := range cfg.Hosts {
		if h.Name == name {
			found = true
			continue
		}
		kept = append(kept, h)
	}
	if !found {
		fatalCode(exitCmdError, fmt.Errorf("host %q not found", name))
	}
	cfg.Hosts = kept

	if err := saveConfig(cfg); err != nil {
		fatal(err)
	}

	if jsonMode(flags) {
		printJSON(map[string]string{"status": "removed", "name": name})
	} else {
		fmt.Printf("host %s removed\n", name)
	}
}

func saveConfig(cfg *Config) error {
	data, err := yaml.Marshal(cfg)
	if err != nil {
		return fmt.Errorf("marshal config: %w", err)
	}
	if err := os.WriteFile(configPath(), data, 0644); err != nil {
		return fmt.Errorf("write bios-client.yaml: %w", err)
	}
	return nil
}
