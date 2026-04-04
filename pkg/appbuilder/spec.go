// Package appbuilder provides reusable logic for packaging apps and plugins
// into distributable zip files. It is agnostic to how it's invoked — CLI, TUI,
// REST handler, or tests can all use it.
package appbuilder

// BuildSpec describes everything needed to produce a distributable zip.
type BuildSpec struct {
	Name     string      // app or plugin name, e.g. "bacnet-server"
	Version  string      // semver, e.g. "2.1.0"
	Arch     string      // target architecture, e.g. "amd64"
	Kind     string      // "app" or "plugin"
	Manifest []byte      // rendered manifest content (app.yaml or plugin.json)
	Files    []FileEntry // all files to include in the zip
}

// FileEntry maps a file on disk to a path inside the zip.
type FileEntry struct {
	DiskPath   string // absolute path on disk
	ZipPath    string // relative path inside the zip
	Executable bool   // mark executable after extract
}
