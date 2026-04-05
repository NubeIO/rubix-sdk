# Builder CLI

Build, cache, and assemble rubix releases from a declarative manifest.

## Build

```bash
cd rubix-sdk/cmd/builder
make build
```

Binary output: `rubix-sdk/bin/builder`

## Usage

```
builder <type> <command> [flags]

Types:
  release   Build + assemble a full release from a manifest
  app       Package a bios-managed app (zip)
  plugin    Package a rubix plugin (zip)
```

---

## Release (build + cache + assemble)

The `release` command reads a `release.yaml` manifest that defines build
commands, artifact paths, and assembly rules for every component. It builds
each component, caches the artifacts, and assembles a runnable output folder.

```
builder release [flags]

Flags:
  --manifest    Path to release.yaml (default: release.yaml)
  --target      Build target: linux, windows, pi, pi32 (default: linux)
  --output      Output directory (default: dist)
  --root        Project root — build commands run here (default: .)
  --exclude     Comma-separated components to skip (e.g. frontend,bacnet,desktop)
  --reuse       Reuse cached builds: component:YYMMDD-HHmmss (e.g. frontend:250405-131215)
  --zip         Create archive after assembly (.tar.gz / .zip)
  --cache-dir   Cache directory (default: {output}/../cache)
```

### Targets

| Target    | OS      | Arch   |
|-----------|---------|--------|
| `linux`   | Linux   | x86_64 |
| `windows` | Windows | x86_64 |
| `pi`      | Linux   | arm64  |
| `pi32`    | Linux   | armv7  |

### Examples

```bash
# Full Linux build
builder release --target linux --root /path/to/rubix

# Minimal (bios + rubix only)
builder release --target linux --exclude frontend,bacnet,desktop

# Reuse cached frontend
builder release --target linux --reuse frontend:250405-131215

# Windows + zip
builder release --target windows --zip

# Combine: reuse frontend, exclude bacnet, zip
builder release --target linux --reuse frontend:250405-131215 --exclude bacnet --zip
```

### Cache

Every build caches each component to `dist/cache/{target}/`:

```
dist/cache/
  linux/
    bios-250405-131215/
    rubix-250405-131215/
    frontend-250405-131215/
    desktop-250405-131215/
    configs-250405-131215/
  windows/
    ...
```

After each build, the CLI prints the cache timestamp:
```
cache timestamp: 250405-131215
  reuse with: --reuse component:250405-131215
```

Use `--reuse component:YYMMDD-HHmmss` to pull from cache instead of rebuilding.

Assembled outputs are also saved to `dist/build/{target}-{timestamp}/`.

### Manifest format (`release.yaml`)

See [release.yaml](release.yaml) for a full annotated example.

```yaml
# Bios — binary + config placed at output root
bios:
  build:
    linux:   "make -C ../bios build"
    windows: "make -C ../bios build-windows"
  binary:
    linux:   "../bios/bin/rubix-bios"
    windows: "../bios/bin/rubix-bios.exe"
  config: desktop/scripts/bios.yaml

# Apps — each gets apps/{name}/ in the output
apps:
  rubix:
    build:
      linux:   "go build -o bin/rubix ./cmd/rubix"
      windows: "CGO_ENABLED=1 GOOS=windows ... go build -o bin/rubix.exe ./cmd/rubix"
    binary:
      linux:   "bin/rubix"
      windows: "bin/rubix.exe"
    manifest: desktop/scripts/rubix-app.yaml
    config: [config/server.yaml]
    dirs: [db, logs]
    shared: [configs, frontend]     # names of shared resources to symlink
    required: true

# Shared resources — placed at output root, apps symlink to them
shared:
  - name: frontend
    build: "cd frontend && pnpm run build"    # optional build step
    src: frontend/dist/client
  - name: configs
    src: configs/ras                          # no build, just copy

# Desktop (Tauri binary) — optional, placed at output root
desktop:
  build:
    linux: "... setup sidecar + tauri build"
  binary:
    linux: "desktop/src-tauri/target/release/rubix-desktop"

start_script: true
```

### Pipeline

1. **Build** — runs each component's shell command from `release.yaml`
2. **Cache** — saves artifacts with timestamp (YYMMDD-HHmmss)
3. **Assemble** — copies binaries, configs, shared resources into output layout
4. **Archive** — optionally creates .tar.gz/.zip (with `--zip`)

Each step is skippable per-component via `--exclude` or `--reuse`.

---

## Package an app (zip)

```
builder app package [flags]

Required:
  --name      App name (lowercase, hyphens)
  --version   Semver version (e.g. 1.0.0)
  --arch      Target arch: amd64, amd64-win, arm64, armv7
  --binary    Path to the built binary

Optional:
  --file      Extra file to include (repeatable)
  --dir       Extra directory to include (repeatable)
  --port      App port (written to app.yaml)
  --health    Health check URL (written to app.yaml)
  --args      App arguments, comma-separated
  --output    Output directory (default: current dir)
```

---

## Package a plugin (zip)

```
builder plugin package [flags]

Required:
  --name        Plugin ID (e.g. nube.github)
  --version     Semver version
  --arch        Target arch
  --binary      Path to plugin binary
  --plugin-json Path to existing plugin.json

Optional:
  --file      Extra file to include (repeatable)
  --dir       Extra directory to include (repeatable)
  --output    Output directory (default: current dir)
```

---

## Interactive mode (TUI)

```bash
builder app       # interactive app packager
builder plugin    # interactive plugin packager
```
