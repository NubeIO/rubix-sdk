# Add Task from Product Detail Page - Scope

## Problem
When viewing a product detail page, users cannot create tasks directly. They must:
1. Right-click on the product node
2. Select "Task Management"
3. Open the tasks page
4. Click "Create Task"

This is too many steps for a common workflow.

## Goal
Add a "Create Task" button to the product detail page's Tasks section that opens the task creation dialog.

## Current State

**File**: `rubix-sdk/nube.plm/frontend/src/features/product/pages/product-detail-view.tsx`

**Tasks Section** (lines ~191-199):
```tsx
<TasksSection
  product={product}
  orgId={orgId}
  deviceId={deviceId}
  baseUrl={baseUrl}
  token={token}
  isExpanded={expandedSections.has('tasks')}
  onToggle={() => toggleSection('tasks')}
/>
```

## Solution

### Option A: Add Button to TasksSection Component (RECOMMENDED)

**Files to modify:**
1. `rubix-sdk/nube.plm/frontend/src/features/product/components/sections/TasksSection.tsx`
   - Add "+ Create Task" button to section header
   - Import `CreateTaskDialog` from product pages
   - Add state for dialog open/closed
   - Pass product ID to dialog

**Implementation:**
```tsx
// In TasksSection.tsx
import { CreateTaskDialog } from '@features/product/pages/create-task-dialog';

export function TasksSection({ product, ... }) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <SettingsSection
      title="Tasks"
      actions={
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Create Task
        </Button>
      }
      ...
    >
      {/* Existing task list */}

      <CreateTaskDialog
        products={[product]} // Pre-select current product
        onClose={() => setCreateDialogOpen(false)}
        onCreate={async (input) => {
          await tasksApi.createTask(input);
          setCreateDialogOpen(false);
          // Refresh task list
        }}
      />
    </SettingsSection>
  );
}
```

### Option B: Add Inline Form in Empty State

**Instead of showing "Use right-click menu", show:**
```tsx
{tasks.length === 0 ? (
  <div className="text-center p-4">
    <p className="text-muted-foreground mb-3">No tasks yet</p>
    <Button onClick={() => setCreateDialogOpen(true)}>
      <Plus className="h-4 w-4 mr-2" />
      Create First Task
    </Button>
  </div>
) : (
  <TasksList tasks={tasks} />
)}
```

## Acceptance Criteria

- [ ] User can click "Create Task" button from product detail page
- [ ] Dialog opens with product pre-selected (no dropdown needed)
- [ ] Task is created and associated with the product
- [ ] Task list refreshes after creation
- [ ] Works on both product-detail page and product-overview-tab

## Files to Change

1. **TasksSection.tsx** - Add create button + dialog
2. **CreateTaskDialog.tsx** - Support pre-selected product (optional products array)
3. **product-detail-view.tsx** - Pass task refresh callback

## Estimated Effort
- 30 minutes implementation
- 15 minutes testing

## Implementation Steps

1. Add state for dialog to TasksSection
2. Add "+ Create Task" button to section header
3. Import and render CreateTaskDialog
4. Pre-fill product ID in dialog
5. Implement refresh after task creation
6. Test both empty and populated task lists

## Notes

- CreateTaskDialog already exists in `features/product/pages/create-task-dialog.tsx`
- Task creation API already works (used by tasks-manager page)
- Just need to wire up the dialog to the Tasks section
