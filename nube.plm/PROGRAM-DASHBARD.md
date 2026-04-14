# Program Dashboard — User Guide

The Program Dashboard is a two-panel workspace for managing product development through a structured gate process. It gives you a single view of all your projects, tasks, and tickets with both a list and timeline (Gantt) view.

---

## Overview

The dashboard is split into two main areas:

- **Left sidebar** — Your project list. Select which projects to view by checking/unchecking them.
- **Right workspace** — The task view for your selected projects, with gate tabs along the top.

At the top you'll see a stats bar showing completed tasks, in-progress count, blocked count, and average progress across all visible tasks.

---

## Projects

Projects represent products or initiatives moving through the development pipeline. Each project has its own color and icon, making it easy to tell tasks apart when viewing multiple projects.

### Creating a project

Click **+ New** in the sidebar header. Fill in the project name, category (Hardware, Software, Hybrid, Firmware, or Bundle), and optionally set a status and product code.

### Customising a project

- **Rename** — Double-click the project name in the sidebar.
- **Change icon** — Right-click or use the icon picker on the project item.
- **Change color** — Pick a color from the color picker. This color flows through to task rows (left border accent) and timeline bars.

### Selecting projects

- Check/uncheck individual projects in the sidebar.
- Use **All** / **None** at the top to quickly select or deselect everything.
- When multiple projects are selected, tasks are grouped under project headers in the list view.

---

## Gates

The gate process follows 8 sequential stages. Each gate represents a milestone in the product lifecycle:

| Gate | Name | Purpose |
|------|------|---------|
| G1 | Executive Summary | Define the problem, solution intent, and strategic alignment |
| G2 | Proof of Concept | Validate core concept and confirm technical viability |
| G3 | MVP (Build) | Develop an end-to-end working version with core functionality |
| G4 | Client Acceptance | Deploy to a live environment and confirm real-world requirements |
| G5 | Product Refinement | Resolve issues, stabilise performance, and lock the design |
| G6 | Production Ready | Ensure full manufacturing and compliance readiness |
| G7 | Go-To-Market | Prepare launch and enable sales adoption |
| G8 | Scale & Support | Operate, support, and improve as the product scales |

### Gate tabs

Along the top of the workspace you'll see tabs for **All** and each gate (G1 through G8). Click a tab to filter tasks to that gate only. Each tab shows the task count and a status indicator (green = done, blue = active, grey = not started).

---

## Tasks

Tasks are the core work items. Each task belongs to a project and can be assigned to a gate.

### Creating a task

Click **+ New Task** in the top-right corner. If you have multiple projects selected, you'll be asked to pick which project the task belongs to.

### Task fields

| Field | Description |
|-------|-------------|
| Name | What the task is (required) |
| Project | Which project it belongs to |
| Gate | Which gate stage (G1-G8) |
| Category | Work area — Hardware, Firmware, Software, Cloud, Testing, Manufacturing, Compliance, Operations, or GTM |
| Status | Current state — Pending, In Progress, Blocked, Review, Completed, or Cancelled |
| Priority | Low, Medium, High, or Critical |
| Assignee(s) | One or more team members |
| Start Date | When work begins |
| Due Date | When work is due |
| Progress | 0-100% completion |
| Auto-progress | When enabled, progress is calculated automatically from completed tickets |

### Inline editing

In the list view, you can change **Status**, **Gate**, and **Category** directly from dropdown menus in the task row — no need to open the edit dialog.

### Expanding a task

Click the arrow next to a task to expand it. This shows:
- All tickets under the task
- An activity feed with task history
- Quick buttons to add, edit, or delete tickets

---

## Tickets

Tickets are sub-items under a task. They represent the specific pieces of work needed to complete the task.

### Creating a ticket

Expand a task and click **+ Add ticket**, or hover over a task row and click **+ticket**.

### Ticket fields

| Field | Description |
|-------|-------------|
| Name | What the ticket is (required) |
| Type | Task, Bug, Feature, or Chore |
| Status | Pending, In Progress, Blocked, Review, Completed, or Cancelled |
| Priority | Low, Medium, High, or Critical |

### Auto-progress

If a task has **auto-progress** enabled, its progress percentage is calculated from its tickets. For example, if a task has 4 tickets and 2 are completed, the task shows 50% progress.

---

## List View

The default view. Shows tasks in a table with columns for the task name, category, gate, status, due date, progress, and assignee.

### Project grouping

When multiple projects are selected, tasks are grouped under coloured project headers. The header shows the project name, its colour dot, and the task count. Each task row also has a coloured left border matching its project.

### Columns

| Column | Shows |
|--------|-------|
| Task | Task name with status dot |
| Category | Work area (inline dropdown) |
| Gate | Gate assignment (inline dropdown, visible in "All" tab) |
| Status | Current status (inline dropdown) |
| Due | Due date with overdue warning |
| Progress | Progress bar with percentage |
| Assignee | Assigned team member |

### Bulk actions

Select multiple tasks using the checkboxes on the left, then use the bulk action bar to:
- **Change status** of all selected tasks at once
- **Move to gate** — reassign all selected tasks to a different gate
- **Delete** all selected tasks

---

## Timeline (Gantt) View

Switch to the timeline view using the **List / Timeline** toggle in the top-right corner.

The timeline shows tasks as horizontal bars on a calendar. Each bar is coloured to match the task's project colour. Tickets appear as lighter-coloured child bars nested under their parent task.

### Date navigation

Use the controls at the top of the timeline:

- **Left arrow** — Move the view backward in time
- **Today** — Jump back to the current month
- **Right arrow** — Move the view forward in time

### Date range

Choose how much time to show:

| Range | View mode | Best for |
|-------|-----------|----------|
| 1 Month | Weekly columns | Detailed short-term planning |
| 3 Months | Weekly columns | Sprint-level overview |
| 6 Months | Monthly columns | Quarterly planning |
| 1 Year | Monthly columns | Roadmap view |
| 2 Years | Yearly columns | Long-term strategy |

### Reading the timeline

- **Coloured bars** — Tasks, coloured by their project colour
- **Lighter bars** — Tickets nested under their parent task
- **Progress fill** — A darker shade fills the bar from the left to show completion percentage
- **Today marker** — A subtle highlighted column marks the current week/month
- **Hover tooltip** — Hover over any bar to see the task name, date range, duration, and progress

### Clicking a bar

Click any task bar to open the edit dialog for that task.

---

## Filters

All filters are consolidated into a single **Filters** button in the header toolbar. Click it to open a popover with all filter categories:

| Filter | Options |
|--------|---------|
| Status | Pending, In Progress, Blocked, Review, Completed, Cancelled |
| Priority | Low, Medium, High, Critical |
| Category | Hardware, Firmware, Software, Cloud, Testing, Manufacturing, Compliance, Operations, GTM |
| Gate | G1 through G8 |
| Assignee | Search and select team members |

Each filter uses a chip/tag style — click a value to toggle it on or off. Active filters are shown as a count badge on the Filters button. Click **Clear all** inside the popover to reset everything.

Filters apply to both the list view and the timeline view.

---

## Stats Cards

Below the header toolbar, four stat cards show a quick summary of your visible (filtered) tasks:

- **Tasks** — Completed vs total (e.g. "3/10 completed") with a check icon
- **In Progress** — Count of tasks currently being worked on (blue)
- **Blocked** — Count of blocked tasks (red when > 0)
- **Avg Progress** — Average completion percentage across all visible tasks

Each card has an icon and is styled as a compact bordered card for clarity.

---

## Header Toolbar

The header toolbar uses icon-only buttons to keep the interface compact:

- **Filters** — Opens the unified filter popover (shows active count badge)
- **Refresh** — Reload data from the server
- **List / Timeline** — Icon toggle to switch between list and timeline views
- **+** (Plus) — Create a new task. If no projects exist yet, this opens a guided wizard that walks you through creating your first project before adding tasks

---

## Typical Workflow

1. **Create a project** for your product or initiative
2. **Set the project colour and icon** so it's easy to identify
3. **Create tasks** and assign them to gates, categories, and team members
4. **Add tickets** under each task for the specific work items
5. **Enable auto-progress** on tasks so progress updates automatically as tickets are completed
6. **Use gate tabs** to focus on one stage at a time
7. **Use filters** to find tasks by status, priority, assignee, etc.
8. **Switch to timeline view** to see the schedule and identify overlaps or gaps
9. **Use bulk actions** to move multiple tasks through gates or update statuses together

---
---

# Developer Reference

This section covers the code structure, data flow, and key files for developers working on the Program Dashboard.

---

## Folder Structure

```
nube.plm/frontend/src/features/program/
├── hooks/
│   ├── use-dashboard-state.ts       Central state hook — all UI state, filters, CRUD, bulk actions
│   ├── use-program-dashboard.ts     Data fetching — products, tasks, gate progress
│   ├── use-program-gantt.ts         Per-product Gantt data — tasks grouped by category
│   └── use-gate-targets.ts          Gate target management
│
├── pages/
│   ├── ProgramDashboardPage.tsx     Main page — composes all components, mounts/unmounts
│   ├── ProgramGanttPage.tsx         Per-product Gantt page (category rows + week columns)
│   ├── constants.ts                 Status list, status styles, product categories/statuses
│   │
│   ├── components/
│   │   ├── DashboardHeader.tsx      Top bar — title, stats, refresh, view toggle, filter bar
│   │   ├── ProjectSidebar.tsx       Left panel — project list with select/create/rename
│   │   ├── TaskListView.tsx         Task table — project grouping, column headers, task rows
│   │   ├── TaskRow.tsx              Single task row — inline editing, expand for tickets
│   │   ├── TimelineView.tsx         Gantt chart — gantt-task-react wrapper with navigation
│   │   ├── FilterBar.tsx            Multi-select filters for status, priority, category, gate, assignee
│   │   ├── BulkActionBar.tsx        Sticky bar for bulk status/gate/delete on selected tasks
│   │   ├── GateTab.tsx              Gate tab button with count and status indicator
│   │   ├── ProjectItem.tsx          Single project row in sidebar
│   │   ├── IconColorPicker.tsx      Icon and colour picker for projects
│   │   ├── MiniStat.tsx             Small stat display (label + value)
│   │   ├── Dropdown.tsx             Inline dropdown for task fields
│   │   ├── DueDate.tsx              Due date display with overdue indicator
│   │   ├── MultiSelectFilter.tsx    Reusable multi-select dropdown
│   │   └── ActivityFeed.tsx         Task activity/change history
│   │
│   └── dialogs/
│       ├── TaskFormDialog.tsx       Create/edit task — all fields including assignees
│       ├── TicketFormDialog.tsx      Create/edit ticket — name, type, status, priority
│       └── ProjectFormDialog.tsx     Create project — name, category, status, product code
│
├── types/
│   └── program.types.ts             GateProgress, ProductSummary, GanttTask, CategoryGroup
│
├── utils/
│   └── gantt-helpers.ts             Date math for the legacy custom timeline (week indexes, bar spans)
│
└── (shared)
    src/shared/
    ├── constants/gates.ts           Gate definitions — G1 through G8 with names and descriptions
    ├── constants/categories.ts      9 task categories with IDs, names, and descriptions
    └── utils/gate-helpers.ts        getTaskGate, setTaskGate, deriveCurrentGate, computeGateProgress
```

---

## Data Flow

```
ProgramDashboardPage
  │
  └─ useDashboardState(orgId, deviceId, baseUrl, token)
       │
       ├─ useProgramDashboard()        ← fetches products + tasks from API
       │    └─ returns: productData[], isLoading, error, refetch
       │
       ├─ createPluginClient()         ← API client for CRUD operations
       │
       └─ returns everything the page needs:
            ├─ Data:        productData, visibleTasks, combinedGateProgress, stats
            ├─ Selection:   selectedProjectIds, selectedProjects, toggleProject
            ├─ Filters:     activeGate, filters, allAssignees
            ├─ Task CRUD:   updateTaskField, updateTaskGate, deleteTask, saveTask
            ├─ Ticket CRUD: loadTickets, deleteTicket, saveTicket
            ├─ Bulk:        bulkUpdateStatus, bulkUpdateGate, bulkDelete
            ├─ Project:     renameProject, changeProjectIcon, changeProjectColor, saveProject
            ├─ View state:  viewMode, expandedTasks, taskTickets, projectColorMap
            └─ Dialogs:     showTaskDialog, showTicketDialog, showProjectDialog, saving
```

The page component (`ProgramDashboardPage`) does no logic — it just passes the hook's return values down to the layout components.

---

## Key Files Explained

### useDashboardState (hooks/use-dashboard-state.ts)

The central state hook. Contains all `useState`, `useCallback`, `useMemo`, and `useEffect` calls. This was extracted from the page component to keep it focused on layout.

Responsibilities:
- Project selection (toggle, select all/none)
- Gate and filter state
- Visible tasks computation (applies gate tab + all filters)
- Gate progress aggregation across selected projects
- Lazy ticket loading with force-refresh support
- Auto-progress calculation from tickets
- Stats computation (totals, averages)
- All CRUD operations (task, ticket, project) via the plugin client
- Bulk action handlers
- Dialog save callbacks

### ProgramDashboardPage (pages/ProgramDashboardPage.tsx)

The page component. Calls `useDashboardState` and composes:
- `DashboardHeader` — top bar with stats, filters, view toggle
- `ProjectSidebar` — left panel
- `GateTab` — gate filter tabs
- `TaskListView` or `TimelineView` — depending on view mode
- `TaskFormDialog`, `TicketFormDialog`, `ProjectFormDialog` — modal dialogs

### TaskListView (pages/components/TaskListView.tsx)

Groups tasks by project (when multiple projects selected) and renders `TaskRow` for each task. Handles:
- Project group headers with colour dot and task count
- Column headers
- Empty state with create button
- Passes all callbacks down to TaskRow

### TimelineView (pages/components/TimelineView.tsx)

Wraps `gantt-task-react` library. Converts internal task/ticket data into the library's `Task` format. Handles:
- Date range presets (1m/3m/6m/1y/2y) mapped to ViewMode (Week/Month/Year)
- Back/Today/Forward navigation
- Project colour mapping to bar colours (tickets use a lighter shade)
- Custom dark tooltip component
- CSS overrides to match the app theme

---

## Data Model

### Task

```
{
  id: string
  name: string
  parentId: string              ← project ID (this is how tasks belong to projects)
  settings: {
    status: string              ← pending | in-progress | blocked | review | completed | cancelled
    category: string            ← hardware | firmware | software | cloud | testing | ...
    priority: string            ← Low | Medium | High | Critical
    assignee: string
    tags: string                ← comma-separated, includes gate marker like "gate:g2"
    startDate: string           ← YYYY-MM-DD
    dueDate: string             ← YYYY-MM-DD
    progress: number            ← 0-100
    autoProgress: boolean       ← derive progress from ticket completion
  }
}
```

### Ticket

```
{
  id: string
  name: string
  parentId: string              ← task ID
  settings: {
    ticketType: string          ← task | bug | feature | chore
    status: string              ← same statuses as tasks
    priority: string            ← Low | Medium | High | Critical
  }
}
```

### Project (Product)

```
{
  id: string
  name: string
  settings: {
    icon: string                ← Lucide icon name
    iconColor: string           ← hex colour (used for sidebar dot, task border, timeline bars)
    category: string            ← hardware | software | hybrid | firmware | bundle
    status: string              ← Design | Prototype | Production | Discontinued
    productCode: string
  }
}
```

---

## Shared Utilities

### Gate helpers (shared/utils/gate-helpers.ts)

- `getTaskGate(tags)` — extracts gate ID from a task's comma-separated tags string
- `setTaskGate(tags, gateId)` — replaces or adds the gate tag
- `deriveCurrentGate(tasks)` — finds the earliest gate with incomplete tasks
- `computeGateProgress(tasks)` — returns per-gate stats: `{ gateId, totalTasks, completedTasks, averageProgress, status }`

### Constants

- **Gates** (`shared/constants/gates.ts`) — array of 8 gate objects with `id`, `name`, and `description`
- **Categories** (`shared/constants/categories.ts`) — array of 9 category objects with `id`, `name`, and `description`
- **Statuses** (`pages/constants.ts`) — `['pending', 'in-progress', 'blocked', 'review', 'completed', 'cancelled']`
- **Status styles** (`pages/constants.ts`) — dot colour, background, and text colour per status

---

## Third-Party Libraries

| Library | Used for |
|---------|----------|
| `gantt-task-react` | Timeline/Gantt chart rendering (ViewMode, bar rendering, tooltips) |
| `@radix-ui/*` | UI primitives — dialogs, selects, progress bars, popovers |
| `lucide-react` | Icons throughout the UI |
| `@tanstack/react-table` | Available but not currently used in the dashboard |
| `@dnd-kit/*` | Drag and drop (available, not used in dashboard) |
