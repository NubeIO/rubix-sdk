# Session: Bios Upgrade Wizard + Cloud Frontend Deploy

Date: 2026-04-09

## What was built

Upgrade endpoint + wizard UI for bios so users can upload a new rubix zip and bios handles: stop, swap files, restart, deploy frontend to nginx.

## Bug: "ras path does not exist: configs" after upgrade

### Root cause

When the initial build is deployed to a cloud server via `scp -r`, symlinks are followed and copied as real directories. So on the cloud server:

- `apps/rubix/configs` is a **real directory** (not a symlink)
- `apps/rubix/frontend` is a **real directory** (not a symlink)

The original `preserveSymlinks()` function only looked for symlinks (`os.ModeSymlink`). Since `configs` was a real dir, it was skipped. The upgrade zip doesn't contain configs. After the swap, the new app dir had no configs. Rubix crashed.

### Fix

Replaced `preserveSymlinks()` with `carryOverMissing()` in `bios/pkg/app_plugin/installer.go`. This function:

1. Scans the OLD app directory top-level entries
2. For anything that does NOT already exist in the NEW staging dir:
   - Symlink: recreate it
   - Real directory: copy it
   - Real file: copy it

This handles both local builds (symlinks) and cloud deploys (real dirs copied by scp).

### How to verify the fix

1. Rebuild bios: `cd bios && make build`
2. Deploy new bios binary to cloud server
3. Upload rubix upgrade zip via bios UI
4. Rubix should start without the configs error
5. Check `apps/rubix/configs/` exists after upgrade

## Code locations

### Bios (process manager + upgrade backend)

| File | What |
|------|------|
| `bios/config/config.go` | Config struct: `Mode`, `FrontendDeployPath` |
| `bios/pkg/app_plugin/installer.go` | `Install()`, `Upgrade()` (stage-and-swap), `carryOverMissing()` |
| `bios/server/server.go` | Server struct, route wiring, `New()` accepts config |
| `bios/server/handlers_install.go` | `handleAppUpgrade`, `runUpgrade` (async worker with job stages) |
| `bios/server/handlers_config.go` | Frontend deploy path GET/PUT, deploy-frontend-now endpoint |
| `bios/server/handlers_health.go` | `/api/bios/info` — exposes `mode` |
| `bios/main.go` | Passes config to server |

### Bios UI (embedded in binary)

| File | What |
|------|------|
| `bios/ui/apps/apps.js` | Upgrade wizard: mode check, 409 detection, wizard steps, progress polling |
| `bios/ui/system.js` | Frontend deploy path settings (save, deploy now) |
| `bios/ui/app.js` | Calls `fetchBiosMode()` on startup |
| `bios/ui/index.html` | Cloud settings section in System tab |
| `bios/ui/style.css` | Upgrade wizard + frontend deploy CSS |
| `bios/ui/embed.go` | Go embed directive for all UI files |

### Rubix SDK (client + builder)

| File | What |
|------|------|
| `rubix-sdk/pkg/biosclient/apps.go` | `Upgrade()`, `UpgradeReader()` methods |
| `rubix-sdk/pkg/appbuilder/app.go` | `PackageApp()` — `--dir` uses `filepath.Base()` for zip path |
| `rubix-sdk/cmd/builder/Makefile` | `rubix-package` target |
| `rubix-sdk/cmd/builder/BUILD-CLOUD.md` | Cloud deployment guide |

## API endpoints added

| Method | Path | What |
|--------|------|------|
| POST | `/api/bios/apps/{name}/upgrade?keep=db,config` | Upload zip, run async upgrade |
| GET | `/api/bios/config/frontend-deploy-path` | Read nginx frontend path |
| PUT | `/api/bios/config/frontend-deploy-path` | Set nginx frontend path (persists to bios.yaml) |
| POST | `/api/bios/config/deploy-frontend` | Copy frontend to nginx path now |

The 409 response from `POST /api/bios/apps/install` was also enhanced to return `action: "upgrade_available"` with version info.

## Upgrade flow (stage-and-swap)

```
User drops zip → POST /install → 409 upgrade_available
    → UI shows wizard (version comparison, keep checkboxes)
    → User confirms → POST /apps/{name}/upgrade

Server async job stages:
    stopping → staging → configuring → starting → health-check → deploying-frontend → done

Stage-and-swap (installer.go Upgrade()):
    1. Extract zip → apps/{name}.upgrade-new/
    2. Copy kept paths (db/, server.yaml, logs/) from live dir
    3. Carry over missing entries (configs/, any other shared resource)
    4. Validate binary exists + executable
    5. Rename: live → .upgrade-old, staging → live
    6. On failure: reverse rename, restart old version
    7. On success: remove .upgrade-old
```

## Automated tests

File: `bios/pkg/app_plugin/installer_test.go`

| Test | What it verifies |
|------|-----------------|
| `TestUpgrade_CarryOverRealDirs` | Cloud scenario: configs/ is a real dir (scp'd), upgrade preserves it |
| `TestUpgrade_CarryOverSymlinks` | Local scenario: configs is a symlink, upgrade recreates it |

Run: `cd bios && go test -v ./pkg/app_plugin/`

Both pass.

## Testing checklist

### Build the upgrade zip

```bash
cd rubix-sdk/cmd/builder
make rubix-package VERSION=1.3.0
# Output: dist/rubix-1.3.0-amd64.zip
```

Verify contents:
```bash
unzip -l dist/rubix-1.3.0-amd64.zip | head -20
# Should contain: app.yaml, rubix (binary), server.yaml, frontend/dist/client/...
# Should NOT contain: configs/
```

### Test fresh install

1. Deploy full dist to server: `scp -r dist/browser-linux/* user@server:/opt/rubix/`
2. Start bios: `./start.sh`
3. Verify rubix is running: bios UI → Services tab

### Test upgrade

1. Open bios UI → Services tab
2. Drop `rubix-1.3.0-amd64.zip`
3. Should see: "rubix v(old) → v1.3.0" upgrade wizard
4. Check keep options (db, config checked by default)
5. Click Upgrade
6. Watch stages: stopping → staging → configuring → starting → done
7. Verify rubix is running with new version
8. Verify `apps/rubix/configs/` still exists after upgrade

### Test frontend deploy (cloud/nginx)

1. Bios UI → System tab → "Frontend Deploy (Cloud / nginx)"
2. Enter `/var/www/rubix-client` → Save
3. Click "Deploy Now" → should show file count
4. Do another upgrade → done message should show "Deployed X frontend files"

### Test desktop mode blocking

1. Set `mode: desktop` in bios.yaml
2. Restart bios
3. UI should show "Updates managed by desktop app" instead of upload bar
4. API: `POST /api/bios/apps/rubix/upgrade` should return 403

## Debugging

### Rubix crashes after upgrade

```bash
# Check if configs exists in app dir
ls -la /opt/rubix/apps/rubix/configs

# If missing, check if it exists at bios root
ls /opt/rubix/configs/

# Manual fix: recreate symlink
cd /opt/rubix/apps/rubix
ln -s ../../configs configs
```

### Upgrade zip contents wrong

```bash
unzip -l dist/rubix-1.3.0-amd64.zip | grep -E "^|configs|frontend|rubix|server|app.yaml"
```

### Check bios logs

Bios logs to stdout. Look for:
- `[rubix] auto-start failed` — binary or config issue
- `deployed X frontend files to /var/www/rubix-client` — frontend deploy worked
- `cleaning up leftover upgrade dir` — crash recovery on startup

### Check job status via API

```bash
# After starting an upgrade, poll the job:
curl -s http://server:8999/api/bios/jobs/{token} \
  -H "Authorization: Bearer <token>" | jq .
```

## bios.yaml config

```yaml
addr: ":8999"
mode: browser                              # "desktop" | "browser" (default)
frontend_deploy_path: /var/www/rubix-client  # auto-deploy frontend after upgrade
```
