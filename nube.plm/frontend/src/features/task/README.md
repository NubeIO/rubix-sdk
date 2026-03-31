# Task Domain

**Status**: 🚧 Placeholder - Not Yet Implemented

This directory contains all code related to **Tasks** (work items, time tracking, timesheets).

**Core Node Types Used:**
- `core.ticket` - Tasks, work items, issues
- `core.entry` - Time entries, time logs

---

## 📁 Directory Structure

```
task/
├── api/
│   ├── task-api.ts                     # CRUD for core.ticket nodes
│   ├── time-entry-api.ts               # CRUD for core.entry nodes
│   └── index.ts
├── hooks/
│   ├── use-tasks.ts                    # Multiple tasks hook
│   ├── use-task.ts                     # Single task hook
│   ├── use-time-entries.ts             # Time entries for a task
│   ├── use-timesheet.ts                # Timesheet aggregation
│   └── index.ts
├── types/
│   ├── task.types.ts                   # core.ticket interfaces
│   ├── time-entry.types.ts             # core.entry interfaces
│   └── index.ts
├── components/
│   ├── TaskList.tsx                    # List of tasks
│   ├── TaskCard.tsx                    # Task card component
│   ├── TaskForm.tsx                    # Create/edit task form
│   ├── TaskBoard.tsx                   # Kanban board view
│   ├── TaskStatusBadge.tsx             # Status badge
│   ├── TaskPriorityBadge.tsx           # Priority badge
│   ├── TaskAssignee.tsx                # Assignee selector
│   ├── TimeEntryForm.tsx               # Log time form
│   ├── TimeEntryList.tsx               # List of time entries
│   ├── TimesheetView.tsx               # Timesheet summary
│   ├── TaskFilters.tsx                 # Filter controls
│   └── index.ts
├── pages/
│   ├── TasksListPage.tsx               # Main tasks page (list/board)
│   ├── TaskDetailPage.tsx              # Single task detail
│   ├── TimesheetPage.tsx               # Time tracking page
│   └── index.ts
├── widgets/
│   ├── TaskBoardWidget.tsx             # Dashboard Kanban widget
│   ├── MyTasksWidget.tsx               # User's assigned tasks
│   └── TimesheetWidget.tsx             # Weekly timesheet
├── utils/
│   ├── task-formatters.ts              # Format task data
│   └── time-calculations.ts            # Time math utilities
└── README.md
```

---

## 🎯 Key Features (Planned)

### Task Management (core.ticket)
- **Create Tasks**: Add tasks to projects, runs, or standalone
- **Assign Tasks**: Assign to users or teams
- **Track Status**: todo → in-progress → review → completed
- **Set Priority**: low, medium, high, urgent
- **Add Deadlines**: Due dates with reminders
- **Dependencies**: Link related tasks (blocked by, blocks)
- **Labels/Tags**: Categorize with identity tags

### Time Tracking (core.entry)
- **Log Time**: Record hours worked on tasks
- **Timesheet View**: Weekly/daily time summaries
- **Billable Tracking**: Mark time as billable/non-billable
- **Time Reports**: Aggregate time by task/user/project
- **Quick Entry**: Fast time logging from task cards

---

## 📊 Data Models

### Task (core.ticket)

```typescript
interface Task {
  id: string;
  name: string;                         // Task title
  type: 'core.ticket';
  identity: ['ticket', 'work-item', 'task'];
  parentId?: string;                    // Project, run, or other parent
  settings: {
    // Core ticket fields
    ticketType: 'task' | 'bug' | 'feature' | 'chore';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in-progress' | 'review' | 'completed' | 'cancelled';
    assignedTo?: string;                // User ID or team ID
    assignedToType?: 'user' | 'team';

    // Dates
    createdDate: string;
    dueDate?: string;
    completedDate?: string;

    // Estimation
    estimatedHours?: number;
    actualHours?: number;               // Calculated from time entries

    // Description & details
    description?: string;
    acceptanceCriteria?: string;

    // Dependencies
    blockedBy?: string[];               // Task IDs that block this
    blocks?: string[];                  // Task IDs this blocks

    // Refs
    projectRef?: string;                // Link to project
    runRef?: string;                    // Link to manufacturing run

    // Labels
    labels?: string[];                  // Custom labels
  };
}
```

### Time Entry (core.entry)

```typescript
interface TimeEntry {
  id: string;
  name: string;                         // Entry description
  type: 'core.entry';
  identity: ['entry', 'time', 'timesheet'];
  parentId: string;                     // REQUIRED - parent task ID
  settings: {
    // Core entry fields
    entryType: 'time';

    // Time data
    hours: number;                      // Hours worked
    date: string;                       // Date worked (ISO 8601)

    // User tracking
    userId: string;                     // Who logged the time
    userName?: string;                  // Cache user name

    // Billing
    billable: boolean;                  // Is this billable time?
    rate?: number;                      // Hourly rate (if billable)
    amount?: number;                    // Calculated: hours * rate

    // Description
    description?: string;               // What was done

    // Refs
    taskRef: string;                    // Link to parent task (same as parentId)
    projectRef?: string;                // Link to project (inherited)
    runRef?: string;                    // Link to run (inherited)
  };
}
```

---

## 🚀 Getting Started (When Implementing)

### Step 1: Define Types

```typescript
// types/task.types.ts
export interface Task {
  // ... (see above)
}

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'task' | 'bug' | 'feature' | 'chore';

// types/time-entry.types.ts
export interface TimeEntry {
  // ... (see above)
}

export interface TimesheetSummary {
  userId: string;
  week: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  entries: TimeEntry[];
}
```

### Step 2: Create API Client

```typescript
// api/task-api.ts
export class TaskAPI {
  async queryTasks(filters: TaskFilters): Promise<Task[]> {
    // Query: type is 'core.ticket' AND identity contains ['task']
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    // POST /v1/nodes with type: 'core.ticket'
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    // PATCH /v1/nodes/:id
  }

  async deleteTask(id: string): Promise<void> {
    // DELETE /v1/nodes/:id
  }
}

// api/time-entry-api.ts
export class TimeEntryAPI {
  async logTime(taskId: string, input: LogTimeInput): Promise<TimeEntry> {
    // POST /v1/nodes with type: 'core.entry', parentId: taskId
  }

  async getTimesheet(userId: string, startDate: string, endDate: string): Promise<TimesheetSummary> {
    // Query all time entries for user in date range
  }
}
```

### Step 3: Build Components

**Core Components:**
1. `TaskList.tsx` - Table/list view with sorting, filtering
2. `TaskBoard.tsx` - Kanban board (drag-and-drop between status columns)
3. `TaskCard.tsx` - Individual task card (shows in list/board)
4. `TaskForm.tsx` - Create/edit dialog
5. `TimeEntryForm.tsx` - Log time dialog
6. `TimesheetView.tsx` - Weekly timesheet grid

### Step 4: Build Pages

**Main Pages:**
1. `TasksListPage.tsx` - All tasks (list or board view toggle)
2. `TaskDetailPage.tsx` - Single task with time entries
3. `TimesheetPage.tsx` - Time tracking page

### Step 5: Integration Points

**Project Integration:**
```typescript
// project/pages/project-tasks-tab.tsx
import { TaskList, TaskForm } from '@/task/components';
import { useTasksByProject } from '@/task/hooks';

export function ProjectTasksTab({ projectId }) {
  const { tasks, createTask } = useTasksByProject(projectId);

  return (
    <div>
      <TaskList tasks={tasks} />
      <TaskForm onSubmit={(data) => createTask(data)} />
    </div>
  );
}
```

---

## 📚 Related Domains

- **project/** - Tasks assigned to projects
- **production-run/** - Tasks assigned to manufacturing runs
- **serialized-unit/** - Tasks for unit-specific work

---

## 🎨 UI Patterns

### Task Status Flow

```
┌──────┐   ┌─────────────┐   ┌────────┐   ┌───────────┐
│ Todo │──▶│ In Progress │──▶│ Review │──▶│ Completed │
└──────┘   └─────────────┘   └────────┘   └───────────┘
                                               │
                                               ▼
                                          ┌───────────┐
                                          │ Cancelled │
                                          └───────────┘
```

### Kanban Board Layout

```
┌─────────────┬──────────────┬─────────────┬──────────────┐
│    Todo     │ In Progress  │   Review    │  Completed   │
├─────────────┼──────────────┼─────────────┼──────────────┤
│ Task 1      │ Task 4       │ Task 7      │ Task 10      │
│ Priority: H │ Assigned: @u │ Due: Today  │ ✓ Done       │
│ Due: Mon    │ 2.5 / 8 hrs  │             │              │
├─────────────┼──────────────┼─────────────┼──────────────┤
│ Task 2      │ Task 5       │ Task 8      │ Task 11      │
│ Priority: M │ Assigned: @t │ Blocked     │ ✓ Done       │
├─────────────┼──────────────┼─────────────┼──────────────┤
│ Task 3      │ Task 6       │             │              │
│ Priority: L │ Assigned: @u │             │              │
└─────────────┴──────────────┴─────────────┴──────────────┘
```

### Time Entry Quick Log

```
┌────────────────────────────────────────┐
│ Task: Assemble Widget Units            │
├────────────────────────────────────────┤
│ Hours:     [2.5]                       │
│ Date:      [2026-03-25]                │
│ Billable:  [✓] Yes                     │
│ Notes:     Assembled 10 units          │
│                                         │
│            [Cancel]  [Log Time]        │
└────────────────────────────────────────┘
```

### Timesheet View

```
Week of March 24-30, 2026                    Total: 37.5 hrs

┌──────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬───────┐
│ Task │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │ Total │
├──────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼───────┤
│ T-1  │ 2.5 │ 3.0 │ 4.0 │ 2.5 │ 1.0 │  -  │  -  │ 13.0  │
│ T-2  │ 1.5 │ 2.0 │ 2.5 │ 3.0 │ 2.5 │  -  │  -  │ 11.5  │
│ T-3  │ 4.0 │ 3.0 │ 1.5 │ 2.5 │ 2.0 │  -  │  -  │ 13.0  │
├──────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼───────┤
│Total │ 8.0 │ 8.0 │ 8.0 │ 8.0 │ 5.5 │ 0.0 │ 0.0 │ 37.5  │
└──────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴───────┘
```

---

## 🔄 Query Patterns

### Get Tasks for a Project

```typescript
// Query: core.ticket nodes where parentId = projectId AND identity contains ['task']
const tasks = await apiClient.get(`/v1/nodes`, {
  params: {
    type: 'core.ticket',
    parentId: projectId,
    identity: 'ticket,work-item,task'
  }
});
```

### Get Time Entries for a Task

```typescript
// Query: core.entry nodes where parentId = taskId
const timeEntries = await apiClient.get(`/v1/nodes`, {
  params: {
    type: 'core.entry',
    parentId: taskId,
    identity: 'entry,time'
  }
});
```

### Get My Tasks (Assigned to Me)

```typescript
// Query: core.ticket where settings.assignedTo = currentUserId
const myTasks = await apiClient.post(`/v1/nodes/query`, {
  type: 'core.ticket',
  filter: `settings.assignedTo is '${currentUserId}' and identity contains ['task']`
});
```

### Get Timesheet (My Time This Week)

```typescript
// Query: core.entry where userId = me AND date in range
const timesheet = await apiClient.post(`/v1/nodes/query`, {
  type: 'core.entry',
  filter: `settings.userId is '${currentUserId}' and settings.date >= '2026-03-24' and settings.date <= '2026-03-30'`
});
```

---

## ⚡ Performance Considerations

### Calculated Fields

**Task.actualHours** - Calculated from sum of time entries:
```typescript
// Option 1: Calculate on read
const timeEntries = await getTimeEntries(taskId);
const actualHours = timeEntries.reduce((sum, entry) => sum + entry.settings.hours, 0);

// Option 2: Update on task when time logged (cached)
await updateTask(taskId, {
  'settings.actualHours': actualHours
});
```

**Recommendation**: Cache `actualHours` on task, recalculate when time entry added/updated/deleted.

### Time Entry Aggregation

For timesheets with many entries:
- Query with date range filters
- Group by task on client side
- Consider server-side aggregation endpoint for reports

---

## 🔐 Permissions

### Task Permissions
- **Create**: Users can create tasks under projects they have write access to
- **Assign**: Can assign to any user/team (or restrict to team members)
- **Edit**: Task creator, assignee, or project owner
- **Delete**: Task creator or project owner
- **View**: Anyone with read access to parent project

### Time Entry Permissions
- **Log Time**: Only the assigned user or time entry owner
- **Edit**: Only the user who logged the time
- **Delete**: Only the user who logged the time (within time limit?)
- **View**: Task assignee, time entry owner, project owner

---

## ✅ Implementation Checklist

When implementing this domain:

### Core Infrastructure
- [ ] Define TypeScript types (task.types.ts, time-entry.types.ts)
- [ ] Create API clients (TaskAPI, TimeEntryAPI)
- [ ] Build React hooks (use-tasks, use-time-entries, use-timesheet)
- [ ] Set up query keys in lib/query-keys.ts

### Task Components
- [ ] TaskList component (table view with sorting/filtering)
- [ ] TaskCard component (card with quick actions)
- [ ] TaskForm component (create/edit dialog)
- [ ] TaskBoard component (Kanban with drag-and-drop)
- [ ] TaskStatusBadge component
- [ ] TaskPriorityBadge component
- [ ] TaskAssignee component (user/team selector)
- [ ] TaskFilters component (status, priority, assignee)

### Time Entry Components
- [ ] TimeEntryForm component (log time dialog)
- [ ] TimeEntryList component (list of entries)
- [ ] TimesheetView component (weekly grid)
- [ ] QuickTimeEntry component (inline time logging)

### Pages
- [ ] TasksListPage (main tasks page with list/board toggle)
- [ ] TaskDetailPage (single task with time entries)
- [ ] TimesheetPage (time tracking page)

### Widgets
- [ ] TaskBoardWidget (dashboard Kanban)
- [ ] MyTasksWidget (my assigned tasks)
- [ ] TimesheetWidget (weekly summary)

### Integration
- [ ] Add tasks tab to project detail page
- [ ] Add tasks to production-run pages (future)
- [ ] Add time tracking to user profile (future)

### Plugin Config
- [ ] Update plugin.json pages array
- [ ] Update vite.config.ts exposes
- [ ] Add to navigation

### Testing & Polish
- [ ] Write unit tests for API clients
- [ ] Write component tests
- [ ] Test drag-and-drop functionality
- [ ] Test time calculations
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add empty states
- [ ] Update this README

---

## 💡 Future Enhancements

- **Task Templates**: Pre-defined task lists (checklists)
- **Recurring Tasks**: Auto-create tasks on schedule
- **Task Dependencies Graph**: Visual dependency tree
- **Time Reports**: Export timesheets to PDF/Excel
- **Notifications**: Reminders for due tasks
- **Activity Feed**: Task comment threads
- **Subtasks**: Nested task hierarchies
- **Time Timer**: Start/stop timer for active task
- **Mobile Time Entry**: Quick time logging on mobile

---

**See**: [`project/README.md`](../project/README.md) for the reference implementation pattern.
