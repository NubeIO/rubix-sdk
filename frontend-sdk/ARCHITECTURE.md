# Frontend SDK Architecture

## Overview

The Rubix Frontend SDK provides shared UI components and utilities for **both Rubix and plugins**.

## Structure

```
@rubix-sdk/frontend/
├── common/                    # Shared UI primitives (used by BOTH rubix and plugins)
│   ├── ui/                   # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── popover.tsx
│   │   ├── badge.tsx
│   │   └── skeleton.tsx
│   └── utils/
│       └── utils.ts          # cn() utility
│
├── settings/                  # Plugin SDK (for multi-schema settings)
│   ├── components/
│   │   └── schema-selector.tsx
│   └── hooks/
│       └── use-multi-schema.ts
│
├── plugin-client/            # Plugin API client
├── ras/                      # RAS API client
└── globals.css              # Global styles
```

## Usage Patterns

### 1. Rubix Frontend

Rubix imports common UI components from the SDK:

```tsx
// In Rubix
import { Button, Card, Dialog } from '@rubix-sdk/frontend/common/ui';
import { cn } from '@rubix-sdk/frontend/common/utils';
```

**Benefits:**
- Single source of truth for UI components
- Consistent styling with plugins
- Easy updates (update SDK, all apps get new version)

### 2. Plugins

Plugins use **both** common UI and settings SDK:

```tsx
// In PLM Plugin
import { Button, Dialog } from '@rubix-sdk/frontend/common/ui';
import { SchemaSelector, useMultiSchema } from '@rubix-sdk/frontend/settings';

function ProductSettings() {
  const { schemas, selectSchema } = useMultiSchema({
    schemas: [
      { name: 'hardware', displayName: 'Hardware Product' },
      { name: 'software', displayName: 'Software Product' }
    ]
  });

  return (
    <Dialog>
      <SchemaSelector schemas={schemas} onSelect={selectSchema} />
      <Button>Save</Button>
    </Dialog>
  );
}
```

**Benefits:**
- Same UI components as Rubix (perfect consistency)
- Reusable settings logic (no need to reimplement multi-schema)
- Lightweight and framework-agnostic

## Design Philosophy

### ✅ What IS in the SDK

**Common UI (common/):**
- shadcn/ui primitives (Button, Card, Input, etc.)
- Basic utilities (cn)
- **Reason:** Shared by both Rubix and plugins

**Settings SDK (settings/):**
- Schema selection UI (`SchemaSelector`)
- Multi-schema hook (`useMultiSchema`)
- **Reason:** Reusable across all plugins with multi-schema support

### ❌ What is NOT in the SDK

**Rubix-specific code:**
- Node-specific components (IconPicker, NodeSettingsForm)
- Rubix API client imports (rasClient, nodeKeys, sidebarKeys)
- Features tied to Rubix internals

**Why:** These are tightly coupled to Rubix and would create circular dependencies.

## Dependency Flow

```
rubix/frontend  ────┐
                    ├───→  @rubix-sdk/frontend/common  (shadcn/ui)
plugins         ────┘
                    │
                    └───→  @rubix-sdk/frontend/settings  (multi-schema SDK)
```

## Key Decisions

### 1. Nested Structure: `common/` inside `frontend-sdk/`

**Why:** Pragmatic approach - only Rubix uses common UI today, but structure allows plugins to adopt later.

### 2. Separate `common/` and `settings/`

**Why:**
- `common/` = Pure UI (no business logic)
- `settings/` = Reusable plugin patterns (multi-schema support)

### 3. Generic, Not Rubix-Specific

**Why:** The SDK should work in **any** plugin, not just Rubix plugins. This means:
- No imports from `@/lib/ras-client`
- No dependencies on Rubix hooks (nodeKeys, sidebarKeys)
- Clean, standalone components

## Migration Path

### Phase 1: SDK Setup ✅ (COMPLETE)
- Created `common/ui/` with shadcn components
- Created `settings/` with multi-schema support
- Updated package.json with proper exports
- Built and verified SDK

### Phase 2: Rubix Migration (TODO)
- Update Rubix to import from SDK:
  ```diff
  - import { Button } from '@/components/ui/button';
  + import { Button } from '@rubix-sdk/frontend/common/ui';
  ```

### Phase 3: Plugin Adoption (TODO)
- Update PLM plugin to use SDK:
  ```tsx
  import { SchemaSelector } from '@rubix-sdk/frontend/settings';
  ```

## Future Enhancements

**Potential additions:**
- More shadcn components (Table, Tabs, Accordion)
- Form utilities (useForm wrappers)
- Additional hooks (useDebounce, useFetch)

**NOT planned:**
- Rubix-specific features (keep those in Rubix)
- Heavy frameworks (keep SDK lightweight)
