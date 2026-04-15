# Program Dashboard & Gantt — Implementation Session

## What you're building

A gate-based program view for the PLM plugin: a portfolio dashboard and per-product Gantt chart. Zero new node types — everything uses existing `plm.task` and `plm.ticket` nodes with tags for gate assignment and the `category` field for grouping.

## Scope doc (read this first)

```
docs/sessions/program-gantt/README.md
```

This is the full spec — architecture, data model, UI reference, code examples, all design decisions. Read it end-to-end before writing code. Everything in the doc has been peer-reviewed and the fixes are already applied.

## Codebase

PLM plugin frontend root:
```
nube.plm/frontend/src/
```

tsconfig with path aliases (`@shared/*`, `@features/*`):
```
nube.plm/frontend/tsconfig.json
```

Plugin registration (add 2 new pages here):
```
nube.plm/plugin.json
```

## Phase 1: Start here — Shared Layer + Program Hooks

The doc explains this in detail under "Implementation Phases > Phase 1". The key idea: reusable logic lives in `shared/`, program-specific UI lives in `features/program/`. This prevents `task/` and `program/` from drifting apart.

### Step 1: Move existing utils to shared

Move these two files (don't copy — move, then update imports):

```
features/task/utils/task-status.ts  →  shared/utils/task-status.ts
features/task/utils/task-date.ts    →  shared/utils/task-date.ts
```

Then update imports in these 10 files (change `@features/task/utils/task-status` or `../utils/task-status` to `@shared/utils/task-status`, same for task-date):

**task-status imports (6 files):**
- `features/task/sections/TaskBasicInfoSection.tsx` — uses `../utils/task-status`
- `features/task/components/TaskBoard.tsx` — uses `../utils/task-status`
- `features/task/components/TaskStatusBadge.tsx` — uses `@features/task/utils/task-status`
- `features/product/v2/sections/OverviewSection.tsx` — uses `@features/task/utils/task-status`
- `features/product/v2/sections/TasksSectionV2.tsx` — uses `@features/task/utils/task-status`
- `features/product/v2/widgets/RecentTasks.tsx` — uses `@features/task/utils/task-status` (type import)

**task-date imports (4 files):**
- `features/task/sections/TaskOverviewSection.tsx` — uses `../utils/task-date`
- `features/product/v2/widgets/RecentTasks.tsx` — uses `@features/task/utils/task-date`
- `features/product/pages/create-task-dialog.tsx` — uses `@features/task/utils/task-date`
- `features/product/v2/components/TaskDialog.tsx` — uses `@features/task/utils/task-date`

After moving: verify the existing task views still compile. Run the build before continuing.

### Step 2: Create shared constants

```
shared/constants/gates.ts        — GATES array, GateId type (see doc "Gate Definitions")
shared/constants/categories.ts   — CATEGORIES array, CategoryId type (see doc "Category Definitions", 9 categories including Cloud)
shared/constants/status.ts       — STATUS_DISPLAY and PROJECT_STATUS_DISPLAY maps with Tailwind classes (see doc "Status Mapping")
```

Also move the existing `PLM_NODE_TYPES` from `shared/constants.ts` into `shared/constants/node-types.ts` and update imports. Keep the old file as a re-export if needed to avoid breaking changes, or update all consumers.

### Step 3: Create shared gate helpers

```
shared/utils/gate-helpers.ts
```

Contains: `getTaskGate()`, `setTaskGate()`, `computeGateProgress()`, `deriveCurrentGate()`. All implementations are in the scope doc with full code.

### Step 4: Create program feature files

```
features/program/types/program.types.ts
features/program/utils/gantt-helpers.ts
features/program/hooks/use-program-dashboard.ts
features/program/hooks/use-program-gantt.ts
features/program/hooks/use-gate-targets.ts
```

All implementations are in the scope doc. Key things to get right:
- `use-program-dashboard.ts` uses `refetchInterval: 30_000` on both queries
- `use-program-gantt.ts` fetches tickets scoped per-task via `Promise.all` (NOT a global unscoped query)
- Gate helpers import from `@shared/utils/gate-helpers`
- Categories import from `@shared/constants/categories`

### Step 5: Verify

Build the frontend. All existing task views should work exactly as before with the new import paths. The new hooks should compile but won't have UI yet.

## SDK rules (critical — read before writing any data-fetching code)

```
docs/PLUGIN-CLIENT-TS.md
```

Key rules repeated here because getting these wrong causes data loss:
- `createNode(parentId, { type, name, settings })` — parentId is the **first argument**
- Use `updateNodeSettings()` for settings — **NEVER** `updateNode()` with settings
- Query filter uses `parent.id is "..."` syntax (NOT `parentId is`)
- `queryNodes` returns `{ nodes: [...] }` — always access `.nodes` or `[]` fallback

## What NOT to do

- Don't create new node types (no `plm.gate`, `plm.program`, `plm.category`)
- Don't modify Go backend code or plugin.json node types
- Don't change any logic in existing task/product components (only import paths)
- Don't replace the existing `TasksGanttView` — the new Program Gantt is a separate component
- Don't use `gantt-task-react` for the new Gantt — it uses a custom CSS grid (see doc "Key UI Rules")
