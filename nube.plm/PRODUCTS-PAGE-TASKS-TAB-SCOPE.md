# Products Page Improvement - Tasks Tab

**Scope Document for adding Tasks tab to Products page**

---

## Overview

Currently, the Products page (`ProductsListPage.tsx`) shows only a products table with filtering tabs (All, Software, Hardware). This scope adds a **second top-level tab** to show all tasks across all products, keeping the existing products view intact.

---

## Current State

**Products Page Structure:**
```
Products Page (Single View)
└─ Product Tabs (All | Software | Hardware)
    └─ Product Table (filtered by type)
```

**Location:** `frontend/src/features/product/pages/ProductsListPage.tsx`

**Uses:** `FilteredTableWithTabs` from `@rubix-sdk/frontend/components`

---

## Desired State

**New Two-Tab Structure:**
```
Products Page (Main Tabs)
├─ Tab 1: Products (existing)
│   └─ Sub-tabs: All | Software | Hardware
│       └─ Product Table
│
└─ Tab 2: Tasks (NEW)
    └─ Sub-tabs: All | To Do | In Progress | Completed
        └─ Task Table (shows tasks from ALL products)
```

---

## Implementation Plan

### Phase 1: Refactor Existing Products View

**Goal:** Extract current products table into separate component

**Files to Create:**
- `frontend/src/features/product/pages/products-list-tab.tsx`
  - Move existing products table + tabs logic here
  - Export `ProductsListTab` component
  - Props: `{ orgId, deviceId, baseUrl, token, productsCollectionId, onEdit, onDelete }`

**Files to Update:**
- `frontend/src/features/product/pages/ProductsListPage.tsx`
  - Import `ProductsListTab`
  - Will become container for main tabs (Phase 2)

---

### Phase 2: Add Main Tab Navigation

**Goal:** Add top-level tabs (Products | Tasks)

**Pattern Reference:** See monitor view pattern at `frontend/src/features/node/components/views/monitor`

**Update `ProductsListPage.tsx`:**

```tsx
import { Tabs } from '@rubix-sdk/frontend/common/ui/tabs';
import { ProductsListTab } from './products-list-tab';
import { TasksListTab } from './tasks-list-tab';

function ProductsPage(props) {
  const [activeMainTab, setActiveMainTab] = useState('products');

  const mainTabs = [
    { value: 'products', label: 'Products', icon: Package },
    { value: 'tasks', label: 'Tasks', icon: ListChecks },
  ];

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Products & Tasks</h1>
          <Button onClick={openCreateDialog}>
            <PlusIcon size={16} />
            Create Product
          </Button>
        </div>

        {/* Main Tabs */}
        <Tabs
          tabs={mainTabs}
          value={activeMainTab}
          onValueChange={setActiveMainTab}
        />

        {/* Tab Content */}
        <div className="mt-4">
          {activeMainTab === 'products' && (
            <ProductsListTab {...props} />
          )}
          {activeMainTab === 'tasks' && (
            <TasksListTab {...props} />
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 3: Create Tasks List Tab

**Goal:** New component showing all tasks across all products

**Files to Create:**
- `frontend/src/features/product/pages/tasks-list-tab.tsx`

**Features:**
- Query: `type is "core.task" and identity contains ["plm"]` (all PLM tasks)
- Show product name for each task (via parentId lookup or join)
- Use `FilteredTableWithTabs` with task status filters
- Table columns:
  - Task Name
  - Product (parent product name)
  - Status
  - Priority
  - Progress
  - Assignee
  - Actions (Edit, Delete)

**Sub-tabs:**
```typescript
const TASK_TABS = [
  { value: 'all', label: 'All', icon: ListChecks, filter: undefined },
  { value: 'todo', label: 'To Do', icon: CircleDot, filter: 'settings.status is "todo"' },
  { value: 'in_progress', label: 'In Progress', icon: Loader2, filter: 'settings.status is "in_progress"' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, filter: 'settings.status is "completed"' },
];
```

**Table Component:**
```tsx
export function TasksListTable({ tasks, products, onEdit, onDelete }) {
  // products map for looking up parent product names
  const productsMap = useMemo(() => {
    return new Map(products.map(p => [p.id, p]));
  }, [products]);

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Task</th>
          <th>Product</th>      {/* ← NEW: Show parent product */}
          <th>Status</th>
          <th>Priority</th>
          <th>Progress</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(task => {
          const product = productsMap.get(task.parentId);
          return (
            <tr key={task.id}>
              <td>{task.name}</td>
              <td>{product?.name || 'Unknown'}</td>
              <td><TaskStatusBadge status={task.settings?.status} /></td>
              <td>{task.settings?.priority}</td>
              <td>{task.settings?.progress}%</td>
              <td>
                <Button onClick={() => onEdit(task)}>Edit</Button>
                <Button onClick={() => onDelete(task)}>Delete</Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

---

### Phase 4: Add Product Context to Tasks

**Challenge:** Tasks need to show which product they belong to

**Solutions:**

**Option A: Fetch products separately**
```tsx
function TasksListTab({ orgId, deviceId, baseUrl, token }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Fetch all products for lookup
    fetchProducts();
  }, []);

  return (
    <FilteredTableWithTabs
      tabs={TASK_TABS}
      baseFilter='type is "core.task" and identity contains ["plm"]'
      client={client}
      renderTable={(tasks) => (
        <TasksListTable
          tasks={tasks}
          products={products}  // ← Pass for lookup
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    />
  );
}
```

**Option B: Enhanced query with parent data** (Future enhancement)
- Backend could return parent node data with query results
- Would eliminate separate fetch

**Recommendation:** Use Option A for now (simpler, works with current API)

---

## File Structure

```
frontend/src/features/product/pages/
├── ProductsListPage.tsx          # ← UPDATE: Main container with tabs
├── products-list-tab.tsx         # ← NEW: Extracted products view
├── tasks-list-tab.tsx            # ← NEW: All tasks view
├── products-page-tabs.tsx        # ← KEEP: Sub-tabs for products
└── tasks-list-table.tsx          # ← NEW: Task table component
```

---

## Benefits

### For Users
- ✅ **Single place** to see all tasks across products
- ✅ **Quick filtering** by status (To Do, In Progress, Completed)
- ✅ **Product context** - see which product each task belongs to
- ✅ **Bulk management** - manage tasks across multiple products

### For Developers
- ✅ **Reuses** existing `FilteredTableWithTabs` component
- ✅ **Consistent** pattern with products view
- ✅ **No backend changes** required
- ✅ **Modular** structure (easy to extend)

---

## Technical Details

### SDK Components Used

```typescript
// Main tabs (top level)
import { Tabs } from '@rubix-sdk/frontend/common/ui/tabs';

// Filtered tables (sub-tabs)
import { FilteredTableWithTabs } from '@rubix-sdk/frontend/components';

// Plugin client
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
```

### Query Patterns

**All PLM tasks:**
```typescript
const filter = 'type is "core.task" and identity contains ["plm"]';
```

**Tasks for specific product:**
```typescript
const filter = `type is "core.task" and parentId is "${productId}"`;
```

**Tasks by status:**
```typescript
const filter = 'type is "core.task" and settings.status is "in_progress"';
```

---

## Future Enhancements

### Phase 5 (Future)
- [ ] **Create Task** button on Tasks tab (creates task dialog)
- [ ] **Bulk actions** (select multiple tasks, batch update)
- [ ] **Advanced filters** (by product, by assignee, by date)
- [ ] **Task search** (search by name/description)
- [ ] **Sort options** (by priority, due date, progress)

### Phase 6 (Future)
- [ ] **Task dependencies** visualization
- [ ] **Kanban board view** (alternative to table)
- [ ] **Calendar view** (tasks by due date)
- [ ] **Export to CSV** (download tasks report)

---

## Testing Checklist

### Manual Testing
- [ ] Main tabs switch correctly (Products ↔ Tasks)
- [ ] Products tab shows existing functionality (unchanged)
- [ ] Tasks tab loads all tasks
- [ ] Task sub-tabs filter correctly
- [ ] Product names display correctly in task table
- [ ] Edit/Delete actions work
- [ ] Refresh buttons work on both tabs
- [ ] Empty states display correctly
- [ ] Loading states display correctly

### Edge Cases
- [ ] No products exist (tasks tab shows empty)
- [ ] No tasks exist (shows empty state)
- [ ] Task with deleted parent product (handle gracefully)
- [ ] Very long product/task names (truncate properly)
- [ ] Many tasks (pagination/virtual scrolling if needed)

---

## Dependencies

**None** - Uses existing SDK components and patterns

---

## Estimated Effort

- **Phase 1** (Refactor): 1-2 hours
- **Phase 2** (Main tabs): 1 hour
- **Phase 3** (Tasks tab): 2-3 hours
- **Phase 4** (Product context): 1 hour
- **Testing**: 1 hour

**Total:** ~6-8 hours

---

## Implementation Order

1. ✅ Phase 1: Extract `ProductsListTab` component
2. ✅ Phase 2: Add main `Tabs` navigation
3. ✅ Phase 3: Create `TasksListTab` with filtered table
4. ✅ Phase 4: Add product lookup for task context
5. ✅ Test all functionality
6. ✅ Update build and deploy

---

## Success Criteria

- ✅ Users can switch between Products and Tasks tabs
- ✅ Existing Products functionality unchanged
- ✅ Tasks tab shows all tasks from all products
- ✅ Task table shows which product each task belongs to
- ✅ Status filtering works (All, To Do, In Progress, Completed)
- ✅ Edit/Delete actions work
- ✅ Page loads in < 2 seconds
- ✅ No console errors

---

**Ready to implement?** Follow phases 1-4 in order.

**Last Updated:** 2026-03-25
