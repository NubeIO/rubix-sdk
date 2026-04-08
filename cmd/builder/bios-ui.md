# Plan: App Upgrade via Bios + Wizard UI

## Context

Users deploy rubix in three modes:
- **Desktop** — Tauri app, updates handled by app store / auto-update (no upgrade needed here)
- **Browser (edge)** — bios + rubix + frontend on a Pi/Linux/Windows device
- **Cloud** — rubix behind nginx, frontend at `/var/www/rubix-client/`

For browser, there's no way to update rubix + frontend on a deployed system. The bios install endpoint rejects uploads if the app already exists (409). The binary update endpoint only swaps the binary, not frontend files.

Cloud is out of scope for this plan. Cloud deployments use CI/CD pipelines, ansible, or manual scp to update nginx-served frontend files and the rubix binary independently. The existing `builder app package` command can already produce a rubix zip for this purpose. A future plan can add cloud-specific tooling if needed.

**Goal:** Add an upgrade endpoint to bios (browser/edge only) + a guided wizard in the bios UI. Enforce desktop mode server-side, not just UI-side.

---

## Changes

### 1. Bios config: add `mode` field

**File:** `bios/config/config.go` — add `Mode string` to `Config` struct

**File:** `rubix/desktop/scripts/bios.yaml` — add `mode: desktop`

The builder sets this at build time:
- `mode: desktop` — desktop builds (upgrade blocked server-side + hidden in UI)
- `mode: browser` — browser builds (upgrade enabled)
- No mode / empty — defaults to `browser`

Expose mode via `GET /api/bios/info` response so UI can conditionally render.

**Server-side enforcement:** The upgrade endpoint returns `403 Forbidden` when `mode: desktop`, not just hidden in UI.

### 2. Preflight: client-side zip parsing + server lookup

**No upload needed for preflight.** The UI parses `app.yaml` from the zip client-side using JSZip, then checks installed status via an existing or lightweight endpoint.

**UI-side (JSZip):** Extract and parse `app.yaml` from the zip in the browser. This gives name, version, exec, args, port, etc. without uploading the full zip (which could be 50-100MB with binary + frontend).

**Server-side:** `GET /api/bios/apps/{name}` — returns installed status for a given app (version, state). If 404, app is not installed. This may already exist; if not, it's a trivial addition.

**Combined result for the wizard:**

```json
{
  "name": "rubix",
  "version": "1.3.0",
  "exec": "./rubix",
  "installed": true,
  "installed_version": "1.2.0",
  "installed_state": "running"
}
```

This avoids uploading the zip twice and keeps Pi devices with limited bandwidth happy. The zip is only uploaded once, for the actual install/upgrade.

### 3. Bios backend: `Upgrade` installer function (stage-and-swap)

**File:** `bios/pkg/app_plugin/installer.go` — new function:

```go
func Upgrade(appsDir string, data []byte, manifest *AppManifest, keep []string) (config.AppConfig, error)
```

**Stage-and-swap algorithm** (not extract-over-existing):

1. Extract zip into a fresh staging directory: `apps/{name}.upgrade-new/`
2. Copy kept paths from the **live** directory into the staging directory:
   - `"db"` → `db/` directory
   - `"config"` → `server.yaml` only (**not** `app.yaml` — see below)
   - `"logs"` → `logs/`
3. Validate staging dir: binary exists, is executable, `app.yaml` is valid
4. Atomic swap: `rename(apps/{name}, apps/{name}.upgrade-old)` then `rename(apps/{name}.upgrade-new, apps/{name})`
5. On success: remove `apps/{name}.upgrade-old/`
6. On any failure: reverse the rename (restore old), remove staging dir

**Why `app.yaml` always comes from the new package:** `app.yaml` is the release manifest — it defines exec path, args, port, health URL, version. Keeping the old one means the new binary runs with stale metadata. Only `server.yaml` (user-edited config) should be preserved.

### 4. Bios backend: upgrade endpoint + async worker

**File:** `bios/server/handlers_install.go` — add:

- `handleAppUpgrade` — `POST /api/bios/apps/{name}/upgrade?keep=db,config`
  - Returns `403` if `mode: desktop`
  - Requires app to exist (404 if not)
  - Accepts zip body (same format as install)
  - `keep` query param defaults to `db,config` (config = server.yaml only)
  - Acquires per-app lock via manager before proceeding (prevents races with concurrent start/stop/upgrade)
  - Returns job token for async polling

- `runUpgrade` — single rollback owner, async worker with stages:
  1. `stopping` — stop the running app via manager
  2. `staging` — extract zip into staging dir (`apps/{name}.upgrade-new/`)
  3. `validating` — check binary exists + is executable in staging dir
  4. `swapping` — atomic rename: live → old, staging → live
  5. `configuring` — update manager config from new `app.yaml`, persist to `bios-apps.json`
  6. `starting` — start the new version
  7. `health-check` — poll the app's health endpoint (from `app.yaml`) with a timeout (e.g. 30s). If healthy, proceed. If timeout expires, treat as start failure.
  8. On start/health failure: `rolling-back` — reverse rename (old → live), restart old version
  9. On success: clean up old dir

All rollback logic lives in `runUpgrade` — the installer function only does extraction, it does not manage rollback.

**File:** `bios/server/server.go` — wire new route:
```go
mux.Handle("POST /api/bios/apps/{name}/upgrade", s.withAuth(s.handleAppUpgrade))
```

### 5. Bios UI: upgrade wizard

**File:** `bios/ui/apps/apps.js`

**Mode awareness:** On page load, fetch `GET /api/bios/info`. If `mode === "desktop"`, hide the install bar entirely and show "Updates managed by desktop app".

**New flow** (replaces the current 409 error):

1. User drops/selects a zip file
2. UI parses `app.yaml` from the zip client-side (JSZip), then calls `GET /api/bios/apps/{name}` to check installed status
3. If not installed → proceed with normal install (`POST /api/bios/apps/install`)
4. If installed → show upgrade wizard:

**Wizard steps:**
1. **Review** — "rubix v1.2.0 is installed (running). This package contains v1.3.0. Upgrade?" If the package version is older than the installed version, show a downgrade warning.
2. **Preserve** — checkboxes: Database (checked by default), Server Config (checked by default), Logs (unchecked). Clear labels explaining what each preserves.
3. **Confirm** — "Upgrade will stop rubix, replace files, and restart. This may take a moment."
4. **Progress** — stage-by-stage feedback (stopping → staging → swapping → starting), reuses existing `pollJob` infrastructure
5. **Done** — "Upgraded rubix to v1.3.0" or failure message with rollback status

The zip is only uploaded once — for the actual install/upgrade. Preflight parsing is done client-side with JSZip.

### 6. Builder: extend existing packaging pipeline

**Do NOT add separate Makefile targets.** Instead, extend the existing `builder app package` command (in `cmd/builder/apps/package.go`, backed by `pkg/appbuilder/app.go`) which already knows how to produce bios-compatible zips.

The existing `--dir` flag already supports including directories. To package rubix with frontend:

```bash
# Build rubix + frontend first (existing targets)
make browser-linux EXCLUDE=bios,bacnet,desktop

# Package using existing builder command
builder app package \
  --name rubix \
  --version 1.3.0 \
  --arch amd64 \
  --binary bin/rubix \
  --dir frontend/dist/client \
  --file config/server.yaml \
  --port 9000 \
  --health "http://localhost:9000/healthz" \
  --args "--addr,:9000,--server-config,server.yaml"
```

If the `--dir` flag doesn't preserve nested paths (`frontend/dist/client` needs to land at that path in the zip, not just `client/`), fix `PackageApp` to support `--dir src:dst` mapping. This is a small change to the existing pipeline, not a parallel one.

Add a convenience Makefile target that just wraps the above:

```makefile
rubix-package: build
	@$(BIN) app package --name rubix --version $(VERSION) ...
```

### 7. Biosclient: `Upgrade` method

**File:** `rubix-sdk/pkg/biosclient/apps.go` — new method:

```go
func (c *AppsClient) Upgrade(name, zipPath, keep string) (*InstallResponse, error)
```

- `Upgrade` — POSTs zip to `/api/bios/apps/{name}/upgrade?keep={keep}`, returns job token

---

## Files to modify

| Repo | File | Change |
|------|------|--------|
| bios | `config/config.go` | Add `Mode` field |
| bios | `pkg/app_plugin/installer.go` | Add `Upgrade()` with stage-and-swap |
| bios | `server/handlers_install.go` | Add `handleAppUpgrade`, `runUpgrade` (with health check stage) |
| bios | `server/server.go` | Wire upgrade route |
| bios | `server/handlers_system.go` | Include `mode` in info response |
| bios | `ui/apps/apps.js` | Upgrade wizard + mode check |
| rubix | `desktop/scripts/bios.yaml` | Add `mode: desktop` |
| rubix-sdk | `pkg/appbuilder/app.go` | Fix `--dir` to support nested path mapping if needed |
| rubix-sdk | `cmd/builder/Makefile` | Add `rubix-package` convenience target |
| rubix-sdk | `pkg/biosclient/apps.go` | Add `Upgrade()` method |

---

## Concurrency & safety

- **Per-app locking:** The manager already has per-app `sync.RWMutex`. The upgrade handler acquires the write lock before stopping, holds it through swap, releases after start. This prevents races with concurrent start/stop/upgrade/install.
- **Single rollback owner:** Only `runUpgrade` manages rollback. The installer function (`Upgrade`) is pure extraction — it doesn't touch the live directory or manage process state.
- **Desktop enforcement:** Server-side 403, not just UI-hidden. Prevents CLI/API upgrades on desktop builds too.

---

## Out of scope

- **Cloud deployments:** Cloud uses CI/CD or manual deployment to update nginx-served frontend and rubix binary independently. No bios involved. The existing `builder app package` command can produce artifacts for this.
- **Auto-update / version checking:** Future work. This plan covers manual upload only.
- **Frontend-only updates:** The upgrade flow always replaces the full app (binary + frontend + configs). If a user only changed frontend code, they still upload a full package. This keeps the flow simple and version-consistent.

---

## Verification

1. **Package:** `builder app package` with `--dir frontend/dist/client` produces valid zip with app.yaml + binary + frontend
2. **Preflight:** drop zip in UI → client-side JSZip parses `app.yaml`, server lookup returns installed status
3. **Fresh install:** upload zip via bios UI → installs and starts normally
4. **Upgrade:** upload new zip for existing app → wizard shows versions → preserves db + server.yaml → stage-and-swap → restarts with new version
5. **Health check:** new version starts but health endpoint never responds → auto-rollback triggered after timeout
6. **Rollback:** upload zip with broken binary → auto-rollback via rename, old version restored and restarted
6. **Keep behavior:** `keep=db,config` preserves `db/` and `server.yaml` but uses new `app.yaml` from package
7. **Desktop enforcement:** bios.yaml `mode: desktop` → upgrade endpoint returns 403, UI hides install bar
8. **Browser mode:** bios.yaml `mode: browser` (or absent) → upgrade wizard visible and functional
9. **Concurrency:** two concurrent upgrade requests for same app → second is rejected (lock held)
