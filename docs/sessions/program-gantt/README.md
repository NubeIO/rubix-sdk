# Program Dashboard & Gantt - Scope Document

## Overview

Add a **gate-based program view** to the PLM plugin. This gives a portfolio-level dashboard and a per-project Gantt chart that maps tasks across 8 development gates (G1-G8) and 9 categories (Hardware, Firmware, Software, etc.).

**Key Principle: Zero new node types.** Everything is built on existing `plm.task` and `plm.ticket` nodes using the `tags` field for gate assignment and the `category` field for category grouping.

**Key Features:**
- Portfolio dashboard showing all products with gate progress
- Per-product Gantt chart: categories on the left, gates/weeks on the top, task bars in the body
- Gate progress computed from child task progress (not stored)
- Drill-down from gate card to filtered task list
- Reuses existing tagging system, existing Gantt library (`gantt-task-react`), and existing task/ticket infrastructure

---

## Architecture

### Why No New Nodes

Gates are not a thing you store -- they are a **lens** you view tasks through. A task tagged `gate:g3` in category `Firmware` with `startDate`/`dueDate` is all the data needed. The new pages just query and group differently than the existing task views.

| PLM Concept | Existing Model | Existing Field | Notes |
|---|---|---|---|
| **Project** | `plm.product` | -- | Already the top-level container |
| **Task** | `plm.task` | -- | Has all tracking fields |
| **Ticket** | `plm.ticket` / `core.ticket` | -- | Lives under tasks |
| **Gate (G1-G8)** | `plm.task` | `settings.tags` | Tag convention: `gate:g1` through `gate:g8` |
| **Category** | `plm.task` | `settings.category` | Currently free-form, constrain to 9 values |
| **Owner / Resource** | `plm.task` | `settings.assignee` | Already exists |
| **Progress %** | `plm.task` | `settings.progress` | Already exists (0-100) |
| **Status** | `plm.task` | `settings.status` | Already exists: pending, in-progress, blocked, review, completed, cancelled |
| **Start / Due** | `plm.task` | `settings.startDate`, `settings.dueDate` | Already exists |

### Gate Definitions

Gates are **constants**, not data. Defined once in frontend code, never stored as nodes.

```typescript
export const GATES = [
  { id: 'g1', name: 'Executive Summary', description: 'Define the problem, solution intent, and confirm strategic and commercial alignment.' },
  { id: 'g2', name: 'Proof of Concept', description: 'Validate the core concept and confirm the solution is technically viable.' },
  { id: 'g3', name: 'MVP (Build)', description: 'Develop an end-to-end working version with core functionality integrated.' },
  { id: 'g4', name: 'Client Acceptance', description: 'Deploy to a live environment and confirm the solution meets real-world requirements.' },
  { id: 'g5', name: 'Product Refinement', description: 'Resolve issues, stabilise performance, and lock the design for scale.' },
  { id: 'g6', name: 'Production Ready', description: 'Ensure the product is fully ready for manufacturing, compliance, and internal delivery.' },
  { id: 'g7', name: 'Go-To-Market', description: 'Prepare, launch, and enable sales to drive initial market adoption.' },
  { id: 'g8', name: 'Scale & Support', description: 'Operate, support, and continuously improve the product as it scales in market.' },
] as const;

export type GateId = typeof GATES[number]['id']; // 'g1' | 'g2' | ... | 'g8'
```

### Category Definitions

Categories are also **constants**. The `category` field on `plm.task` is currently free-form. The new pages provide a dropdown with these 9 values. Existing task views are unaffected (they can still show whatever is in the field).

```typescript
export const CATEGORIES = [
  { id: 'hardware', name: 'Hardware', description: 'PCB, IO, power, enclosure' },
  { id: 'firmware', name: 'Firmware', description: 'Device logic, comms, protocols' },
  { id: 'software', name: 'Software', description: 'UI, APIs, data, desktop/mobile apps' },
  { id: 'cloud', name: 'Cloud', description: 'Telemetry, pipelines, access control, infrastructure' },
  { id: 'testing', name: 'Testing', description: 'Functional, stress, field validation' },
  { id: 'manufacturing', name: 'Manufacturing', description: 'BOM, suppliers, production, QA' },
  { id: 'compliance', name: 'Compliance', description: 'CE, FCC, RCM, standards' },
  { id: 'operations', name: 'Operations', description: 'Support, documentation, internal handover' },
  { id: 'gtm', name: 'GTM', description: 'Pricing, sales tools, partners, launch' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];
```

### Tag Convention for Gates

Tasks are assigned to a gate via the existing `settings.tags` string field.

**Format:** Comma-separated, gate tag uses `gate:` prefix.

```
gate:g3,firmware,bacnet
```

**Parsing:**

```typescript
/** Extract the gate ID from a task's tags string */
export function getTaskGate(tags?: string): GateId | null {
  if (!tags) return null;
  const match = tags.split(',').map(t => t.trim()).find(t => t.startsWith('gate:'));
  if (!match) return null;
  const id = match.replace('gate:', '');
  return GATES.some(g => g.id === id) ? id as GateId : null;
}

/** Set or replace the gate tag in a tags string */
export function setTaskGate(tags: string | undefined, gateId: GateId): string {
  const existing = (tags || '').split(',').map(t => t.trim()).filter(t => t && !t.startsWith('gate:'));
  return [...existing, `gate:${gateId}`].join(', ');
}
```

**Why tags and not a new `gate` settings field:**
- The `tags-references` property panel already exists on all PLM nodes
- Tags are already queryable and filterable
- No schema changes needed in plugin.json or backend hooks
- Keeps the data model flat -- a task can have other tags alongside its gate tag

### Gate Progress Computation

Gate progress for a product is **computed, not stored**. Queried on page load, cached with React Query.

The active gate is **auto-derived** -- no manual `currentGate` setting required. The active gate is the earliest gate that has tasks but is not yet fully complete. This avoids stale dashboards when team leads forget to advance the gate manually.

```typescript
interface GateProgress {
  gateId: GateId;
  totalTasks: number;
  completedTasks: number;
  averageProgress: number;  // avg of task.settings.progress (0-100)
  status: 'done' | 'active' | 'upcoming';
}

/** Auto-derive which gate is currently active for a product.
 *  Logic: the earliest gate (by G1-G8 order) that has tasks and is not 100% complete.
 *  Falls back to product.settings.currentGate as manual override if set. */
export function deriveCurrentGate(tasks: Task[], manualOverride?: GateId): GateId | null {
  if (manualOverride) return manualOverride;
  for (const gate of GATES) {
    const gateTasks = tasks.filter(t => getTaskGate(t.settings?.tags) === gate.id);
    if (gateTasks.length === 0) continue;
    const allComplete = gateTasks.every(t => t.settings?.status === 'completed');
    if (!allComplete) return gate.id;
  }
  return null; // all gates complete
}

/** Compute gate progress for a product */
export function computeGateProgress(tasks: Task[], manualOverride?: GateId): GateProgress[] {
  const currentGateId = deriveCurrentGate(tasks, manualOverride);

  return GATES.map(gate => {
    const gateTasks = tasks.filter(t => getTaskGate(t.settings?.tags) === gate.id);
    const totalTasks = gateTasks.length;
    const completedTasks = gateTasks.filter(t => t.settings?.status === 'completed').length;
    const averageProgress = totalTasks > 0
      ? Math.round(gateTasks.reduce((sum, t) => sum + (t.settings?.progress || 0), 0) / totalTasks)
      : 0;

    let status: 'done' | 'active' | 'upcoming' = 'upcoming';
    if (totalTasks > 0 && completedTasks === totalTasks) status = 'done';
    else if (gate.id === currentGateId) status = 'active';

    return { gateId: gate.id, totalTasks, completedTasks, averageProgress, status };
  });
}
```

### Product-Level Gate Metadata

Gate target dates and an optional manual override are stored in product `settings`:

```typescript
// Added to existing product settings (no schema break)
interface ProductGateSettings {
  currentGate?: GateId;          // Optional manual override. If unset, active gate is auto-derived
                                 // (earliest gate with incomplete tasks in G1-G8 order)
  gateTargets?: Record<GateId, string>;  // e.g. { g1: '2026-02-01', g2: '2026-02-08', ... }
}
```

**Active gate logic:**
1. If `currentGate` is set on the product, use it (manual override for edge cases)
2. Otherwise, auto-derive: scan G1 through G8 in order, the first gate with tasks that aren't all completed is the active gate
3. If all gates are complete, no active gate (all show "done")

This avoids stale dashboards when a team lead forgets to manually advance the gate. Products without any gate settings simply show "No gate data" on the dashboard.

---

## Node Hierarchy (Unchanged)

```
plm.service (PLM Service)
│
├─ plm.products (Products Collection)
│  │
│  ├─ plm.product (Galvin TMV OEM)
│  │  │  settings.currentGate: "g3"
│  │  │  settings.gateTargets: { g1: "2026-02-01", g2: "2026-02-08", ... }
│  │  │
│  │  ├─ plm.task (Finalise PCB layout)
│  │  │  │  settings.category: "hardware"
│  │  │  │  settings.tags: "gate:g1, pcb"
│  │  │  │  settings.status: "completed"
│  │  │  │  settings.progress: 100
│  │  │  │  settings.assignee: "Hoai"
│  │  │  │  settings.startDate: "2026-02-01"
│  │  │  │  settings.dueDate: "2026-02-14"
│  │  │  │
│  │  │  ├─ plm.ticket (Review IO isolation spacing)
│  │  │  ├─ plm.ticket (Confirm connector placement)
│  │  │  └─ plm.ticket (Close layout sign-off comments)
│  │  │
│  │  ├─ plm.task (Implement BACnet objects)
│  │  │  │  settings.category: "firmware"
│  │  │  │  settings.tags: "gate:g3, bacnet, protocol"
│  │  │  │  settings.status: "in-progress"
│  │  │  │  settings.progress: 55
│  │  │  │  settings.assignee: "Tan"
│  │  │  │
│  │  │  ├─ plm.ticket (Add writable point behaviour)
│  │  │  ├─ plm.ticket (Validate object list)
│  │  │  └─ plm.ticket (Confirm priority array handling)
│  │  │
│  │  ├─ plm.task (Build device detail UI)
│  │  │     settings.category: "software"
│  │  │     settings.tags: "gate:g3, ui, frontend"
│  │  │     settings.status: "in-progress"
│  │  │     settings.assignee: "Ritesh"
│  │  │
│  │  └─ ... (more tasks across categories and gates)
│  │
│  └─ plm.product (UART Module)
│     └─ ... (tasks tagged with gates)
```

**Nothing changes in the hierarchy.** Tasks are still children of products. Tickets are still children of tasks. The only difference is how we **read** and **group** them.

---

## Data Model Changes

### Changes to Existing Types

**plm.task settings** -- No changes. All fields already exist:
- `category` (string) -- currently free-form, now also offered as dropdown in program views
- `tags` (string) -- currently free-form, now includes `gate:gN` convention
- `status`, `priority`, `progress`, `assignee`, `startDate`, `dueDate` -- all unchanged

**plm.product settings** -- Add optional fields (non-breaking):
```typescript
// Optional gate tracking fields added to product settings
currentGate?: string;     // 'g1' through 'g8'
gateTargets?: string;     // JSON string: '{"g1":"2026-02-01","g2":"2026-02-08",...}'
```

**Why JSON string for gateTargets:** Node settings are flat key-value. Nested objects stored as JSON strings is the existing pattern (see manufacturing run settings).

### No Backend Changes Required

- No new node types in plugin.json
- No new hooks in Go backend
- No schema migrations
- Product settings are schemaless (any key can be added)

---

## New Pages

### Page 1: Program Dashboard

**Page ID:** `program-dashboard`
**Attached to:** `plm.service` (top-level, same as My Work and Reports)
**Purpose:** Portfolio-level overview of all products with gate progress

**What it shows:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Nube iO · Development Pipeline                                         │
│  Live Project Dashboard                                                  │
│                                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ Active       │ │ Current Gate │ │ Portfolio     │ │ Next Review  │   │
│  │ Projects: 03 │ │ MVP          │ │ Health: ✓    │ │ 17 Feb 2026  │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘

Phase Roadmap
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ...
│ G1     │ │ G2     │ │ G3 ◀── │ │ G4     │ │ G5     │ │ G6     │
│ Exec.  │ │ PoC    │ │ MVP    │ │ Client │ │ Refine │ │ Prod.  │
│ 100%   │ │ 100%   │ │ 65%    │ │ 0%     │ │ 0%     │ │ 0%     │
│ ██████ │ │ ██████ │ │ ████░░ │ │ ░░░░░░ │ │ ░░░░░░ │ │ ░░░░░░ │
│ 01 Feb │ │ 08 Feb │ │ 20 Feb │ │ 10 Mar │ │ 25 Mar │ │ 10 Apr │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘

Project Cards
┌─────────────────────────────────────────────────────────────────────────┐
│ Zone Controller Gen-02    │ Gate: MVP   │ On Track  │ 62% │ Phuong    │
│ UART Module               │ Gate: G4    │ At Risk   │ 78% │ Tan       │
│ Droplet Sensor Refresh    │ Gate: PoC   │ In Review │ 34% │ Hoai      │
└─────────────────────────────────────────────────────────────────────────┘
```

**Data flow:**
1. Query all `plm.product` nodes
2. For each product, query all child `plm.task` nodes
3. Parse gate tags, group by gate, compute progress
4. Read `currentGate` and `gateTargets` from product settings
5. Render cards

**Interactions:**
- Click a product card -> navigates to that product's Program Gantt page
- Click a gate card -> filters project cards to that gate
- Summary stats computed from aggregated data

---

### Page 2: Program Gantt

**Page ID:** `program-gantt`
**Attached to:** `plm.product` (per-project view, same as product-detail-v2)
**Purpose:** Category-based Gantt with gates as timeline markers

**What it shows:**

```
Delivery Gantt - Galvin TMV (OEM)
                                [Done] [In Progress] [At Risk] [Planned]

┌───────────┬──────────────────────┬────────┬──────────────────────────────┐
│ Category  │ Task                 │ Owner  │ G1  G2  G3  G4  G5  G6  G7  │
│           │                      │        │ Feb    Mar    Apr    May     │
│           │                      │        │ W1 W2 W3 W4 W5 W6 W7 W8 ...│
├───────────┼──────────────────────┼────────┼──────────────────────────────┤
│ Hardware  │ Finalise PCB layout  │ Hoai   │ ██████                      │
│           │  ├ Review IO spacing │        │                              │
│           │  ├ Confirm connectors│        │                              │
│           │  └ Close sign-off    │        │                              │
│           │                      │        │                              │
│           │ Validate power design│ Hoai   │    ████████                  │
│           │  ├ Retest full load  │        │                              │
│           │  ├ Confirm surge     │        │                              │
│           │  └ Update schematic  │        │                              │
├───────────┼──────────────────────┼────────┼──────────────────────────────┤
│ Firmware  │ Implement BACnet     │ Tan    │       ████████████           │
│           │  ├ Writable points   │        │                              │
│           │  ├ Validate objects   │        │                              │
│           │  └ Priority array    │        │                              │
│           │                      │        │                              │
│           │ Develop sensor logic │ Tan    │          ██████████          │
│           │  ├ Fix analog scaling │        │                              │
│           │  ├ Tune debounce     │        │                              │
│           │  └ Retest failed     │        │                              │
├───────────┼──────────────────────┼────────┼──────────────────────────────┤
│ Software  │ Build device UI      │ Ritesh │          ████████████████    │
│           │  ...                 │        │                              │
├───────────┼──────────────────────┼────────┼──────────────────────────────┤
│ Testing   │ (no tasks yet)       │ --     │                              │
├───────────┴──────────────────────┴────────┴──────────────────────────────┤
│ ...continues for Manufacturing, Compliance, Operations, GTM...          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- **Left columns:** Category | Task (with expandable tickets) | Owner + Status badge
- **Right area:** Timeline grid
  - Top row: Gate markers (G1 through G8) positioned by `gateTargets` dates
  - Second row: Month labels (Feb, Mar, Apr...)
  - Third row: Week labels (W1, W2, W3...)
  - Body: Horizontal bars from `startDate` to `dueDate`, coloured by status

**Data flow:**
1. Query all `plm.task` nodes for this product
2. Group tasks by `settings.category`
3. For each task, query child `plm.ticket` nodes (loaded on expand)
4. Read `gateTargets` from product settings for gate marker positions
5. Render using `gantt-task-react` (same library as existing TasksGanttView)

**Interactions:**
- Expand/collapse categories
- Expand/collapse tasks to show tickets
- Click task -> opens task detail page (existing)
- Click ticket -> opens ticket detail
- View mode toggle: Week / Month
- Filter by status, assignee, gate

**Relationship to existing TasksGanttView:**
- **Does NOT replace** TasksGanttView -- that continues to work as-is
- This is a **different view** with category grouping and gate markers
- Shares the same `gantt-task-react` library and similar styling patterns
- Shares utility functions (date parsing, bar colours, status labels) via `@shared/utils/`

---

### Page 3: Gate Detail (Optional, Phase 2)

**Page ID:** `gate-detail`
**Attached to:** `plm.product`
**Purpose:** Drill into a single gate for one product

**What it shows:**
- All tasks tagged with that gate, grouped by category
- Task table or Kanban board filtered by gate
- Gate completion summary
- Blockers and at-risk items

**Deferred to Phase 2** -- the Program Dashboard already provides a gate-level view. This page adds depth when a user clicks on a specific gate card.

---

## Frontend Implementation

### File Structure

**Maintainability rule:** If two features need it, it lives in `shared/`. If only one feature needs it, it stays in that feature. This prevents `task/` and `program/` from drifting apart on status colours, date parsing, gate constants, etc.

```
nube.plm/frontend/src/

  shared/                              <-- EXPANDED (existing folder, @shared/* alias)
  ├── constants/
  │   ├── node-types.ts              # existing PLM_NODE_TYPES (moved from constants.ts)
  │   ├── status.ts                  # NEW: STATUS_DISPLAY, PROJECT_STATUS_DISPLAY + Tailwind classes
  │   ├── gates.ts                   # NEW: GATES array, GateId type
  │   └── categories.ts             # NEW: CATEGORIES array, CategoryId type
  ├── utils/
  │   ├── task-status.ts             # MOVED from features/task/utils/ — status colours, labels
  │   ├── task-date.ts               # MOVED from features/task/utils/ — date parsing, week generation
  │   └── gate-helpers.ts            # NEW: getTaskGate, setTaskGate, computeGateProgress, deriveCurrentGate
  ├── hooks/
  │   ├── use-plm-service.ts         # existing
  │   └── use-plm-hierarchy.ts       # existing
  └── components/
      └── icons.tsx                   # existing

  features/task/                       <-- EXISTING (import paths updated, no logic changes)
  ├── components/                     # TaskBoard, TasksGanttView, TaskTable — unchanged
  ├── utils/
  │   └── task-helpers.ts            # STAYS — task-specific helpers that only task/ needs
  │   (task-status.ts, task-date.ts MOVED to shared/utils/)
  └── ...

  features/program/                    <-- NEW (program-specific UI only, no shared logic)
  ├── types/
  │   └── program.types.ts          # GateProgress, GanttRow, CategoryGroup, etc.
  ├── utils/
  │   └── gantt-helpers.ts          # Bar positioning, week-to-column mapping (program-specific)
  ├── hooks/
  │   ├── use-program-dashboard.ts  # Fetch all products + tasks, compose shared utils
  │   ├── use-program-gantt.ts      # Fetch tasks for product, group by category
  │   └── use-gate-targets.ts       # Read/write gate target dates on product
  ├── components/
  │   ├── GateProgressCard.tsx      # Single gate card with progress bar
  │   ├── GateRoadmap.tsx           # Row of 8 gate cards
  │   ├── ProjectCard.tsx           # Product summary card for dashboard
  │   ├── ProjectCardGrid.tsx       # Grid of product cards
  │   ├── DashboardHeader.tsx       # Hero header with summary stats
  │   ├── GanttCategoryGroup.tsx    # Category header + task rows
  │   ├── GanttGroupToggle.tsx     # "Group by: Category | Assignee | Gate" toggle
  │   ├── GanttTaskRow.tsx          # Task row with bar + expandable tickets
  │   ├── GanttTicketRow.tsx        # Ticket sub-row (indented)
  │   ├── GanttTimeline.tsx         # Gate markers + month/week header
  │   ├── GanttLegend.tsx           # Status colour legend
  │   ├── GateSelector.tsx          # Dropdown to assign gate tag to a task
  │   └── CategorySelector.tsx      # Dropdown to assign category to a task
  └── pages/
      ├── ProgramDashboardPage.tsx  # Portfolio view (registered in plugin.json)
      ├── ProgramDashboardEntry.tsx # Entry point wrapper
      ├── ProgramGanttPage.tsx      # Per-product Gantt (registered in plugin.json)
      └── ProgramGanttEntry.tsx     # Entry point wrapper
```

### What Moves to Shared (and Why)

| File | From | To | Reason |
|---|---|---|---|
| `task-status.ts` | `features/task/utils/` | `shared/utils/` | Program Gantt needs same status colours/labels. Both Gantts, dashboard, and task views all render status the same way. |
| `task-date.ts` | `features/task/utils/` | `shared/utils/` | Both Gantts parse `startDate`/`dueDate` identically. Week generation is reused. |
| `GATES`, `CATEGORIES` | new | `shared/constants/` | Dashboard, Gantt, and any future gate-aware view all need these constants. |
| `gate-helpers.ts` | new | `shared/utils/` | Any view filtering or grouping by gate needs `getTaskGate`, `computeGateProgress`, `deriveCurrentGate`. |
| `STATUS_DISPLAY` maps | new | `shared/constants/status.ts` | Single source of truth for status label/colour mappings across all features. |

**Import path change for existing `task/` code:** Update `from '../utils/task-status'` to `from '@shared/utils/task-status'`. No logic changes — just import paths. The `@shared/*` path alias already exists in `tsconfig.json`.

### Plugin Client SDK Reference

All data access uses the Rubix plugin client SDK.

**Import:**
```typescript
import { createPluginClient, usePluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { PluginClientConfig } from '@rubix-sdk/frontend/plugin-client';
```

**Client creation (memoised in existing PLM hooks pattern):**
```typescript
const client = createPluginClient({ orgId, deviceId, baseUrl, token });
// OR in React components:
const client = usePluginClient({ orgId, deviceId, baseUrl, token });
```

**Key methods used by this feature:**

| Method | Signature | Use |
|---|---|---|
| `queryNodes` | `client.queryNodes({ filter: string })` | Fetch tasks, products, tickets |
| `getNode` | `client.getNode(nodeId)` | Get single node |
| `createNode` | `client.createNode(parentId, { type, name, settings })` | Create tasks |
| `updateNodeSettings` | `client.updateNodeSettings(nodeId, { ...partialSettings })` | Update gate tags, category, status |
| `updateNode` | `client.updateNode(nodeId, { name })` | Update node name only |
| `deleteNode` | `client.deleteNode(nodeId)` | Delete nodes |

**Critical rules:**
- `createNode` takes `parentId` as the **first argument**, not inside the body
- Use `updateNodeSettings()` for settings changes -- NEVER `updateNode()` with settings (causes data loss)
- Query filter uses `parent.id is "..."` syntax (NOT `parentId is`)
- `queryNodes` returns `{ nodes: [...] }` -- always access `.nodes` or `[]` fallback

### Key Hooks

**use-program-dashboard.ts:**

```typescript
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { computeGateProgress, deriveCurrentGate } from '@shared/utils/gate-helpers';

export function useProgramDashboard(client: ReturnType<typeof createPluginClient>) {
  // Get all products -- auto-refresh every 30s for team lead dashboards
  const productsQuery = useQuery({
    queryKey: ['program-products'],
    queryFn: async () => {
      const result = await client.queryNodes({
        filter: `type is "plm.product"`
      });
      return result.nodes || [];
    },
    refetchInterval: 30_000, // 30s -- keeps dashboard fresh during meetings
  });

  // Get all tasks across all products (single query)
  const tasksQuery = useQuery({
    queryKey: ['program-all-tasks'],
    queryFn: async () => {
      const result = await client.queryNodes({
        filter: `type is "plm.task"`
      });
      return result.nodes || [];
    },
    refetchInterval: 30_000,
  });

  // Compute per-product gate progress
  const productData = useMemo(() => {
    const products = productsQuery.data || [];
    const allTasks = tasksQuery.data || [];

    return products.map(product => {
      const productTasks = allTasks.filter(t => t.parentId === product.id);
      // Auto-derive active gate (falls back to manual override if set)
      const manualOverride = product.settings?.currentGate;
      const currentGate = deriveCurrentGate(productTasks, manualOverride);
      const gateProgress = computeGateProgress(productTasks, manualOverride);
      const overallProgress = productTasks.length > 0
        ? Math.round(productTasks.reduce((s, t) => s + (t.settings?.progress || 0), 0) / productTasks.length)
        : 0;

      return {
        product,
        tasks: productTasks,
        gateProgress,
        currentGate,
        overallProgress,
      };
    });
  }, [productsQuery.data, tasksQuery.data]);

  return {
    productData,
    isLoading: productsQuery.isLoading || tasksQuery.isLoading,
  };
}
```

**use-program-gantt.ts:**

```typescript
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { CATEGORIES } from '@shared/constants/categories';

export function useProgramGantt(client: ReturnType<typeof createPluginClient>, productId: string) {
  // Get all tasks for this product
  const tasksQuery = useQuery({
    queryKey: ['program-gantt-tasks', productId],
    queryFn: async () => {
      const result = await client.queryNodes({
        filter: `type is "plm.task" and parent.id is "${productId}"`
      });
      return result.nodes || [];
    }
  });

  // Get tickets scoped to this product's tasks only (not globally)
  const taskIds = tasksQuery.data?.map(t => t.id) || [];
  const ticketsQuery = useQuery({
    queryKey: ['program-gantt-tickets', productId, taskIds],
    queryFn: async () => {
      // Fetch tickets per task in parallel to avoid unscoped global query
      const results = await Promise.all(
        taskIds.map(taskId =>
          client.queryNodes({
            filter: `type is "plm.ticket" and parent.id is "${taskId}"`
          }).then(r => r.nodes || [])
        )
      );
      return results.flat();
    },
    enabled: taskIds.length > 0,
  });

  // Group by category, attach tickets to their parent tasks
  const categoryGroups = useMemo(() => {
    const tasks = tasksQuery.data || [];
    const tickets = ticketsQuery.data || [];

    return CATEGORIES.map(cat => ({
      category: cat,
      tasks: tasks
        .filter(t => t.settings?.category === cat.id)
        .map(task => ({
          ...task,
          tickets: tickets.filter(ticket => ticket.parentId === task.id),
        })),
    })).filter(group => group.tasks.length > 0);
  }, [tasksQuery.data, ticketsQuery.data]);

  return {
    categoryGroups,
    allTasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading || ticketsQuery.isLoading,
  };
}
```

**use-gate-targets.ts:**

```typescript
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { GateId } from '@shared/constants/gates';

/** Read gate target dates from product settings */
export function parseGateTargets(product: any): Record<GateId, string> | null {
  const raw = product?.settings?.gateTargets;
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

/** Save gate target dates to product settings */
export async function saveGateTargets(
  client: ReturnType<typeof createPluginClient>,
  productId: string,
  targets: Record<GateId, string>
) {
  await client.updateNodeSettings(productId, {
    gateTargets: JSON.stringify(targets),
  });
}

/** Save current gate on product */
export async function saveCurrentGate(
  client: ReturnType<typeof createPluginClient>,
  productId: string,
  gateId: GateId
) {
  await client.updateNodeSettings(productId, {
    currentGate: gateId,
  });
}
```

**Assigning a gate tag to a task (inline from Gantt):**

```typescript
import { setTaskGate } from '@shared/utils/gate-helpers';

async function assignGateToTask(
  client: ReturnType<typeof createPluginClient>,
  taskId: string,
  currentTags: string | undefined,
  gateId: GateId
) {
  const newTags = setTaskGate(currentTags, gateId);
  await client.updateNodeSettings(taskId, { tags: newTags });
}
```

**Assigning a category to a task (inline from Gantt):**

```typescript
async function assignCategoryToTask(
  client: ReturnType<typeof createPluginClient>,
  taskId: string,
  categoryId: CategoryId
) {
  await client.updateNodeSettings(taskId, { category: categoryId });
}
```

### plugin.json Registration

Add 2 new pages to the existing `pages` array:

```json
{
  "id": "program-dashboard",
  "title": "Program Dashboard",
  "description": "Portfolio-level view of all products with gate progress",
  "nodeTypes": ["plm.service"],
  "entryFile": "./ProgramDashboard",
  "icon": "layout-dashboard",
  "default": false
},
{
  "id": "program-gantt",
  "title": "Program Gantt",
  "description": "Category-based Gantt chart with gate markers for a product",
  "nodeTypes": ["plm.product"],
  "entryFile": "./ProgramGantt",
  "icon": "gantt-chart",
  "default": false
}
```

**No changes to existing pages.** Product Detail, Tasks Manager, My Work, Reports all remain as-is.

---

## UI Specification (Reference Implementation)

The following React component is the **approved design reference**. The implementation must match this layout, spacing, colour palette, and structure exactly. This is the single source of truth for how the UI should look.

### Reference Component

```tsx
export default function NubeIODashboard() {
  const gates = [
    { name: "Executive Summary", status: "done", progress: 100, target: "01 Feb 2026" },
    { name: "PoC", status: "done", progress: 100, target: "08 Feb 2026" },
    { name: "MVP", status: "active", progress: 65, target: "20 Feb 2026" },
    { name: "Client Acceptance", status: "upcoming", progress: 0, target: "10 Mar 2026" },
    { name: "Product Refinement", status: "upcoming", progress: 0, target: "25 Mar 2026" },
    { name: "Production Ready", status: "upcoming", progress: 0, target: "10 Apr 2026" },
    { name: "Go-To-Market", status: "upcoming", progress: 0, target: "20 Apr 2026" },
    { name: "Scale & Support", status: "upcoming", progress: 0, target: "01 May 2026" },
  ];

  const projects = [
    {
      name: "Zone Controller Gen-02",
      gate: "MVP",
      status: "On Track",
      progress: 62,
      owner: "Phuong",
      launch: "28 Feb 2026",
    },
    {
      name: "UART Module",
      gate: "Client Acceptance",
      status: "At Risk",
      progress: 78,
      owner: "Tan",
      launch: "15 Mar 2026",
    },
    {
      name: "Droplet Sensor Refresh",
      gate: "PoC",
      status: "In Review",
      progress: 34,
      owner: "Hoai",
      launch: "22 Apr 2026",
    },
  ];

  const ganttRows = [
    {
      category: "Hardware",
      items: [
        {
          task: "Finalise PCB layout",
          owner: "Hoai",
          status: "Done",
          span: [0, 1],
          tickets: ["Review IO isolation spacing", "Confirm connector placement", "Close layout sign-off comments"],
        },
        {
          task: "Validate power design",
          owner: "Hoai",
          status: "In Progress",
          span: [1, 3],
          tickets: ["Retest under full load", "Confirm surge margin", "Update schematic notes"],
        },
      ],
    },
    {
      category: "Firmware",
      items: [
        {
          task: "Implement BACnet objects",
          owner: "Tan",
          status: "In Progress",
          span: [1, 4],
          tickets: ["Add writable point behaviour", "Validate object list", "Confirm priority array handling"],
        },
        {
          task: "Develop sensor logic",
          owner: "Tan",
          status: "In Progress",
          span: [2, 4],
          tickets: ["Fix scaling on analog input", "Tune debounce timing", "Retest failed sensor states"],
        },
      ],
    },
    {
      category: "Software",
      items: [
        {
          task: "Build device detail UI",
          owner: "Ritesh",
          status: "In Progress",
          span: [2, 5],
          tickets: ["Resolve alarm state rendering", "Add point history panel", "Tighten mobile spacing"],
        },
        {
          task: "Develop reporting module",
          owner: "Ritesh",
          status: "Planned",
          span: [4, 6],
          tickets: ["Add monthly summary card", "Support CSV export", "Confirm filter behaviour"],
        },
      ],
    },
    {
      category: "Cloud",
      items: [
        {
          task: "Set up telemetry pipeline",
          owner: "Binod",
          status: "At Risk",
          span: [2, 6],
          tickets: ["Fix intermittent packet loss", "Confirm retry handling", "Stabilise queue processing"],
        },
        {
          task: "Implement user access control",
          owner: "Binod",
          status: "Planned",
          span: [5, 7],
          tickets: ["Add role mapping", "Test tenant access rules", "Review session expiry"],
        },
      ],
    },
    {
      category: "Testing",
      items: [
        {
          task: "Run stress test cycle",
          owner: "Bryn",
          status: "Planned",
          span: [5, 7],
          tickets: ["Retest reboot under load", "Capture memory trend", "Close burn-in report"],
        },
        {
          task: "Execute field validation",
          owner: "Bryn",
          status: "Planned",
          span: [6, 8],
          tickets: ["Confirm live comms stability", "Verify sensor accuracy", "Document site issues"],
        },
      ],
    },
    {
      category: "Manufacturing",
      items: [
        {
          task: "Lock EOL test process",
          owner: "Lily",
          status: "Planned",
          span: [6, 8],
          tickets: ["Add missing IO test case", "Confirm pass/fail criteria", "Update factory SOP"],
        },
        {
          task: "Finalise BOM release",
          owner: "Lily",
          status: "Planned",
          span: [7, 9],
          tickets: ["Approve alternates list", "Confirm lead times", "Release sourcing pack"],
        },
      ],
    },
    {
      category: "Compliance",
      items: [
        {
          task: "Complete EMC pre-check",
          owner: "Hoai",
          status: "Planned",
          span: [7, 9],
          tickets: ["Confirm product variant label", "Review test setup", "Close pre-scan actions"],
        },
        {
          task: "Prepare compliance pack",
          owner: "Hoai",
          status: "Planned",
          span: [8, 10],
          tickets: ["Update declaration draft", "Confirm standards list", "Collect latest reports"],
        },
      ],
    },
    {
      category: "Operations",
      items: [
        {
          task: "Prepare support handover pack",
          owner: "Amy",
          status: "Planned",
          span: [8, 10],
          tickets: ["Add comms fault guide", "Confirm escalation path", "Upload support notes"],
        },
        {
          task: "Set up service workflow",
          owner: "Amy",
          status: "Planned",
          span: [9, 11],
          tickets: ["Define ticket triage rules", "Prepare RMA workflow", "Review customer response template"],
        },
      ],
    },
    {
      category: "GTM",
      items: [
        {
          task: "Prepare partner launch kit",
          owner: "Claire",
          status: "Planned",
          span: [9, 11],
          tickets: ["Update datasheet with final specs", "Prepare launch slides", "Confirm distributor copy"],
        },
        {
          task: "Define pricing release",
          owner: "Claire",
          status: "Planned",
          span: [10, 11],
          tickets: ["Confirm margin model", "Review partner tier pricing", "Approve final price list"],
        },
      ],
    },
  ];

  const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"];

  const pill = (status) => {
    const map = {
      "On Track": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "At Risk": "bg-amber-100 text-amber-700 border-amber-200",
      "In Review": "bg-slate-100 text-slate-700 border-slate-200",
    };
    return map[status] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const gateColor = (status) => {
    if (status === "done") return "bg-emerald-500 text-white";
    if (status === "active") return "bg-sky-600 text-white ring-4 ring-sky-100";
    return "bg-white text-slate-500 border border-slate-200";
  };

  const barColor = (status) => {
    if (status === "Done") return "bg-emerald-500";
    if (status === "In Progress") return "bg-sky-600";
    if (status === "At Risk") return "bg-amber-500";
    return "bg-slate-300";
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.22em] text-slate-300">
                Nube iO · Development Pipeline
              </div>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">Live Project Dashboard</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300">
                Portfolio-first view of product status, phase progression, and delivery readiness.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["Active Projects", "03"],
                ["Current Gate", "MVP"],
                ["Portfolio Health", "On Track"],
                ["Next Review", "17 Feb 2026"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
                  <div className="mt-2 text-2xl font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase Roadmap */}
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Phase Roadmap</h2>
              <p className="text-sm text-slate-500">Progress and target dates by development phase.</p>
            </div>
            <div className="rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
              Current focus: MVP
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {gates.map((gate, idx) => (
              <div key={gate.name} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold ${gateColor(gate.status)}`}>
                    G{idx + 1}
                  </div>
                  <div className="text-xs text-slate-500">{gate.target}</div>
                </div>
                <div className="mt-3 font-medium">{gate.name}</div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-500">Progress</span>
                    <span>{gate.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-slate-900"
                      style={{ width: `${gate.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Gantt */}
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Delivery Gantt</h2>
              <p className="text-sm text-slate-500">
                High-level timing view across categories for the active program.
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">Done</span>
              <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700">In Progress</span>
              <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">At Risk</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">Planned</span>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200">

            {/* Gantt Header */}
            <div className="grid grid-cols-[1fr_1.6fr_0.8fr_2.4fr] bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div className="px-4 py-3">Category</div>
              <div className="px-4 py-3">Task</div>
              <div className="px-4 py-3">Owner</div>
              <div className="border-l border-slate-200 px-4 py-3">
                {/* Gate labels row */}
                <div className="grid grid-cols-12 gap-1 text-center text-[11px] font-semibold text-slate-600">
                  {gates.slice(0, 8).map((gate, idx) => (
                    <div key={gate.name} className="col-span-1">G{idx + 1}</div>
                  ))}
                  <div className="col-span-4"></div>
                </div>
                {/* Month labels row */}
                <div className="mt-1 grid grid-cols-12 text-center text-[11px] font-semibold normal-case text-slate-500">
                  <div className="col-span-4">Feb 2026</div>
                  <div className="col-span-4">Mar 2026</div>
                  <div className="col-span-4">Apr 2026</div>
                </div>
                {/* Week labels row */}
                <div className="mt-2 grid grid-cols-12 text-center text-[11px] font-medium normal-case text-slate-400">
                  {weeks.map((week) => (
                    <div key={week}>{week}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gantt Body */}
            <div className="divide-y divide-slate-200">
              {ganttRows.map((group) => (
                <div key={group.category} className="bg-white">
                  {/* Category header row */}
                  <div className="grid grid-cols-[1fr_1.6fr_0.8fr_2.4fr] items-center border-b border-slate-200 bg-slate-50/60 text-sm">
                    <div className="px-4 py-4 font-semibold text-slate-800">{group.category}</div>
                    <div className="px-4 py-4 text-slate-500">{group.items.length} tasks</div>
                    <div className="px-4 py-4 text-slate-500">Category Lead</div>
                    <div className="border-l border-slate-200 px-4 py-4 text-xs text-slate-400">
                      Task timing and tickets
                    </div>
                  </div>

                  {/* Task rows within category */}
                  {group.items.map((row) => (
                    <div key={group.category + row.task}
                      className="grid grid-cols-[1fr_1.6fr_0.8fr_2.4fr] items-start border-b border-slate-100 text-sm last:border-b-0">
                      {/* Column 1: Row label */}
                      <div className="px-4 py-4 text-slate-500">Task</div>
                      {/* Column 2: Task name + tickets */}
                      <div className="px-4 py-4">
                        <div className="font-medium text-slate-900">{row.task}</div>
                        <div className="mt-2 space-y-1.5">
                          {row.tickets.map((ticket) => (
                            <div key={ticket}
                              className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
                              {ticket}
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Column 3: Owner + status badge */}
                      <div className="px-4 py-4">
                        <div className="text-slate-700">{row.owner}</div>
                        <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          row.status === "Done"
                            ? "bg-emerald-50 text-emerald-700"
                            : row.status === "In Progress"
                            ? "bg-sky-50 text-sky-700"
                            : row.status === "At Risk"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {row.status}
                        </div>
                      </div>
                      {/* Column 4: Timeline bars */}
                      <div className="border-l border-slate-200 px-4 py-4">
                        <div className="grid grid-cols-12 gap-1">
                          {weeks.map((_, idx) => {
                            const active = idx >= row.span[0] && idx <= row.span[1];
                            const roundedLeft = idx === row.span[0] ? "rounded-l-full" : "";
                            const roundedRight = idx === row.span[1] ? "rounded-r-full" : "";
                            return (
                              <div key={idx} className="h-8 rounded-md bg-slate-50">
                                {active && (
                                  <div className={`h-8 ${roundedLeft} ${roundedRight} ${barColor(row.status)} shadow-sm`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### UI Structure Breakdown

The page is a **single scrolling view** with 3 stacked sections. All sections are contained in `mx-auto max-w-7xl space-y-6` inside a `bg-slate-100 p-8` page wrapper.

#### Section 1: Dashboard Header

**Container:** `rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-2xl`

| Element | Styling | Notes |
|---|---|---|
| Breadcrumb text | `text-sm uppercase tracking-[0.22em] text-slate-300` | "Nube iO · Development Pipeline" |
| Title | `text-4xl font-semibold tracking-tight` | "Live Project Dashboard" |
| Subtitle | `text-sm text-slate-300` | Description text |
| Stat cards | `rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur` | 2x2 grid on mobile, 4-column on desktop |
| Stat label | `text-xs uppercase tracking-wide text-slate-400` | |
| Stat value | `mt-2 text-2xl font-semibold` | |

**Layout:** `flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between` -- title on left, stats on right, stacks on mobile.

**Stat cards (4):**
1. Active Projects -- count of products with tasks
2. Current Gate -- most common active gate across portfolio
3. Portfolio Health -- "On Track" / "At Risk" based on aggregate status
4. Next Review -- nearest gate target date

#### Section 2: Phase Roadmap

**Container:** `rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200`

**Header row:** Title + "Current focus: {gate}" pill (`rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700`)

**Gate cards grid:** `grid grid-cols-2 gap-4 lg:grid-cols-4` (8 cards, 2 rows of 4 on desktop)

Each gate card:
```
rounded-2xl border border-slate-200 p-4
├── Row: Gate badge (h-10 w-10 rounded-xl) + target date (text-xs text-slate-500)
├── Gate name (mt-3 font-medium)
└── Progress bar section (mt-3)
    ├── Label row: "Progress" + "65%" (text-xs)
    └── Bar: h-2 rounded-full bg-slate-100 > inner h-2 rounded-full bg-slate-900
```

**Gate badge colours (critical -- must match exactly):**

| Status | Badge class |
|---|---|
| `done` | `bg-emerald-500 text-white` |
| `active` | `bg-sky-600 text-white ring-4 ring-sky-100` |
| `upcoming` | `bg-white text-slate-500 border border-slate-200` |

**Progress bar fill:** Always `bg-slate-900` (dark, not status-coloured). Width set via inline `style={{ width: \`${progress}%\` }}`.

#### Section 3: Delivery Gantt

**Container:** `rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200`

**Header row:** Title "Delivery Gantt" + legend pills (Done / In Progress / At Risk / Planned)

**Legend pill styles:**
```
Done:        rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700
In Progress: rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700
At Risk:     rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700
Planned:     rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600
```

**Gantt table:** `overflow-hidden rounded-2xl border border-slate-200`

**Column grid (critical -- 4 columns):** `grid grid-cols-[1fr_1.6fr_0.8fr_2.4fr]`

| Column | Width | Content |
|---|---|---|
| Category | `1fr` | Category name or "Task" label |
| Task | `1.6fr` | Task name + ticket pills below |
| Owner | `0.8fr` | Owner name + status badge |
| Timeline | `2.4fr` | Gate/month/week headers + bars (has `border-l border-slate-200`) |

**Gantt header:**
```
bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500
```

**Timeline header (3 rows in the 4th column):**
1. Gate labels: `grid grid-cols-12 gap-1 text-center text-[11px] font-semibold text-slate-600` -- G1 through G8 in first 8 cols, last 4 empty
2. Month labels: `grid grid-cols-12 text-center text-[11px] font-semibold normal-case text-slate-500` -- 3 groups of `col-span-4`
3. Week labels: `grid grid-cols-12 text-center text-[11px] font-medium normal-case text-slate-400` -- W1 through W12

**Category header row:**
```
grid grid-cols-[1fr_1.6fr_0.8fr_2.4fr] items-center border-b border-slate-200 bg-slate-50/60 text-sm
├── Category name: px-4 py-4 font-semibold text-slate-800
├── Task count: px-4 py-4 text-slate-500  ("2 tasks")
├── "Category Lead": px-4 py-4 text-slate-500
└── Timeline label: border-l border-slate-200 px-4 py-4 text-xs text-slate-400
```

**Task row:**
```
grid grid-cols-[1fr_1.6fr_0.8fr_2.4fr] items-start border-b border-slate-100 text-sm last:border-b-0
├── Col 1: "Task" label (px-4 py-4 text-slate-500)
├── Col 2: Task name + tickets
│   ├── Task name: font-medium text-slate-900
│   └── Tickets: mt-2 space-y-1.5
│       └── Each ticket: rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200
├── Col 3: Owner + status
│   ├── Owner: text-slate-700
│   └── Status badge: mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium
│       Done:        bg-emerald-50 text-emerald-700
│       In Progress: bg-sky-50 text-sky-700
│       At Risk:     bg-amber-50 text-amber-700
│       Planned:     bg-slate-100 text-slate-600
└── Col 4: Timeline bars (border-l border-slate-200 px-4 py-4)
    └── grid grid-cols-12 gap-1
        └── Each week cell: h-8 rounded-md bg-slate-50
            └── Active cell: h-8 {barColor} shadow-sm + rounded-l-full / rounded-r-full on ends
```

**Bar colours (critical -- must match):**

| Status | Bar class |
|---|---|
| Done | `bg-emerald-500` |
| In Progress | `bg-sky-600` |
| At Risk | `bg-amber-500` |
| Planned | `bg-slate-300` |

**Bar shape:** 12-column grid (1 per week). Active cells get the coloured bar. First active cell gets `rounded-l-full`, last gets `rounded-r-full`. Inactive cells show `bg-slate-50` background. All cells are `h-8`.

---

### Mapping Reference Data to Real Data

The reference uses hardcoded data. In the real implementation, each piece maps to a query:

| Reference data | Real data source |
|---|---|
| `gates[].progress` | Computed from `computeGateProgress()` -- average of task progress per gate |
| `gates[].status` | `done` if all gate tasks completed, `active` if currentGate matches, else `upcoming` |
| `gates[].target` | From `product.settings.gateTargets` |
| `projects[]` | Query all `plm.product` nodes |
| `projects[].gate` | From `product.settings.currentGate` |
| `projects[].status` | Derived: "At Risk" if any task blocked/overdue, "On Track" otherwise |
| `projects[].progress` | Average of all child task progress |
| `projects[].owner` | From product settings or first task assignee |
| `ganttRows[].category` | Tasks grouped by `settings.category` |
| `ganttRows[].items[].task` | `plm.task` node name |
| `ganttRows[].items[].owner` | `task.settings.assignee` |
| `ganttRows[].items[].status` | `task.settings.status` mapped to display values |
| `ganttRows[].items[].span` | Calculated from `task.settings.startDate` / `task.settings.dueDate` relative to visible week range |
| `ganttRows[].items[].tickets` | Child `plm.ticket` node names, loaded on expand |

### Status Mapping (Internal to Display)

Task status values are stored as lowercase internal values. Map them for display **consistently** across all views (dashboard project cards, Gantt task rows, legend pills):

```typescript
/** Single source of truth for status display names.
 *  Used by: DashboardHeader stat cards, ProjectCard pills, GanttTaskRow badges, GanttLegend.
 *  The reference UI uses "Done" / "In Progress" / "At Risk" / "Planned" everywhere. */
const STATUS_DISPLAY: Record<string, { label: string; barClass: string; badgeClass: string }> = {
  'completed': {
    label: 'Done',
    barClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-700',
  },
  'in-progress': {
    label: 'In Progress',
    barClass: 'bg-sky-600',
    badgeClass: 'bg-sky-50 text-sky-700',
  },
  'blocked': {
    label: 'At Risk',
    barClass: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700',
  },
  'pending': {
    label: 'Planned',
    barClass: 'bg-slate-300',
    badgeClass: 'bg-slate-100 text-slate-600',
  },
  'review': {
    label: 'In Review',
    barClass: 'bg-sky-600',
    badgeClass: 'bg-slate-100 text-slate-700',
  },
  'cancelled': {
    label: 'Cancelled',
    barClass: 'bg-slate-300',
    badgeClass: 'bg-slate-100 text-slate-500',
  },
};

/** Dashboard project card status (portfolio-level health).
 *  These are derived values, NOT the same as task status. */
const PROJECT_STATUS_DISPLAY: Record<string, string> = {
  'On Track': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'At Risk': 'bg-amber-100 text-amber-700 border-amber-200',
  'In Review': 'bg-slate-100 text-slate-700 border-slate-200',
};
```

**Important:** The Gantt uses task-level statuses (Done, In Progress, At Risk, Planned). The Dashboard project cards use portfolio-level statuses (On Track, At Risk, In Review). These are two different vocabularies -- do NOT mix them. The `STATUS_DISPLAY` map handles task statuses; `PROJECT_STATUS_DISPLAY` handles project card pills.

### Key UI Rules

1. **Do NOT use `gantt-task-react` for the Delivery Gantt.** The reference uses a custom CSS grid layout (`grid grid-cols-12`). This is intentional -- it allows tickets to be shown inline and gives full control over the layout. The existing `gantt-task-react` library stays in `TasksGanttView` only.

2. **Tickets are always visible** under their task (not behind an expand toggle in MVP). The reference shows tickets as pills directly below the task name. Phase 2 can add collapse/expand if lists get long.

3. **The timeline is a 12-column grid** (12 weeks). In the real implementation, compute the visible week range from the earliest task start to the latest task end, then generate week columns dynamically. The 12-week span in the reference is a starting point.

4. **All 3 sections are on one page** for the Program Dashboard view. For the Program Gantt page (per-product), only Sections 2 (Phase Roadmap) and 3 (Delivery Gantt) are shown, with the product name as the page title.

5. **Rounded corners are generous** -- `rounded-3xl` on section cards, `rounded-2xl` on inner cards and the gantt table, `rounded-xl` on gate badges and ticket pills, `rounded-full` on status badges and legend pills.

6. **"Group by" toggle on the Gantt.** Default grouping is by Category (as in the reference). Add a toggle: `Group by: Category | Assignee | Gate`. Same rows and bars, just re-grouped. This is the single biggest UX win for managing a mixed hardware/software team -- a team lead managing Hoai (hardware), Tan (firmware), and Ritesh (software) needs to see what each person is working on across categories, who is overloaded, and where cross-discipline handoffs are blocked. No new pages needed -- just an alternative grouping of the same data.

7. **The 12-column timeline is a starting point.** Products with longer timelines (hardware compliance can stretch 6+ months) will overflow. The week count should be dynamically computed from the date range of the product's tasks. For MVP, cap at a reasonable max (e.g., 24 weeks) and add horizontal scroll. Document this as a known limitation for Phase 2 zoom controls.

### Responsive Behaviour

- Page wrapper: `min-h-screen bg-slate-100 p-8`
- Content: `mx-auto max-w-7xl space-y-6`
- Header stat cards: `grid grid-cols-2 gap-3 lg:grid-cols-4`
- Gate cards: `grid grid-cols-2 gap-4 lg:grid-cols-4`
- Gantt table: Horizontal scroll via `overflow-hidden` on container (content naturally overflows on small screens)
- Header stacks vertically on mobile: `flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between`

---

## Validation & Constraints

### Gate Tag Validation

- Only one `gate:` tag per task (if multiple found, use the first)
- Valid values: `gate:g1` through `gate:g8`
- Invalid gate tags are ignored (task appears as "unassigned gate")
- Gate assignment is optional -- tasks without a gate tag still appear in existing views

### Category Validation

- Program Gantt page offers dropdown with the 9 defined categories
- Tasks with a category not in the list appear under "Other"
- Category assignment is optional -- tasks without a category appear under "Uncategorised"
- Existing tasks with free-form categories are not broken

### No Breaking Changes

- Products without `currentGate` or `gateTargets` simply show empty gate roadmap
- Tasks without `gate:` tags simply don't appear in gate-grouped views
- Tasks without a category from the 9-list appear under "Uncategorised"
- All existing pages, queries, and workflows continue to work unmodified

---

## Assigning Gates and Categories to Tasks

Two approaches, both implemented:

### Approach 1: From Program Gantt Page (New)

The Program Gantt page includes:
- **GateSelector** dropdown on each task row -- sets/changes the `gate:gN` tag
- **CategorySelector** dropdown on each task row -- sets/changes the `category` field
- Both use inline editing (click to change, auto-saves)

### Approach 2: From Existing Task Forms (Unmodified)

Users can still set `tags` and `category` manually in existing task forms. The `gate:gN` convention is just a tag string -- any task editor that writes tags works.

---

## Queries (Using Plugin Client SDK)

All queries use `@rubix-sdk/frontend/plugin-client`. The client is created via `createPluginClient({ orgId, deviceId, baseUrl, token })`.

### Get All Tasks for a Product Grouped by Gate

```typescript
const result = await client.queryNodes({
  filter: `type is "plm.task" and parent.id is "${productId}"`
});
const tasks = result.nodes || [];

const byGate = groupBy(tasks, t => getTaskGate(t.settings?.tags) || 'unassigned');
// { g1: [...], g3: [...], unassigned: [...] }
```

### Get All Tasks for a Product Grouped by Category

```typescript
const result = await client.queryNodes({
  filter: `type is "plm.task" and parent.id is "${productId}"`
});
const tasks = result.nodes || [];

const byCategory = groupBy(tasks, t => t.settings?.category || 'uncategorised');
// { hardware: [...], firmware: [...], software: [...] }
```

### Get Tickets for a Task (Shown Inline in Gantt)

```typescript
const result = await client.queryNodes({
  filter: `type is "plm.ticket" and parent.id is "${taskId}"`
});
const tickets = result.nodes || [];
```

### Get All Tickets for a Product (Bulk Load for Gantt)

```typescript
// Fetch tickets scoped to this product's task IDs (NOT a global unscoped query)
const taskIds = tasks.map(t => t.id);
const ticketResults = await Promise.all(
  taskIds.map(taskId =>
    client.queryNodes({
      filter: `type is "plm.ticket" and parent.id is "${taskId}"`
    }).then(r => r.nodes || [])
  )
);
const allTickets = ticketResults.flat();

// Group by parentId to attach to tasks
const ticketsByTask = groupBy(allTickets, t => t.parentId);
```

**Why per-task queries instead of a single global query:**
A filter like `type is "plm.ticket" and parent.type is "plm.task"` returns tickets from ALL products, not just the one being viewed. With multiple products and hundreds of tickets, this over-fetches and relies on client-side filtering. Scoping to known task IDs is correct.

### Get Portfolio Summary (Dashboard)

```typescript
// All products (single query)
const productsResult = await client.queryNodes({ filter: `type is "plm.product"` });
const products = productsResult.nodes || [];

// All tasks across all products (single query for performance)
const tasksResult = await client.queryNodes({ filter: `type is "plm.task"` });
const allTasks = tasksResult.nodes || [];

// Group tasks by product parentId, then compute gate progress per product
const tasksByProduct = groupBy(allTasks, t => t.parentId);
```

### Update Task Gate Assignment

```typescript
// Read current tags, set new gate, write back via settings PATCH
const node = await client.getNode(taskId);
const currentTags = node.settings?.tags;
const newTags = setTaskGate(currentTags, 'g3');

await client.updateNodeSettings(taskId, { tags: newTags });
// ⚠️ NEVER use client.updateNode() for settings -- use updateNodeSettings()
```

### Update Task Category

```typescript
await client.updateNodeSettings(taskId, { category: 'firmware' });
```

### Set Gate Targets on Product

```typescript
await client.updateNodeSettings(productId, {
  currentGate: 'g3',
  gateTargets: JSON.stringify({
    g1: '2026-02-01',
    g2: '2026-02-08',
    g3: '2026-02-20',
    g4: '2026-03-10',
    g5: '2026-03-25',
    g6: '2026-04-10',
    g7: '2026-04-20',
    g8: '2026-05-01',
  }),
});
```

---

## Implementation Phases

### Phase 1: Shared Layer + Program Hooks (Day 1)

**Shared layer files (new + moved):**
```
shared/constants/gates.ts              # NEW: GATES array, GateId type
shared/constants/categories.ts         # NEW: CATEGORIES array, CategoryId type
shared/constants/status.ts             # NEW: STATUS_DISPLAY, PROJECT_STATUS_DISPLAY + Tailwind classes
shared/utils/gate-helpers.ts           # NEW: getTaskGate, setTaskGate, computeGateProgress, deriveCurrentGate
shared/utils/task-status.ts            # MOVED from features/task/utils/
shared/utils/task-date.ts              # MOVED from features/task/utils/
```

**Program feature files:**
```
features/program/types/program.types.ts
features/program/utils/gantt-helpers.ts
features/program/hooks/use-program-dashboard.ts
features/program/hooks/use-program-gantt.ts
features/program/hooks/use-gate-targets.ts
```

**Deliverables:**
- [ ] Move `task-status.ts`, `task-date.ts` to `shared/utils/` and update imports in `features/task/`
- [ ] Gate and category constants in `shared/constants/`
- [ ] Status display maps in `shared/constants/status.ts`
- [ ] Gate tag parsing/writing utilities (getTaskGate, setTaskGate) in `shared/utils/`
- [ ] computeGateProgress and deriveCurrentGate functions
- [ ] Gantt helper functions (bar positioning, week-to-column mapping) in `features/program/utils/`
- [ ] useProgramDashboard hook (fetch products + tasks, compose shared utils)
- [ ] useProgramGantt hook (fetch tasks for product, group by category)
- [ ] useGateTargets hook (read/write gate target dates on product settings)
- [ ] Verify existing task views still work after import path changes

### Phase 2: Program Dashboard Page (Day 2-3)

**Files:**
```
features/program/components/DashboardHeader.tsx
features/program/components/GateProgressCard.tsx
features/program/components/GateRoadmap.tsx
features/program/components/ProjectCard.tsx
features/program/components/ProjectCardGrid.tsx
features/program/pages/ProgramDashboardPage.tsx
features/program/pages/ProgramDashboardEntry.tsx
```

**Deliverables:**
- [ ] Dashboard header with summary stats (active projects, current gate, health)
- [ ] Gate roadmap (8 cards with progress bars and target dates)
- [ ] Project card grid (product name, current gate, status, progress, owner)
- [ ] Click project card to navigate to Program Gantt
- [ ] Register `program-dashboard` page in plugin.json
- [ ] Loading and empty states

### Phase 3: Program Gantt Page (Day 4-6)

**Files:**
```
features/program/components/GanttTimeline.tsx
features/program/components/GanttCategoryGroup.tsx
features/program/components/GanttTaskRow.tsx
features/program/components/GanttTicketRow.tsx
features/program/components/GanttLegend.tsx
features/program/components/GanttGroupToggle.tsx
features/program/components/GateSelector.tsx
features/program/components/CategorySelector.tsx
features/program/pages/ProgramGanttPage.tsx
features/program/pages/ProgramGanttEntry.tsx
```

**Deliverables:**
- [ ] Timeline header with gate markers, month labels, week labels
- [ ] Dynamic week count computed from task date range (not hardcoded 12)
- [ ] Category group rows (collapsible)
- [ ] Task rows with horizontal bars (startDate to dueDate, coloured by status)
- [ ] Expandable task rows showing child tickets
- [ ] Owner and status badge on each row
- [ ] **"Group by" toggle: Category | Assignee | Gate** (same data, re-grouped)
- [ ] GateSelector and CategorySelector inline editors
- [ ] Status/assignee/gate filters
- [ ] View toggle: Week / Month
- [ ] Register `program-gantt` page in plugin.json
- [ ] Loading and empty states

### Phase 4: Gate Target Date Management (Day 7)

**Files:**
```
features/program/components/GateTargetEditor.tsx  (modal/dialog)
```

**Deliverables:**
- [ ] Dialog to set target dates for each gate on a product
- [ ] Stores as `gateTargets` in product settings
- [ ] Accessible from both Dashboard (product card action) and Gantt (header action)
- [ ] Gate markers on Gantt timeline update dynamically

### Phase 5: Polish & Integration (Day 8-9)

**Deliverables:**
- [ ] Navigation between Dashboard and Gantt pages
- [ ] Empty states for products with no tasks
- [ ] "Uncategorised" and "Unassigned Gate" handling
- [ ] Responsive layout testing
- [ ] Performance: React Query caching, lazy ticket loading on expand
- [ ] Accessibility: keyboard navigation, screen reader labels

---

## Edge Cases & Error Handling

### Task Without Gate Tag

**Scenario:** Task exists but has no `gate:` tag in its `tags` string.

**Handling:**
- Dashboard: Task contributes to product's overall progress but not to any gate
- Gantt: Task appears in its category row, positioned by date, with no gate association
- Shown as "No Gate" in filters

### Task Without Category

**Scenario:** Task has no `category` or has a value not in the 9 defined categories.

**Handling:**
- Gantt: Appears in "Uncategorised" group at the bottom
- Dashboard: Still counted in gate progress (gate is tag-based, not category-based)

### Product Without Gate Targets

**Scenario:** Product has no `gateTargets` in settings.

**Handling:**
- Dashboard: Gate cards show "No target date"
- Gantt: Gate markers hidden from timeline (only show month/week grid)
- Prompt user: "Set gate targets to enable timeline markers"

### Multiple Gate Tags

**Scenario:** Task has `tags: "gate:g2, gate:g5, firmware"`.

**Handling:**
- Use the first `gate:` tag found (`g2`)
- Log a warning in console
- Could add a validation hint in the UI later

### Date Parsing

**Scenario:** Task has `startDate` but no `dueDate`, or neither.

**Handling:**
- No start + no due: Task appears in category row but no bar on timeline
- Start but no due: Bar shows as a point/milestone marker
- Due but no start: Bar starts from the beginning of the visible range

### Large Product (100+ Tasks)

**Scenario:** Product has many tasks across all categories.

**Handling:**
- Categories are collapsed by default, user expands what they need
- Tickets loaded on demand (expand task row, then query)
- React Query caching prevents re-fetches
- Virtual scrolling if needed (Phase 2 optimisation)

---

## Key Design Decisions

### Use Tags for Gates (Not a New Settings Field)

**Decision:** Store gate assignment in `settings.tags` as `gate:gN`.

**Why:**
- Tags already exist on all PLM nodes (`tags-references` panel)
- No schema changes needed
- Tags are already filterable
- A task can have a gate tag alongside other tags
- Compatible with existing tag UI

**Alternative considered:** Adding `settings.gate` field to plm.task. Rejected because it requires plugin.json changes, backend hook updates, and adds a field that only matters in the program view.

### Use Category Field (Not Tags) for Categories

**Decision:** Use `settings.category` for the 9 PLM categories.

**Why:**
- `category` field already exists on plm.task
- A task belongs to exactly one category (not a many-to-many like tags)
- Semantically correct: "Hardware" is a category, not a tag
- The field is already used in existing task forms

### Compute Gate Progress (Not Store It)

**Decision:** Gate progress is calculated on the fly from task data.

**Why:**
- Single source of truth (tasks)
- No sync issues when tasks are updated
- React Query caching means re-computation is fast
- Storing progress would require hooks to update on every task change

**Trade-off:** Slightly more computation on page load. Mitigated by caching.

### New Feature Folder + Expanded Shared Layer

**Decision:** Create `features/program/` for program-specific UI. Promote reusable task/PLM logic (status maps, date parsing, gate helpers) to `shared/`.

**Why:**
- Clean separation -- program views don't touch task or product code
- **Shared logic is shared, not copied.** Status colours, date parsing, and gate constants live in one place (`shared/`). Both `task/` and `program/` import from it. No drift.
- Existing task Gantt, task board, task table all remain unchanged (only import paths change)
- Easy to remove or refactor `features/program/` independently without losing shared utilities

**The rule:** If two features need it, it lives in `shared/`. If only one feature needs it, it stays in that feature. When in doubt, start in the feature folder and promote to shared when the second consumer appears.

**Migration for existing `task/` code:** Move `task-status.ts` and `task-date.ts` from `features/task/utils/` to `shared/utils/`. Update imports in existing task components from `'../utils/task-status'` to `'@shared/utils/task-status'`. No logic changes — just import paths. The `@shared/*` path alias already exists in `tsconfig.json`.

### Keep Existing TasksGanttView

**Decision:** The existing TasksGanttView stays as-is. Program Gantt is a separate component.

**Why:**
- Different purpose: TasksGanttView is task-centric, Program Gantt is category-centric
- Different layout: TasksGanttView has no category grouping or gate markers
- Different data flow: Program Gantt groups by category and adds gate markers
- Avoids risk of breaking existing functionality
- Shares utilities (bar colours, date parsing, status labels) via `@shared/utils/` -- not copy-pasted

---

## What Is NOT In Scope

- **No new node types** -- no `plm.gate`, `plm.phase`, `plm.program`, or `plm.category` nodes
- **No backend changes** -- no new Go hooks, no plugin.json node type changes
- **No logic changes to existing pages** -- product-detail, tasks-manager, my-work, reports all untouched (import paths updated for moved shared utils, no behaviour change)
- **No logic changes to existing TasksGanttView** -- it continues to work as-is (imports from `@shared/utils/` instead of `../utils/`)
- **No drag-and-drop task rescheduling** on the Gantt (Phase 2)
- **No dependency arrows** between tasks on the Gantt (Phase 2)
- **No gate approval workflow** (e.g., "gate review meeting" with sign-off) -- not needed for MVP
- **No automated gate progression** (e.g., "when all G3 tasks complete, move to G4") -- manual for now

---

## Dependencies

### Existing Infrastructure (No Changes Needed)

| Dependency | Status | Notes |
|---|---|---|
| `plm.task` node type | Exists | All required fields present |
| `plm.ticket` node type | Exists | Child of task |
| `plm.product` node type | Exists | Parent container |
| `settings.tags` field | Exists | Free-form string on tasks |
| `settings.category` field | Exists | Free-form string on tasks |
| `gantt-task-react` library | Installed | v0.3.9 in package.json |
| `@tanstack/react-query` | Installed | For data fetching/caching |
| Tailwind CSS | Installed | For styling |
| `lucide-react` | Installed | For icons |
| Plugin page registration | Supported | Via plugin.json `pages` array |

### New Dependencies

None. All libraries already installed.

---

## Success Metrics

**MVP Complete When:**
- [ ] Can view Program Dashboard from plm.service node
- [ ] Dashboard shows all products with computed gate progress
- [ ] Can view Program Gantt from any plm.product node
- [ ] Gantt shows tasks grouped by category with timeline bars
- [ ] Can assign gate tag to a task from the Gantt page
- [ ] Can assign category to a task from the Gantt page
- [ ] Gate progress updates when tasks are modified
- [ ] Existing pages and functionality are completely unaffected

**Production Ready When:**
- [ ] All above + gate target date management
- [ ] All above + responsive layout on tablet/mobile
- [ ] All above + expand task to see tickets in Gantt
- [ ] All above + filter by status, assignee, gate
- [ ] All above + loading and empty states polished

---

## Summary

This feature adds **2 new pages** (Program Dashboard + Program Gantt), **1 new feature folder** (`features/program/`), and **expands the shared layer** (`shared/constants/`, `shared/utils/`) to the PLM plugin. Reusable logic (status maps, date parsing, gate helpers) lives in `shared/` so `task/` and `program/` stay in sync. It uses **zero new node types**, relying entirely on existing `plm.task` fields:

- `settings.tags` with `gate:gN` convention for gate assignment
- `settings.category` for the 9 PLM categories
- `settings.startDate` / `settings.dueDate` for timeline bars
- `settings.status` / `settings.progress` for colouring and progress

Gate progress is **computed from tasks**, not stored. The existing task, ticket, and product infrastructure is **completely untouched**. The Program Dashboard gives a portfolio-level view, and the Program Gantt gives a per-product category-based timeline with gate markers.

**Next:** Start with Phase 1 (expand shared layer, move task utils, add constants + gate helpers, wire up hooks), then Phase 2 (Dashboard page).

---

## Peer Review Findings (Applied)

The following issues were identified in peer review and have been resolved in this document:

### Fixed: Ticket Query Unscoped to Product (was medium severity)

**Problem:** The `use-program-gantt` ticket query used `parent.type is "plm.task"` which fetches ALL tickets globally, not just for the viewed product.

**Fix:** Changed to per-task scoped queries using `Promise.all` over the product's known task IDs. See `use-program-gantt.ts` hook and "Get All Tickets for a Product" query section.

### Fixed: "Cloud" Category Missing from Constants

**Problem:** The reference UI component includes a "Cloud" category (telemetry pipeline, user access control) but the CATEGORIES constant only had 8 entries. Cloud tasks would fall into "Uncategorised".

**Fix:** Added `{ id: 'cloud', name: 'Cloud', description: 'Telemetry, pipelines, access control, infrastructure' }` to CATEGORIES. Now 9 categories as stated in the overview.

### Fixed: currentGate Requires Manual Advancement

**Problem:** `product.settings.currentGate` was manually set with no described workflow. Team leads managing 5+ products would forget to advance it, causing stale dashboards.

**Fix:** Active gate is now **auto-derived** via `deriveCurrentGate()` -- scans G1 through G8, returns the first gate with incomplete tasks. `currentGate` in product settings is now an optional manual override, not a requirement. See "Gate Progress Computation" section.

### Fixed: No Auto-Refresh on Dashboard

**Problem:** Dashboard fetched once and cached. When a developer completes a task, the team lead's view wouldn't update until manual refresh.

**Fix:** Added `refetchInterval: 30_000` (30 seconds) to both `productsQuery` and `tasksQuery` in `useProgramDashboard`. Short enough for meeting glance-views, long enough to avoid load.

### Fixed: Status Vocabulary Inconsistency

**Problem:** Dashboard project card pills use "On Track" / "At Risk" / "In Review" but Gantt task rows use "Done" / "In Progress" / "Planned". These are different vocabularies that could be confused during implementation.

**Fix:** Added explicit `STATUS_DISPLAY` (task-level) and `PROJECT_STATUS_DISPLAY` (portfolio-level) maps with a note that they must not be mixed. Each map includes the Tailwind classes for bars and badges.

### Added: "Group by" Toggle on Gantt (UX enhancement)

**Why:** Hardware and software teams work differently. A team lead managing people across disciplines needs a people-centric view -- "what is each person working on, who is overloaded, where are handoffs blocked?" The original design only grouped by category.

**Fix:** Added a `Group by: Category | Assignee | Gate` toggle to the Gantt page. Same data, same bars, just re-grouped. No new pages or queries needed. Added to Phase 3 deliverables.

### Added: Dynamic Timeline Width

**Why:** The 12-column/12-week grid works for ~3 months. Hardware compliance timelines can stretch 6+ months.

**Fix:** Documented that week count should be dynamically computed from task date range, capped at a reasonable max with horizontal scroll. Full zoom controls deferred to Phase 2.

### Noted for Phase 2 (Not MVP)

These items from the review are acknowledged but intentionally deferred:

- **Cross-category dependency visibility** (e.g., `blocked-by:task-id` tag with warning icon) -- lightweight alternative to full dependency arrows
- **"Week View" summary for standups** -- current week +/- 1 filtered view of the Gantt for 15-minute weekly syncs
- **Gate transition ceremony** -- "Advance to G3" button showing G2 completion summary with confirmation note (stored as a tag or ticket)
- **Permissions** -- who can change gate targets or advance gates (currently any user can; team lead lock deferred to Phase 2)
