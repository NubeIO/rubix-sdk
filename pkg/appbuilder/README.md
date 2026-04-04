# appbuilder

Reusable Go library for packaging apps and plugins into distributable `.zip` files. Framework-agnostic -- can be called from CLI, TUI, REST handlers, or tests.

This package is the engine behind the [builder CLI](../../cmd/builder/README.md).

## Install

```go
import "github.com/nube/rubix-sdk/pkg/appbuilder"
```

## Package an app

```go
zipPath, err := appbuilder.PackageApp(appbuilder.AppOptions{
    Name:    "bacnet-server",
    Version: "2.1.0",
    Arch:    "amd64",
    Binary:  "./bin/bacnet-server",
    Port:    4000,
    Files:   []string{"./config.json"},
    Output:  "dist/",
})
// zipPath = "dist/bacnet-server-2.1.0-amd64.zip"
```

### AppOptions

| Field      | Type     | Required | Description                              |
|------------|----------|----------|------------------------------------------|
| Name       | string   | yes      | Lowercase, hyphens allowed               |
| Version    | string   | yes      | Semver (`1.0.0`)                         |
| Arch       | string   | yes      | `amd64`, `amd64-win`, `arm64`, `armv7`   |
| Binary     | string   | yes      | Path to the built binary                 |
| Files      | []string | no       | Extra files to include                   |
| Dirs       | []string | no       | Extra directories to include recursively |
| Port       | int      | no       | App port (written to app.yaml)           |
| HealthURL  | string   | no       | Health check URL (written to app.yaml)   |
| Args       | []string | no       | App arguments (written to app.yaml)      |
| OutputDir  | string   | no       | Output directory (default: `.`)          |

## Package a plugin

```go
zipPath, err := appbuilder.PackagePlugin(appbuilder.PluginOptions{
    Name:       "my-plugin",
    Version:    "1.0.0",
    Arch:       "arm64",
    Binary:     "./bin/my-plugin",
    PluginJSON: "./plugin.json",
    Output:     "dist/",
})
// zipPath = "dist/my-plugin-1.0.0-arm64.zip"
```

### PluginOptions

| Field      | Type     | Required | Description                              |
|------------|----------|----------|------------------------------------------|
| Name       | string   | yes      | Lowercase, hyphens allowed               |
| Version    | string   | yes      | Semver (`1.0.0`)                         |
| Arch       | string   | yes      | `amd64`, `amd64-win`, `arm64`, `armv7`   |
| Binary     | string   | yes      | Path to the built binary                 |
| PluginJSON | string   | yes      | Path to plugin.json (version is patched) |
| Files      | []string | no       | Extra files to include                   |
| Dirs       | []string | no       | Extra directories to include recursively |
| OutputDir  | string   | no       | Output directory (default: `.`)          |

## Zip output format

Output filename: `{name}-{version}-{arch}.zip`

**App zip contents:**
```
app.yaml          # generated manifest
bacnet-server     # binary (marked executable)
config.json       # any extra files/dirs
```

**Plugin zip contents:**
```
plugin.json       # from PluginJSON with version patched
my-plugin         # binary (marked executable)
```

## Generated app.yaml

```yaml
name: bacnet-server
version: 2.1.0
exec: ./bacnet-server
port: 4000
health_url: http://localhost:4000/healthz
args:
  - --addr
  - ":4000"
```

Generate manifest bytes directly:

```go
data, err := appbuilder.WriteAppYAML(appbuilder.AppManifest{
    Name:      "bacnet-server",
    Version:   "2.1.0",
    Exec:      "./bacnet-server",
    Port:      4000,
    HealthURL: "http://localhost:4000/healthz",
    Args:      []string{"--addr", ":4000"},
})
```

## Validation

All inputs are validated before building. You can also validate individually:

```go
appbuilder.ValidateName("bacnet-server")   // nil
appbuilder.ValidateName("Bad Name!")       // error

appbuilder.ValidateVersion("1.0.0")        // nil
appbuilder.ValidateVersion("v1.0")         // error

appbuilder.ValidateArch("arm64")           // nil
appbuilder.ValidateArch("mips")            // error
```

**Name rules:** lowercase alphanumeric, hyphens and dots allowed, min 2 chars, must start with a letter.

**Version rules:** strict semver `MAJOR.MINOR.PATCH` (e.g. `1.0.0`).

**Supported architectures:** `amd64`, `amd64-win`, `arm64`, `armv7`.

## Low-level API

For full control, build a `BuildSpec` directly:

```go
spec := appbuilder.BuildSpec{
    Name:    "my-app",
    Version: "1.0.0",
    Arch:    "amd64",
    Kind:    "app",
    Manifest: manifestBytes,
    Files: []appbuilder.FileEntry{
        {DiskPath: "./bin/my-app", ZipPath: "my-app", Executable: true},
        {DiskPath: "./config.json", ZipPath: "config.json"},
    },
}

zipPath, err := appbuilder.Build(spec, "dist/")
```

## Architecture

```
AppOptions / PluginOptions
        |
  PackageApp() / PackagePlugin()
        |
     BuildSpec
        |
      Build()
        |
   ValidateSpec()
        |
   Create zip:
     - manifest (app.yaml or plugin.json)
     - binary (executable)
     - extra files/dirs
        |
   Return zip path
```
