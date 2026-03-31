# Project Domain

This directory contains all code related to the **Project** domain, organized using a feature-based architecture.

**Date Refactored**: 2026-03-28
**Status**: ✅ Production Ready - V2 Architecture

---

## 📁 Directory Structure

```
project/
├── api/                          # API layer
│   ├── project-api.ts           # ProjectsAPI class (CRUD operations)
│   └── index.ts                 # Exports
├── hooks/                        # React hooks
│   ├── use-projects.ts          # Multiple projects hook
│   ├── use-project-schemas.ts   # Schema fetching hook
│   └── index.ts                 # Exports
├── types/                        # TypeScript types
│   ├── project.types.ts         # Project interfaces
│   └── index.ts                 # Exports
├── components/                   # Reusable components
│   ├── ProjectTable.tsx         # Project table component
│   ├── ProjectForm.tsx          # Project form fields
│   ├── ProjectStatusBadge.tsx   # Status badge
│   ├── create-project-dialog-sdk.tsx  # Create dialog
│   ├── edit-project-dialog-sdk.tsx    # Edit dialog
│   ├── delete-project-dialog-sdk.tsx  # Delete dialog
│   └── index.ts                 # Exports
├── pages/                        # Full-page views
│   ├── ProjectsListPage.tsx     # Main projects list (tabbed)
│   ├── ProjectDetailPageV2Entry.tsx # Project detail V2 (MF entry)
│   ├── projects-page-tabs.tsx   # Page tabs component
│   ├── projects-page-dialogs.tsx # Page dialogs
│   └── use-projects-page-state.ts # Page state hook
├── v2/                           # V2 Project Detail Page
│   ├── ProjectDetailPageV2.tsx  # Main V2 detail page
│   ├── components/              # V2-specific components
│   │   ├── ProjectHeader.tsx    # Project header
│   │   ├── SidebarNavigation.tsx # Sidebar navigation
│   │   ├── StatCard.tsx         # Statistics card
│   │   └── AddBOMItemDialog.tsx # BOM item dialog
│   ├── sections/                # V2 page sections
│   │   ├── OverviewSection.tsx  # Overview section
│   │   ├── BasicInfoSection.tsx # Basic info section
│   │   ├── PricingSection.tsx   # Pricing section
│   │   ├── SystemInfoSection.tsx # System info section
│   │   ├── BOMSectionV2.tsx     # BOM section
│   │   └── TasksSectionV2.tsx   # Tasks section
│   └── widgets/                 # V2 widgets
│       ├── QuickActions.tsx     # Quick actions widget
│       └── RecentTasks.tsx      # Recent tasks widget
├── widgets/                      # Dashboard widgets
│   └── ProjectTableWidget.tsx   # Project table widget
├── utils/                        # Utility functions
│   └── project-formatters.ts    # Formatting utilities
└── README.md                     # This file
```

---

## 🎯 Design Principles

### 1. **Domain-Driven Organization**
- All project-related code lives in `project/`
- Clear separation by concern (api, hooks, types, components, pages)
- Self-contained and independent

### 2. **Path Aliases**
Use clean imports via TypeScript path aliases:

```typescript
// ✅ Good
import { Project } from '@features/project/types/project.types';
import { ProjectsAPI } from '@features/project/api/project-api';
import { useProjects } from '@features/project/hooks/use-projects';

// ❌ Bad
import { Project } from '../../../project/types/project.types';
```

### 3. **Scalability**
This structure scales to 100s of files without confusion:
- Easy to find files (project API? → `project/api/`)
- No mixing of concerns
- Clear ownership boundaries

---

## 📝 Key Files

### API Layer (`api/`)

**`project-api.ts`** - ProjectsAPI class
- `queryProjects()` - Query all projects
- `getProject(id)` - Get single project
- `createProject(input)` - Create new project
- `updateProject(id, input)` - Update project
- `deleteProject(id)` - Delete project

### Hooks (`hooks/`)

**`use-projects.ts`** - Multiple projects management
- Fetches project list
- Provides CRUD operations
- Handles hierarchy (projects collection ID)
- Auto-refresh support

**`use-project-schemas.ts`** - Schema fetching
- Fetches project settings schemas
- Generates variant schemas (hardware/software)

### Types (`types/`)

**`project.types.ts`** - Core types
- `Project` - Project node interface
- `ProjectFormData` - Form data structure
- `ProjectStatus` - Status enum
- `CreateProjectInput`, `UpdateProjectInput` - API payloads

### Components (`components/`)

**Reusable Components:**
- `ProjectTable.tsx` - Table with edit/delete actions
- `ProjectForm.tsx` - Form fields component
- `ProjectStatusBadge.tsx` - Status badge

**Dialogs (SDK Version):**
- `create-project-dialog-sdk.tsx` - Create dialog
- `edit-project-dialog-sdk.tsx` - Edit dialog
- `delete-project-dialog-sdk.tsx` - Delete dialog

### Pages (`pages/`)

**`ProjectsListPage.tsx`** - Main entry point
- Full-page tabbed view (All/Software/Hardware)
- Create/Edit/Delete operations
- Module Federation export (`./Page`)

**`ProjectDetailPageV2Entry.tsx`** - Project detail V2 entry
- Module Federation mount/unmount wrapper
- Module Federation export (`./ProjectDetail`)
- Shows when clicking project node in tree
- Wraps the V2 ProjectDetailPageV2 component

### V2 Architecture (`v2/`)

**`ProjectDetailPageV2.tsx`** - Modern project detail page
- Sidebar navigation with section switching
- Lazy-loaded sections for performance
- Real-time project updates
- Integrated task and BOM management

**V2 Components:**
- Modern, responsive UI components
- Optimized for performance with lazy loading
- Consistent styling with shadcn/ui

### Widgets (`widgets/`)

**`ProjectTableWidget.tsx`** - Dashboard widget
- Embeddable project table
- Module Federation export (`./ProjectTableWidget`)

---

## 🚀 Usage Examples

### Import Project Types
```typescript
import { Project, ProjectStatus } from '@features/project/types/project.types';

const project: Project = {
  id: 'node_001',
  name: 'Widget Pro',
  type: 'plm.project',
  settings: {
    projectCode: 'WP-001',
    status: 'Production',
    price: 99.99
  }
};
```

### Use Projects Hook
```typescript
import { useProjects } from '@features/project/hooks/use-projects';

function MyComponent() {
  const { projects, loading, createProject, updateProject } = useProjects({
    orgId: 'org_001',
    deviceId: 'dev_001',
    baseUrl: '/api/v1',
    autoRefresh: true,
    refreshInterval: 30000
  });

  // Use projects...
}
```

### Use API Directly
```typescript
import { ProjectsAPI } from '@features/project/api/project-api';

const api = new ProjectsAPI({
  orgId: 'org_001',
  deviceId: 'dev_001',
  baseUrl: '/api/v1',
  token: 'auth_token'
});

const projects = await api.queryProjects();
```

---

## 🔄 Module Federation Exports

The following components are exposed via Module Federation:

| Export Name          | File                              | Usage                          |
|---------------------|-----------------------------------|--------------------------------|
| `./Page`            | `pages/ProjectsListPage.tsx`      | Main projects list page        |
| `./ProjectDetail`   | `pages/ProjectDetailPage.tsx`     | Single project detail page     |
| `./ProjectTableWidget` | `widgets/ProjectTableWidget.tsx` | Dashboard widget              |

---

## 🏗️ Future Domains

When adding new domains (e.g., production-run, work-item, site), **copy this structure**:

```
production-run/
├── api/
├── hooks/
├── types/
├── components/
├── pages/
├── widgets/
└── utils/
```

Each domain is self-contained and follows the same pattern.

---

## 📊 Migration Notes

### Before (Old Structure)
```
projects/
├── common/          # ❌ Mixed types, API, hooks, utils
├── components/      # ❌ Unclear which components
├── page/           # ❌ Singular or plural?
├── node/           # ❌ What is this?
├── dialogs/        # ❌ Separate from components
└── widget/         # ❌ Separate from everything
```

### After (New Structure) ✅
```
project/            # Singular, clear domain
├── api/            # API layer
├── hooks/          # React hooks
├── types/          # TypeScript types
├── components/     # All reusable components
├── pages/          # Full-page views
├── widgets/        # Dashboard widgets
└── utils/          # Utilities
```

**Benefits:**
- ✅ Clear boundaries
- ✅ Easy to find files
- ✅ Scales to 100s of files
- ✅ Consistent structure
- ✅ Self-documenting

---

## ✅ Checklist for New Features

When adding new project features:

- [ ] Types → `types/project.types.ts`
- [ ] API → `api/project-api.ts`
- [ ] Hooks → `hooks/use-*.ts`
- [ ] Components → `components/*.tsx`
- [ ] Pages → `pages/*.tsx` (if full-page)
- [ ] Widgets → `widgets/*.tsx` (if dashboard widget)
- [ ] Utils → `utils/*.ts` (if shared utilities)
- [ ] Update index.ts exports
- [ ] Use `@features/project/*` path aliases
- [ ] Test build with `npm run build`

---

## 🐛 Troubleshooting

### Build fails with "Cannot resolve..."
- Check that path aliases are configured in `tsconfig.json` and `vite.config.ts`
- Ensure imports use `@features/project/*` not relative paths

### Module Federation not loading
- Verify `vite.config.ts` exposes are correct
- Check `plugin.json` page definitions
- Ensure build succeeded (`npm run build`)

### Type errors
- Run `npx tsc --noEmit` to check TypeScript errors
- Ensure all exports are in index.ts files

---

**Questions?** See the [REFACTOR_SCOPE.md](/home/user/code/go/nube/rubix-sdk/nube.plm/REFACTOR_SCOPE.md) for the original refactor plan.
