# Rubix SDK

Software Development Kit for building Rubix plugins and extensions.

## Overview

The Rubix SDK provides the core libraries, tools, and frameworks needed to build plugins for the Rubix platform. It includes both backend (Go) and frontend (React/TypeScript) SDKs, protocol buffer definitions, NATS messaging infrastructure, and development utilities.

## What is this repository for?

This repository serves as the **central SDK** for Rubix plugin development. It provides:

- **Plugin Framework**: Core abstractions for building Rubix plugins with nodes, settings, and lifecycle management
- **Frontend SDK**: React components, hooks, and utilities for building plugin UIs
- **Communication Layer**: NATS-based messaging for plugin-to-platform communication
- **Protocol Definitions**: Protobuf specifications for plugin communication
- **Development Tools**: Generators, bootstrapping utilities, and testing frameworks
- **Reference Implementation**: Example plugins demonstrating SDK usage

## Repository Structure

### Core SDK (`/`)

#### `bootstrap/`
Plugin bootstrapping utilities and initialization code. Provides scaffolding for new plugin projects.

#### `cmd/`
Command-line tools and utilities.

- **`fake-plugin-generator/`**: Code generator for creating plugin scaffolding and boilerplate

#### `converters/`
Protocol buffer converters and transformers for translating between proto messages and Go structs.

#### `frontend-sdk/`
**Frontend SDK for plugin UIs** - React/TypeScript library for building plugin interfaces.

**Contains:**
- React components (`components/`) - Reusable UI components for plugin development
- Common utilities (`common/`) - Shared frontend logic and helpers
- Plugin client (`plugin-client/`) - Client library for communicating with plugin backend
- RAS integration (`ras/`) - REST API Schema integration utilities
- Settings management (`settings/`) - Plugin settings UI components
- Type definitions (`types/`) - TypeScript type definitions
- Styles and themes (`styles/`, `globals.css`)

**Tech Stack:** React, TypeScript, Vite, Vitest

#### `models/`
Go data models and structures used throughout the SDK. Includes domain models for nodes, plugins, settings, and other core entities.

#### `natslib/`
NATS messaging library providing pub/sub, request/reply, and streaming capabilities for plugin communication.

#### `natssubject/`
NATS subject naming conventions and builders. Defines standardized subject patterns for plugin messaging.

#### `nodedeps/`
Node dependency management - handles dependencies between plugin nodes and ensures proper initialization order.

#### `nodehooks/`
Node lifecycle hooks and event handlers. Allows plugins to hook into node lifecycle events (create, update, delete, etc.).

#### `plugin/`
Core plugin interface definitions and base implementations. Defines what makes a Rubix plugin.

#### `pluginnode/`
Plugin node abstractions and base types. Provides the foundation for building custom node types in plugins.

#### `proto/`
Protocol buffer definitions for plugin communication.

**Generated code:**
- `proto/go/` - Generated Go code from protobuf definitions
- `proto/go/plugin/v1/` - Plugin protocol v1 (lifecycle, RPC envelopes)
- `proto/go/websocket/v1/` - WebSocket protocol definitions

**Source:** Protocol definitions are maintained in [`rubix-proto`](https://github.com/NubeIO/rubix-proto)

#### `scripts/`
Build scripts, version management, and development utilities.

**Key Scripts:**
- `sdk-version.sh` - SDK and proto version management (switch, release, status)
- `path.yaml` - Repository path configuration

See [scripts/README.md](scripts/README.md) for detailed documentation.

#### `widgetsettings/`
Widget settings schema and validation. Defines how plugin widgets declare and validate their configuration.

### Example Plugin

#### `nube.plm/`
**Product Lifecycle Management (PLM) Plugin** - Reference implementation demonstrating SDK usage.

**Features:**
- Product management nodes
- Multi-level settings
- Frontend UI with React
- Database integration
- Widget implementations

This serves as both a real plugin and a comprehensive example for SDK usage.

## Version Management

The SDK uses automated version management with integration to the main Rubix repository.

### Quick Commands

```bash
# Check version status
make sdk-status

# Local development (use local SDK in rubix)
make sdk-switch

# Release new version
make sdk-release-patch   # v0.0.1 → v0.0.2
make sdk-release-minor   # v0.0.1 → v0.1.0
make sdk-release-major   # v0.0.1 → v1.0.0

# Return to released version
make sdk-unswitch

# Show configured paths
make paths
```

See [SDK_VERSION_MANAGEMENT.md](SDK_VERSION_MANAGEMENT.md) for detailed workflow documentation.

## Branch Management

Create synchronized branches across SDK, Proto, and Rubix repositories:

```bash
# Create branch in SDK only
make new-branch BRANCH=feature-name

# Create branch in SDK + Proto
make new-branch BRANCH=feature-name PROTO=yes

# Create branch in SDK + Rubix
make new-branch BRANCH=feature-name RUBIX=yes

# Create branch in all repositories
make new-branch BRANCH=feature-name PROTO=yes RUBIX=yes
```

## Development Workflow

### 1. Setup Local Development

```bash
# Clone the repository
git clone https://github.com/NubeIO/rubix-sdk
cd rubix-sdk

# Switch rubix to use local SDK
make sdk-switch
```

### 2. Make Changes

Edit SDK code - changes are immediately available in rubix:

```bash
# Edit SDK files
vim models/node.go
vim frontend-sdk/components/MyComponent.tsx

# Test in rubix
cd /home/user/code/go/nube/rubix
go run ./cmd/rubix
```

### 3. Frontend Development

```bash
cd frontend-sdk

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build
```

### 4. Create Release

```bash
# From rubix-sdk directory
make sdk-release-patch   # Creates v0.0.2 from v0.0.1

# This automatically:
# - Updates CHANGELOG.md
# - Creates git tag
# - Pushes to GitHub
# - Creates GitHub release
# - Updates rubix go.mod
```

## Dependencies

### Backend (Go)
- Go 1.24.6+
- NATS (messaging)
- Protocol Buffers (gRPC/proto3)
- Zerolog (logging)

### Frontend (TypeScript/React)
- Node.js 18+
- pnpm (package manager)
- React 18+
- TypeScript 5+
- Vite (build tool)
- Vitest (testing)

## Testing

### Backend Tests
```bash
make test
```

### Frontend Tests
```bash
cd frontend-sdk
pnpm test
```

## Related Repositories

- **[rubix](https://github.com/NubeIO/rubix)** - Main Rubix platform
- **[rubix-proto](https://github.com/NubeIO/rubix-proto)** - Protocol buffer definitions
- **[rubix-plugin](https://github.com/NubeIO/rubix-plugin)** - Plugin template (deprecated, use this SDK)

## Documentation

- [SDK Version Management](SDK_VERSION_MANAGEMENT.md) - Version control and release workflow
- [Scripts Documentation](scripts/README.md) - Build scripts and utilities
- [Frontend SDK README](frontend-sdk/README.md) - Frontend SDK documentation
- [PLM Plugin README](nube.plm/README.md) - Example plugin documentation

## Contributing

1. Create a feature branch: `make new-branch BRANCH=feature-name`
2. Make your changes
3. Test thoroughly (both backend and frontend)
4. Create a pull request to `master`

## License

Copyright © 2026 NubeIO

## Support

- **Issues**: [GitHub Issues](https://github.com/NubeIO/rubix-sdk/issues)
- **Documentation**: See `/docs` directory (coming soon)
- **Examples**: See `nube.plm/` for a complete plugin implementation
