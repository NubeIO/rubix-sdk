# Scope: PLM Reporting Dashboard

**Date**: 2026-04-01
**Status**: 🔵 IN PROGRESS
**Priority**: HIGH - Central visibility across all products

---

## Problem

The PLM plugin has no cross-product reporting. Each product has its own isolated stats in its detail page (OverviewSection), but there is no way to:

- See aggregate stats across all products or a selection of products
- View time entries grouped by user (who logged what hours)
- Compare task/ticket progress across products
- Get a manufacturing summary across hardware products

The current service-level page (`ProductsListPage`) only lists products and tasks — no analytics or rollups.

---

## Solution

Build a **Reporting Dashboard** as a new feature module at the service level. It provides a central snapshot page where users can:

1. **Select one or more products** to filter all report sections
2. **View aggregate KPIs** (total tasks, tickets, hours, manufacturing runs)
3. **Drill into sections** for tasks, tickets, time entries, and manufacturing

### User Query: `createdByRef`

Time entries use `createdByRef` (see [REF-TABLE.md](../../../../rubix/docs/system/v1/query/REF-TABLE.md)) to track who created each entry. This is an **audit ref** (not auth — does not affect visibility). The reporting page uses this to group hours by user.

**Query pattern:**
```
// All time entries created by a specific user
type is "core.entry" and r.createdByRef is "<user-node-id>"

// All time entries (then group client-side by createdByRef)
type is "core.entry" and parent.parent.type is "plm.ticket"
```

---

## Data Model & Queries

### Node Types Used

| Type | Purpose | Parent |
|---|---|---|
| `plm.product` | Product node | `plm.products` collection |
| `plm.task` | Task under a product | `plm.product` |
| `plm.ticket` | Ticket (product-level or task-level) | `plm.product` or `plm.task` |
| `core.entry` | Time entry on a ticket | `plm.ticket` |
| `plm.manufacturing-run` | Manufacturing run (hardware only) | `plm.product` |
| `core.asset` | Serialized unit in a run | `plm.manufacturing-run` |

### Queries

```typescript
// All products
type is "plm.product"

// All tasks for selected products
type is "plm.task" and parent.id is "<productId>"

// All tickets (product-level)
type is "plm.ticket" and parent.id is "<productId>"

// All tickets (task-level)
type is "plm.ticket" and parent.id is "<taskId>"

// Time entries for a ticket
type is "core.entry" and parent.id is "<ticketId>"

// Time entries by user (using createdByRef)
type is "core.entry" and r.createdByRef is "<userId>"

// Manufacturing runs (hardware products only)
type is "plm.manufacturing-run" and parent.id is "<productId>"

// Units in a run
type is "core.asset" and parent.id is "<runId>"
```

---

## Directory Structure

```
src/features/reporting/
├── ReportingPage.tsx              # Main entry point
├── index.ts                       # Exports
├── hooks/
│   ├── useReportingData.ts        # Fetches & aggregates all data
│   └── useProductSelector.ts      # Multi-select product state
├── components/
│   ├── ProductSelector.tsx        # Multi-select product/type picker
│   ├── DateRangeFilter.tsx        # Date range filter (7d, 30d, custom)
│   └── ReportingHeader.tsx        # Title + filters bar
└── sections/
    ├── SummaryCards.tsx            # Top-level KPI cards
    ├── TasksReport.tsx            # Task breakdown by status
    ├── TicketsReport.tsx          # Ticket breakdown by type/priority
    ├── TimeEntriesReport.tsx      # Hours by user/product/category
    └── ManufacturingReport.tsx    # Run stats (hardware only)
```

---

## Scope of Work

### Phase 1: Infrastructure

1. **Create directory structure** — `src/features/reporting/` with hooks, components, sections
2. **`useProductSelector` hook** — multi-select state, remembers selection, filters by product type
3. **`useReportingData` hook** — fetches products, then for each selected product fetches tasks, tickets, time entries, manufacturing runs. Returns aggregated stats
4. **`ReportingPage`** — main page component, wires hooks to sections

### Phase 2: Summary & Filters

5. **`ReportingHeader`** — page title, product selector, date range filter
6. **`ProductSelector`** — checkbox list of products, "Select All" toggle, filter by software/hardware
7. **`DateRangeFilter`** — preset buttons (7d, 30d, 90d, All) + custom date range
8. **`SummaryCards`** — top-level KPI cards:
   - Total Products (selected)
   - Total Tasks + % completed
   - Total Tickets + open vs closed
   - Total Hours Logged
   - Manufacturing Runs (hardware only, hidden if no hardware selected)

### Phase 3: Report Sections

9. **`TasksReport`** — table/chart of tasks grouped by status across selected products
   - Columns: Product | Task | Status | Priority | Assignee | Due Date
   - Status breakdown bar per product
10. **`TicketsReport`** — ticket stats across selected products
    - Group by type (support, bug, feature, chore, RMA)
    - Group by priority (Critical, High, Medium, Low)
    - Group by status (pending, in-progress, blocked, completed)
11. **`TimeEntriesReport`** — hours logged, grouped by user via `createdByRef`
    - Columns: User | Product | Ticket | Date | Hours | Category | Description
    - Summary row: total hours per user
    - Filter by user, category, date range
12. **`ManufacturingReport`** — manufacturing run summary (hardware products only)
    - Auto-hidden when only software products selected
    - Columns: Product | Run # | Status | Target | Produced | QA Failures
    - Unit breakdown per run

### Phase 4: Integration

13. **Add "Reports" tab** to `ProductsListPage` alongside "Products" and "Tasks"
14. **Wire up lazy loading** for the reporting page

---

## Key Ref: `createdByRef` for Time Entries

From [REF-TABLE.md](../../../../rubix/docs/system/v1/query/REF-TABLE.md):

> `createdByRef` — Who created the node → user. Optional audit trail. NOT auth — does not affect visibility.

### How it works in reporting:

1. **Fetch all time entries** across selected products (walk: product → tasks → tickets → entries)
2. **Each `core.entry` node has `createdByRef`** pointing to the user who created it
3. **Group entries by `createdByRef`** to show hours per user
4. **Query shortcut**: `type is "core.entry" and r.createdByRef is "<userId>"` to filter entries by a specific user

### TimeEntry Node Shape

```typescript
interface TimeEntry {
  id: string;
  name: string;
  type: 'core.entry';
  parentId: string;          // Ticket ID
  refs?: {
    createdByRef?: string;   // User node ID who created this entry
  };
  settings?: {
    date: string;
    hours: number;
    userId: string;          // Legacy — prefer createdByRef
    userName?: string;
    description?: string;
    category?: string;       // e.g., "development", "qa", "support"
  };
}
```

**Note**: `settings.userId` is the legacy field. Going forward, `createdByRef` is the canonical way to identify who created the entry. The reporting page should read `createdByRef` first, fall back to `settings.userId`.

---

## UI Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│  📊 Reporting Dashboard                                         │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Products: [multi]│  │ Type: [All ▼]│  │ Date: [Last 30d] │   │
│  └──────────────────┘  └──────────────┘  └──────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │Products │ │ Tasks   │ │Tickets  │ │ Hours   │ │Mfg Runs │  │
│  │    5    │ │   23    │ │   41    │ │  120h   │ │    3    │  │
│  │selected │ │ 60% done│ │ 12 open │ │ 5 users │ │hw only  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TASKS BY STATUS                    TICKETS BY TYPE              │
│  ┌────────────────────────┐         ┌──────────────────────┐     │
│  │ Product  │ P │ IP│ C  │         │ Bug: 8   Feature: 18│     │
│  │ Rubix    │ 2 │ 5 │ 3  │         │ Support: 12  RMA: 3 │     │
│  │ Widget   │ 1 │ 8 │ 4  │         │ Chore: 0            │     │
│  └────────────────────────┘         └──────────────────────┘     │
│                                                                  │
│  TIME ENTRIES BY USER (via createdByRef)                         │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ User    │ Product │ Ticket       │ Hours │ Category      │    │
│  │ Alice   │ Rubix   │ Fix login    │ 4.0h  │ Development   │    │
│  │ Alice   │ Rubix   │ Add search   │ 2.5h  │ Development   │    │
│  │ Bob     │ Widget  │ QA batch #3  │ 8.0h  │ QA            │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │ TOTAL: Alice 6.5h │ Bob 8.0h │ Grand total: 14.5h       │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  MANUFACTURING RUNS (hardware only)                              │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ Product │ Run #   │ Status  │ Target │ Done │ QA Fail   │    │
│  │ Widget  │ MFG-001 │ In Prog │ 100    │ 50   │ 2         │    │
│  │ Widget  │ MFG-002 │ Planned │ 200    │ 0    │ 0         │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Open Questions

- [ ] Should we cache aggregated data or always fetch fresh on page load?
- [ ] Do we need CSV/PDF export for reports?
- [ ] Should time entries be editable from the reporting page or read-only?
- [ ] Do we want charts (bar/pie) or is tabular enough for v1?
