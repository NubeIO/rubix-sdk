# PLM Ticket System - Design Decisions & Known Issues

**Date**: 2026-03-28

This document explains key design decisions, known limitations, and workarounds.

---

## Design Decisions

### 1. Comments Use Commands, Not Child Nodes

**Decision**: Comments are stored via commands (`addComment`, `listComments`, `deleteComment`) in NodeDataStore, NOT as child nodes.

**Why**:
- Comments are append-only and chronological
- No need for complex queries or aggregation
- Commands provide simpler CRUD API
- Better performance for high-volume comment threads

**Trade-off**:
- Creates two mental models (comments via commands, time entries via nodes)
- Can't query comments like nodes
- Can't use refs to/from comments

**When to reconsider**: If you need to query comments, use full-text search on comments, or link comments to other nodes, consider switching to `core.comment` child nodes.

---

### 2. Calculated Fields Stored in Settings

**Decision**: `actualHours` (on tickets) and `progress` (on tasks) are stored in `settings` but calculated from child nodes.

**Why**:
- Fast access without aggregation queries
- Denormalized for read performance
- Settings are easily queryable

**Trade-off**:
- **Will drift if not manually recalculated**
- Requires discipline to update after every child change
- No automatic triggers

**Mitigation**:
```typescript
// Always recalculate after changes
await client.createNode({ type: 'core.entry', ... });
await recalculateActualHours(client, ticketId);

await client.updateNodeSettings(ticketId, { status: 'completed' });
await recalculateTaskProgress(client, taskId);
```

**✅ Implementation Status**: Helper functions implemented in:
- `features/task/utils/task-helpers.ts` - `recalculateTaskProgress()`, `recalculateTaskActualHours()`
- `features/ticket/utils/ticket-helpers.ts` - `recalculateActualHours()`
- `features/time/utils/time-entry-helpers.ts` - `createTimeEntryWithRecalc()`, `deleteTimeEntryWithRecalc()`

**Future improvement**: Add backend triggers or hooks to auto-update on child changes.

---

### 3. Tickets Can Be Under Tasks OR Products

**Decision**: Tickets can have `plm.task` OR `plm.product` as parent.

**Why**:
- Flexibility for standalone tickets (small bugs, quick fixes)
- No need to create tasks for every ticket

**Trade-off**:
- **Getting all tickets for a product requires 2 queries**
- More complex query logic
- Easy to miss tickets in one location

**Mitigation**:
```typescript
// Option 1: Use helper function (2 queries)
async function getAllProductTickets(client, productId) {
  const direct = await client.queryNodes({
    filter: `type is "core.ticket" and parent.id is "${productId}"`
  });
  const inTasks = await client.queryNodes({
    filter: `type is "core.ticket" and parent.type is "plm.task" and parent.parent.id is "${productId}"`
  });
  return [...direct, ...inTasks];
}

// Option 2: Always add productRef (single query)
await client.createNode({
  type: 'core.ticket',
  parentRef: taskId,
  refs: [{ refName: 'productRef', toNodeId: productId }],  // ← Enables single query
  settings: { ... }
});

const all = await client.queryNodes({
  filter: `type is "core.ticket" and refs.productRef.toNodeId is "${productId}"`
});
```

**Recommendation**: Always add `productRef` to tickets, even when under tasks.

**✅ Implementation Status**: Helper function `getAllProductTickets()` implemented in `features/task/utils/task-helpers.ts`

---

### 4. parentRef vs parentId Confusion

**Decision**: The API has both `parentRef` and `parentId`, but only `parentRef` works.

**Why this exists**:
- Legacy API design
- `parentId` is a regular field, `parentRef` creates the relationship
- `parentId` wasn't removed for backward compatibility

**Trade-off**:
- **Common footgun - developers use wrong one**
- Silent failures or orphaned nodes
- Requires documentation everywhere

**Mitigation**:
- Use ESLint rule to ban `parentId`
- Always validate in code reviews
- Consider API v2 that removes `parentId`

```typescript
// ❌ NEVER USE
parentId: taskId

// ✅ ALWAYS USE
parentRef: taskId
```

**✅ Implementation Status**: All TypeScript interfaces updated to use `parentRef` instead of `parentId`:
- `CreateTaskInput` in `features/task/types/task.types.ts`
- `CreateTicketInput` in `features/ticket/types/ticket.types.ts`
- `CreateTimeEntryInput` in `features/time/types/time-entry.types.ts`
- All CRUD operations in `TasksPage.tsx` now use `parentRef`

---

### 5. Status Values Must Be Standardized

**Decision**: Both tasks and tickets use the same status enum with strict validation.

**Why**:
- New system, no legacy data
- Enforce consistency from day one
- Prevent data drift before it starts

**Standard Values**:
- `pending` - Not started
- `in-progress` - Actively being worked on
- `blocked` - Blocked by dependencies
- `review` - In code review
- `completed` - Done
- `cancelled` - Cancelled/abandoned

**Mitigation**:
```typescript
// Always normalize user input
export function normalizeStatus(status?: string): string {
  const normalized = status?.trim().toLowerCase().replace(/_/g, '-');
  switch (normalized) {
    case 'completed':
      return 'completed';
    case 'in-progress':
      return 'in-progress';
    case 'blocked':
      return 'blocked';
    case 'review':
      return 'review';
    case 'cancelled':
      return 'cancelled';
    case 'pending':
    default:
      return 'pending';
  }
}

// Use everywhere
await client.updateNodeSettings(id, {
  status: normalizeStatus(userInput)
});
```

**✅ Implementation Status**: Normalization functions implemented in:
- `features/task/utils/task-status.ts` - `normalizeTaskStatus()` with all 6 statuses
- `features/ticket/utils/ticket-helpers.ts` - `normalizeTicketStatus()`
- `TasksPage.tsx` now uses normalization in `updateTask()`

**Future improvement**: Add API-level validation to reject invalid status values.

---

## Known Limitations

### L1: No Automatic Field Recalculation

**Problem**: `actualHours` and `progress` don't auto-update when child nodes change.

**Impact**: Data becomes stale if developers forget to recalculate.

**Workaround**: Call helper functions after every change (see Design Decision #2).

**Fix**: Add backend triggers or use database computed columns.

---

### L2: Two Queries for All Product Tickets

**Problem**: Can't get all tickets for a product in a single query.

**Impact**: Slower performance, potential to miss tickets, complex code.

**Workaround**: Use `productRef` on all tickets or helper function (see Design Decision #3).

**Fix**: Enforce `productRef` at creation time, or change design to always nest tickets under tasks.

---

### L3: Identity Tags Not Validated

**Problem**: No schema enforcement on identity arrays.

**Impact**: Inconsistent tags make filtering unreliable.

**Example Bad Data**:
```typescript
identity: ['bug', 'ticket']           // Wrong order
identity: ['ticket']                  // Missing 'plm'
identity: ['ticket', 'plm', 'Bug']    // Wrong case
```

**Workaround**: Use constants and validation:
```typescript
const TICKET_IDENTITY = {
  BUG: ['ticket', 'plm', 'bug'],
  FEATURE: ['ticket', 'plm', 'feature'],
  TASK: ['ticket', 'plm', 'task'],
  CHORE: ['ticket', 'plm', 'chore'],
} as const;

// Use in code
identity: TICKET_IDENTITY.BUG
```

**✅ Implementation Status**: Constants defined in `features/ticket/utils/ticket-helpers.ts`. Task creation now uses standard identity tags: `['task', 'work-item', 'plm']`

**Fix**: Add API-level validation for identity arrays.

---

### L4: Deep Nesting Allowed But Discouraged

**Problem**: System allows `ticket → ticket → ticket` (subtasks) but docs say "don't do this."

**Impact**: Confusing guidance, some developers will use it anyway.

**Workaround**: Document clearly when to use (almost never) or enforce at API level.

**Fix**: Either:
- Fully support subtasks with UI and docs
- OR block ticket→ticket creation at API level

---

### L5: No Cascade Delete Configuration

**Problem**: Deleting task deletes all child tickets (cascade), but this isn't configurable.

**Impact**: Can't move tickets to product when deleting a task.

**Workaround**: Manually move tickets before deleting:
```typescript
// Before deleting task, move tickets to product
const tickets = await client.queryNodes({
  filter: `type is "core.ticket" and parent.id is "${taskId}"`
});

for (const ticket of tickets) {
  await client.updateNode(ticket.id, { parentRef: productId });
}

await client.deleteNode(taskId);
```

**Fix**: Add `onDelete` behavior option: `cascade` | `orphan` | `prevent`.

---

## Best Practices (Summary)

1. ✅ **Always use `parentRef`**, never `parentId`
2. ✅ **Always normalize status** with `normalizeStatus()`
3. ✅ **Always recalculate** `actualHours` and `progress` after changes
4. ✅ **Always add `productRef`** to tickets for single-query access
5. ✅ **Always use standard identity tags** from constants
6. ✅ **Always use helper functions** for complex queries (all product tickets)
7. ❌ **Never trust raw user input** for status, priority, identity
8. ❌ **Never create ticket→ticket** unless you have a very good reason
9. ❌ **Never delete tasks** without considering child tickets

---

## Migration Path

If starting fresh, consider these improvements:

1. **Enforce productRef**: Make it required on all tickets at API level
2. **Remove parentId**: API v2 should only have `parentRef`
3. **Standardize status**: Migrate all data, then validate at API
4. **Add triggers**: Auto-update calculated fields
5. **Validate identity**: Enforce tag schema at API level
6. **Cascade config**: Add `onDelete` behavior option
7. **Consider**: Comments as nodes instead of commands for consistency

---

## See Also

- [README.md](./README.md) - Main documentation
- [API-QUICK-REFERENCE.md](./API-QUICK-REFERENCE.md) - Code examples
- [UI-PATTERNS.md](./UI-PATTERNS.md) - Frontend patterns
