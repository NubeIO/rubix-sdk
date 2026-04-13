package bios

import (
	"fmt"
	"strconv"

	"github.com/NubeIO/rubix-sdk/pkg/biosclient"
)

func runApps(flags []string, client *biosclient.Client) {
	list, err := client.Apps.List()
	if err != nil {
		fatalCode(exitAPIError, err)
	}

	if jsonMode(flags) {
		printJSON(list)
		return
	}

	if len(list.Apps) == 0 {
		fmt.Println("no apps installed")
		return
	}

	headers := []string{"NAME", "VERSION", "STATE", "PID", "PORT", "UPTIME", "ENABLED"}
	var rows [][]string
	for _, a := range list.Apps {
		pid := "-"
		if a.PID > 0 {
			pid = strconv.Itoa(a.PID)
		}
		port := "-"
		if a.Port > 0 {
			port = strconv.Itoa(a.Port)
		}
		uptime := "-"
		if a.Uptime != "" {
			uptime = a.Uptime
		}
		enabled := "yes"
		if !a.Enabled {
			enabled = "no"
		}
		rows = append(rows, []string{a.Name, a.Version, a.State, pid, port, uptime, enabled})
	}
	printTable(headers, rows)

	if len(list.Orphans) > 0 {
		fmt.Printf("\nOrphans (%d):\n", len(list.Orphans))
		for _, o := range list.Orphans {
			fmt.Printf("  %s (%.1f MB, manifest: %v)\n", o.Name, float64(o.Size)/1024/1024, o.HasManifest)
		}
	}
}

func runStatus(flags []string, client *biosclient.Client) {
	app := requireArg(flags, "<app>")
	status, err := client.Apps.Status(app)
	if err != nil {
		fatalCode(exitAPIError, err)
	}

	if jsonMode(flags) {
		printJSON(status)
		return
	}

	fmt.Printf("App:            %s\n", status.Name)
	fmt.Printf("Version:        %s\n", status.Version)
	fmt.Printf("State:          %s\n", status.State)
	if status.PID > 0 {
		fmt.Printf("PID:            %d\n", status.PID)
	}
	if status.Port > 0 {
		fmt.Printf("Port:           %d\n", status.Port)
	}
	if status.Uptime != "" {
		fmt.Printf("Uptime:         %s\n", status.Uptime)
	}
	fmt.Printf("Enabled:        %v\n", status.Enabled)
	fmt.Printf("Failed:         %v\n", status.Failed)
	if status.RestartCount > 0 {
		fmt.Printf("Restarts:       %d\n", status.RestartCount)
	}
	if status.ExitReason != "" {
		fmt.Printf("Exit reason:    %s\n", status.ExitReason)
	}
}

func runLogs(flags []string, client *biosclient.Client) {
	app := requireArg(flags, "<app>")
	lines := 50
	if v := parseFlag(flags, "--lines", ""); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil {
			fatalCode(exitCmdError, fmt.Errorf("invalid --lines value: %s", v))
		}
		lines = n
	}

	resp, err := client.Apps.Logs(app, lines)
	if err != nil {
		fatalCode(exitAPIError, err)
	}

	if jsonMode(flags) {
		printJSON(resp)
		return
	}

	for _, line := range resp.Lines {
		fmt.Println(line)
	}
}

func runVersion(flags []string, client *biosclient.Client) {
	ver, err := client.Version()
	if err != nil {
		fatalCode(exitAPIError, err)
	}

	if jsonMode(flags) {
		printJSON(ver)
		return
	}

	fmt.Printf("BIOS:  %s\n", ver.Bios)
	if ver.Channel != "" {
		fmt.Printf("Channel: %s\n", ver.Channel)
	}
	if len(ver.Apps) > 0 {
		fmt.Println("Apps:")
		for name, info := range ver.Apps {
			fmt.Printf("  %-15s v%s (%s)\n", name, info.Version, info.State)
		}
	}
}
