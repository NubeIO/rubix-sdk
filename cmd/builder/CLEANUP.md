# Builder CLI Cleanup — Scope

## Goal

Strip the Makefile down to just building the Go binary. Move everything else into the `builder` CLI so there's **one interface** — no more maintaining both.

AI agents (and scripts) use `builder <command>` for everything. Adding a new app or plugin means adding a yaml entry, not editing Go code or a Makefile.

---

## What changes

### 1. Makefile → build/clean/test only

The Makefile shrinks to ~10 lines. It compiles the `builder` binary and nothing else.

Everything currently in the Makefile (browser-linux, desktop-windows, rubix-package, flutter-web, plm-package, cache-list, cache-clean, cache-prune, all the flag plumbing) gets removed.

### 2. Add `builder cache` subcommand

```
builder cache list              Show cached builds
builder cache clean             Delete ALL cached builds
builder cache prune             Delete old caches, keep latest per component
```

Replaces the Makefile's `cache-list`, `cache-clean`, `cache-prune` targets. Just `ls` and `rm -rf` on `dist/cache/`.

### 3. Add `builder package` subcommand (data-driven from packages.yaml)

```
builder package <name> --version <ver> [--arch <arch>] [--output <dir>]
```

Reads from `packages.yaml` so new apps/plugins are just yaml entries — no code changes.

```yaml
# packages.yaml
packages:
  rubix:
    type: app
    binary: dist/browser-linux/apps/rubix/rubix
    files: [dist/browser-linux/apps/rubix/server.yaml]
    dirs: [dist/browser-linux/frontend]
    port: 9000
    health: "http://localhost:9000/healthz"
    args: "--addr,:9000,--server-config,server.yaml"

  rubix-app:
    type: app
    static: true
    static-dir: web
    build: "cd $FLUTTER_ROOT && flutter build web --release --dart-define=RUNTIME_MODE=none"
    dirs: ["$FLUTTER_ROOT/build/web"]
    port: 8080

  nube.plm:
    type: plugin
    build: "cd $PLM_ROOT && go build -o nube.plm ."
    binary: "$PLM_ROOT/nube.plm"
    plugin-json: "$PLM_ROOT/plugin.json"
    dirs: ["$PLM_ROOT/dist-frontend", "$PLM_ROOT/config"]
```

### 4. Add `builder commands --json` (top-level AI discovery)

Same pattern as `builder bios commands --json` — lets AI agents discover all available commands without parsing help text.

### 5. Update docs

Replace EXAMPLE.md / README.md with CLI-first examples:

```bash
# Build (cache/reuse/exclude/keep/zip all work already)
builder release --target linux
builder release --target linux --exclude desktop          # browser build
builder release --target windows --zip
builder release --target linux --reuse frontend:latest --keep db

# Package (data-driven from packages.yaml)
builder package rubix --version 1.3.0 --arch amd64
builder package nube.plm --version 1.0.0 --arch amd64
builder package rubix-app --version 1.0.0

# Cache
builder cache list
builder cache clean
builder cache prune

# Bios remote management (already done)
builder bios apps --host cloud --json
builder bios upgrade rubix rubix-1.1.0.zip --host cloud
```

---

## What stays the same

- **release.yaml** — source of truth for builds, untouched
- **Cache/reuse system** — already in Go (`appbuilder.AssembleRelease`), untouched
- **All Go subpackages** (apps/, plugin/, bios/, release/, version/) — untouched
- **bios client commands** — already CLI-first with --json, untouched
- **main.go** — gets new `cache` and `package` cases in the switch, that's it

---

## Order of work

1. Add `cache` subcommand (list/clean/prune) — move shell logic from Makefile into Go
2. Add `packages.yaml` schema + `package` subcommand — data-driven packaging
3. Add top-level `commands --json` discovery
4. Strip Makefile to build/clean/test
5. Update README.md / EXAMPLE.md with CLI-only examples
