# How to Add More Features to PLM Plugin

Complete guide for extending the PLM plugin with new nodes, pages, and UI components.

**See also:**
- [TASK-MANAGEMENT.md](./TASK-MANAGEMENT.md) - Task management implementation example
- [V2-MIGRATION-SUMMARY.md](./V2-MIGRATION-SUMMARY.md) - PLM V2 architecture overview

---

## Quick Links

- [Adding Nodes](#adding-nodes) - Core nodes vs custom nodes
- [Adding Pages](#adding-pages) - Module Federation pages
- [Product Sections](#product-sections) - Collapsible sections pattern  
- [SDK Table Component](#sdk-table-component) - FilteredTableWithTabs
- [SDK Overview](#sdk-overview) - Frontend SDK reference

---

## Adding Nodes

### Core Node Reuse (✅ Recommended)

**Available Core Nodes:**
- `core.task` - Tasks, assignments, work items
- `core.ticket` - Issues, RMAs, support tickets
- `core.entry` - Time logs, expenses, data entries
- `core.document` - Files, specs, documentation
- `core.release` - Software releases, versions
- `core.asset` - Hardware units, physical items
- `core.product` - Products, catalog items
- `core.service` - Service roots
- `core.component` - Parts, BOM items

**Steps:**

1. **Add to plugin.json `coreNodeTypes`:**
```json
{
  "coreNodeTypes": ["core.task", "core.entry"]
}
```

2. **Define node profile in `nodes` array:**
```json
{
  "type": "core.task",
  "profile": "plm-task",
  "displayName": "Task",
  "icon": "list-checks",
  "color": "#8b5cf6",
  "constraints": {
    "allowedParents": ["plm.product"]
  },
  "autoFields": {
    "identity": ["task", "plm"]
  }
}
```

3. **Query in frontend:**
```typescript
const tasks = await client.queryNodes({
  filter: 'type is "core.task" and parentId is "${productId}"'
});
```

**That's it!** No Go code needed.

---

### Custom Nodes (Only When Necessary)

**When to create custom:**
- No core node matches
- Need custom business logic
- Need special validation

**Steps:**

1. **Add to plugin.json `nodeTypes`:**
```json
{
  "nodeTypes": ["plm.manufacturing-run"]
}
```

2. **Create Go implementation** (`internal/nodes/manufacturing_run.go`):
```go
package nodes

type ManufacturingRunNode struct {}

func (n *ManufacturingRunNode) GetHelp() models.NodeHelp {
    return models.NodeHelp{
        Summary: "Production batch tracking",
    }
}
```

3. **Register node** (`internal/nodes/registry.go`):
```go
registry.Register("plm.manufacturing-run", &ManufacturingRunNode{})
```

---

## Adding Pages

Pages load via Module Federation and appear in Rubix UI.

### Step-by-Step

**1. Define in plugin.json:**
```json
{
  "pages": [{
    "pageId": "tasks-manager",
    "title": "Task Management",
    "icon": "list-checks",
    "nodeTypes": ["plm.product"],
    "enabled": true,
    "props": {
      "exposedPath": "./TasksPage",
      "useMountPattern": true
    }
  }]
}
```

**2. Create page component:**
```tsx
// frontend/src/features/task/pages/TasksPage.tsx
import { createRoot, type Root } from 'react-dom/client';

export interface TasksPageProps {
  orgId: string;
  deviceId: string;
  nodeId: string;
  node?: any;
  baseUrl: string;
  token?: string;
}

function TasksPage(props: TasksPageProps) {
  return (
    <div className="p-8">
      <h1>Tasks for {props.node?.name}</h1>
    </div>
  );
}

// ✅ CRITICAL: Mount/unmount pattern
export default {
  mount: (container: HTMLElement, props?: TasksPageProps) => {
    const root = createRoot(container);
    root.render(<TasksPage {...props} />);
    return root;
  },
  unmount: (root: Root) => root.unmount(),
};
```

**3. Expose in vite.config.ts:**
```typescript
exposes: {
  './TasksPage': './src/features/task/pages/TasksPage.tsx',
}
```

**4. Build & deploy:**
```bash
make build-frontend && make build && ./deploy.sh
```

---

## Product Sections

Collapsible sections for detail pages (like Product Detail).

### Section Component Pattern

```tsx
// frontend/src/features/product/components/sections/TasksSection.tsx
import { SettingsSection } from '@rubix-sdk/frontend/common/ui/settings-section';

interface TasksSectionProps {
  product: Product;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export function TasksSection({
  product,
  isExpanded,
  onToggle,
  ...fetchProps
}: TasksSectionProps) {
  const [tasks, setTasks] = useState([]);

  // Lazy load when expanded
  useEffect(() => {
    if (isExpanded) fetchTasks();
  }, [isExpanded]);

  return (
    <SettingsSection
      title="Tasks"
      icon={ListChecks}
      description={`${tasks.length} tasks`}
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      {/* Content */}
    </SettingsSection>
  );
}
```

### Using in Detail Page

```tsx
function ProductDetailView({ product }) {
  const [expandedSections, setExpandedSections] = useState(new Set(['basic-info']));

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div>
      <TasksSection
        product={product}
        isExpanded={expandedSections.has('tasks')}
        onToggle={() => toggleSection('tasks')}
      />
    </div>
  );
}
```

---

## SDK Table Component

`FilteredTableWithTabs` provides tabbed filtering with lazy loading.

### Usage Example

```tsx
import { FilteredTableWithTabs } from '@rubix-sdk/frontend/components';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';

const TABS = [
  { value: 'all', label: 'All', filter: undefined },
  { value: 'todo', label: 'To Do', filter: 'settings.status is "todo"' },
  { value: 'done', label: 'Done', filter: 'settings.status is "completed"' },
];

export function TasksPageTabs({ orgId, deviceId, baseUrl, token, productId }) {
  const client = createPluginClient({ orgId, deviceId, baseUrl, token });

  return (
    <FilteredTableWithTabs
      tabs={TABS}
      baseFilter={`type is "core.task" and parentId is "${productId}"`}
      client={client}
      renderTable={(tasks) => <TaskTable tasks={tasks} />}
      renderEmpty={() => <div>No tasks found</div>}
    />
  );
}
```

**Features:**
- ✅ Lazy loading per tab
- ✅ Refresh button
- ✅ Loading states
- ✅ Tab counts

---

## SDK Overview

### Frontend SDK (`@rubix-sdk/frontend`)

Location: `/home/user/code/go/nube/rubix-sdk/frontend-sdk`

**Common Imports:**
```typescript
// UI Components
import { Button, Skeleton, Tabs } from '@rubix-sdk/frontend/common/ui';
import { SettingsSection } from '@rubix-sdk/frontend/common/ui/settings-section';
import { FilteredTableWithTabs } from '@rubix-sdk/frontend/components';

// Plugin Client
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';

// Icons (lucide-react)
import { Package, ListChecks, Edit, Trash2 } from 'lucide-react';
```

**Plugin Client Methods:**
```typescript
const client = createPluginClient({ orgId, deviceId, baseUrl, token });

// Query nodes
await client.queryNodes({ filter: 'type is "core.task"' });

// Create node
await client.createNode({ name, type, parentId, settings });

// Update node
await client.updateNode(nodeId, { settings: {...} });

// Delete node
await client.deleteNode(nodeId);
```

---

## Best Practices

### ✅ DO

- Reuse core nodes whenever possible
- Use lazy loading for sections (fetch when expanded)
- Use `FilteredTableWithTabs` for list views
- Follow mount/unmount pattern for pages
- Use SDK components (Button, Skeleton, etc.)
- Add loading/empty/error states

### ❌ DON'T

- Don't create custom nodes unless necessary
- Don't fetch data on mount - use lazy loading
- Don't hardcode URLs - use baseUrl prop
- Don't forget to expose in vite.config.ts
- Don't skip the plugin.json update

---

## Quick Commands

```bash
# Build frontend
make build-frontend

# Build backend
make build

# Deploy
./deploy.sh

# Full rebuild + deploy
make build-frontend && make build && ./deploy.sh
```

---

## File Structure

```
nube.plm/
├── plugin.json                    # Node types, pages config
├── internal/nodes/                # Custom Go nodes (if needed)
├── frontend/
│   ├── vite.config.ts            # Module Federation
│   └── src/features/
│       ├── product/
│       │   ├── types/            # TypeScript types
│       │   ├── api/              # API classes
│       │   ├── components/       # Reusable components
│       │   │   └── sections/     # Detail page sections
│       │   └── pages/            # Page entry points
│       └── task/
│           └── ... (same structure)
```

---

## Real Examples

See existing implementations:
- **Product**: `frontend/src/features/product/`
- **Task**: `frontend/src/features/task/`
- **Sections**: `frontend/src/features/product/components/sections/`
- **Pages**: `frontend/src/features/*/pages/`

---

## Troubleshooting

**Page doesn't appear:**
1. Check `nodeTypes` filter in plugin.json
2. Check `exposedPath` matches vite.config.ts
3. Rebuild & redeploy
4. Refresh Rubix UI

**Section doesn't load data:**
1. Check `isExpanded` prop
2. Check `useEffect` dependencies
3. Check query filter syntax
4. Check console for errors

---

**Last Updated:** 2026-03-25
