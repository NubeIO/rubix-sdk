# SDK and Proto Version Management

Automated workflow for managing rubix-sdk and rubix-proto versions between local development and releases.

## Quick Reference

### SDK Management
```bash
make sdk-status          # Check current SDK version and mode
make sdk-switch          # Switch to local SDK (for development)
make sdk-unswitch        # Switch back to released version
make sdk-release-patch   # Release v0.0.1 → v0.0.2
make sdk-release-minor   # Release v0.0.1 → v0.1.0
make sdk-release-major   # Release v0.0.1 → v1.0.0
```

### Proto Management
```bash
make proto-status          # Check proto version
make proto-switch          # Switch to local proto
make proto-unswitch        # Switch back to released proto
make proto-release-patch   # Release proto v0.0.1 → v0.0.2
make proto-release-minor   # Release proto v0.0.1 → v0.1.0
make proto-release-major   # Release proto v0.0.1 → v1.0.0
make proto-init            # Initialize Proto CHANGELOG.md
```

Or use the script directly:
```bash
./scripts/sdk-version.sh status --repo=proto          # Check proto version
./scripts/sdk-version.sh switch --repo=proto          # Switch to local proto
./scripts/sdk-version.sh unswitch --repo=proto        # Switch back to released proto
./scripts/sdk-version.sh release patch --repo=proto   # Release proto v0.0.1 → v0.0.2
./scripts/sdk-version.sh release minor --repo=proto   # Release proto v0.0.1 → v0.1.0
./scripts/sdk-version.sh release major --repo=proto   # Release proto v0.0.1 → v1.0.0
```

### Combined Status
```bash
./scripts/sdk-version.sh status                       # Show status for both SDK and proto
```

### Path Configuration
```bash
make paths                                            # Show configured repository paths
cp scripts/path-example.yaml scripts/path.yaml        # Create custom path config
```

## Repository Paths

### Default Paths

- **SDK**: `/home/user/code/go/nube/rubix-sdk`
- **Proto**: `/home/user/code/go/nube/rubix-proto`
- **Rubix**: `/home/user/code/go/nube/rubix`

### Custom Path Configuration

You can customize the repository paths by creating a `scripts/path.yaml` file:

```bash
# Copy the example config
cp scripts/path-example.yaml scripts/path.yaml

# Edit the paths to match your setup
vim scripts/path.yaml
```

Example `path.yaml`:
```yaml
sdk_path: /home/user/code/go/nube/rubix-sdk
proto_path: /home/user/code/go/nube/rubix-proto
rubix_path: /home/user/code/go/nube/rubix
```

**Note**: `path.yaml` is gitignored, so your local configuration won't be committed.

## Typical Workflow

### 1. Start Local Development

#### For SDK:
```bash
cd /home/user/code/go/nube/rubix-sdk
make sdk-switch
```

#### For Proto:
```bash
cd /home/user/code/go/nube/rubix-sdk
make proto-switch
```

This will:
- Save the current released version
- Add `replace` directive to `/home/user/code/go/nube/rubix/go.mod`
- Point rubix to use local repository for testing

### 2. Make Changes

Edit SDK code and test in rubix:

```bash
# Your changes in rubix-sdk are immediately available in rubix
cd /home/user/code/go/nube/rubix
go run ./cmd/rubix
```

### 3. Create Release

When ready to release:

#### For SDK:
```bash
cd /home/user/code/go/nube/rubix-sdk
make sdk-release-patch   # or minor/major
```

#### For Proto:
```bash
cd /home/user/code/go/nube/rubix-sdk
make proto-release-patch   # or proto-release-minor/proto-release-major
```

This will automatically:
1. ✅ Update `CHANGELOG.md` with new version section (creates if doesn't exist)
2. ✅ Commit the changelog
3. ✅ Create and push git tag
4. ✅ Create GitHub release with changelog notes
5. ✅ Update `/home/user/code/go/nube/rubix/go.mod` to use new version
6. ✅ Run `go mod tidy` in rubix

### 4. Return to Released Version

If you were using local repository and want to switch back:

#### For SDK:
```bash
make sdk-unswitch
```

#### For Proto:
```bash
make proto-unswitch
```

This restores the previous released version.

## Version Bumping

### Patch (v0.0.1 → v0.0.2)
Bug fixes, small changes
```bash
make sdk-release-patch
```

### Minor (v0.0.1 → v0.1.0)
New features, backwards compatible
```bash
make sdk-release-minor
```

### Major (v0.0.1 → v1.0.0)
Breaking changes
```bash
make sdk-release-major
```

## Proto-Specific Features

### Building/Releasing Proto Files

The proto repository contains the protobuf definitions. When working with proto:

1. **Initialize CHANGELOG** (first time only):
   ```bash
   make proto-init
   ```

2. **Local Development**:
   ```bash
   # Switch to local proto for testing changes
   make proto-switch

   # Make your proto changes
   cd /home/user/code/go/nube/rubix-proto
   make generate  # or your proto build command

   # Test in rubix - it will use local proto
   cd /home/user/code/go/nube/rubix
   go run ./cmd/rubix
   ```

3. **Release Proto Version**:
   ```bash
   make proto-release-patch  # or proto-release-minor/proto-release-major
   ```

## Status Check

### Check SDK Status:
```bash
make sdk-status
```

### Check Proto Status:
```bash
make proto-status
```

### Check Both:
```bash
./scripts/sdk-version.sh status
# or
./scripts/sdk-version.sh status --repo=all
```

**Example Output (for both):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Version Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SDK Latest Tag:     v0.0.1
Rubix SDK Version:  v0.0.1
Mode:               RELEASED

---

PROTO Latest Tag:     v0.0.0
Rubix PROTO Version:  Not in go.mod
Mode:                 RELEASED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Or when using local:
```
Mode:               LOCAL (using replace directive)
Saved Version:      v0.0.1
```

## Script Options

The `sdk-version.sh` script supports the following options:

### Repository Selection
- `--repo=sdk` or `-r sdk` - Target SDK repository (default)
- `--repo=proto` or `-r proto` - Target Proto repository
- `--repo=all` or `-r all` - Target both repositories (status and switch commands only)

### Commands
- `switch` - Switch to local development
- `unswitch` - Switch back to released version
- `release [type]` - Create new release (patch/minor/major)
- `status` - Show version status
- `init-changelog` - Initialize CHANGELOG.md

## Behind the Scenes

### Files Managed

#### SDK:
- `/home/user/code/go/nube/rubix-sdk/.sdk-state` - Tracks saved SDK version
- `/home/user/code/go/nube/rubix-sdk/CHANGELOG.md` - SDK version entries

#### Proto:
- `/home/user/code/go/nube/rubix-proto/.proto-state` - Tracks saved Proto version
- `/home/user/code/go/nube/rubix-proto/CHANGELOG.md` - Proto version entries

#### Shared:
- `/home/user/code/go/nube/rubix/go.mod` - Updated automatically for both repos

### Git Configuration
The script uses the global git configuration for private repos:
```bash
git config --global url."https://TOKEN@github.com/NubeIO/".insteadOf "https://github.com/NubeIO/"
```

## Troubleshooting

### "Already using local SDK"
You're already switched to local. Run `make sdk-unswitch` first if you want to re-switch.

### "Working directory is not clean"
Commit or stash changes before creating a release:
```bash
git status
git add .
git commit -m "Your changes"
```

### Release fails with authentication error
Ensure `gh` CLI is authenticated:
```bash
gh auth status
gh auth login
```

### Path configuration not working
If your custom paths aren't being recognized:
1. Ensure `scripts/path.yaml` exists (copy from `scripts/path-example.yaml`)
2. Check the YAML syntax is correct (no extra spaces or tabs)
3. Use absolute paths or `~` for home directory
4. Verify paths exist:
   ```bash
   ls -la /your/custom/path
   ```

## Manual Control

You can also use the script directly with full options:

### SDK Control:
```bash
./scripts/sdk-version.sh status --repo=sdk
./scripts/sdk-version.sh switch --repo=sdk
./scripts/sdk-version.sh unswitch --repo=sdk
./scripts/sdk-version.sh release patch --repo=sdk
```

### Proto Control:
```bash
./scripts/sdk-version.sh status --repo=proto
./scripts/sdk-version.sh switch --repo=proto
./scripts/sdk-version.sh unswitch --repo=proto
./scripts/sdk-version.sh release minor --repo=proto
./scripts/sdk-version.sh init-changelog --repo=proto
```

### Combined:
```bash
./scripts/sdk-version.sh status                    # Show both
./scripts/sdk-version.sh switch --repo=all         # Switch both to local
./scripts/sdk-version.sh unswitch --repo=all       # Switch both to released
```
