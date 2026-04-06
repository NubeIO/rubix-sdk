# Builder CLI

Build, cache, and assemble rubix releases from a single `release.yaml`.

## Setup

```bash
cd rubix-sdk/cmd/builder
make build
```

## Quick reference

See [EXAMPLE.md](EXAMPLE.md) for copy-paste recipes.

---

## Browser builds (no desktop window — bios + rubix + frontend)

| Command | Output |
|---------|--------|
| `make browser-linux` | `dist/browser-linux/` |
| `make browser-windows` | `dist/browser-windows/` |
| `make browser-pi` | `dist/browser-pi/` |
| `make browser-pi32` | `dist/browser-pi32/` |
| `make browser-all` | all of the above |

## Desktop builds (browser + Tauri app — double-click and run)

| Command | Output |
|---------|--------|
| `make desktop-linux` | `dist/desktop-linux/` |
| `make desktop-windows` | `dist/desktop-windows/` |
| `make desktop-all` | all of the above |

## Flags

| Flag | What it does | Example |
|------|-------------|---------|
| `ZIP=1` | Archive output (`.tar.gz` / `.zip`) | `make browser-linux ZIP=1` |
| `EXCLUDE=x,y` | Skip components | `make browser-linux EXCLUDE=frontend,bacnet` |
| `REUSE=x:latest` | Reuse most recent cached build | `make browser-linux REUSE=frontend:latest` |
| `REUSE=x:YYMMDD-HHmmss` | Reuse specific cached build | `make browser-linux REUSE=frontend:250405-131215` |
| `KEEP=db` | Preserve database across rebuilds | `make browser-linux KEEP=db` |
| `KEEP=config` | Preserve app.yaml + server.yaml | `make browser-linux KEEP=config` |
| `KEEP=all` | Preserve db + config | `make browser-linux KEEP=all` |
| `RUBIX_ROOT=/path` | Override rubix project path | `make browser-linux RUBIX_ROOT=~/rubix` |

## Components

| Name | What | Browser | Desktop |
|------|------|---------|---------|
| `bios` | Process manager | included | included |
| `rubix` | Go backend | included | included |
| `frontend` | React UI (pnpm build) | included | included |
| `configs` | API schemas (no build) | included | included |
| `bacnet` | BACnet server (Node SEA) | included | included |
| `desktop` | Tauri app | **excluded** | included |

## Cache

Every build caches each component with a `YYMMDD-HHmmss` timestamp.

| Command | What it does |
|---------|-------------|
| `make cache-list` | Show cached builds |
| `make cache-prune` | Delete old caches, keep latest per component |
| `make cache-clean` | Delete ALL cached builds |

Use `--reuse component:latest` to pull the most recent cache, or `component:YYMMDD-HHmmss` for a specific one.

```
dist/cache/
  linux/
    bios-250405-131215/
    rubix-250405-131215/
    frontend-250405-131215/
    bacnet-250405-131215/
  windows/
    ...
```

## Keep (preserve data across rebuilds)

By default, rebuilding wipes the output folder. Use `KEEP` to preserve data:

| Flag | What it preserves |
|------|------------------|
| `KEEP=db` | `apps/rubix/db/` (database) |
| `KEEP=config` | `apps/rubix/app.yaml` + `apps/rubix/server.yaml` |
| `KEEP=all` | db + config |

## Manifest (`release.yaml`)

Single source of truth — defines build commands, artifact paths, and assembly rules for every component.

```yaml
bios:
  build:
    linux:   "make -C ../bios build"
    windows: "make -C ../bios build-windows"
  binary:
    linux:   "../bios/bin/rubix-bios"
    windows: "../bios/bin/rubix-bios.exe"
  config: desktop/scripts/bios.yaml

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
    shared: [configs, frontend]
    required: true

shared:
  - name: frontend
    build: "cd frontend && pnpm install --frozen-lockfile && pnpm run build"
    src: frontend/dist/client
    output: frontend/dist/client    # rubix expects this path
  - name: configs
    src: configs/ras                # no build, just copy

desktop:
  build:
    linux: "... setup sidecar + tauri build"
  binary:
    linux: "desktop/src-tauri/target/release/rubix-desktop"

start_script: true
```

### Build behaviour

- **Build command fails** → always an error (even if `required: false`)
- **No build/binary for this target** → skip silently (platform not supported)
- **Binary missing after build + `required: false`** → skip with warning
- **Binary missing after build + `required: true`** → error

### Pipeline

1. **Build** — runs each component's shell command from `release.yaml`
2. **Cache** — saves artifacts with YYMMDD-HHmmss timestamp
3. **Assemble** — copies into output layout (bios at root, apps under apps/, shared resources)
4. **Archive** — optionally creates .tar.gz/.zip (with `ZIP=1`)

Each step is skippable per-component via `EXCLUDE` or `REUSE`.

## Output layout

```
dist/browser-linux/
  rubix-bios              ← bios process manager
  bios.yaml               ← bios config
  start.sh                ← launches rubix-bios
  apps/
    rubix/
      rubix               ← Go backend
      app.yaml            ← bios manifest
      server.yaml         ← config
      db/                 ← database
      logs/               ← log files
      frontend/dist/client/ → symlink to ../../frontend/dist/client
      configs → ../../configs
    bacnet/
      bacnet-server       ← Node SEA binary
      config.json
  configs/ras/            ← shared (API schemas)
  frontend/dist/client/   ← shared (React build)
```

Desktop builds add `rubix-desktop` at the root.

## Development (separate — run from `rubix/desktop/`)

```bash
cd rubix/desktop
make dev-bios      # browser-only: bios + rubix (no Tauri)
make dev           # full desktop: Go + frontend + Tauri
make dev-quick     # desktop: skip all rebuilds, Tauri only
```

---

## Package an app (zip)

```
builder app package [flags]

Required:
  --name      App name
  --version   Semver version
  --arch      Target arch: amd64, amd64-win, arm64, armv7
  --binary    Path to the built binary

Optional:
  --file, --dir, --port, --health, --args, --output
```

## Package a plugin (zip)

```
builder plugin package [flags]

Required:
  --name, --version, --arch, --binary, --plugin-json

Optional:
  --file, --dir, --output
```

## Interactive mode (TUI)

```bash
builder app       # interactive app packager
builder plugin    # interactive plugin packager
```
