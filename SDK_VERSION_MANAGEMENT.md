# SDK Version Management

Automated workflow for managing rubix-sdk versions between local development and releases.

## Quick Reference

```bash
make sdk-status          # Check current SDK version and mode
make sdk-switch          # Switch to local SDK (for development)
make sdk-unswitch        # Switch back to released version
make sdk-release-patch   # Release v0.0.1 → v0.0.2
make sdk-release-minor   # Release v0.0.1 → v0.1.0
make sdk-release-major   # Release v0.0.1 → v1.0.0
```

## Typical Workflow

### 1. Start Local Development

```bash
cd /home/user/code/go/nube/rubix-sdk
make sdk-switch
```

This will:
- Save the current released version
- Add `replace` directive to `/home/user/code/go/nube/rubix/go.mod`
- Point rubix to use local SDK for testing

### 2. Make Changes

Edit SDK code and test in rubix:

```bash
# Your changes in rubix-sdk are immediately available in rubix
cd /home/user/code/go/nube/rubix
go run ./cmd/rubix
```

### 3. Create Release

When ready to release:

```bash
cd /home/user/code/go/nube/rubix-sdk
make sdk-release-patch   # or minor/major
```

This will automatically:
1. ✅ Update `CHANGELOG.md` with new version section
2. ✅ Commit the changelog
3. ✅ Create and push git tag
4. ✅ Create GitHub release with changelog notes
5. ✅ Update `/home/user/code/go/nube/rubix/go.mod` to use new version
6. ✅ Run `go mod tidy` in rubix

### 4. Return to Released Version

If you were using local SDK and want to switch back:

```bash
make sdk-unswitch
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

## Status Check

Check what version you're using:

```bash
make sdk-status
```

**Example Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SDK Version Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SDK Latest Tag:     v0.0.1
Rubix SDK Version:  v0.0.1
Mode:               RELEASED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Or when using local:
```
Mode:               LOCAL (using replace directive)
Saved Version:      v0.0.1
```

## Behind the Scenes

### Files Managed
- `/home/user/code/go/nube/rubix-sdk/.sdk-state` - Tracks saved version
- `/home/user/code/go/nube/rubix/go.mod` - Updated automatically
- `/home/user/code/go/nube/rubix-sdk/CHANGELOG.md` - Version entries added

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

## Manual Control

You can also use the script directly:

```bash
./scripts/sdk-version.sh status
./scripts/sdk-version.sh switch
./scripts/sdk-version.sh unswitch
./scripts/sdk-version.sh release patch
```
