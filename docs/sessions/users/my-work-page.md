# Scope: My Work Page (User Dashboard)

**Date**: 2026-04-01
**Status**: DRAFT
**Priority**: HIGH - Core productivity feature
**Target node**: `plm.service` (service-level page)

---

## Problem

Time entry is painful. Users currently have to:

1. Navigate to a specific product
2. Open a task
3. Find the ticket
4. Click "Log Time" on that one ticket
5. Repeat for every ticket they worked on

There is no way to see "what's on my plate" or log a full week of hours in one place. For a user who works across 5 products and 10 tickets, this is 50+ clicks to log a week. Nobody wants to do that, so timesheets are incomplete or late.

There is also no single view of "my assigned tasks" or "my open tickets" across all products.

---

## Solution

Build a **My Work** page on `plm.service` with two tabs:

### Tab 1: My Work

Everything assigned to the logged-in user across all products:
- My open tasks (assigned to me)
- My open tickets (assigned to me)
- My recent time entries

### Tab 2: All Users

Manager/admin view:
- All users with their assigned tasks, tickets, and time entries
- User picker to drill into a specific user
- Same data as "My Work" but for any user

---

## How to Identify "My" Work

### Assigned Tasks & Tickets

Tasks and tickets use `assignedUserRef` (ref to user node). A node can have multiple `assignedUserRef` entries (multiple assignees).

```typescript
// All tasks assigned to a user (by ref)
type is "plm.task" and r.assignedUserRef is "<userNodeId>"

// All tickets assigned to a user (by ref)
type is "plm.ticket" and r.assignedUserRef is "<userNodeId>"

// Navigate through the ref for display
assignedUserRef->name is "Alice"
```

**SDK helpers:**
- `client.getAssignedUsers(nodeId)` — returns all `assignedUserRef` refs for a node
- `client.replaceAssignedUsers(nodeId, users)` — replaces all assignees (delete + create)
- `client.setAssignedUser(nodeId, userId, userName)` — add a single assignee

**UserPicker component** (`@rubix-sdk/frontend/common/ui/user-picker`) provides a multi-select checkbox dropdown that fetches users via `client.listUsers()`.

### Time Entries

Time entries use `createdByRef` (ref to user node) for tracking who logged the time.

```typescript
// By ref
type is "core.entry" and r.createdByRef is "<userNodeId>"
```

The `createdByRef` is set automatically by `createTimeEntryWithRecalc()` when `userNodeId` is provided.

### Getting the Current User

The host passes `token` to plugin pages. The plugin client can list users via `client.listUsers()`. The current user needs to be resolved — options:

1. **Props from host** — if the host passes `userId` in page props (check if available)
2. **Token decode** — extract user info from the JWT token
3. **User picker fallback** — let user select themselves on first use, persist in localStorage

> **Open question**: Does the host currently pass `userId` in page mount props? If not, we use option 3 (user picker with localStorage persistence) as the initial approach.

---

## Timesheet: The Core UX

The timesheet is the key feature. Goal: **log a full week of hours in under 2 minutes**.

### Weekly Grid View

```
Week of Mar 30 - Apr 5, 2026          [< Prev]  [This Week]  [Next >]

Ticket                    Mon   Tue   Wed   Thu   Fri   Sat   Sun   Total
─────────────────────────────────────────────────────────────────────────
Rubix > Fix login bug      2     —     —     —     —     —     —     2.0h
Rubix > Add search         —    1.5    3     2     —     —     —     6.5h
Widget > QA batch #3       —     —     —     —     8     —     —     8.0h
+ Add ticket...
─────────────────────────────────────────────────────────────────────────
Daily total               2.0   1.5   3.0   2.0   8.0   —     —    16.5h
```

### How It Works

1. **Rows = tickets** the user has logged time against (auto-populated from existing entries, or manually added via "+ Add ticket" picker)
2. **Columns = days of the week** (Mon-Sun)
3. **Cells = hours** — click a cell to enter hours (inline editable, no dialog needed)
4. **Tab through cells** — keyboard navigation: Tab moves right, Enter moves down
5. **Bulk entry** — click a cell, type hours, Tab to next. Log a full week in seconds.
6. **Auto-save** — saves on blur/Tab, no submit button needed. Shows a subtle checkmark on save.
7. **"+ Add ticket"** — opens a searchable picker: select product -> task -> ticket. Adds a new row.

### Cell Behavior

- Empty cell = no entry for that day
- Click empty cell -> input appears, type hours, Tab/Enter to save
- Click filled cell -> edit inline
- Each cell maps to one `core.entry` node (create on first entry, update on edit, delete if set to 0)
- Category defaults to the ticket's last used category (or "dev")

### Timesheet Data Flow

```
User clicks cell (Wed, "Fix login bug")
  -> Check if core.entry exists for that ticket + date + user
     -> YES: update settings.hours
     -> NO:  create new core.entry under that ticket
  -> Recalculate ticket actualHours
  -> Recalculate parent task actualHours (if applicable)
```

Uses existing `createTimeEntryWithRecalc`, `updateTimeEntryWithRecalc`, `deleteTimeEntryWithRecalc` from `time-entry-helpers.ts`.

---

## Data Model & Queries

### Fetching User's Work

```typescript
// 1. Get all users
const users = await client.listUsers();

// 2. Get tasks assigned to user (via assignedUserRef)
const myTasks = await client.queryNodes({
  filter: `type is "plm.task" and r.assignedUserRef is "${userNodeId}"`,
});

// 3. Get tickets assigned to user (via assignedUserRef)
const myTickets = await client.queryNodes({
  filter: `type is "plm.ticket" and r.assignedUserRef is "${userNodeId}"`,
});

// 4. Get time entries for user (via createdByRef)
const myEntries = await client.queryNodes({
  filter: `type is "core.entry" and r.createdByRef is "${userNodeId}"`,
});
```

### Fetching Ticket Context (for "+ Add ticket" picker)

```typescript
// All products
const products = await client.queryNodes({ filter: 'type is "plm.product"' });

// Tasks for a product
const tasks = await client.queryNodes({
  filter: `type is "plm.task" and parent.id is "${productId}"`,
});

// Tickets for a task
const tickets = await client.queryNodes({
  filter: `type is "plm.ticket" and parent.id is "${taskId}"`,
});

// Or product-level tickets
const tickets = await client.queryNodes({
  filter: `type is "plm.ticket" and parent.id is "${productId}"`,
});
```

---

## Directory Structure

```
src/features/my-work/
├── MyWorkPage.tsx                  # Main entry point (mount/unmount)
├── index.ts
├── hooks/
│   ├── useCurrentUser.ts           # Resolve logged-in user (picker + localStorage)
│   ├── useMyWork.ts                # Fetch tasks, tickets, entries for a user
│   └── useTimesheetData.ts         # Weekly grid data: entries by ticket x day
├── components/
│   ├── UserSelector.tsx            # "Who am I?" picker (first-time setup)
│   ├── WeekNavigator.tsx           # Week picker: prev/next/this week
│   └── TicketPicker.tsx            # Searchable product -> task -> ticket picker
└── sections/
    ├── MyTasksSection.tsx          # Assigned tasks table
    ├── MyTicketsSection.tsx        # Assigned tickets table
    ├── TimesheetGrid.tsx           # The weekly timesheet grid (core feature)
    └── AllUsersSection.tsx         # All users view (Tab 2)
```

---

## Scope of Work

### Phase 1: User Resolution & Data

1. **`useCurrentUser` hook** — user picker with localStorage persistence. Lists users via `client.listUsers()`, saves selected user ID to `localStorage`. Returns `{ user, loading, pickUser }`.
2. **`useMyWork` hook** — fetches tasks/tickets/entries for a given user. Returns assigned tasks, assigned tickets, and time entries.
3. **`useTimesheetData` hook** — takes a user + week start date, fetches all time entries for that week, organizes into a grid: `Map<ticketId, Map<dayOfWeek, TimeEntry>>`.

### Phase 2: Timesheet Grid

4. **`WeekNavigator`** — prev/next/this-week buttons, displays "Week of Mon DD - Sun DD, YYYY"
5. **`TimesheetGrid`** — the weekly grid. Rows = tickets, columns = Mon-Sun. Inline-editable cells. Tab navigation. Auto-save on blur.
6. **`TicketPicker`** — "+ Add ticket" row. Searchable cascading picker: Product -> Task -> Ticket.

### Phase 3: My Tasks & Tickets

7. **`MyTasksSection`** — table of tasks assigned to current user. Columns: Product | Task | Status | Priority | Due Date
8. **`MyTicketsSection`** — table of tickets assigned to current user. Columns: Product | Task | Ticket | Status | Priority | Hours

### Phase 4: All Users Tab

9. **`AllUsersSection`** — user list with expandable rows showing each user's tasks/tickets/hours summary. Click a user to see their full view.

### Phase 5: Integration

10. **`MyWorkPage`** — main page with "My Work" / "All Users" tabs, wires everything together
11. **Add page to `plugin.json`** — `pageId: "my-work"`, `nodeTypes: ["plm.service"]`
12. **Add expose to `vite.config.ts`** — `'./MyWork': './src/features/my-work/MyWorkPage.tsx'`

---

## UI Wireframe

### My Work Tab

```
┌──────────────────────────────────────────────────────────────────┐
│  My Work                                    [My Work] [All Users]│
│                                                                  │
│  Logged in as: [Alice ▼]                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TIMESHEET            [< Prev]  Week of Mar 30 - Apr 5  [Next >]│
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Ticket               Mon  Tue  Wed  Thu  Fri  Sat  Sun Total││
│  │─────────────────────────────────────────────────────────────││
│  │ Rubix > Fix login      2    —    —    —    —    —    —   2.0 ││
│  │ Rubix > Add search     —   1.5   3    2    —    —    —   6.5 ││
│  │ Widget > QA batch      —    —    —    —    8    —    —   8.0 ││
│  │ + Add ticket...                                              ││
│  │─────────────────────────────────────────────────────────────││
│  │ Daily total           2.0  1.5  3.0  2.0  8.0   —    — 16.5 ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  MY TASKS (3 assigned)                                           │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Product  │ Task            │ Status      │ Priority │ Due    ││
│  │ Rubix    │ Auth overhaul   │ in-progress │ High     │ Apr 10 ││
│  │ Widget   │ QA automation   │ pending     │ Medium   │ Apr 15 ││
│  │ Rubix    │ Search feature  │ in-progress │ High     │ Apr 8  ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  MY TICKETS (5 open)                                             │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Product │ Task          │ Ticket         │ Status │ Hours    ││
│  │ Rubix   │ Auth overhaul │ Fix login bug  │ in-prog│ 2.0/4.0 ││
│  │ Rubix   │ Search feat.  │ Add search bar │ pending│ 6.5/8.0 ││
│  │ Widget  │ QA automation │ QA batch #3    │ in-prog│ 8.0/16  ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### All Users Tab

```
┌──────────────────────────────────────────────────────────────────┐
│  My Work                                    [My Work] [All Users]│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ALL USERS                                                       │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ User   │ Tasks │ Open Tickets │ Hours (this week) │ Total h  ││
│  │─────────────────────────────────────────────────────────────││
│  │ Alice  │   3   │      5       │     16.5h         │  120.0h  ││
│  │ Bob    │   2   │      3       │      8.0h         │   85.5h  ││
│  │ Charlie│   1   │      2       │      0.0h         │   42.0h  ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Click a user row to expand and see their tasks/tickets/entries  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Implementation Notes

### Existing Code to Reuse

- **`createTimeEntryWithRecalc`** / `updateTimeEntryWithRecalc` / `deleteTimeEntryWithRecalc` — already handles entry CRUD + parent recalc ([time-entry-helpers.ts](../../../nube.plm/frontend/src/features/time/utils/time-entry-helpers.ts))
- **`TimeEntryDialog`** — existing single-entry dialog, can be used for editing individual entries ([TimeEntryDialog.tsx](../../../nube.plm/frontend/src/features/time/components/TimeEntryDialog.tsx))
- **`UserPicker`** from SDK — `@rubix-sdk/frontend/common/ui/user-picker` fetches users via `client.listUsers()`
- **`client.listUsers()`** — returns all org users with `id`, `name`, `settings.email`

### Timesheet Grid: Auto-Save Pattern

```typescript
// On cell blur or Tab keydown:
async function saveCell(ticketId: string, date: string, hours: number) {
  const existing = entryMap.get(`${ticketId}:${date}`);

  if (hours === 0 && existing) {
    // Delete entry
    await deleteTimeEntryWithRecalc(client, existing.id);
  } else if (existing) {
    // Update existing
    await updateTimeEntryWithRecalc(client, existing.id, { hours });
  } else if (hours > 0) {
    // Create new
    await createTimeEntryWithRecalc(client, {
      name: `${userName} - ${hours}h - ${date}`,
      parentId: ticketId,
      date,
      hours,
      userId: currentUser.id,
      userName: currentUser.name,
      userNodeId: currentUser.id,
    });
  }
}
```

### Config Updates Required

**plugin.json** — add page:
```json
{
  "pageId": "my-work",
  "title": "My Work",
  "icon": "user",
  "description": "Personal dashboard with timesheet, tasks, and tickets",
  "nodeTypes": ["plm.service"],
  "enabled": true,
  "isDefault": false,
  "order": 5,
  "props": {
    "exposedPath": "./MyWork",
    "useMountPattern": true
  }
}
```

**vite.config.ts** — add expose:
```typescript
'./MyWork': './src/features/my-work/MyWorkPage.tsx',
```

---

## Open Questions

- [ ] Does the host pass `userId` in page mount props? If not, use user-picker + localStorage.
- [ ] Should the timesheet allow logging time on tickets not assigned to the user? (Probably yes — you may help on tickets not formally assigned.)
- [ ] Do we need a "Submit timesheet" workflow or is auto-save sufficient for v1?
- [ ] Should "All Users" tab be restricted to admin/manager roles?
- [ ] Do we want a "copy last week" button to pre-populate common tickets?
