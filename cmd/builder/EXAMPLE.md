# Builder — Copy-Paste Examples

All commands run from `rubix-sdk/cmd/builder/`. One-time setup: `make build`

---

## Browser builds (no desktop window — bios + rubix + frontend)

| Command | Output |
|---------|--------|
| `make browser-linux` | `dist/browser-linux/` |
| `make browser-linux ZIP=1` | `dist/browser-linux.tar.gz` |
| `make browser-windows` | `dist/browser-windows/` |
| `make browser-windows ZIP=1` | `dist/browser-windows.zip` |
| `make browser-pi` | `dist/browser-pi/` |
| `make browser-pi ZIP=1` | `dist/browser-pi.tar.gz` |
| `make browser-pi32` | `dist/browser-pi32/` |
| `make browser-pi32 ZIP=1` | `dist/browser-pi32.tar.gz` |
| `make browser-all` | all of the above |
| `make browser-all ZIP=1` | all of the above, zipped |

## Desktop builds (browser + Tauri app — double-click and run)

| Command | Output |
|---------|--------|
| `make desktop-linux` | `dist/desktop-linux/` |
| `make desktop-linux ZIP=1` | `dist/desktop-linux.tar.gz` |
| `make desktop-windows` | `dist/desktop-windows/` |
| `make desktop-windows ZIP=1` | `dist/desktop-windows.zip` |
| `make desktop-all` | all of the above |
| `make desktop-all ZIP=1` | all of the above, zipped |

## Exclude components

| Command | What you get |
|---------|-------------|
| `make browser-linux EXCLUDE=frontend,bacnet` | bios + rubix only (smallest) |
| `make browser-linux EXCLUDE=bacnet` | bios + rubix + frontend (no bacnet) |
| `make desktop-linux EXCLUDE=bacnet` | everything except bacnet |

## Reuse cached builds

| Command | What happens |
|---------|-------------|
| `make browser-linux REUSE=frontend:latest` | reuse last cached frontend, rebuild rest |
| `make browser-linux REUSE="frontend:latest,bios:latest"` | only rebuild rubix + bacnet |
| `make browser-linux REUSE=frontend:250405-131215` | reuse specific cached frontend |
| `make desktop-linux REUSE="frontend:latest,rubix:latest,bios:latest"` | only rebuild desktop + bacnet |

## Keep data across rebuilds

| Flag | What it preserves |
|------|------------------|
| `KEEP=db` | `apps/rubix/db/` (database) |
| `KEEP=config` | `apps/rubix/app.yaml` + `apps/rubix/server.yaml` |
| `KEEP=all` | db + config (everything above) |

| Command | What happens |
|---------|-------------|
| `make browser-linux KEEP=db` | rebuild everything, preserve database |
| `make browser-linux KEEP=config` | rebuild everything, preserve app.yaml + server.yaml |
| `make browser-linux KEEP=all` | rebuild everything, preserve db + config |

## Cache management

| Command | What it does |
|---------|-------------|
| `make cache-list` | show all cached builds + timestamps |
| `make cache-clean` | delete all cached builds |

## Flags

| Flag | What it does |
|------|-------------|
| `ZIP=1` | archive output (`.tar.gz` for linux, `.zip` for windows) |
| `EXCLUDE=x,y` | skip components |
| `REUSE=x:latest` | reuse most recent cached build |
| `REUSE=x:YYMMDD-HHmmss` | reuse specific cached build |
| `KEEP=db` | preserve database across rebuilds |
| `KEEP=config` | preserve app.yaml + server.yaml across rebuilds |
| `KEEP=all` | preserve db + config |
| `RUBIX_ROOT=/path` | override rubix project path |

## Components

| Name | What | Browser | Desktop |
|------|------|---------|---------|
| `bios` | process manager | included | included |
| `rubix` | Go backend | included | included |
| `frontend` | React UI | included | included |
| `configs` | API schemas | included | included |
| `bacnet` | BACnet server | included | included |
| `desktop` | Tauri app | **excluded** | included |

---

## Quick examples

Full browser build for linux, zipped:
```bash
make browser-linux ZIP=1
```

Minimal build (just bios + rubix, no frontend):
```bash
make browser-linux EXCLUDE=frontend,bacnet
```

Fast rebuild after changing only Go code (reuse cached frontend):
```bash
make browser-linux REUSE=frontend:latest
```

Rebuild everything but keep the database and config:
```bash
make browser-linux KEEP=all
```

Rebuild only bios, reuse rest, keep database:
```bash
make desktop-linux REUSE="frontend:latest,rubix:latest,desktop:latest" EXCLUDE=bacnet KEEP=db
```

Windows desktop, zipped, skip bacnet:
```bash
make desktop-windows EXCLUDE=bacnet ZIP=1
```

All browser platforms, zipped:
```bash
make browser-all ZIP=1
```

---

## Development (run from `rubix/desktop/`)

```bash
make dev-bios      # browser-only: bios + rubix (no Tauri)
make dev           # full desktop: Go + frontend + Tauri
make dev-quick     # desktop: skip all rebuilds, Tauri only
```
