package bios

import (
	"fmt"

	"github.com/NubeIO/rubix-sdk/pkg/biosclient"
)

func runStart(flags []string, client *biosclient.Client) {
	runLifecycle("start", flags, client, client.Apps.Start)
}

func runStop(flags []string, client *biosclient.Client) {
	runLifecycle("stop", flags, client, client.Apps.Stop)
}

func runRestart(flags []string, client *biosclient.Client) {
	runLifecycle("restart", flags, client, client.Apps.Restart)
}

func runEnable(flags []string, client *biosclient.Client) {
	runLifecycle("enable", flags, client, client.Apps.Enable)
}

func runDisable(flags []string, client *biosclient.Client) {
	runLifecycle("disable", flags, client, client.Apps.Disable)
}

func runLifecycle(action string, flags []string, _ *biosclient.Client, fn func(string) (*biosclient.StatusResponse, error)) {
	app := requireArg(flags, "<app>")
	resp, err := fn(app)
	if err != nil {
		fatalCode(exitAPIError, err)
	}

	if jsonMode(flags) {
		printJSON(resp)
		return
	}

	fmt.Printf("%s: %s\n", app, resp.Status)
}
