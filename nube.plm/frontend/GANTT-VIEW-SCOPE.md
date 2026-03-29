# Gantt Chart View - Implementation Scope (Updated)

**Goal**: Add reusable Gantt chart view for tasks with expandable ticket sub-rows

**Library**: [gantt-task-react](https://www.npmjs.com/package/gantt-task-react)

**Use Cases**:
1. **Products Page** - All tasks across all products (TasksListTab)
2. **Single Product Page** - Tasks for specific product (TasksSectionV2)

---

## 1. Installation

```bash
npm install gantt-task-react
```

---

## 2. Reusable Component Architecture

### 2.1 Component Hierarchy

```
TasksGanttView (Reusable)
├─ View Mode Toggle (Day/Week/Month)
├─ Gantt Chart Container
│  ├─ Task Rows (parent bars)
│  │  ├─ [+] Expand Icon
│  │  └─ Task Timeline Bar
│  └─ Ticket Rows (child bars, lazy loaded)
│     ├─ Ticket Timeline Bar
│     └─ Ticket Timeline Bar
└─ Dialogs (Edit Task, Edit Ticket)
```

### 2.2 Props Interface

```typescript
interface TasksGanttViewProps {
  tasks: Task[];
  products?: Product[]; // Optional: for multi-product view
  client: PluginClient;
  context: 'all-products' | 'single-product';
  productId?: string; // Required when context='single-product'
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
}
```

---

## 3. Data Transformation

### 3.1 Task-Level Data

Transform Task objects to Gantt-compatible format:

```typescript
interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number; // 0-100
  type: 'task' | 'milestone' | 'project';
  isDisabled?: boolean; // For tickets (non-editable)
  dependencies?: string[];
  styles?: {
    backgroundColor?: string;
    progressColor?: string;
    backgroundSelectedColor?: string;
  };
  project?: string; // Product name
  hideChildren?: boolean; // For collapsed state
}
```

### 3.2 Ticket-Level Data (New!)

```typescript
interface GanttTicket extends GanttTask {
  type: 'task'; // Tickets are rendered as tasks
  parentId: string; // Task ID
  isDisabled: true; // Tickets are view-only in Gantt
  styles: {
    backgroundColor: string; // Lighter color
    progressColor: string;
    opacity: 0.7; // Visual distinction from tasks
  };
}
```

**Mapping Logic**:
- **Task**:
  - `start`: `task.settings.startDate` or `task.createdAt`
  - `end`: `task.settings.dueDate` or `start + 7 days` (default)
  - `progress`: `task.settings.progress` or calculate from status
  - `type`: 'task'

- **Ticket**:
  - `start`: `ticket.settings.createdDate` or `ticket.createdAt`
  - `end`: `ticket.settings.dueDate` or `start + 3 days` (default)
  - `progress`: Calculate from ticket status
  - `type`: 'task' (rendered as child row)
  - `parentId`: Task ID
  - `isDisabled`: true (view-only)

---

## 4. Expandable Rows Implementation

### 4.1 State Management

```typescript
// Track expanded task IDs
const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

// Track loaded tickets per task
const [taskTickets, setTaskTickets] = useState<Map<string, Ticket[]>>(new Map());

// Track loading states
const [loadingTickets, setLoadingTickets] = useState<Set<string>>(new Set());
```

### 4.2 Lazy Loading Tickets

```typescript
const handleTaskExpand = async (taskId: string) => {
  // Toggle expanded state
  setExpandedTasks(prev => {
    const next = new Set(prev);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
    }
    return next;
  });

  // Lazy load tickets if not already loaded
  if (!taskTickets.has(taskId)) {
    try {
      setLoadingTickets(prev => new Set(prev).add(taskId));

      const tickets = await client.queryNodes({
        filter: `type is "plm.ticket" and parentId is "${taskId}"`,
      });

      setTaskTickets(prev => new Map(prev).set(taskId, tickets as Ticket[]));
    } catch (error) {
      console.error('[Gantt] Failed to load tickets:', error);
    } finally {
      setLoadingTickets(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }
};
```

### 4.3 Building Gantt Data with Tickets

```typescript
const ganttData = useMemo(() => {
  const items: GanttTask[] = [];

  tasks.forEach(task => {
    // Add task
    items.push(transformTaskToGantt(task, products));

    // Add tickets if expanded
    if (expandedTasks.has(task.id)) {
      const tickets = taskTickets.get(task.id) || [];
      tickets.forEach(ticket => {
        items.push(transformTicketToGantt(ticket, task));
      });
    }
  });

  return items;
}, [tasks, products, expandedTasks, taskTickets]);
```

---

## 5. Component Structure

### 5.1 Create `tasks-gantt-view.tsx` (Reusable)

```typescript
import { useState, useMemo, useCallback } from 'react';
import { Gantt, Task as GanttTask, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react';
// @ts-ignore
import { Button } from '@rubix-sdk/frontend/common/ui';
import type { Task } from '@features/task/types/task.types';
import type { Product } from '@features/product/types/product.types';
import type { Ticket } from '@features/ticket/types/ticket.types';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';

interface TasksGanttViewProps {
  tasks: Task[];
  products?: Product[];
  client: PluginClient;
  context: 'all-products' | 'single-product';
  productId?: string;
  onTaskEdit?: (task: Task) => void;
}

export function TasksGanttView({
  tasks,
  products = [],
  client,
  context,
  productId,
  onTaskEdit
}: TasksGanttViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [taskTickets, setTaskTickets] = useState<Map<string, Ticket[]>>(new Map());
  const [loadingTickets, setLoadingTickets] = useState<Set<string>>(new Set());

  // Transform tasks and tickets to Gantt format
  const ganttData = useMemo(() => {
    const items: GanttTask[] = [];

    tasks.forEach(task => {
      // Add task with expand icon
      items.push({
        ...transformTaskToGantt(task, products),
        displayOrder: items.length,
      });

      // Add tickets if expanded
      if (expandedTasks.has(task.id)) {
        const tickets = taskTickets.get(task.id) || [];
        tickets.forEach(ticket => {
          items.push({
            ...transformTicketToGantt(ticket, task),
            displayOrder: items.length,
          });
        });
      }
    });

    return items;
  }, [tasks, products, expandedTasks, taskTickets]);

  const handleExpandTask = useCallback(async (taskId: string) => {
    // Toggle expanded state
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });

    // Lazy load tickets
    if (!taskTickets.has(taskId)) {
      try {
        setLoadingTickets(prev => new Set(prev).add(taskId));

        const tickets = await client.queryNodes({
          filter: `type is "plm.ticket" and parentId is "${taskId}"`,
        });

        setTaskTickets(prev => new Map(prev).set(taskId, tickets as Ticket[]));
      } catch (error) {
        console.error('[TasksGanttView] Failed to load tickets:', error);
      } finally {
        setLoadingTickets(prev => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }
    }
  }, [client, taskTickets]);

  // Custom task list for expand icons
  const TaskListTable = ({ tasks, rowHeight }: any) => {
    return (
      <div className="gantt-task-list">
        {tasks.map((task: GanttTask, index: number) => {
          const isTask = !task.parentId; // Tasks don't have parentId
          const isExpanded = expandedTasks.has(task.id);
          const isLoading = loadingTickets.has(task.id);

          return (
            <div
              key={task.id}
              className="gantt-task-list-row"
              style={{ height: rowHeight }}
            >
              <div className="flex items-center gap-2 px-2">
                {isTask && (
                  <button
                    onClick={() => handleExpandTask(task.id)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    {isLoading ? (
                      <span className="text-xs">...</span>
                    ) : isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                )}
                <span className={isTask ? 'font-medium' : 'text-sm text-muted-foreground ml-4'}>
                  {isTask ? '📋' : '🎫'} {task.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === ViewMode.Day ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode(ViewMode.Day)}
          >
            Day
          </Button>
          <Button
            variant={viewMode === ViewMode.Week ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode(ViewMode.Week)}
          >
            Week
          </Button>
          <Button
            variant={viewMode === ViewMode.Month ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode(ViewMode.Month)}
          >
            Month
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {tasks.length} task(s) • {[...taskTickets.values()].flat().length} ticket(s)
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="border rounded-lg overflow-hidden">
        <Gantt
          tasks={ganttData}
          viewMode={viewMode}
          listCellWidth="250px"
          columnWidth={viewMode === ViewMode.Month ? 300 : 60}
          rowHeight={38}
          TaskListTable={TaskListTable}
          onDoubleClick={(task) => {
            // Only allow editing tasks, not tickets
            if (!task.isDisabled) {
              const originalTask = tasks.find(t => t.id === task.id);
              if (originalTask) onTaskEdit?.(originalTask);
            }
          }}
        />
      </div>
    </div>
  );
}
```

---

## 6. Integration Points

### 6.1 Products Page (TasksListTab)

```typescript
// tasks-list-tab.tsx
import { TasksGanttView } from './tasks-gantt-view';

const [viewMode, setViewMode] = useState<'table' | 'gantt'>('table');

return (
  <div>
    {/* View Toggle */}
    <Tabs value={viewMode} onValueChange={setViewMode}>
      <Tab value="table">Table</Tab>
      <Tab value="gantt">Gantt</Tab>
    </Tabs>

    {/* View Content */}
    {viewMode === 'table' ? (
      <TasksDataTable
        tasks={tasks}
        products={products}
        client={client}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ) : (
      <TasksGanttView
        tasks={tasks}
        products={products}
        client={client}
        context="all-products"
        onTaskEdit={onEdit}
      />
    )}
  </div>
);
```

### 6.2 Single Product Page (TasksSectionV2)

```typescript
// TasksSectionV2.tsx
import { TasksGanttView } from '@features/product/pages/tasks-gantt-view';

const [viewMode, setViewMode] = useState<'kanban' | 'gantt'>('kanban');

return (
  <div>
    {/* View Toggle */}
    <Tabs value={viewMode} onValueChange={setViewMode}>
      <Tab value="kanban">Board</Tab>
      <Tab value="gantt">Timeline</Tab>
    </Tabs>

    {/* View Content */}
    {viewMode === 'kanban' ? (
      <TaskBoard tasks={tasks} client={client} onTaskUpdate={handleTaskUpdate} />
    ) : (
      <TasksGanttView
        tasks={tasks}
        client={client}
        context="single-product"
        productId={product.id}
        onTaskEdit={setEditingTask}
      />
    )}
  </div>
);
```

---

## 7. Features to Implement

### Phase 1 (MVP with Tickets):
- ✅ Basic Gantt rendering (tasks only)
- ✅ View mode toggle (Day/Week/Month)
- ✅ Expandable task rows ([+]/[-] icons)
- ✅ **Lazy load tickets** on expand
- ✅ Display tickets as indented sub-rows
- ✅ Color-code by status (tasks and tickets)
- ✅ Reusable for both contexts
- ✅ Click task to edit (tickets view-only)
- ⏱️ **Estimated: 6-8 hours**

### Phase 2 (Enhanced):
- 🔲 Drag to reschedule tasks (update dueDate)
- 🔲 Drag progress bar (update progress %)
- 🔲 Click ticket to view/edit in dialog
- 🔲 Filter by product (multi-product view)
- 🔲 Filter by date range
- 🔲 Export to PNG/PDF
- ⏱️ **Estimated: 8-10 hours**

### Phase 3 (Advanced):
- 🔲 Task dependencies (arrows)
- 🔲 Critical path highlighting
- 🔲 Resource allocation view
- 🔲 Baseline vs actual timeline
- 🔲 Drag-and-drop ticket reordering
- ⏱️ **Estimated: 12-16 hours**

---

## 8. Styling Customization

### 8.1 Task vs Ticket Visual Distinction

```css
/* Custom Gantt styles */
.gantt-container {
  font-family: var(--font-sans);
}

/* Task bars */
.gantt-task-task {
  border-radius: 4px;
  opacity: 1;
}

.gantt-task-pending { background-color: hsl(var(--muted)); }
.gantt-task-in-progress { background-color: hsl(var(--primary)); }
.gantt-task-completed { background-color: hsl(var(--success)); }
.gantt-task-cancelled { background-color: hsl(var(--destructive)); }

/* Ticket bars (lighter, smaller) */
.gantt-ticket {
  opacity: 0.7;
  height: 24px !important; /* Smaller than tasks */
  border-radius: 3px;
  border: 1px dashed rgba(0,0,0,0.2);
}

.gantt-ticket-bug { background-color: #ef4444; }
.gantt-ticket-feature { background-color: #3b82f6; }
.gantt-ticket-task { background-color: #10b981; }
.gantt-ticket-chore { background-color: #6b7280; }

/* Expand icons */
.gantt-task-list-row {
  border-bottom: 1px solid hsl(var(--border));
}

.gantt-task-list-row:hover {
  background-color: hsl(var(--muted) / 0.5);
}
```

---

## 9. Data Validation & Edge Cases

### 9.1 Task Edge Cases
- **No due date**: Use `startDate + 7 days` as default end
- **No start date**: Use `createdAt` or current date
- **Invalid dates**: Skip task or show warning
- **Past due dates**: Highlight in red

### 9.2 Ticket Edge Cases
- **No due date**: Use `createdDate + 3 days` as default
- **No created date**: Use `task.createdAt`
- **Ticket duration longer than task**: Show warning, don't restrict
- **Many tickets (10+)**: Consider pagination or "Show more" button

---

## 10. Performance Considerations

- **Lazy Loading**: ✅ Tickets only fetched on expand (implemented)
- **Memoization**: Use `useMemo` for ganttData transformation
- **Virtualization**: For 100+ tasks, consider react-window
- **Debouncing**: Debounce expand/collapse actions
- **Cache**: Cache loaded tickets in state (don't refetch on re-expand)

---

## 11. File Structure

```
features/product/pages/
├── tasks-list-tab.tsx           # All tasks view (with Table/Gantt toggle)
├── tasks-data-table.tsx         # Table view (existing, with expandable tickets)
├── tasks-nested-tickets.tsx     # Nested tickets table (existing)
├── tasks-gantt-view.tsx         # NEW - Reusable Gantt view
└── utils/
    └── tasks-gantt-transform.ts # NEW - Transform utilities

features/product/v2/sections/
└── TasksSectionV2.tsx           # Single product tasks (Board/Gantt toggle)
```

---

## 12. Transform Utilities

### 12.1 `tasks-gantt-transform.ts`

```typescript
import type { Task } from '@features/task/types/task.types';
import type { Ticket } from '@features/ticket/types/ticket.types';
import type { Product } from '@features/product/types/product.types';

export interface GanttItem {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: 'task';
  parentId?: string; // For tickets
  isDisabled?: boolean;
  project?: string;
  styles: {
    backgroundColor: string;
    progressColor: string;
    backgroundSelectedColor?: string;
  };
}

export function transformTaskToGantt(
  task: Task,
  products: Product[] = []
): GanttItem {
  const startDate = task.settings?.startDate
    ? new Date(task.settings.startDate)
    : new Date(task.createdAt || Date.now());

  const endDate = task.settings?.dueDate
    ? new Date(task.settings.dueDate)
    : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

  const progress = calculateTaskProgress(task);
  const product = products.find(p => p.id === task.parentId);

  return {
    id: task.id,
    name: task.name,
    start: startDate,
    end: endDate,
    progress,
    type: 'task',
    project: product?.name || 'Unknown Product',
    styles: {
      backgroundColor: getTaskStatusColor(task.settings?.status),
      progressColor: '#4caf50',
      backgroundSelectedColor: '#aaa',
    },
  };
}

export function transformTicketToGantt(
  ticket: Ticket,
  parentTask: Task
): GanttItem {
  const startDate = ticket.settings?.createdDate
    ? new Date(ticket.settings.createdDate)
    : new Date(ticket.createdAt || parentTask.createdAt || Date.now());

  const endDate = ticket.settings?.dueDate
    ? new Date(ticket.settings.dueDate)
    : new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days

  const progress = calculateTicketProgress(ticket);

  return {
    id: ticket.id,
    name: `🎫 ${ticket.name}`,
    start: startDate,
    end: endDate,
    progress,
    type: 'task',
    parentId: parentTask.id,
    isDisabled: true, // View-only
    styles: {
      backgroundColor: getTicketTypeColor(ticket.settings?.ticketType),
      progressColor: '#22c55e',
      backgroundSelectedColor: '#ddd',
    },
  };
}

function calculateTaskProgress(task: Task): number {
  if (task.settings?.progress !== undefined) {
    return task.settings.progress;
  }

  switch (task.settings?.status) {
    case 'completed': return 100;
    case 'in-progress': return 50;
    case 'review': return 75;
    default: return 0;
  }
}

function calculateTicketProgress(ticket: Ticket): number {
  switch (ticket.settings?.status) {
    case 'completed': return 100;
    case 'in-progress': return 50;
    case 'review': return 75;
    case 'blocked': return 25;
    default: return 0;
  }
}

function getTaskStatusColor(status?: string): string {
  switch (status) {
    case 'completed': return '#22c55e';
    case 'in-progress': return '#3b82f6';
    case 'blocked': return '#ef4444';
    case 'review': return '#a855f7';
    case 'cancelled': return '#6b7280';
    default: return '#94a3b8'; // pending
  }
}

function getTicketTypeColor(type?: string): string {
  switch (type) {
    case 'bug': return '#ef4444';
    case 'feature': return '#3b82f6';
    case 'chore': return '#6b7280';
    default: return '#10b981'; // task
  }
}
```

---

## 13. Testing Checklist

### MVP Features:
- [ ] Gantt renders with tasks (all products context)
- [ ] Gantt renders with tasks (single product context)
- [ ] View mode toggle works (Day/Week/Month)
- [ ] Tasks color-coded by status
- [ ] [+] icon expands task row
- [ ] Tickets lazy load on expand (API call only when expanding)
- [ ] Tickets display as indented sub-rows
- [ ] Tickets color-coded by type
- [ ] [-] icon collapses task row
- [ ] Click task opens edit dialog
- [ ] Click ticket does nothing (view-only)
- [ ] Handles tasks without due dates
- [ ] Handles tickets without due dates
- [ ] Performance with 50+ tasks
- [ ] Performance with 10+ tickets per task

### Edge Cases:
- [ ] Task with no tickets (expand shows empty)
- [ ] Task with 20+ tickets (performance)
- [ ] Expand multiple tasks simultaneously
- [ ] Re-expand task (uses cached tickets)
- [ ] Network error on ticket fetch

---

## 14. Implementation Steps

### Step 1: Core Setup (2 hours)
1. Install `gantt-task-react`
2. Create `tasks-gantt-view.tsx` (basic structure)
3. Create `tasks-gantt-transform.ts` (transform utilities)
4. Add basic Gantt rendering (tasks only)

### Step 2: Expandable Rows (2 hours)
5. Add expand/collapse state management
6. Implement lazy ticket loading
7. Build custom TaskListTable with expand icons
8. Handle loading states

### Step 3: Integration (2 hours)
9. Add toggle to TasksListTab (Products Page)
10. Add toggle to TasksSectionV2 (Product Page)
11. Test both contexts
12. Handle edge cases

### Step 4: Styling & Polish (2 hours)
13. Custom CSS for task vs ticket distinction
14. Add tooltips and hover states
15. Mobile responsiveness
16. Performance optimization

---

## 15. Next Steps

**Phase 1 (MVP):**
```bash
# Install library
npm install gantt-task-react

# Create files
touch features/product/pages/tasks-gantt-view.tsx
touch features/product/pages/utils/tasks-gantt-transform.ts

# Integrate into existing pages
# - Update TasksListTab.tsx
# - Update TasksSectionV2.tsx
```

**Ready to start?** Begin with Step 1! 🚀

---

## 16. Future Enhancements

- Drag ticket from one task to another (re-parent)
- Ticket dependencies (blocked by other tickets)
- Bulk ticket operations
- Ticket progress syncs with task progress
- Gantt view for tickets only (dedicated view)
- Resource loading chart (show assignee workload)
