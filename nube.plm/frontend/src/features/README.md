# PLM Features

This directory contains all **PLM domain features**, organized by business capability.

**Date Created**: 2026-03-25
**Architecture**: Feature-based organization (follows Rubix frontend pattern)

---

## 📁 Structure

```
features/
├── product/              ✅ IMPLEMENTED - Product catalog & lifecycle
├── task/                 🚧 READY - Tasks & time tracking
├── production-run/       🚧 PLACEHOLDER - Manufacturing runs
├── serialized-unit/      🚧 PLACEHOLDER - Individual units
├── site/                 🚧 PLACEHOLDER - Manufacturing sites
└── work-item/            🚧 PLACEHOLDER - Work orders
```

---

## 🎯 Design Principles

### 1. **Feature-Based Organization**
Each directory is a self-contained domain with its own:
- API clients (`api/`)
- React hooks (`hooks/`)
- TypeScript types (`types/`)
- Reusable components (`components/`)
- Full pages (`pages/`)
- Dashboard widgets (`widgets/`)
- Utilities (`utils/`)

### 2. **Clean Imports via Path Aliases**

```typescript
// ✅ CORRECT: Use @features/* path alias
import { Product } from '@features/product/types/product.types';
import { ProductsAPI } from '@features/product/api/product-api';
import { TaskList } from '@features/task/components/TaskList';

// ❌ WRONG: Relative paths across features
import { Product } from '../../product/types/product.types';
```

### 3. **Domain Independence**
- Each feature is self-contained
- Features can reference each other via clean imports
- Shared code lives in `src/shared/`
- No circular dependencies between features

---

## 📊 Feature Status

| Feature | Status | Description | Core Node Types |
|---------|--------|-------------|-----------------|
| **product** | ✅ **IMPLEMENTED** | Product catalog, BOM, lifecycle | `core.product`, `core.document` |
| **task** | 🚧 **READY** | Tasks, time tracking, timesheets | `core.ticket`, `core.entry` |
| **production-run** | 🚧 Placeholder | Manufacturing runs | `plm.manufacturing-run` |
| **serialized-unit** | 🚧 Placeholder | Individual produced units | `core.asset` |
| **site** | 🚧 Placeholder | Manufacturing sites/facilities | TBD |
| **work-item** | 🚧 Placeholder | Work orders (may merge with task) | `core.ticket` |

---

## 🚀 Adding a New Feature

When implementing a new feature domain:

### 1. Create Directory Structure

```bash
cd src/features
mkdir -p my-feature/{api,hooks,types,components,pages,widgets,utils}
```

### 2. Copy from Template

Use `product/` as reference implementation:
```bash
# Study the structure
ls -la product/

# Copy README template
cp product/README.md my-feature/README.md
```

### 3. Set Up Exports

Create `index.ts` files in each subdirectory:
```typescript
// my-feature/api/index.ts
export * from './my-feature-api';

// my-feature/components/index.ts
export * from './MyFeatureList';
export * from './MyFeatureCard';
```

### 4. Update Path Aliases (if needed)

If you need a dedicated path alias:
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@features/*": ["./src/features/*"],
      "@my-feature/*": ["./src/features/my-feature/*"]  // Optional
    }
  }
}
```

### 5. Build Components

Follow the standard structure:
- `api/` - API client classes
- `hooks/` - React hooks for data fetching
- `types/` - TypeScript interfaces
- `components/` - Reusable UI components
- `pages/` - Full-page views
- `widgets/` - Dashboard widgets

### 6. Add to Plugin Config

```json
// plugin.json
{
  "pages": [
    {
      "pageId": "my-feature-list",
      "title": "My Feature",
      "nodeTypes": ["my.feature.collection"],
      "props": {
        "exposedPath": "./MyFeatureListPage"
      }
    }
  ]
}

// vite.config.ts
{
  exposes: {
    './MyFeatureListPage': './src/features/my-feature/pages/MyFeatureListPage.tsx'
  }
}
```

---

## 🔗 Feature Relationships

### Product → Task
```typescript
// product/pages/product-tasks-tab.tsx
import { TaskList } from '@features/task/components/TaskList';

// Query tasks for this product
const tasks = await apiClient.get('/v1/nodes', {
  type: 'core.ticket',
  parentId: productId,
  identity: 'ticket,task'
});
```

### Product → BOM
```typescript
// product/pages/product-bom-tab.tsx
// BOM is core.document - no separate feature needed
const bomDocs = await apiClient.get('/v1/nodes', {
  type: 'core.document',
  parentId: productId,
  identity: 'document,source,bom'
});
```

### Task → Time Entries
```typescript
// task/components/TaskCard.tsx
import { TimeEntryForm } from './TimeEntryForm';

// Time entries are core.entry child nodes
const timeEntries = await apiClient.get('/v1/nodes', {
  type: 'core.entry',
  parentId: taskId,
  identity: 'entry,time'
});
```

---

## 📚 Key Resources

### Reference Implementation
- [product/README.md](./product/README.md) - Complete feature guide
- [task/README.md](./task/README.md) - Task & time tracking architecture

### Architecture Docs
- `/docs/system/v1/plm-plugin/V2-OVERVIEW.md` - Core node type mapping
- `/docs/system/v1/plm-plugin/VISION.md` - PLM vision & design

### Related Directories
- `src/shared/` - Cross-feature utilities
- `src/lib/` - Core libraries (API clients, utilities)
- `src/ui/` - UI component library

---

## ✅ Checklist for New Features

When adding a new feature:

- [ ] Create directory with subdirectories (api, hooks, types, components, pages, widgets, utils)
- [ ] Write comprehensive README.md
- [ ] Define TypeScript types
- [ ] Create API client
- [ ] Build React hooks
- [ ] Create reusable components
- [ ] Build pages (list, detail)
- [ ] Add dashboard widgets
- [ ] Update plugin.json
- [ ] Update vite.config.ts exposes
- [ ] Write tests
- [ ] Update this README

---

## 🎨 Naming Conventions

### Directories
- **Lowercase with hyphens**: `production-run/`, `serialized-unit/`
- **Singular for domain name**: `product/`, `task/` (not `products/`, `tasks/`)

### Files
- **PascalCase for components**: `ProductTable.tsx`, `TaskCard.tsx`
- **kebab-case for utilities**: `product-api.ts`, `time-calculations.ts`
- **Descriptive names**: `use-products.ts`, `product.types.ts`

### Types
- **PascalCase for interfaces**: `Product`, `Task`, `TimeEntry`
- **Descriptive suffixes**: `CreateProductInput`, `UpdateTaskInput`

### Imports
- **Use path aliases**: `@features/product/...`, `@shared/...`
- **Named exports preferred**: `import { Product } from '...'`
- **Avoid default exports** for components (easier to refactor)

---

## 🔐 Access Control

Features respect Rubix node permissions:
- **Read**: Can view if user has read access to parent node
- **Create**: Can create if user has write access to parent
- **Update**: Can edit if user has write access to node
- **Delete**: Can delete if user has write access to node

Time entries have special rules:
- Only the user who logged time can edit/delete their entries
- Task assignee can view all time entries on their tasks

---

**Questions?** See individual feature READMEs for detailed implementation guides.
