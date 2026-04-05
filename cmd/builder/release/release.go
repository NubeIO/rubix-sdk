package release

import (
	"flag"
	"fmt"
	"os"

	"github.com/NubeIO/rubix-sdk/pkg/appbuilder"
)

// RunRelease parses CLI flags and assembles a release folder.
func RunRelease(args []string) {
	fs := flag.NewFlagSet("release", flag.ExitOnError)

	manifest := fs.String("manifest", "release.yaml", "Path to release.yaml manifest")
	target := fs.String("target", "", "Build target: linux, windows, pi, pi32")
	outputDir := fs.String("output", "dist", "Output directory")
	rootDir := fs.String("root", ".", "Project root (build commands run here, paths are relative to this)")
	exclude := fs.String("exclude", "", "Comma-separated components to skip (e.g. frontend,bacnet,desktop)")
	reuse := fs.String("reuse", "", "Reuse cached builds: component:YYMMDD-HHmmss,... (e.g. frontend:250405-131215)")
	zipFlag := fs.Bool("zip", false, "Create archive after assembly (.tar.gz for linux, .zip for windows)")
	cacheDir := fs.String("cache-dir", "", "Cache directory (default: {output}/../cache)")

	// Legacy compat
	targetOS := fs.String("os", "", "Target OS (legacy — use --target instead)")
	arch := fs.String("arch", "", "Target arch (legacy — use --target instead)")

	fs.Usage = func() {
		fmt.Fprintf(os.Stderr, `Usage: builder release [flags]

Build components, cache artifacts, and assemble a release folder from a
release.yaml manifest. Each component can be excluded (--exclude) or
reused from a previous cached build (--reuse component:YYMMDD-HHmmss).

Targets:
  linux     Linux x86_64
  windows   Windows x86_64
  pi        Linux arm64 (Raspberry Pi 4+)
  pi32      Linux armv7 (Raspberry Pi 3)

Flags:
`)
		fs.PrintDefaults()
		fmt.Fprintf(os.Stderr, `
Examples:
  # Full Linux build
  builder release --target linux --root /path/to/rubix

  # Minimal build (bios + rubix only, no frontend/bacnet/desktop)
  builder release --target linux --exclude frontend,bacnet,desktop

  # Reuse cached frontend from a previous build
  builder release --target linux --reuse frontend:250405-131215

  # Windows build + auto-zip
  builder release --target windows --zip

  # Reuse frontend + desktop, exclude bacnet, zip it
  builder release --target linux --reuse "frontend:250405-131215,desktop:250405-131215" --exclude bacnet --zip
`)
	}

	if err := fs.Parse(args); err != nil {
		os.Exit(1)
	}

	opts := appbuilder.ReleaseOptions{
		ManifestPath: *manifest,
		Target:       *target,
		OutputDir:    *outputDir,
		RootDir:      *rootDir,
		Exclude:      *exclude,
		Reuse:        *reuse,
		Zip:          *zipFlag,
		CacheDir:     *cacheDir,
		OS:           *targetOS,
		Arch:         *arch,
	}

	if opts.Target == "" && opts.OS == "" {
		opts.Target = "linux" // default
	}

	if err := appbuilder.AssembleRelease(opts); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}
