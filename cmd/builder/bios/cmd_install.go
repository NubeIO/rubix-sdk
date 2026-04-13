package bios

import (
	"fmt"
	"os"
	"time"

	"github.com/NubeIO/rubix-sdk/pkg/biosclient"
)

func runInstall(flags []string, client *biosclient.Client) {
	zipPath := requireArg(flags, "<zipfile>")

	if _, err := os.Stat(zipPath); err != nil {
		fatalCode(exitCmdError, fmt.Errorf("zip file not found: %s", zipPath))
	}

	isJSON := jsonMode(flags)
	if !isJSON {
		fmt.Printf("Uploading %s...", zipPath)
	}

	resp, err := client.Apps.Upload(zipPath)
	if err != nil {
		if !isJSON {
			fmt.Println(" FAIL")
		}
		fatalCode(exitAPIError, err)
	}

	if !isJSON {
		fmt.Println(" done")
		fmt.Printf("Installing %s v%s...\n", resp.Name, resp.Version)
	}

	if resp.Token == "" {
		// Synchronous install (no job token).
		if isJSON {
			printJSON(resp)
		} else {
			fmt.Printf("%s v%s installed\n", resp.Name, resp.Version)
		}
		return
	}

	// Poll the async job.
	result := pollUntilDone(client, resp.Token, defaultPollTimeout, isJSON)
	if result.Err != nil {
		fatalCode(exitOpFailed, result.Err)
	}

	if isJSON {
		printJSON(map[string]any{
			"status":  "installed",
			"name":    resp.Name,
			"version": resp.Version,
		})
	} else {
		fmt.Printf("%s v%s installed successfully\n", resp.Name, resp.Version)
	}
}

func runUpgrade(flags []string, client *biosclient.Client) {
	args := positionalArgs(flags)
	if len(args) < 2 {
		fmt.Fprintln(os.Stderr, "usage: builder bios upgrade <app> <zipfile> [--keep all] [--no-backup] [--json]")
		os.Exit(exitCmdError)
	}
	app := args[0]
	zipPath := args[1]

	if _, err := os.Stat(zipPath); err != nil {
		fatalCode(exitCmdError, fmt.Errorf("zip file not found: %s", zipPath))
	}

	noBackup := hasFlag(flags, "--no-backup")
	keep := parseFlag(flags, "--keep", "all")
	isJSON := jsonMode(flags)
	timeout := defaultPollTimeout
	if v := parseFlag(flags, "--timeout", ""); v != "" {
		d, err := time.ParseDuration(v)
		if err != nil {
			fatalCode(exitCmdError, fmt.Errorf("invalid --timeout: %s", v))
		}
		timeout = d
	}

	// Step 1: Snapshot (unless --no-backup).
	var snapArchive string
	if !noBackup {
		if !isJSON {
			fmt.Printf("Creating snapshot of %s...", app)
		}
		snap, err := client.Apps.Snapshot(app)
		if err != nil {
			if !isJSON {
				fmt.Println(" FAIL")
			}
			fatalCode(exitOpFailed, fmt.Errorf("snapshot failed: %w", err))
		}
		snapArchive = snap.Archive
		if !isJSON {
			fmt.Printf(" done (%s)\n", snap.Archive)
		}

		// Step 2: Verify snapshot exists and has size > 0.
		snapList, err := client.Apps.ListSnapshots(app)
		if err != nil {
			fatalCode(exitOpFailed, fmt.Errorf("verify snapshot: %w", err))
		}
		found := false
		for _, s := range snapList.Backups {
			if s.Path == snap.Archive || s.Name == snap.Archive {
				if s.Size <= 0 {
					fatalCode(exitOpFailed, fmt.Errorf("snapshot %s has zero size", snap.Archive))
				}
				found = true
				break
			}
		}
		if !found {
			fatalCode(exitOpFailed, fmt.Errorf("snapshot %s not found in backup list", snap.Archive))
		}
	}

	// Step 3: Upload and start upgrade job.
	if !isJSON {
		fmt.Printf("Uploading %s...", zipPath)
	}

	resp, err := client.Apps.Upgrade(app, zipPath, &biosclient.UpgradeOpts{
		Keep:   keep,
		Backup: false, // we already handled the backup
	})
	if err != nil {
		if !isJSON {
			fmt.Println(" FAIL")
		}
		fatalCode(exitAPIError, err)
	}

	if !isJSON {
		fmt.Println(" done")
		fmt.Print("Upgrading...")
	}

	// Step 4: Poll until done.
	if resp.Token != "" {
		result := pollUntilDone(client, resp.Token, timeout, isJSON)
		if result.Err != nil {
			fatalCode(exitOpFailed, result.Err)
		}
	}

	// Step 5: Verify app is running.
	status, err := client.Apps.Status(app)
	if err != nil {
		fatalCode(exitAPIError, fmt.Errorf("verify post-upgrade status: %w", err))
	}

	// Step 6: Report.
	if isJSON {
		out := map[string]any{
			"status":  "upgraded",
			"version": status.Version,
			"state":   status.State,
		}
		if snapArchive != "" {
			out["snapshot"] = snapArchive
		}
		printJSON(out)
	} else {
		fmt.Printf("%s upgraded to v%s (%s", app, status.Version, status.State)
		if status.PID > 0 {
			fmt.Printf(", pid %d", status.PID)
		}
		fmt.Println(")")
	}

	if status.State != "running" {
		os.Exit(exitOpFailed)
	}
}
