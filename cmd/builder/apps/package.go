package apps

import (
	"flag"
	"fmt"
	"os"
	"strings"

	"github.com/NubeIO/rubix-sdk/pkg/appbuilder"
)

// RunPackage handles "builder app package [flags]".
func RunPackage(args []string) {
	fs := flag.NewFlagSet("app package", flag.ExitOnError)

	name := fs.String("name", "", "App name (required)")
	version := fs.String("version", "", "Semver version (required)")
	arch := fs.String("arch", "", "Target arch: amd64, amd64-win, arm64, armv7 (required)")
	binary := fs.String("binary", "", "Path to binary (required)")
	port := fs.Int("port", 0, "App port")
	health := fs.String("health", "", "Health check URL")
	argsFlag := fs.String("args", "", "App arguments, comma-separated")
	output := fs.String("output", ".", "Output directory")

	var files multiFlag
	var dirs multiFlag
	fs.Var(&files, "file", "Extra file to include (repeatable)")
	fs.Var(&dirs, "dir", "Extra directory to include (repeatable)")

	fs.Parse(args)

	// Validate required flags.
	missing := []string{}
	if *name == "" {
		missing = append(missing, "--name")
	}
	if *version == "" {
		missing = append(missing, "--version")
	}
	if *arch == "" {
		missing = append(missing, "--arch")
	}
	if *binary == "" {
		missing = append(missing, "--binary")
	}
	if len(missing) > 0 {
		fmt.Fprintf(os.Stderr, "missing required flags: %s\n", strings.Join(missing, ", "))
		fs.Usage()
		os.Exit(1)
	}

	var appArgs []string
	if *argsFlag != "" {
		appArgs = strings.Split(*argsFlag, ",")
	}

	zipPath, err := appbuilder.PackageApp(appbuilder.AppOptions{
		Name:      *name,
		Version:   *version,
		Arch:      *arch,
		Binary:    *binary,
		Files:     files,
		Dirs:      dirs,
		Port:      *port,
		HealthURL: *health,
		Args:      appArgs,
		OutputDir: *output,
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}

	fmt.Println(zipPath)
}

// multiFlag allows a flag to be specified multiple times.
type multiFlag []string

func (m *multiFlag) String() string { return strings.Join(*m, ", ") }
func (m *multiFlag) Set(v string) error {
	*m = append(*m, v)
	return nil
}
