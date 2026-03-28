# Ticket System - API Quick Reference

**Date**: 2026-03-28

Quick copy-paste examples for working with tasks, tickets, and time entries.

---

## Creating Nodes

### Create Task
```typescript
await client.createNode({
  type: 'plm.task',
  profile: 'plm-task',
  name: 'Implement Authentication',
  parentRef: productId,  // ← Use parentRef!
  identity: ['task', 'work-item', 'plm'],
  settings: {
    status: 'in-progress',
    priority: 'high',
    assignee: 'engineering-team',
    description: 'Add OAuth2 with JWT tokens',
    dueDate: '2026-04-15',
    estimatedHours: 80
  }
});
```

### Create Ticket (Under Task)
```typescript
await client.createNode({
  type: 'core.ticket',
  profile: 'plm-ticket',
  name: 'Add JWT validation endpoint',
  parentRef: taskId,  // Points to plm.task
  identity: ['ticket', 'plm', 'task'],
  settings: {
    ticketType: 'task',
    status: 'in-progress',
    priority: 'medium',
    assignee: 'alice',
    description: 'Create /auth/validate endpoint',
    dueDate: '2026-03-25',
    estimatedHours: 4
  }
});
```

### Create Standalone Ticket (Under Product)
```typescript
await client.createNode({
  type: 'core.ticket',
  profile: 'plm-ticket',
  name: 'Fix button styling',
  parentRef: productId,  // Points directly to product
  identity: ['ticket', 'plm', 'bug'],
  settings: {
    ticketType: 'bug',
    status: 'pending',
    priority: 'low',
    assignee: 'bob',
    description: 'Submit button is misaligned'
  }
});
```

### Create Time Entry
```typescript
await client.createNode({
  type: 'core.entry',
  profile: 'plm-time-log',
  name: 'JWT validation work',
  parentRef: ticketId,  // Points to core.ticket
  identity: ['entry', 'time-log', 'plm'],
  settings: {
    date: '2026-03-23',
    hours: 2.5,
    userId: 'alice',
    userName: 'Alice Smith',
    description: 'Implemented JWT validation logic',
    category: 'dev'
  }
});
```

---

## Updating Nodes

### Update Task
```typescript
// Update name
await client.updateNode(taskId, {
  name: 'New Task Name'
});

// Update settings (deep merge)
await client.updateNodeSettings(taskId, {
  status: 'completed',
  progress: 100,
  actualHours: 75
});
```

### Update Ticket
```typescript
// Update status
await client.updateNodeSettings(ticketId, {
  status: 'completed',
  completedDate: new Date().toISOString()
});

// Update assignee
await client.updateNodeSettings(ticketId, {
  assignee: 'bob'
});
```

---

## Querying

### Get Tasks for Product
```typescript
const tasks = await client.queryNodes({
  filter: `type is "plm.task" and parent.id is "${productId}"`
});
```

### Get Tickets for Task
```typescript
const tickets = await client.queryNodes({
  filter: `type is "core.ticket" and parent.id is "${taskId}"`
});
```

### Get All Tickets for Product (Direct + In Tasks)
```typescript
// Direct tickets
const directTickets = await client.queryNodes({
  filter: `type is "core.ticket" and parent.id is "${productId}"`
});

// Tickets in tasks
const taskTickets = await client.queryNodes({
  filter: `type is "core.ticket" and parent.type is "plm.task"`
});
```

### Get My Tickets
```typescript
const myTickets = await client.queryNodes({
  filter: `type is "core.ticket" and settings.assignee is "${currentUser}"`
});
```

### Get Tickets by Status
```typescript
const inProgressTickets = await client.queryNodes({
  filter: `type is "core.ticket" and settings.status is "in-progress"`
});
```

### Get Overdue Tickets
```typescript
const today = new Date().toISOString().split('T')[0];
const overdue = await client.queryNodes({
  filter: `type is "core.ticket" and settings.status != "completed" and settings.dueDate < "${today}"`
});
```

### Get Time Entries for Ticket
```typescript
const timeEntries = await client.queryNodes({
  filter: `type is "core.entry" and parent.id is "${ticketId}"`
});
```

### Get Time Entries for a User This Week
```typescript
const timeEntries = await client.queryNodes({
  filter: `type is "core.entry" and settings.userId is "${userId}" and settings.date >= "${weekStart}" and settings.date <= "${weekEnd}"`
});
```

### Get Bugs Only
```typescript
const bugs = await client.queryNodes({
  filter: `type is "core.ticket" and identity contains ["bug"]`
});
```

---

## Deleting

### Delete Task (Will Delete Child Tickets!)
```typescript
await client.deleteNode(taskId);
// ⚠️ Warning: This will cascade delete all tickets under this task
```

### Delete Ticket (Will Delete Time Entries!)
```typescript
await client.deleteNode(ticketId);
// ⚠️ Warning: This will cascade delete all time entries under this ticket
```

### Delete Time Entry
```typescript
await client.deleteNode(entryId);
```

---

## Calculated Fields

### Calculate Actual Hours for Ticket
```typescript
// Get all time entries
const entries = await client.queryNodes({
  filter: `type is "core.entry" and parent.id is "${ticketId}"`
});

// Sum hours
const actualHours = entries.reduce(
  (sum, entry) => sum + (entry.settings?.hours || 0),
  0
);

// Update ticket
await client.updateNodeSettings(ticketId, {
  actualHours
});
```

### Calculate Task Progress
```typescript
// Get all tickets in task
const tickets = await client.queryNodes({
  filter: `type is "core.ticket" and parent.id is "${taskId}"`
});

// Count completed
const completed = tickets.filter(
  t => t.settings?.status === 'completed'
).length;

const progress = tickets.length > 0
  ? Math.round((completed / tickets.length) * 100)
  : 0;

// Update task
await client.updateNodeSettings(taskId, {
  progress
});
```

---

## Common Filters

### Status Filters
```typescript
// Pending
`settings.status in ["pending", "todo"]`

// Active
`settings.status is "in-progress"`

// Done
`settings.status is "completed" or settings.completed is true`

// Cancelled
`settings.status in ["cancelled", "canceled"]`

// Not done
`settings.status != "completed" and settings.status != "cancelled"`
```

### Priority Filters
```typescript
// High priority
`settings.priority in ["high", "critical"]`

// Not low priority
`settings.priority != "low"`
```

### Date Filters
```typescript
// Due today
`settings.dueDate is "${today}"`

// Due this week
`settings.dueDate >= "${weekStart}" and settings.dueDate <= "${weekEnd}"`

// Overdue
`settings.dueDate < "${today}" and settings.status != "completed"`

// Created this month
`createdAt >= "${monthStart}"`
```

### Assignment Filters
```typescript
// Assigned to me
`settings.assignee is "${userId}"`

// Unassigned
`settings.assignee is null or settings.assignee is ""`

// Assigned to team
`settings.assignee is "${teamId}"`
```

### Type Filters (Using Identity)
```typescript
// Bugs only
`identity contains ["bug"]`

// Features only
`identity contains ["feature"]`

// Tasks only
`identity contains ["task"]`

// All PLM tickets
`identity contains ["plm"]`
```

---

## React Hook Patterns

### Fetch Tasks
```typescript
const [tasks, setTasks] = useState<Task[]>([]);

useEffect(() => {
  async function fetchTasks() {
    const nodes = await client.queryNodes({
      filter: `type is "plm.task" and parent.id is "${productId}"`
    });
    setTasks(nodes);
  }
  fetchTasks();
}, [productId]);
```

### Fetch Tickets with Refresh
```typescript
const [tickets, setTickets] = useState<Ticket[]>([]);
const [refreshKey, setRefreshKey] = useState(0);

useEffect(() => {
  async function fetchTickets() {
    const nodes = await client.queryNodes({
      filter: `type is "core.ticket" and parent.id is "${taskId}"`
    });
    setTickets(nodes);
  }
  fetchTickets();
}, [taskId, refreshKey]);

// Trigger refresh
const refresh = () => setRefreshKey(k => k + 1);
```

---

## Common Pitfalls

### ❌ Don't Use `parentId`
```typescript
// Wrong
await client.createNode({
  type: 'core.ticket',
  parentId: taskId  // ← Wrong!
});

// Correct
await client.createNode({
  type: 'core.ticket',
  parentRef: taskId  // ← Use parentRef
});
```

### ❌ Don't Query with `parentId`
```typescript
// Wrong
filter: `parentId is "${taskId}"`

// Correct
filter: `parent.id is "${taskId}"`
```

### ❌ Don't Store Arrays in Settings
```typescript
// Wrong - not queryable
settings: {
  timeEntries: [
    { userId: 'alice', hours: 2 },
    { userId: 'bob', hours: 3 }
  ]
}

// Correct - use child nodes
await client.createNode({
  type: 'core.entry',
  parentRef: ticketId,
  settings: { userId: 'alice', hours: 2 }
});
```

### ❌ Don't Forget Identity Tags
```typescript
// Minimal - works but less useful
identity: ['ticket']

// Better - enables filtering
identity: ['ticket', 'plm', 'bug']
```

---

## Status Normalization

```typescript
export function normalizeStatus(status?: string): string {
  const normalized = status?.trim().toLowerCase().replace(/_/g, '-');

  switch (normalized) {
    case 'completed':
    case 'done':
      return 'completed';
    case 'in-progress':
    case 'inprogress':
    case 'active':
      return 'in-progress';
    case 'cancelled':
    case 'canceled':
    case 'wontfix':
      return 'cancelled';
    case 'blocked':
      return 'blocked';
    case 'review':
    case 'in-review':
      return 'review';
    case 'todo':
    case 'pending':
    default:
      return 'pending';
  }
}
```

---

## Comments (Using Commands)

### Add Comment to Task/Ticket
```typescript
import { executePostCommand } from '@rubix-sdk/frontend/plugin-client/commands';

const result = await executePostCommand(client, taskId, 'addComment', {
  text: 'Updated acceptance criteria'
});
// Returns: { success: true, id: "cmt_abc123", text: "...", createdAt: "..." }
```

### List Comments
```typescript
import { executeGetCommand } from '@rubix-sdk/frontend/plugin-client/commands';

const result = await executeGetCommand<{
  comments: Array<{
    id: string;
    text: string;
    userId?: string;
    userName?: string;
    createdAt: string;
  }>;
  count: number;
}>(client, taskId, 'listComments');

console.log(`${result.count} comments`);
result.comments.forEach(c => console.log(c.text));
```

### Delete Comment
```typescript
import { executeDeleteCommand } from '@rubix-sdk/frontend/plugin-client/commands';

await executeDeleteCommand(client, taskId, 'deleteComment', {
  id: 'cmt_abc123'
});
// Returns: { success: true, message: "Comment deleted", deletedId: "..." }
```

---

## Complete Example: Task Management Component

```typescript
import { useState, useEffect, useCallback } from 'react';
import { PluginClient } from '@rubix-sdk/frontend/plugin-client';

interface TaskManagerProps {
  client: PluginClient;
  productId: string;
}

export function TaskManager({ client, productId }: TaskManagerProps) {
  const [tasks, setTasks] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch tasks
  useEffect(() => {
    async function fetch() {
      const nodes = await client.queryNodes({
        filter: `type is "plm.task" and parent.id is "${productId}"`
      });
      setTasks(nodes);
    }
    fetch();
  }, [productId, refreshKey]);

  // Create task
  const createTask = useCallback(async (name: string) => {
    await client.createNode({
      type: 'plm.task',
      profile: 'plm-task',
      name,
      parentRef: productId,
      identity: ['task', 'plm'],
      settings: {
        status: 'pending',
        priority: 'medium'
      }
    });
    setRefreshKey(k => k + 1);
  }, [client, productId]);

  // Update task status
  const updateStatus = useCallback(async (taskId: string, status: string) => {
    await client.updateNodeSettings(taskId, { status });
    setRefreshKey(k => k + 1);
  }, [client]);

  // Delete task
  const deleteTask = useCallback(async (taskId: string) => {
    await client.deleteNode(taskId);
    setRefreshKey(k => k + 1);
  }, [client]);

  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>
          <h3>{task.name}</h3>
          <p>Status: {task.settings?.status}</p>
          <button onClick={() => updateStatus(task.id, 'completed')}>
            Complete
          </button>
          <button onClick={() => deleteTask(task.id)}>
            Delete
          </button>
        </div>
      ))}
      <button onClick={() => createTask('New Task')}>
        Create Task
      </button>
    </div>
  );
}
```
