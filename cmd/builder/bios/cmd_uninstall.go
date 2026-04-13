package bios

import (
	"fmt"
	"os"

	"github.com/NubeIO/rubix-sdk/pkg/biosclient"
)

func runUninstall(flags []string, client *biosclient.Client) {
	app := requireArg(flags, "<app>")

	if !hasFlag(flags, "--confirm") {
		fmt.Fprintln(os.Stderr, "error: uninstall requires --confirm flag for safety")
		fmt.Fprintf(os.Stderr, "usage: builder bios uninstall %s --confirm\n", app)
		os.Exit(exitCmdError)
	}

	isJSON := jsonMode(flags)

	if !isJSON {
		fmt.Printf("Uninstalling %s...", app)
	}

	if err := client.Apps.Uninstall(app); err != nil {
		if !isJSON {
			fmt.Println(" FAIL")
		}
		fatalCode(exitAPIError, err)
	}

	if isJSON {
		printJSON(map[string]string{"status": "uninstalled", "name": app})
	} else {
		fmt.Println(" done")
	}
}
