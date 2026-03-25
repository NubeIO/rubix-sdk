# Task Management for PLM Plugin

**Status:** ✅ Base implementation complete
**Date:** 2026-03-25

---

## Overview

Added task management functionality to the PLM plugin, allowing users to organize product development work using tasks and time entries.

## Hierarchy

```
plm.product (Product)
  └─ core.task (Task)
      └─ core.entry (Time Entry)
```

**Example:**
```
Product: "Backend System"
├─ Task: "Add Database"
│   ├─ Entry: "3h - schema design"
│   └─ Entry: "5h - migration scripts"
└─ Task: "Add Websocket"
    └─ Entry: "2h - connection handling"
```

---

## Changes Made

### 1. plugin.json Updates

**Added `core.task` to coreNodeTypes:**
```json
"coreNodeTypes": [
  "core.asset",
  "core.component",
  "core.document",
  "core.entry",
  "core.product",
  "core.service",
  "core.task",     // ← NEW
  "core.ticket"
]
```

**Added task node profile:**
```json
{
  "type": "core.task",
  "profile": "plm-task",
  "displayName": "Task",
  "description": "Product development task or work item",
  "icon": "list-checks",
  "color": "#8b5cf6",
  "category": "manufacturing",
  "constraints": {
    "allowedParents": ["plm.product"]
  },
  "autoFields": {
    "identity": ["task", "plm"]
  }
}
```

**Updated `core.entry` to allow both tasks and tickets:**
```json
{
  "type": "core.entry",
  "profile": "plm-time-entry",
  "displayName": "Time Entry",
  "description": "Time tracking for tasks and work items",
  "constraints": {
    "allowedParents": ["core.task", "core.ticket"]  // ← Both allowed
  }
}
```

**Added tasks page:**
```json
{
  "pageId": "tasks-manager",
  "title": "Task Management",
  "icon": "list-checks",
  "description": "Manage product tasks",
  "nodeTypes": ["plm.product"],
  "enabled": true,
  "isDefault": false,
  "order": 11,
  "props": {
    "exposedPath": "./TasksPage",
    "useMountPattern": true
  }
}
```

### 2. Frontend Structure

**Created files:**
```
frontend/src/features/task/
├── types/
│   └── task.types.ts           # Task type definitions
├── api/
│   └── task-api.ts             # CRUD operations
├── components/
│   ├── TaskStatusBadge.tsx     # Status badge component
│   └── TaskTable.tsx           # Task table with right-click menu
└── pages/
    ├── tasks-page-tabs.tsx     # Tabbed filtering (All, To Do, In Progress, Completed)
    └── TasksPage.tsx           # Main page entry point
```

**Updated:**
- `vite.config.ts` - Added `'./TasksPage'` to exposes

### 3. Features Implemented

**Task Table:**
- ✅ Task name + description preview
- ✅ Status badge (To Do, In Progress, Review, Blocked, Completed, Cancelled)
- ✅ Priority badge (Low, Medium, High, Critical)
- ✅ Progress bar (0-100%)
- ✅ Assignee column
- ✅ Edit/Delete actions
- ✅ Right-click context menu
- ✅ Compact mode support

**Tabs:**
- ✅ All tasks
- ✅ To Do (status: "todo")
- ✅ In Progress (status: "in_progress")
- ✅ Completed (status: "completed")
- ✅ Lazy loading (only active tab fetches)
- ✅ Per-tab refresh

**Task Settings (from core.task):**
- `title` - Task title/summary
- `description` - Detailed description
- `status` - todo, in_progress, review, blocked, completed, cancelled
- `priority` - low, medium, high, critical
- `progress` - 0-100% completion
- `completed` - Boolean flag
- `assignee` - Assigned user
- `reporter` - Who created the task
- `category` - Task category
- `dueDate` - ISO 8601 date
- `startDate` - ISO 8601 date
- `completedAt` - ISO 8601 timestamp
- `estimatedHours` - Time estimate
- `actualHours` - Actual time spent
- `storyPoints` - Complexity estimate
- `blocked` - Is task blocked?
- `blockedReason` - Why blocked
- `tags`, `labels`, `notes` - Additional metadata

---

## How to Use

### 1. Access Task Manager

1. Navigate to a `plm.product` node in the sidebar
2. Right-click → "Task Management" (or click from page tabs)
3. Task manager page opens

### 2. Create a Task

1. Click "Create Task" button
2. Fill in task details (name, status, priority, assignee, etc.)
3. Task is created under the product with `parentId` set correctly

### 3. Manage Tasks

- **Edit:** Click edit icon or right-click → Edit
- **Delete:** Click trash icon or right-click → Delete
- **Filter:** Use tabs to filter by status
- **Refresh:** Click refresh button to reload

### 4. Add Time Entries

Time entries can be added under tasks:
- Create `core.entry` node with `parentId` = task ID
- Entry will automatically get identity: `["entry", "timesheet", "plm"]`
- Track hours, dates, billable status, etc.

---

## Query Examples

**Get all tasks for a product:**
```
type is "core.task" and parentId is "{productId}"
```

**Get tasks by status:**
```
type is "core.task" and parentId is "{productId}" and settings.status is "in_progress"
```

**Get tasks by priority:**
```
type is "core.task" and settings.priority is "high"
```

**Get time entries for a task:**
```
type is "core.entry" and parentId is "{taskId}"
```

**Get all PLM tasks (across all products):**
```
identity contains ["task", "plm"]
```

---

## Still TODO (Future Enhancements)

### Dialogs
- [ ] Create task dialog (form for all settings)
- [ ] Edit task dialog (similar to products)
- [ ] Delete task confirmation dialog
- [ ] Bulk operations (multi-select)

### Entry Management
- [ ] Entry table component
- [ ] Entry CRUD dialogs
- [ ] Time entry aggregation (total hours per task)
- [ ] Entry page (nested under task page)

### Advanced Features
- [ ] Task dependencies (blockedBy refs)
- [ ] Task templates
- [ ] Kanban board view
- [ ] Gantt chart view
- [ ] Sprint/milestone grouping
- [ ] Task assignment to teams (via ownership)
- [ ] Task notifications
- [ ] Task comments/activity log

### Integration
- [ ] Link tasks to BOM items
- [ ] Link tasks to releases
- [ ] Link tasks to manufacturing runs
- [ ] GitHub issue sync (optional)

---

## Architecture Notes

### Why core.task Instead of Custom Type?

Following the V2 design principle: **Maximize core node reuse**

✅ **Benefits:**
- Reuses existing `core.task` implementation
- AI tools already understand core.task
- Query engine works out-of-box
- No custom Go code needed
- Consistent with PLM V2 philosophy

### Parent Relationships

Tasks use `parentId` (NOT refs) for hierarchy:
- `task.parentId` → Product UUID
- `entry.parentId` → Task UUID

**Why parentId?**
- Enforces hierarchy constraints
- Faster queries (indexed)
- Deletion cascades automatically
- Standard Rubix pattern

### Identity Tags

Tasks get auto-tagged: `["task", "plm"]`
Entries get auto-tagged: `["entry", "timesheet", "plm"]`

**Query pattern:**
```
identity contains ["task", "plm"]
```

---

## Testing

### Manual Test Steps

1. **Deploy plugin:**
   ```bash
   cd /home/user/code/go/nube/rubix-sdk/nube.plm
   make build
   ./deploy.sh
   ```

2. **Create product:**
   - Navigate to PLM service
   - Create a test product

3. **Open task manager:**
   - Right-click product → "Task Management"
   - Verify page loads

4. **Create tasks:**
   - Click "Create Task"
   - Fill in details
   - Verify task appears in table

5. **Test filters:**
   - Create tasks with different statuses
   - Switch between tabs
   - Verify filtering works

6. **Test CRUD:**
   - Edit task (change status, priority)
   - Delete task
   - Verify changes persist

### API Test

```bash
# Create task
curl -X POST http://localhost:1660/api/v1/{orgId}/{deviceId}/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Add Database",
    "type": "core.task",
    "parentId": "{productId}",
    "settings": {
      "title": "Add Database",
      "description": "Implement PostgreSQL database",
      "status": "in_progress",
      "priority": "high",
      "progress": 25,
      "assignee": "john.doe",
      "estimatedHours": 16
    }
  }'

# Query tasks
curl "http://localhost:1660/api/v1/{orgId}/{deviceId}/query?filter=type%20is%20%22core.task%22%20and%20parentId%20is%20%22{productId}%22"
```

---

## Files Changed

**Backend:**
- `plugin.json` - Added task node, entry parent update, tasks page

**Frontend:**
- `vite.config.ts` - Exposed TasksPage
- `src/features/task/types/task.types.ts` - NEW
- `src/features/task/api/task-api.ts` - NEW
- `src/features/task/components/TaskStatusBadge.tsx` - NEW
- `src/features/task/components/TaskTable.tsx` - NEW
- `src/features/task/pages/tasks-page-tabs.tsx` - NEW
- `src/features/task/pages/TasksPage.tsx` - NEW

---

## Next Steps

1. **Implement dialogs** - Create/Edit/Delete task dialogs
2. **Add entry management** - Entry table and CRUD
3. **Test with real data** - Deploy and test workflow
4. **Add advanced features** - Dependencies, templates, boards

---

**Last Updated:** 2026-03-25
