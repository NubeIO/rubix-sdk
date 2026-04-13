package bios

import (
	"fmt"
	"os"

	"github.com/NubeIO/rubix-sdk/pkg/biosclient"
)

func runSnapshot(flags []string, client *biosclient.Client) {
	app := requireArg(flags, "<app>")
	isJSON := jsonMode(flags)

	if !isJSON {
		fmt.Printf("Creating snapshot of %s...", app)
	}

	resp, err := client.Apps.Snapshot(app)
	if err != nil {
		if !isJSON {
			fmt.Println(" FAIL")
		}
		fatalCode(exitOpFailed, err)
	}

	if isJSON {
		printJSON(resp)
	} else {
		fmt.Printf(" done (%s)\n", resp.Archive)
	}
}

func runSnapshots(flags []string, client *biosclient.Client) {
	app := requireArg(flags, "<app>")

	list, err := client.Apps.ListSnapshots(app)
	if err != nil {
		fatalCode(exitAPIError, err)
	}

	if jsonMode(flags) {
		printJSON(list)
		return
	}

	if len(list.Backups) == 0 {
		fmt.Printf("no snapshots for %s\n", app)
		return
	}

	headers := []string{"NAME", "SIZE", "CREATED"}
	var rows [][]string
	for _, s := range list.Backups {
		size := fmt.Sprintf("%.1f MB", float64(s.Size)/1024/1024)
		rows = append(rows, []string{s.Name, size, s.Created})
	}
	printTable(headers, rows)
}

func runRecover(flags []string, client *biosclient.Client) {
	args := positionalArgs(flags)
	if len(args) < 2 {
		fmt.Fprintln(os.Stderr, "usage: builder bios recover <app> <archive> [--all | --db | --config | --binary] [--json]")
		os.Exit(exitCmdError)
	}
	app := args[0]
	archive := args[1]
	isJSON := jsonMode(flags)

	req := biosclient.RecoverRequest{
		Archive: archive,
	}

	// Default to --all if no specific flag is given.
	if hasFlag(flags, "--all") || (!hasFlag(flags, "--db") && !hasFlag(flags, "--config") && !hasFlag(flags, "--binary")) {
		req.All = true
	} else {
		req.Db = hasFlag(flags, "--db")
		req.Config = hasFlag(flags, "--config")
		req.Binary = hasFlag(flags, "--binary")
	}

	if !isJSON {
		fmt.Printf("Recovering %s from %s...", app, archive)
	}

	resp, err := client.Apps.Recover(app, req)
	if err != nil {
		if !isJSON {
			fmt.Println(" FAIL")
		}
		fatalCode(exitOpFailed, err)
	}

	if isJSON {
		printJSON(resp)
	} else {
		fmt.Println(" done")
		fmt.Printf("Status:   %s\n", resp.Status)
		fmt.Printf("Archive:  %s\n", resp.Archive)
		if len(resp.Restored) > 0 {
			fmt.Printf("Restored: %v\n", resp.Restored)
		}
		if resp.StartError != "" {
			fmt.Printf("Warning:  start error: %s\n", resp.StartError)
		}
	}
}

func runBackupDb(flags []string, client *biosclient.Client) {
	app := requireArg(flags, "<app>")
	isJSON := jsonMode(flags)

	if !isJSON {
		fmt.Printf("Backing up database for %s...", app)
	}

	resp, err := client.Apps.BackupDb(app)
	if err != nil {
		if !isJSON {
			fmt.Println(" FAIL")
		}
		fatalCode(exitOpFailed, err)
	}

	if isJSON {
		printJSON(resp)
	} else {
		fmt.Printf(" done (%s)\n", resp.Archive)
	}
}
