# Scripts Directory

This directory contains utility scripts for managing the rubix-sdk and rubix-proto repositories.

## Files

### sdk-version.sh
Main version management script that handles:
- Switching between local and released versions for SDK and Proto
- Creating releases with automatic changelog updates
- Managing go.mod dependencies in the main rubix repository
- Initializing CHANGELOG.md for new repositories

See [SDK_VERSION_MANAGEMENT.md](../SDK_VERSION_MANAGEMENT.md) for detailed usage.

### path.yaml (User Configuration)
Optional configuration file for customizing repository paths. This file is gitignored.

**Setup:**
```bash
cp path-example.yaml path.yaml
# Edit path.yaml with your custom paths
```

**Format:**
```yaml
sdk_path: /home/user/code/go/nube/rubix-sdk
proto_path: /home/user/code/go/nube/rubix-proto
rubix_path: /home/user/code/go/nube/rubix
```

**Features:**
- Supports absolute paths
- Supports tilde (`~`) for home directory
- Falls back to defaults if file doesn't exist
- Check current paths with: `make paths` or `./scripts/sdk-version.sh paths`

### path-example.yaml (Template)
Example configuration file showing the default paths and documentation. Copy this to `path.yaml` and customize for your setup.

## Quick Commands

```bash
# Show configured paths
make paths

# Check version status
make sdk-status          # SDK only
make proto-status        # Proto only
./scripts/sdk-version.sh status  # Both

# Switch to local development
make sdk-switch
make proto-switch

# Create releases
make sdk-release-patch
make proto-release-minor

# Initialize proto changelog (first time only)
make proto-init
```

## Path Configuration Examples

### Example 1: Different Home Directory
```yaml
sdk_path: ~/projects/nube/rubix-sdk
proto_path: ~/projects/nube/rubix-proto
rubix_path: ~/projects/nube/rubix
```

### Example 2: Different Organization
```yaml
sdk_path: /opt/nubeio/rubix-sdk
proto_path: /opt/nubeio/rubix-proto
rubix_path: /opt/nubeio/rubix
```

### Example 3: Docker/Container Setup
```yaml
sdk_path: /workspace/rubix-sdk
proto_path: /workspace/rubix-proto
rubix_path: /workspace/rubix
```

## Troubleshooting

### Paths not being recognized
1. Verify `path.yaml` exists: `ls -la scripts/path.yaml`
2. Check YAML syntax (no tabs, proper spacing)
3. Verify paths exist: `ls -la /your/custom/path`
4. View current configuration: `make paths`

### Want to reset to defaults
Simply delete or rename `path.yaml`:
```bash
mv scripts/path.yaml scripts/path.yaml.old
# The script will now use default paths
```
