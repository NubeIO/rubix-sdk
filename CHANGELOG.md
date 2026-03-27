# rubix-plugin Changelog


## v0.0.6 - 2026-03-27

### Added
- 

### Changed
- 

### Fixed
- 

---


## v0.0.5 - 2026-03-27

### Added
- 

### Changed
- 

### Fixed
- 

---


## v0.0.4 - 2026-03-25

### Added
- 

### Changed
- 

### Fixed
- 

---


## v0.0.3 - 2026-03-23

### Added
- 

### Changed
- 

### Fixed
- 

---


## v0.0.2 - 2026-03-21

### Added
- 

### Changed
- 

### Fixed
- 

---

## v0.0.1 - 2026-03-21

### Added
- **SDK Version Management Script** (`scripts/sdk-version.sh`)
  - Switch between local and released SDK versions
  - Automated release workflow with version bumping
  - Automatic CHANGELOG updates
  - GitHub release creation
  - Auto-update rubix go.mod after release

### Makefile Targets
- `make sdk-switch` - Switch rubix to use local SDK for development
- `make sdk-unswitch` - Switch back to released SDK version
- `make sdk-release-patch` - Create patch release (v0.0.1 → v0.0.2)
- `make sdk-release-minor` - Create minor release (v0.0.1 → v0.1.0)
- `make sdk-release-major` - Create major release (v0.0.1 → v1.0.0)
- `make sdk-status` - Show current SDK version status

### Workflow
1. Development: `make sdk-switch` to use local SDK
2. Test changes in rubix with local SDK
3. When ready to release: `make sdk-release-patch`
4. Script automatically:
   - Updates CHANGELOG
   - Creates git tag
   - Pushes to GitHub
   - Creates GitHub release
   - Updates rubix go.mod to new version

---

## 2026-03-20 - NATS Subject Builder

### Added
- **`natssubject/builder.go`** - Reusable subject builder for plugins
  - Copied from `rubix/internal/libs/natssubject`
  - Ensures consistent subject format across all plugins
  - Eliminates manual `fmt.Sprintf` for subject construction

- **`natslib/helpers.go`** - Convenience helper for plugins
  - `PluginClient` - combines NATS client + subject builder
  - `NewPluginClient()` - one-line setup for plugin NATS communication

- **`NATS_USAGE.md`** - Complete guide for plugin developers
  - How to use natslib + natssubject
  - Common operations (get node, query, update)
  - Best practices and anti-patterns
  - Hook context extraction example

### Benefits
- ✅ **Consistent subjects** - All plugins use same format
- ✅ **Less boilerplate** - No more `fmt.Sprintf` for subjects
- ✅ **Type safety** - Subject builder prevents typos
- ✅ **Easier maintenance** - Update format in one place

### Example Usage

**Before:**
```go
subject := fmt.Sprintf("rubix.v1.local.%s.%s.%s.nodes.get", orgID, deviceID, flowID)
```

**After:**
```go
sb := natssubject.NewBuilder("rubix.v1.local", orgID, deviceID, flowID)
subject := sb.Build("nodes", "get")
```

**Or with helper:**
```go
pc, _ := natslib.NewPluginClient(natsURL, "rubix.v1.local", orgID, deviceID, flowID)
subject := pc.Subject.Build("nodes", "get")
```

### Migration
Existing plugins (e.g., `nube.plm`) have been updated to use the subject builder.

---

## Previous Versions

### 2026-02-19 - Initial NATS Library
- `natslib/client.go` - Basic NATS wrapper
- `Connect()`, `Request()`, `Publish()`, `SubscribeMsg()`
