# Scope: Task CRUD Implementation for ProductDetailPageV2

**Date**: 2026-03-27
**Status**: ✅ COMPLETED
**Priority**: HIGH - Core feature for v2 product page

---

## Problem

The v2 product page ([ProductDetailPageV2.tsx](../../frontend/src/features/product/v2/ProductDetailPageV2.tsx)) has a Tasks section ([TasksSectionV2.tsx](../../frontend/src/features/product/v2/sections/TasksSectionV2.tsx)) with a Kanban board UI, but only **READ** functionality is implemented. Users cannot create, update, or delete tasks.

**Current state:**
- ✅ **READ** - Fetches tasks using `client.queryNodes()` with filter: `parent.id is "${product.id}" and type is "plm.task"`
- ✅ Kanban board UI (3 columns: Pending, In Progress, Completed)
- ❌ Non-functional "Create Task" button
- ❌ No UPDATE functionality (can't change status, assignee, priority, etc.)
- ❌ No DELETE functionality
- ❌ No task details view/edit dialog

**Configuration:**
- `core.task` with profile `plm-task` is defined in [plugin.json:168-181](../../plugin.json#L168-L181)
- Missing: Node profile definition for `plm-task` in [nodes.yaml](../../config/nodes.yaml)

---

## Solution

Implement full CRUD operations for tasks using the **new URL builder pattern** and **settings PATCH endpoint** (not `updateNode()`).

**Key patterns from updated SDK:**
- ✅ Use `urls.node.*` from `@rubix-sdk/frontend/plugin-client/url-builder`
- ✅ Use settings PATCH endpoint for task updates (NOT `updateNode()`)
- ✅ Settings are flat, no wrapping
- ✅ Use `client.createNode()` and `client.deleteNode()` for create/delete

---

## Scope of Work

### Phase 1: Define plm-task Node Profile

**File**: [nube.plm/config/nodes.yaml](../../config/nodes.yaml)

Add node profile for `plm-task` after the `plm-component` section:

```yaml
  # ---------------------------------------------------------------------------
  # Task (core.task + plm-task profile)
  # ---------------------------------------------------------------------------
  - nodeType: core.task
    profile: plm-task
    displayName: PLM Task
    description: Product development task with kanban workflow
    identity: [task, plm]

    defaults:
      status: pending
      priority: Medium
      assignee: Unassigned

    validation:
      required: [name]
      rules:
        status:
          enum: [pending, in-progress, completed]
          message: "Status must be: pending, in-progress, or completed"
        priority:
          enum: [Low, Medium, High]
          message: "Priority must be: Low, Medium, or High"
        dueDate:
          pattern: "^\\d{4}-\\d{2}-\\d{2}(T.*)?$"
          message: "Due date must be ISO 8601 format (YYYY-MM-DD or full timestamp)"

    uiHints:
      icon: list-checks
      color: "#8b5cf6"
```

**Why needed:**
- Provides defaults (status: pending, priority: Medium)
- Validates settings fields on create/update
- Documents expected settings structure

---

### Phase 2: CREATE - Task Creation Dialog

**New File**: `nube.plm/frontend/src/features/product/v2/sections/TaskCreateDialog.tsx`

**Features:**
- Modal dialog with form
- Fields:
  - **Name** (required, text input)
  - **Description** (optional, textarea)
  - **Status** (select: pending, in-progress, completed)
  - **Priority** (select: Low, Medium, High)
  - **Assignee** (text input)
  - **Due Date** (date picker - use shadcn/ui DatePicker)

**Implementation pattern:**
```typescript
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

interface TaskCreateDialogProps {
  productId: string;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
}

export function TaskCreateDialog({
  productId,
  orgId,
  deviceId,
  baseUrl = '/api/v1',
  token,
  open,
  onOpenChange,
  onTaskCreated,
}: TaskCreateDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'pending',
    priority: 'Medium',
    assignee: '',
    dueDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const client = useMemo(
    () => createPluginClient({ orgId, deviceId, baseUrl, token }),
    [orgId, deviceId, baseUrl, token]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Create task using SDK
      await client.createNode({
        type: 'plm.task',
        name: formData.name,
        parentRef: productId,  // IMPORTANT: Use parentRef, not parentId
        settings: {
          // Settings are flat, no wrapping
          status: formData.status,
          priority: formData.priority,
          assignee: formData.assignee,
          description: formData.description,
          dueDate: formData.dueDate || undefined,
        },
      });

      onTaskCreated();
      onOpenChange(false);
      setFormData({
        name: '',
        description: '',
        status: 'pending',
        priority: 'Medium',
        assignee: '',
        dueDate: '',
      });
    } catch (error) {
      console.error('[TaskCreateDialog] Failed to create task:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {/* Form fields here */}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Connect to TasksSectionV2:**
- Import `TaskCreateDialog`
- Add state: `const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);`
- Update "Create Task" button: `<Button onClick={() => setIsCreateDialogOpen(true)}>`
- Render dialog with `onTaskCreated={() => { fetchTasks(); }}`

---

### Phase 3: UPDATE - Drag & Drop Status Changes

**Update**: [TasksSectionV2.tsx](../../frontend/src/features/product/v2/sections/TasksSectionV2.tsx)

**Goal:** Allow dragging tasks between kanban columns to change status.

**Implementation:**
1. Install drag-drop library: `pnpm add @dnd-kit/core @dnd-kit/sortable`
2. Wrap kanban board with `DndContext`
3. Make task cards draggable
4. Handle drop event to update task status

**Update pattern using URL builder:**
```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client/url-builder';

const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  const taskId = active.id as string;
  const newStatus = over.id as Task['status']; // 'pending', 'in-progress', 'completed'

  try {
    // Optimistic update - update UI immediately
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));

    // Update via settings PATCH endpoint (NOT updateNode)
    const config = { orgId, deviceId, baseUrl, token };
    const url = urls.node.settingsPatch(config, taskId);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        status: newStatus,  // Only update status field (deep merge)
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update task status');
    }

    // Refresh to get server state (optional, if optimistic update not reliable)
    // await fetchTasks();
  } catch (error) {
    console.error('[TasksSectionV2] Failed to update task status:', error);
    // Revert optimistic update
    await fetchTasks();
    // TODO: Show error toast
  }
};
```

**Benefits:**
- ✅ Deep merge - only `status` field changes, other fields preserved
- ✅ Uses URL builder for type-safe URLs
- ✅ Optimistic UI update for instant feedback
- ✅ Rollback on error

---

### Phase 4: UPDATE - Task Edit Dialog

**New File**: `nube.plm/frontend/src/features/product/v2/sections/TaskEditDialog.tsx`

**Features:**
- Modal dialog with form (similar to create dialog)
- Pre-populate form with existing task data
- Allow editing all fields: name, description, status, priority, assignee, dueDate
- Include "Delete Task" button in dialog footer

**Implementation pattern:**
```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client/url-builder';

interface TaskEditDialogProps {
  task: Task;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}

export function TaskEditDialog({
  task,
  orgId,
  deviceId,
  baseUrl = '/api/v1',
  token,
  open,
  onOpenChange,
  onTaskUpdated,
  onTaskDeleted,
}: TaskEditDialogProps) {
  const [formData, setFormData] = useState({
    name: task.name,
    description: task.settings?.description || '',
    status: task.settings?.status || 'pending',
    priority: task.settings?.priority || 'Medium',
    assignee: task.settings?.assignee || '',
    dueDate: task.settings?.dueDate || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const client = useMemo(
    () => createPluginClient({ orgId, deviceId, baseUrl, token }),
    [orgId, deviceId, baseUrl, token]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Update name separately (if changed)
      if (formData.name !== task.name) {
        await client.updateNode(task.id, {
          name: formData.name,
        });
      }

      // Update settings via PATCH endpoint (NOT updateNode)
      const config = { orgId, deviceId, baseUrl, token };
      const url = urls.node.settingsPatch(config, task.id);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          status: formData.status,
          priority: formData.priority,
          assignee: formData.assignee,
          description: formData.description,
          dueDate: formData.dueDate || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      onTaskUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('[TaskEditDialog] Failed to update task:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await client.deleteNode(task.id);
      onTaskDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('[TaskEditDialog] Failed to delete task:', error);
      // TODO: Show error toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {/* Form fields here */}
          <div className="flex justify-between">
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete Task
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Connect to TasksSectionV2:**
- Add state for selected task and dialog open state
- Make task cards clickable
- Render `TaskEditDialog` with callbacks

---

### Phase 5: DELETE - Task Deletion

**Two approaches:**

**Option A: Delete from Edit Dialog (Recommended)**
- Already implemented in Phase 4
- "Delete Task" button in edit dialog footer
- Uses `client.deleteNode(taskId)`

**Option B: Quick Delete Action (Optional Enhancement)**
- Add trash icon to task cards (visible on hover)
- Click to delete with confirmation
- Use shared `DeleteDialog` component from host app

**Implementation:**
```typescript
import { client } from '@rubix-sdk/frontend/plugin-client';

const handleDelete = async (taskId: string) => {
  try {
    await client.deleteNode(taskId);
    await fetchTasks();
    // Update stats
    onStatsUpdate({ totalTasks: tasks.length - 1 });
  } catch (error) {
    console.error('[TasksSectionV2] Failed to delete task:', error);
    // TODO: Show error toast
  }
};
```

---

### Phase 6: UI/UX Enhancements

**TasksSectionV2 Updates:**

1. **Task Cards - Click to Edit**
   ```typescript
   <Card
     key={task.id}
     className="cursor-pointer hover:shadow-md"
     onClick={() => {
       setSelectedTask(task);
       setIsEditDialogOpen(true);
     }}
   >
     {/* Task content */}
   </Card>
   ```

2. **Loading States**
   ```typescript
   {isLoading && <Skeleton />}
   {isSubmitting && <LoadingSpinner />}
   ```

3. **Error Handling**
   - Use toast notifications for errors
   - Show inline errors in forms
   - Rollback optimistic updates on failure

4. **Empty States**
   ```typescript
   {tasks.length === 0 && (
     <div className="text-center py-12">
       <p className="text-muted-foreground mb-4">No tasks yet</p>
       <Button onClick={() => setIsCreateDialogOpen(true)}>
         Create First Task
       </Button>
     </div>
   )}
   ```

5. **Stats Updates**
   ```typescript
   const updateTaskStats = () => {
     const completedThisWeek = tasks.filter(t =>
       t.status === 'completed' &&
       isWithinWeek(new Date(t.updatedAt))
     ).length;

     onStatsUpdate({
       totalTasks: tasks.length,
       tasksCompletedThisWeek: completedThisWeek,
     });
   };
   ```

---

## File Structure

```
nube.plm/
├── config/
│   └── nodes.yaml                          # Add plm-task profile
└── frontend/src/features/product/v2/
    └── sections/
        ├── TasksSectionV2.tsx              # Update: Add drag-drop, click handlers
        ├── TaskCreateDialog.tsx            # New: Task creation form
        ├── TaskEditDialog.tsx              # New: Task edit/delete form
        └── components/                     # Optional: Shared components
            ├── TaskForm.tsx                # Shared form fields
            └── TaskCard.tsx                # Task card component
```

---

## Key Patterns & Best Practices

### ✅ DO: Use URL Builder
```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client/url-builder';

const config = { orgId, deviceId, baseUrl, token };
const url = urls.node.settingsPatch(config, taskId);
```

### ✅ DO: Use Settings PATCH for Updates
```typescript
const response = await fetch(urls.node.settingsPatch(config, taskId), {
  method: 'PATCH',
  body: JSON.stringify({ status: 'completed' })
});
```

### ✅ DO: Settings are Flat
```typescript
// ✅ CORRECT
settings: {
  status: 'pending',
  priority: 'High',
  assignee: 'User 1',
}

// ❌ WRONG - No nested wrapping
settings: {
  settings: {
    status: 'pending'
  }
}
```

### ❌ DON'T: Use updateNode for Settings
```typescript
// ❌ WRONG
await client.updateNode(taskId, {
  settings: { status: 'completed' }
});

// ✅ CORRECT
const url = urls.node.settingsPatch(config, taskId);
await fetch(url, {
  method: 'PATCH',
  body: JSON.stringify({ status: 'completed' })
});
```

### ✅ DO: Use parentRef (not parentId)
```typescript
await client.createNode({
  type: 'plm.task',
  name: 'Task Name',
  parentRef: productId,  // ✅ Use parentRef
  settings: { ... }
});
```

---

## Dependencies

**Required:**
- ✅ `@rubix-sdk/frontend/plugin-client` - Already imported
- ✅ `client` prop - Already passed to TasksSectionV2
- 🔲 `@dnd-kit/core` and `@dnd-kit/sortable` - For drag & drop
- 🔲 shadcn/ui components:
  - `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
  - `Button`, `Input`, `Textarea`, `Select`
  - `DatePicker` (or use HTML5 date input)
- 🔲 Toast/notification system (e.g., `sonner` or shadcn/ui toast)

**Install:**
```bash
cd nube.plm/frontend
pnpm add @dnd-kit/core @dnd-kit/sortable
```

---

## Testing Checklist

### Basic CRUD
- [ ] Create task with all fields
- [ ] Create task with only required fields (name)
- [ ] Edit task name via edit dialog
- [ ] Edit task settings via edit dialog
- [ ] Drag task between kanban columns
- [ ] Delete task from edit dialog
- [ ] Delete task with quick delete button (if implemented)

### Edge Cases
- [ ] Create task with empty assignee (should default to "Unassigned")
- [ ] Create task with no due date (should be optional)
- [ ] Edit task and save without changes (should succeed)
- [ ] Drag task to same column (should no-op)
- [ ] Delete task while edit dialog is open (should close dialog)

### Error Handling
- [ ] Network failure on create (should show error toast)
- [ ] Network failure on update (should rollback optimistic update)
- [ ] Network failure on delete (should show error)
- [ ] Invalid settings (should show validation error)

### UI/UX
- [ ] Loading spinner shows during API calls
- [ ] Optimistic updates feel instant
- [ ] Error messages are clear
- [ ] Empty state shows when no tasks
- [ ] Stats update correctly after each operation

### Database Validation
```typescript
// After creating/updating a task, check the database:
const task = await client.getNode(taskId);

// Settings should be flat
console.log(task.settings);
// ✅ CORRECT: { status: 'pending', priority: 'High', assignee: 'User 1' }
// ❌ WRONG: { settings: { settings: { ... } } }
```

---

## Benefits

1. ✅ **Complete Task Management** - Users can fully manage product tasks
2. ✅ **Clean Code** - Uses URL builder and settings PATCH (no wrappers)
3. ✅ **Type Safe** - TypeScript types match SDK responses
4. ✅ **Modern UX** - Drag-drop, optimistic updates, loading states
5. ✅ **Maintainable** - Follows SDK best practices

---

## Estimated Effort

- **Phase 1 (Node Profile)**: 15 minutes
- **Phase 2 (Create Dialog)**: 2 hours
- **Phase 3 (Drag & Drop)**: 2 hours
- **Phase 4 (Edit Dialog)**: 2 hours
- **Phase 5 (Delete)**: 30 minutes (if using edit dialog)
- **Phase 6 (UI Polish)**: 1.5 hours

**Total: 8-9 hours** (1-2 days)

---

## Risks

🟡 **MEDIUM** - Adding CRUD operations could have edge cases

**Mitigation:**
- Use URL builder to avoid manual URL errors
- Use settings PATCH to avoid nested settings bug
- Test each phase thoroughly before moving to next
- Keep git commits small and focused
- Can rollback easily if issues found

---

## Success Criteria

- [ ] Node profile `plm-task` defined in nodes.yaml
- [ ] Users can create tasks via dialog
- [ ] Users can drag tasks between kanban columns
- [ ] Users can edit task details via dialog
- [ ] Users can delete tasks
- [ ] No nested settings in database
- [ ] All API calls use URL builder
- [ ] Settings updates use PATCH endpoint (not updateNode)
- [ ] UI shows loading/error states appropriately
- [ ] Stats update correctly after operations

---

## References

- [Plugin Client SDK README](../../../frontend-sdk/plugin-client/README.md)
- [URL Builder Source](../../../frontend-sdk/plugin-client/url-builder.ts)
- [Settings PATCH Pattern](../../../frontend-sdk/plugin-client/README.md#L86-L100)
- [ProductDetailPageV2](../../frontend/src/features/product/v2/ProductDetailPageV2.tsx)
- [TasksSectionV2](../../frontend/src/features/product/v2/sections/TasksSectionV2.tsx)
- [plugin.json](../../plugin.json)

---

## Notes

- **Query type**: Use `"plm.task"` in filter (not `"core.task"`) - this is the effective type after profile resolution
- **Settings PATCH**: Always use the dedicated settings endpoint for updates (deep merge, validation, re-initialization)
- **URL Builder**: Import from `@rubix-sdk/frontend/plugin-client/url-builder` for type-safe URLs
- **parentRef vs parentId**: Always use `parentRef` when creating nodes (API field name)
- **Drag library**: `@dnd-kit` is modern and lightweight, but vanilla HTML5 DnD also works
