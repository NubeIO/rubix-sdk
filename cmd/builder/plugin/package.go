package plugin

import (
	"flag"
	"fmt"
	"os"
	"strings"

	"github.com/NubeIO/rubix-sdk/pkg/appbuilder"
)

// RunPackage handles "builder plugin package [flags]".
func RunPackage(args []string) {
	fs := flag.NewFlagSet("plugin package", flag.ExitOnError)

	name := fs.String("name", "", "Plugin ID, e.g. nube.github (required)")
	version := fs.String("version", "", "Semver version (required)")
	arch := fs.String("arch", "", "Target arch: amd64, amd64-win, arm64, armv7 (required)")
	binary := fs.String("binary", "", "Path to plugin binary (required)")
	pluginJSON := fs.String("plugin-json", "", "Path to plugin.json (required)")
	output := fs.String("output", ".", "Output directory")

	var files multiFlag
	var dirs multiFlag
	fs.Var(&files, "file", "Extra file to include (repeatable)")
	fs.Var(&dirs, "dir", "Extra directory to include (repeatable)")

	fs.Parse(args)

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
	if *pluginJSON == "" {
		missing = append(missing, "--plugin-json")
	}
	if len(missing) > 0 {
		fmt.Fprintf(os.Stderr, "missing required flags: %s\n", strings.Join(missing, ", "))
		fs.Usage()
		os.Exit(1)
	}

	zipPath, err := appbuilder.PackagePlugin(appbuilder.PluginOptions{
		Name:       *name,
		Version:    *version,
		Arch:       *arch,
		Binary:     *binary,
		PluginJSON: *pluginJSON,
		Files:      files,
		Dirs:       dirs,
		OutputDir:  *output,
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}

	fmt.Println(zipPath)
}

type multiFlag []string

func (m *multiFlag) String() string { return strings.Join(*m, ", ") }
func (m *multiFlag) Set(v string) error {
	*m = append(*m, v)
	return nil
}
