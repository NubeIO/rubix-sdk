package bios

import (
	"fmt"
	"os"

	"github.com/NubeIO/rubix-sdk/pkg/biosclient"
)

func runUpdateFrontend(flags []string, client *biosclient.Client) {
	args := positionalArgs(flags)
	if len(args) < 2 {
		fmt.Fprintln(os.Stderr, "usage: builder bios update-frontend <app> <zipfile> [--host name] [--json]")
		os.Exit(exitCmdError)
	}
	app := args[0]
	zipPath := args[1]

	if _, err := os.Stat(zipPath); err != nil {
		fatalCode(exitCmdError, fmt.Errorf("zip file not found: %s", zipPath))
	}

	isJSON := jsonMode(flags)

	if !isJSON {
		fmt.Printf("Updating frontend for %s from %s...", app, zipPath)
	}

	resp, err := client.Apps.UpdateFrontend(app, zipPath)
	if err != nil {
		if !isJSON {
			fmt.Println(" FAIL")
		}
		fatalCode(exitAPIError, err)
	}

	if isJSON {
		printJSON(resp)
	} else {
		fmt.Printf(" done (%d files)\n", resp.Files)
	}
}
