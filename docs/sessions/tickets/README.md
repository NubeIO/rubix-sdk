# PLM Ticket System

**Date**: 2026-03-28
**Status**: ✅ Active Development

---

## Overview

The PLM ticket system uses a **two-tier hierarchy** for managing work:

```
plm.product "Edge Controller"
  └─ plm.task "Implement Authentication"
      ├─ core.ticket "Choose auth library"
      ├─ core.ticket "Design login UI"
      ├─ core.ticket "Add JWT validation"
      │   └─ core.entry "Time logged: 2.5 hrs"
      └─ core.ticket "Write tests"
```

### Key Concepts

| Type | Purpose | Lives Under | Examples |
|------|---------|-------------|----------|
| **plm.task** | High-level work items, epics, features | `plm.product` | "Build frontend", "Fix auth bugs", "Release v2.0" |
| **core.ticket** | Granular actionable items, bugs, subtasks | `plm.task` or `plm.product` | "Choose library", "Fix button color", "Add tests" |
| **core.entry** | Time tracking, labor logs | `core.ticket` | "Worked 2.5 hours on JWT validation" |

---

## Architecture

### Design Principle

**Use core nodes with profiles instead of custom types:**
- ✅ `core.ticket` (with PLM profile) for tickets
- ✅ `core.entry` (with PLM profile) for time tracking
- ✅ Reuse existing Rubix infrastructure
- ✅ AI tools work out-of-box
- ❌ Don't create custom types unnecessarily

### Node Types

#### 1. plm.task (High-Level Work Item)

**Purpose**: Container for related tickets, epics, milestones

**Type**: Custom PLM node (no core equivalent for this use case)

**Parent**: `plm.product`

**Children**: `core.ticket`, `core.entry`

**Identity Tags**: `["task", "work-item", "plm"]`

**Settings Schema**:
```json
{
  "title": "Implement Authentication System",
  "description": "Add OAuth2 authentication with JWT tokens",
  "status": "in-progress",
  "priority": "high",
  "progress": 45,
  "completed": false,
  "assignee": "engineering-team",
  "reporter": "john.doe",
  "category": "feature",
  "dueDate": "2026-04-15",
  "startDate": "2026-03-20",
  "estimatedHours": 80,
  "actualHours": 36,
  "tags": "auth,security,v2"
}
```

**Example**:
```typescript
await client.createNode({
  type: 'plm.task',
  profile: 'plm-task',
  name: 'Implement Authentication',
  parentRef: productId,  // Use parentRef, not parentId!
  identity: ['task', 'work-item', 'plm'],
  settings: {
    status: 'in-progress',
    priority: 'high',
    assignee: 'engineering-team',
    dueDate: '2026-04-15'
  }
});
```

---

#### 2. core.ticket (Granular Action Item)

**Purpose**: Individual actionable work items, bugs, subtasks

**Type**: Core node with PLM profile

**Parent**: `plm.task` (preferred) or `plm.product` (standalone)

**Children**: `core.entry` (time logs)

**Identity Tags**:
- Base: `["ticket", "plm"]`
- Subtypes:
  - Bug: `["ticket", "plm", "bug"]`
  - Feature: `["ticket", "plm", "feature"]`
  - Task: `["ticket", "plm", "task"]`
  - Chore: `["ticket", "plm", "chore"]`

**Settings Schema**:
```json
{
  "ticketType": "task",
  "ticketNumber": "T-42",
  "title": "Add JWT validation endpoint",
  "description": "Create /auth/validate endpoint for token verification",
  "status": "in-progress",
  "priority": "medium",
  "assignee": "alice",
  "reporter": "john.doe",
  "reporterEmail": "john@company.com",
  "createdDate": "2026-03-20T10:00:00Z",
  "dueDate": "2026-03-25T17:00:00Z",
  "completedDate": "",
  "resolution": "",
  "category": "backend",
  "tags": "auth,jwt,api",
  "estimatedHours": 4,
  "actualHours": 2.5,
  "blocked": false,
  "blockedReason": ""
}
```

**Example**:
```typescript
await client.createNode({
  type: 'core.ticket',
  profile: 'plm-ticket',
  name: 'Add JWT validation',
  parentRef: taskId,  // Points to plm.task parent
  identity: ['ticket', 'plm', 'task'],
  settings: {
    ticketType: 'task',
    status: 'in-progress',
    priority: 'medium',
    assignee: 'alice',
    category: 'backend'
  }
});
```

---

#### 3. core.entry (Time Tracking)

**Purpose**: Track time spent on tickets

**Type**: Core node with PLM profile

**Parent**: `core.ticket` (required)

**Identity Tags**: `["entry", "time-log", "plm"]`

**Settings Schema**:
```json
{
  "date": "2026-03-23",
  "hours": 2.5,
  "userId": "alice",
  "userName": "Alice Smith",
  "description": "Implemented JWT validation logic",
  "category": "dev"
}
```

**Example**:
```typescript
await client.createNode({
  type: 'core.entry',
  profile: 'plm-time-log',
  name: 'Time log - JWT work',
  parentRef: ticketId,  // Points to core.ticket parent
  identity: ['entry', 'time-log', 'plm'],
  settings: {
    date: '2026-03-23',
    hours: 2.5,
    userId: 'alice',
    description: 'Implemented JWT validation'
  }
});
```

---

## Hierarchy Patterns

### Pattern 1: Task with Tickets (Recommended)

```
Product
  └─ Task "Build Auth System"
      ├─ Ticket "Research libraries"
      ├─ Ticket "Implement OAuth2"
      │   ├─ Entry "Alice: 3 hrs"
      │   └─ Entry "Bob: 2 hrs"
      └─ Ticket "Write tests"
          └─ Entry "Alice: 1.5 hrs"
```

**Use when**: You have a large feature that needs to be broken down

**Query tickets in a task**:
```typescript
filter: `type is "core.ticket" and parent.id is "${taskId}"`
```

### Pattern 2: Standalone Tickets

```
Product
  ├─ Ticket "Fix button styling" (no parent task)
  ├─ Ticket "Update README"
  └─ Task "Major Refactor"
      └─ Ticket "Extract components"
```

**Use when**: Small bug fixes or chores that don't need a parent task

**Query standalone tickets**:
```typescript
filter: `type is "core.ticket" and parent.id is "${productId}" and parent.type is "plm.product"`
```

### Pattern 3: Deep Nesting (Optional)

```
Product
  └─ Task "V2 Migration"
      └─ Ticket "Migrate Auth"
          └─ Ticket "Update login form" (sub-ticket)
              └─ Entry "Time logged"
```

**Use when**: You need sub-tickets under tickets (rare)

**Note**: Most cases should use Task → Ticket, not Ticket → Ticket

---

## Status Values

### Task Status
- `pending` - Not started
- `in-progress` - Actively being worked on
- `blocked` - Blocked by dependencies
- `review` - In code review
- `completed` - Done
- `cancelled` - Cancelled/abandoned

### Ticket Status
- `pending` / `todo` - Not started
- `in-progress` - Active work
- `blocked` - Blocked
- `review` - Needs review
- `completed` / `done` - Finished
- `cancelled` / `wontfix` - Not doing

### Priority Levels
- `low` - Nice to have
- `medium` - Normal priority
- `high` - Important
- `critical` - Urgent/blocking

---

## Queries

### Get All Tasks for a Product
```typescript
const tasks = await client.queryNodes({
  filter: `type is "plm.task" and parent.id is "${productId}"`
});
```

### Get All Tickets for a Task
```typescript
const tickets = await client.queryNodes({
  filter: `type is "core.ticket" and parent.id is "${taskId}"`
});
```

### Get All Tickets for a Product (Including in Tasks)
```typescript
// Direct tickets under product
const directTickets = await client.queryNodes({
  filter: `type is "core.ticket" and parent.id is "${productId}"`
});

// Tickets under tasks under product
const taskTickets = await client.queryNodes({
  filter: `type is "core.ticket" and parent.type is "plm.task" and parent.parent.id is "${productId}"`
});
```

### Get My Assigned Tickets
```typescript
const myTickets = await client.queryNodes({
  filter: `type is "core.ticket" and settings.assignee is "${userId}"`
});
```

### Get Overdue Tickets
```typescript
const overdue = await client.queryNodes({
  filter: `type is "core.ticket" and settings.status != "completed" and settings.dueDate < "${today}"`
});
```

### Get Time Entries for a Ticket
```typescript
const timeEntries = await client.queryNodes({
  filter: `type is "core.entry" and parent.id is "${ticketId}"`
});
```

### Get All Time Entries for a User This Week
```typescript
const timeEntries = await client.queryNodes({
  filter: `type is "core.entry" and settings.userId is "${userId}" and settings.date >= "${weekStart}" and settings.date <= "${weekEnd}"`
});
```

---

## Refs (References)

### Task Refs
```typescript
{
  refs: [
    { refName: 'productRef', toNodeId: productId },
    { refName: 'teamRef', toNodeId: teamId },
    { refName: 'assignedUserRef', toNodeId: userId },
    { refName: 'releaseRef', toNodeId: releaseId }  // Optional
  ]
}
```

### Ticket Refs
```typescript
{
  refs: [
    { refName: 'taskRef', toNodeId: taskId },  // Parent task
    { refName: 'productRef', toNodeId: productId },  // Product (inherited)
    { refName: 'assignedUserRef', toNodeId: userId },
    { refName: 'blockedByRef', toNodeId: blockingTicketId }  // Dependencies
  ]
}
```

### Entry Refs
```typescript
{
  refs: [
    { refName: 'ticketRef', toNodeId: ticketId },  // Parent ticket
    { refName: 'userRef', toNodeId: userId },  // Who logged time
    { refName: 'taskRef', toNodeId: taskId }  // Optional: parent task
  ]
}
```

---

## Frontend Implementation

### Key Files

```
nube.plm/frontend/src/features/
├── task/
│   ├── types/task.types.ts          # plm.task types
│   ├── components/TaskTable.tsx     # Task list table
│   ├── pages/TasksPage.tsx          # Tasks page
│   └── utils/task-status.ts         # Status helpers
├── ticket/
│   ├── types/ticket.types.ts        # core.ticket types
│   ├── components/TicketTable.tsx   # Ticket list
│   ├── components/TicketDialog.tsx  # Create/edit dialog
│   └── utils/ticket-helpers.ts
└── time/
    ├── types/time-entry.types.ts    # core.entry types
    ├── components/TimeEntryForm.tsx
    └── components/TimeLogView.tsx
```

### Creating Nodes

**Always use `parentRef`, not `parentId`:**

```typescript
// ✅ Correct
await client.createNode({
  type: 'core.ticket',
  name: 'My Ticket',
  parentRef: taskId,  // ← Use parentRef
  settings: { ... }
});

// ❌ Wrong
await client.createNode({
  type: 'core.ticket',
  name: 'My Ticket',
  parentId: taskId,  // ← Don't use parentId
  settings: { ... }
});
```

### TypeScript Types

```typescript
// Task
export interface Task {
  id: string;
  name: string;
  type: 'plm.task';
  parentId?: string;
  identity?: string[];
  settings?: TaskSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskSettings {
  title?: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'blocked' | 'review' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  progress?: number;  // 0-100
  assignee?: string;
  reporter?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
}

// Ticket
export interface Ticket {
  id: string;
  name: string;
  type: 'core.ticket';
  parentId?: string;
  identity?: string[];
  settings?: TicketSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketSettings {
  ticketType?: 'task' | 'bug' | 'feature' | 'chore';
  ticketNumber?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  reporter?: string;
  description?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
}

// Time Entry
export interface TimeEntry {
  id: string;
  name: string;
  type: 'core.entry';
  parentId: string;  // Required - ticket ID
  identity?: string[];
  settings?: TimeEntrySettings;
  createdAt?: string;
}

export interface TimeEntrySettings {
  date: string;
  hours: number;
  userId: string;
  userName?: string;
  description?: string;
  category?: string;
}
```

---

## Comments System

Both tasks and tickets support comments using the core.note node's command system. Comments are stored in NodeDataStore and support threaded discussions.

### Comment Data Structure

```typescript
interface CommentData {
  id: string;           // Unique comment ID (e.g., "cmt_abc123")
  text: string;         // Comment content
  userId?: string;      // User who created the comment
  userName?: string;    // Display name of the user
  createdAt: string;    // ISO 8601 timestamp
}
```

### Add Comment to Task or Ticket

```typescript
import { executePostCommand } from '@rubix-sdk/frontend/plugin-client/commands';

// Add comment to task
const result = await executePostCommand(client, taskId, 'addComment', {
  text: 'Updated the acceptance criteria for this task'
});

console.log(result.result);
// {
//   success: true,
//   id: "cmt_abc123",
//   text: "Updated the acceptance criteria...",
//   createdAt: "2026-03-28T10:30:00Z"
// }

// Add comment to ticket
await executePostCommand(client, ticketId, 'addComment', {
  text: 'Fixed the issue, ready for review'
});
```

### List All Comments

```typescript
import { executeGetCommand } from '@rubix-sdk/frontend/plugin-client/commands';

// List comments for task
const result = await executeGetCommand<{
  success: boolean;
  comments: CommentData[];
  count: number;
}>(client, taskId, 'listComments');

console.log(`Found ${result.count} comments`);
result.comments.forEach(comment => {
  console.log(`${comment.userName} at ${comment.createdAt}: ${comment.text}`);
});
```

### Delete Comment

```typescript
import { executeDeleteCommand } from '@rubix-sdk/frontend/plugin-client/commands';

// Delete a specific comment
const result = await executeDeleteCommand(client, taskId, 'deleteComment', {
  id: 'cmt_abc123'
});

console.log(result.result);
// {
//   success: true,
//   message: "Comment deleted successfully",
//   deletedId: "cmt_abc123"
// }
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { executeGetCommand, executePostCommand, executeDeleteCommand } from '@rubix-sdk/frontend/plugin-client/commands';

function useComments(client: PluginClient, nodeId: string) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const result = await executeGetCommand<{
        comments: CommentData[];
      }>(client, nodeId, 'listComments');
      setComments(result.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (text: string) => {
    try {
      await executePostCommand(client, nodeId, 'addComment', { text });
      await fetchComments(); // Refresh list
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await executeDeleteCommand(client, nodeId, 'deleteComment', { id: commentId });
      await fetchComments(); // Refresh list
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [nodeId]);

  return { comments, loading, addComment, deleteComment, refresh: fetchComments };
}

// Usage in component
function TaskCommentsPanel({ taskId }: { taskId: string }) {
  const client = createPluginClient({ orgId, deviceId, baseUrl, token });
  const { comments, loading, addComment, deleteComment } = useComments(client, taskId);

  return (
    <div>
      <h3>Comments ({comments.length})</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {comments.map(comment => (
            <div key={comment.id} className="comment">
              <div className="comment-header">
                <strong>{comment.userName || 'Unknown'}</strong>
                <span>{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              <p>{comment.text}</p>
              <button onClick={() => deleteComment(comment.id)}>Delete</button>
            </div>
          ))}
          <textarea id="new-comment" placeholder="Add a comment..." />
          <button onClick={() => {
            const textarea = document.getElementById('new-comment') as HTMLTextAreaElement;
            addComment(textarea.value);
            textarea.value = '';
          }}>
            Post Comment
          </button>
        </div>
      )}
    </div>
  );
}
```

### Comment Features

**Built-in Capabilities:**
- ✅ Automatic comment ID generation (e.g., `cmt_abc123`)
- ✅ Timestamp tracking (createdAt)
- ✅ User attribution (userId, userName)
- ✅ Ordered by creation time (index-based)
- ✅ Thread-safe storage in NodeDataStore
- ✅ Cascade deletion when node is deleted

**Best Practices:**
- Use comments for discussions, updates, and audit trails
- Comments are stored per-node (task or ticket)
- Each comment has a unique ID for editing/deletion
- Comments are ordered chronologically
- No nesting - flat comment structure

---

## Best Practices

### 1. Use Two-Tier Hierarchy

✅ **Do**: Task → Ticket
```
Task "Build Dashboard"
  ├─ Ticket "Create charts"
  ├─ Ticket "Add filters"
  └─ Ticket "Write tests"
```

❌ **Avoid**: Deep nesting (Ticket → Ticket → Ticket)

### 2. Use parentRef in API Calls

✅ **Do**: `parentRef: taskId`
❌ **Don't**: `parentId: taskId`

### 3. Query by parent.id

✅ **Do**: `parent.id is "${taskId}"`
❌ **Don't**: `parentId is "${taskId}"`

### 4. Use Identity Tags

```typescript
identity: ['ticket', 'plm', 'bug']  // Bug ticket
identity: ['ticket', 'plm', 'feature']  // Feature ticket
identity: ['ticket', 'plm', 'task']  // Task ticket
```

### 5. Store Time Entries as Child Nodes

✅ **Do**: Create `core.entry` nodes under tickets
❌ **Don't**: Store time entries in JSON arrays in settings

### 6. Calculate Actual Hours

```typescript
// Query time entries
const entries = await client.queryNodes({
  filter: `type is "core.entry" and parent.id is "${ticketId}"`
});

// Calculate total
const actualHours = entries.reduce(
  (sum, entry) => sum + (entry.settings?.hours || 0),
  0
);

// Update ticket
await client.updateNodeSettings(ticketId, {
  actualHours
});
```

---

## Migration Notes

### Current State (2026-03-28)

The codebase currently uses:
- ✅ `plm.task` for tasks (correct)
- 🚧 Adding `core.ticket` support with PLM profile
- 📋 Time tracking with `core.entry` (planned)

### Next Steps

1. ✅ Finalize `plm.task` implementation
2. 🚧 Add `core.ticket` support with PLM profile
3. 🚧 Add ticket → task relationship UI
4. 📋 Add `core.entry` time tracking
5. 📋 Build time log views

---

## See Also

- [V2-OVERVIEW.md](/home/user/code/go/nube/rubix/docs/system/v1/plm-plugin/V2-OVERVIEW.md) - PLM V2 architecture
- [GENERIC-CORE-NODES.md](/home/user/code/go/nube/rubix/docs/system/v1/nodes/GENERIC-CORE-NODES.md) - Core node types
- [plugin-client README](/home/user/code/go/nube/rubix-sdk/frontend-sdk/plugin-client/README.md) - SDK usage
