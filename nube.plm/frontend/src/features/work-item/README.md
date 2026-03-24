# Work Item Domain

**Status**: 🚧 Placeholder - Not Yet Implemented

This directory will contain all code related to **Work Items** (tasks, work orders, operations).

---

## 📁 Planned Structure

```
work-item/
├── api/
│   ├── work-item-api.ts            # CRUD operations
│   └── index.ts
├── hooks/
│   ├── use-work-items.ts           # Multiple items hook
│   ├── use-work-item.ts            # Single item hook
│   └── index.ts
├── types/
│   ├── work-item.types.ts          # Interfaces
│   └── index.ts
├── components/
│   ├── WorkItemBoard.tsx           # Kanban board
│   ├── WorkItemCard.tsx            # Card component
│   ├── WorkItemTable.tsx           # Table view
│   ├── WorkItemForm.tsx            # Form component
│   ├── WorkItemStatusBadge.tsx     # Status badge
│   └── index.ts
├── pages/
│   ├── WorkItemsListPage.tsx       # Main list page
│   ├── WorkItemDetailPage.tsx      # Detail page
│   └── index.ts
├── widgets/
│   └── WorkItemBoardWidget.tsx     # Dashboard widget
└── README.md
```

---

## 🎯 Key Features (Planned)

### Core Functionality
- **Create Work Items**: Define tasks, operations, work orders
- **Assign to Runs**: Link work items to production runs
- **Track Status**: Todo → In Progress → Completed
- **Assign Resources**: Assign workers, equipment
- **Time Tracking**: Log time spent on tasks
- **Dependencies**: Link work items (blockers)

### Data Model (Draft)
```typescript
interface WorkItem {
  id: string;
  name: string;
  type: 'plm.work-item';
  settings: {
    productionRunRef?: string;    // Link to production run
    workItemType: 'task' | 'operation' | 'inspection' | 'setup';
    status: 'todo' | 'in-progress' | 'completed' | 'blocked';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignedTo?: string;          // User/team assigned
    estimatedHours?: number;
    actualHours?: number;
    dueDate?: string;
    dependencies?: string[];      // Other work item IDs
    notes?: string;
  };
}
```

---

## 🚀 Getting Started (When Implementing)

1. **Copy the product/ structure** as a template
2. **Define types** in `types/work-item.types.ts`
3. **Create API client** in `api/work-item-api.ts`
4. **Build hooks** for data fetching
5. **Create components** (board, card, table, form)
6. **Build pages** (list with Kanban, detail)
7. **Add to plugin.json** pages array
8. **Update vite.config.ts** exposes

---

## 📚 Related Domains

- **production-run/** - Production runs that contain work items
- **product/** - Products being worked on
- **site/** - Work locations
- **serialized-unit/** - Units being processed

---

## 🎨 UI Considerations

### Views
- **Kanban Board**: Drag-and-drop cards across status columns
- **Table View**: Sortable, filterable list
- **Calendar View**: Work items by due date
- **Timeline View**: Gantt-style visualization

### Features
- Drag-and-drop status changes
- Quick-add from any view
- Bulk operations (assign, move, complete)
- Real-time updates (collaborative)

---

## ✅ Implementation Checklist

When implementing this domain:

- [ ] Define TypeScript types
- [ ] Create API client
- [ ] Build React hooks
- [ ] Create Kanban board component
- [ ] Create table view component
- [ ] Create card component
- [ ] Build list page (multi-view)
- [ ] Build detail page (tabbed)
- [ ] Add dashboard widget
- [ ] Update plugin.json
- [ ] Update vite.config.ts
- [ ] Write tests
- [ ] Update this README

---

**See**: [`product/README.md`](../product/README.md) for the reference implementation pattern.
