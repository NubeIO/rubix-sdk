package main

import (
	"fmt"
	"os"

	"github.com/NubeIO/rubix-sdk/cmd/builder/apps"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	typ := os.Args[1]
	cmd := ""
	args := os.Args[2:]
	if len(os.Args) >= 3 {
		cmd = os.Args[2]
		args = os.Args[3:]
	}

	switch typ {
	case "app":
		switch cmd {
		case "package":
			if len(args) > 0 {
				apps.RunPackage(args)
			} else {
				apps.RunInteractive()
			}
		case "":
			// No subcommand — show interactive picker.
			apps.RunInteractive()
		default:
			printUsage()
			os.Exit(1)
		}
	default:
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Fprintln(os.Stderr, `Usage: builder <type> <command> [flags]

Types:
  app       Bios-managed apps

Commands:
  package   Zip an existing built app for deployment

Interactive (TUI):
  builder app              Launch interactive app packager
  builder app package      Launch interactive app packager

CLI (for AI / scripts):
  builder app package --name bacnet-server --version 2.1.0 --arch amd64 \
    --binary ./bacnet-server --file config.json --output ./dist/`)
}
