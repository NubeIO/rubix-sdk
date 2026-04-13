package version

import (
	"flag"
	"fmt"
	"os"

	"github.com/NubeIO/rubix-sdk/pkg/appversion"
)

// Run handles the "builder version" subcommands.
func Run(args []string) {
	if len(args) == 0 {
		printUsage()
		os.Exit(1)
	}

	cmd := args[0]
	rest := args[1:]

	switch cmd {
	case "show":
		runShow(rest)
	case "bump":
		runBump(rest)
	case "set":
		runSet(rest)
	default:
		printUsage()
		os.Exit(1)
	}
}

func runShow(args []string) {
	fs := flag.NewFlagSet("version show", flag.ExitOnError)
	file := fs.String("file", "version.json", "path to version.json")
	fs.Parse(args)

	info, err := appversion.Load(*file)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("version:  %s\n", info.Version)
	fmt.Printf("channel:  %s\n", info.Channel)
	fmt.Printf("released: %s\n", info.Released)
}

func runBump(args []string) {
	fs := flag.NewFlagSet("version bump", flag.ExitOnError)
	file := fs.String("file", "version.json", "path to version.json")
	major := fs.Bool("major", false, "bump major version")
	minor := fs.Bool("minor", false, "bump minor version")
	patch := fs.Bool("patch", false, "bump patch version")
	fs.Parse(args)

	component := ""
	switch {
	case *major:
		component = "major"
	case *minor:
		component = "minor"
	case *patch:
		component = "patch"
	default:
		component = "patch" // default to patch
	}

	newVer, err := appversion.Bump(*file, component)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("%s\n", newVer)
}

func runSet(args []string) {
	fs := flag.NewFlagSet("version set", flag.ExitOnError)
	file := fs.String("file", "version.json", "path to version.json")
	ver := fs.String("version", "", "version string (e.g. 1.2.0)")
	channel := fs.String("channel", "", "channel (dev, beta, stable)")
	fs.Parse(args)

	info, err := appversion.Load(*file)
	if err != nil {
		// Create new if doesn't exist.
		info = &appversion.Info{Version: "0.0.0", Channel: "dev"}
	}

	if *ver != "" {
		// Validate it parses.
		if _, err := appversion.Parse(*ver); err != nil {
			fmt.Fprintf(os.Stderr, "error: %v\n", err)
			os.Exit(1)
		}
		info.Version = *ver
	}
	if *channel != "" {
		info.Channel = *channel
	}

	if err := info.Save(*file); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("%s\n", info.Version)
}

func printUsage() {
	fmt.Fprintln(os.Stderr, `Usage: builder version <command> [flags]

Commands:
  show     Print the current version from version.json
  bump     Increment the version (--major, --minor, --patch)
  set      Set the version explicitly (--version 1.2.0 --channel stable)

Flags:
  --file   Path to version.json (default: version.json)

Examples:
  builder version show
  builder version bump --patch
  builder version bump --minor
  builder version set --version 2.0.0 --channel stable`)
}
