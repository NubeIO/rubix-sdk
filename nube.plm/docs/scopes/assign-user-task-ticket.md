# Scope: Migrate Task/Ticket Assignee from Settings to assignedUserRef

**Status:** Proposed
**Date:** 2026-04-01
**Priority:** High
**Effort:** 2-3 days

## Problem

Assignees on tasks and tickets are stored as a **free-form string** in `settings.assignee`:

```typescript
// Current - just a string, no referential integrity
settings: {
  assignee: "Alice"  // or "admin@rubix.io" or "Unassigned" or a typo
}
```

Issues:
- No link to actual user nodes (can't query "all tasks for user X" via refs)
- Free-text input allows typos and inconsistency
- Can't navigate the relationship (`assignedUserRef->name`)
- No user picker dropdown - just a text box

## Solution

Replace `settings.assignee` with `assignedUserRef` on task and ticket nodes.

Per REF-TABLE.md:

| Ref | Purpose | Auth Impact |
|-----|---------|-------------|
| `userRef` | Visibility control | **Yes** - auto-filters queries |
| `assignedUserRef` | Task ownership | **No** - purely informational |

`assignedUserRef` is the correct choice: it records who owns the work item without restricting visibility.

```typescript
// After - proper ref to user node
refs: [
  { refName: 'assignedUserRef', toNodeId: 'nod_USER_ABC', displayName: 'Alice' }
]
```

## Scope

### 1. Frontend SDK Changes (generic - all plugins benefit)

**File:** `frontend-sdk/plugin-client/refs.ts`

Add `assignedUserRef` convenience methods alongside existing `userRef`/`teamRef` helpers:

```typescript
/**
 * Set the assigned user on a node (creates assignedUserRef).
 * Unlike userRef, this does NOT affect visibility/access control.
 */
export async function setAssignedUser(
  client: PluginClient,
  nodeId: string,
  userId: string,
  userName?: string
): Promise<Ref> {
  return createRef(client, nodeId, {
    refName: 'assignedUserRef',
    toNodeId: userId,
    displayName: userName,
  });
}

/**
 * Remove the assigned user from a node
 */
export async function removeAssignedUser(
  client: PluginClient,
  nodeId: string
): Promise<void> {
  await deleteRef(client, nodeId, 'assignedUserRef');
}

/**
 * Get the assigned user for a node (returns first assignedUserRef)
 */
export async function getAssignedUser(
  client: PluginClient,
  nodeId: string
): Promise<Ref | null> {
  const refs = await listRefs(client, nodeId);
  return refs.find((ref) => ref.refName === 'assignedUserRef') || null;
}

/**
 * Replace the assigned user on a node.
 * Pass null userId to unassign.
 */
export async function replaceAssignedUser(
  client: PluginClient,
  nodeId: string,
  userId: string | null,
  userName?: string
): Promise<void> {
  try {
    await deleteRef(client, nodeId, 'assignedUserRef');
  } catch {
    // No existing ref - that's fine
  }

  if (userId) {
    await createRef(client, nodeId, {
      refName: 'assignedUserRef',
      toNodeId: userId,
      displayName: userName,
    });
  }
}
```

**File:** `frontend-sdk/plugin-client/index.ts` and `index.d.ts`

Expose the new methods on `PluginClient`:

```typescript
setAssignedUser(nodeId: string, userId: string, userName?: string): Promise<Ref>;
removeAssignedUser(nodeId: string): Promise<void>;
getAssignedUser(nodeId: string): Promise<Ref | null>;
replaceAssignedUser(nodeId: string, userId: string | null, userName?: string): Promise<void>;
```

### 2. Shared UserPicker Component

**File:** `frontend-sdk/common/ui/user-picker.tsx` (new)

A reusable dropdown that fetches users and lets you pick one. All plugins benefit.

```typescript
interface UserPickerProps {
  client: PluginClient;
  value?: string | null;       // Current user node ID
  displayValue?: string;       // Current display name (for initial render)
  onChange: (userId: string | null, userName: string) => void;
  placeholder?: string;
  disabled?: boolean;
}
```

Renders a `<Select>` with:
- "Unassigned" option (value = null)
- All org users fetched from `client.listUsers()`
- Shows user name in dropdown
- Caches user list (fetched once on mount)

### 3. PLM Ticket Changes

#### TicketForm.tsx - Replace text input with UserPicker

```diff
- <Label htmlFor="ticket-assignee">Assignee</Label>
- <Input
-   id="ticket-assignee"
-   value={values.assignee}
-   onChange={(e) => update('assignee', e.target.value)}
-   placeholder="Unassigned"
- />

+ <Label>Assignee</Label>
+ <UserPicker
+   client={client}
+   value={values.assigneeNodeId}
+   displayValue={values.assignee}
+   onChange={(userId, userName) => {
+     update('assigneeNodeId', userId);
+     update('assignee', userName);
+   }}
+ />
```

#### TicketDialog.tsx - Set ref after save

```typescript
// After creating/updating the ticket node:
if (values.assigneeNodeId) {
  await client.replaceAssignedUser(ticketId, values.assigneeNodeId, values.assignee);
} else {
  await client.removeAssignedUser(ticketId);
}
```

#### TicketsSectionV2.tsx - Read assignee display from ref

On fetch, read `assignedUserRef` to get the display name. Fall back to `settings.assignee` for old tickets.

### 4. PLM Task Changes

Same pattern as tickets. Replace text input with `UserPicker`, call `replaceAssignedUser()` on save.

**Files to modify:**

| File | Change |
|------|--------|
| `task/sections/TaskBasicInfoSection.tsx` | Replace `<Input>` with `<UserPicker>`, set ref on save |
| `product/pages/create-task-dialog.tsx` | `<UserPicker>`, set ref on create |
| `product/pages/edit-task-dialog.tsx` | `<UserPicker>`, set ref on save |
| `task/components/TaskHeader.tsx` | Read from ref displayName |
| `task/components/TaskCard.tsx` | Read from ref displayName |
| `task/components/TaskDetailDialog.tsx` | Read from ref displayName |
| `product/pages/tasks-data-table.tsx` | Read from ref |
| `product/pages/tasks-nested-tickets.tsx` | Read from ref |

### 5. Migration Strategy

**Backward compatible** - no big-bang migration needed:

1. **Read**: Check `assignedUserRef` first, fall back to `settings.assignee` for old nodes
2. **Write**: Always write `assignedUserRef`. Keep `settings.assignee` as a display cache
3. **Over time**: Old string-based assignees get replaced as users edit tasks/tickets

```typescript
function getAssigneeDisplay(refs: Ref[], settings: any): string {
  const assignedRef = refs.find(r => r.refName === 'assignedUserRef');
  if (assignedRef) return assignedRef.displayName || 'Assigned';
  return settings?.assignee || 'Unassigned';
}
```

### 6. Query Benefits

After migration:

```
# All tickets assigned to a specific user
assignedUserRef is "nod_USER_ABC" and type is "plm.ticket"

# All tasks assigned to a user across all products
assignedUserRef is "nod_USER_ABC" and type is "plm.task"

# Navigate through the ref
assignedUserRef->name is "Alice"
```

## Files Changed Summary

### Frontend SDK (generic - benefits all plugins)

| File | Action |
|------|--------|
| `frontend-sdk/plugin-client/refs.ts` | Add `setAssignedUser`, `removeAssignedUser`, `getAssignedUser`, `replaceAssignedUser` |
| `frontend-sdk/plugin-client/refs.d.ts` | Update types |
| `frontend-sdk/plugin-client/index.ts` | Expose new methods on PluginClient |
| `frontend-sdk/plugin-client/index.d.ts` | Update types |
| `frontend-sdk/common/ui/user-picker.tsx` | New shared UserPicker component |

### PLM Plugin

| File | Action |
|------|--------|
| `ticket/types/ticket.types.ts` | Add `assigneeNodeId?` to TicketSettings |
| `ticket/components/TicketForm.tsx` | Replace `<Input>` with `<UserPicker>` |
| `ticket/components/TicketDialog.tsx` | Call `replaceAssignedUser()` on save |
| `task/types/task.types.ts` | Add `assigneeNodeId?` to TaskSettings |
| `task/sections/TaskBasicInfoSection.tsx` | Replace `<Input>` with `<UserPicker>`, set ref on save |
| `task/sections/TicketsSectionV2.tsx` | Read assignee from ref (settings fallback) |
| `task/components/TaskHeader.tsx` | Read from ref displayName |
| `task/components/TaskCard.tsx` | Read from ref displayName |
| `task/components/TaskDetailDialog.tsx` | Read from ref displayName |
| `product/pages/create-task-dialog.tsx` | `<UserPicker>`, set ref on create |
| `product/pages/edit-task-dialog.tsx` | `<UserPicker>`, set ref on save |
| `product/pages/tasks-data-table.tsx` | Read from ref |
| `product/pages/tasks-nested-tickets.tsx` | Read from ref |

## Implementation Order

### Day 1: SDK
- [ ] Add `assignedUserRef` helpers to `refs.ts`
- [ ] Expose on `PluginClient` class + update `.d.ts`
- [ ] Create `UserPicker` component in `frontend-sdk/common/ui/`

### Day 2: Tickets
- [ ] Update `TicketForm` - replace text input with `UserPicker`
- [ ] Update `TicketDialog` - call `replaceAssignedUser()` on save
- [ ] Update `TicketsSectionV2` - read assignee from ref (settings fallback)
- [ ] Test create, edit, display

### Day 3: Tasks
- [ ] Update `TaskBasicInfoSection` - `UserPicker` + ref on save
- [ ] Update `create-task-dialog` - `UserPicker` + ref on create
- [ ] Update `edit-task-dialog` - `UserPicker` + ref on save
- [ ] Update display components (TaskHeader, TaskCard, TaskDetailDialog, tables)
- [ ] Test full flow

## Performance Note

Fetching `getAssignedUser()` per ticket in a list = N+1 API calls. Recommended approach:

**Keep `settings.assignee` as a display cache.** Write both the ref AND settings on save. List views read from settings (fast, single query), detail views read from ref (authoritative).

This avoids N+1 calls while maintaining ref-based querying.

## Success Criteria

- [ ] Tasks and tickets show a user dropdown (not free text)
- [ ] Selecting a user creates `assignedUserRef` on the node
- [ ] Old tasks/tickets still display correctly (settings fallback)
- [ ] Can query `assignedUserRef is "nod_XXX"` to find all work for a user
- [ ] `UserPicker` component reusable by any plugin
- [ ] No breaking changes to existing data
