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
  profile: 'plm-work-item',
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

**⚠️ IMPORTANT: Only use the standardized values below.**

### Standard Status (Tasks & Tickets)
- `pending` - Not started
- `in-progress` - Actively being worked on
- `blocked` - Blocked by dependencies
- `review` - In code review
- `completed` - Done
- `cancelled` - Cancelled/abandoned

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

**⚠️ DESIGN LIMITATION**: Getting all tickets requires 2 queries because tickets can be under Product OR Task.

```typescript
/**
 * Helper function to get ALL tickets for a product (direct + in tasks)
 * This is the recommended approach to avoid missing tickets.
 */
async function getAllProductTickets(client: PluginClient, productId: string) {
  // Query 1: Direct tickets under product
  const directTickets = await client.queryNodes({
    filter: `type is "core.ticket" and parent.id is "${productId}"`
  });

  // Query 2: Tickets under tasks under product
  const taskTickets = await client.queryNodes({
    filter: `type is "core.ticket" and parent.type is "plm.task" and parent.parent.id is "${productId}"`
  });

  // Merge and deduplicate
  const allTickets = [...directTickets, ...taskTickets];
  return allTickets;
}

// Usage
const tickets = await getAllProductTickets(client, productId);
```

**Alternative**: Use refs to link all tickets to product:
```typescript
// When creating ticket under task, also add productRef
await client.createNode({
  type: 'core.ticket',
  parentRef: taskId,
  refs: [
    { refName: 'productRef', toNodeId: productId }  // ← Enables single query
  ],
  settings: { ... }
});

// Then query becomes simple
const allTickets = await client.queryNodes({
  filter: `type is "core.ticket" and refs.productRef.toNodeId is "${productId}"`
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

**When to use Refs vs Parent Hierarchy:**

| Use Case | Use Parent Hierarchy | Use Refs |
|----------|---------------------|----------|
| Containment ("belongs to") | ✅ Ticket belongs to Task | ❌ |
| Single relationship | ✅ Entry belongs to Ticket | ❌ |
| Multiple relationships | ❌ | ✅ Ticket blocked by multiple tickets |
| Cross-hierarchy links | ❌ | ✅ Ticket links to Product AND Task |
| Dependencies | ❌ | ✅ Ticket depends on other tickets |

### Creating Refs

```typescript
// Create ticket with refs
const ticket = await client.createNode({
  type: 'core.ticket',
  name: 'Implement feature X',
  parentRef: taskId,  // Parent hierarchy
  refs: [
    { refName: 'productRef', toNodeId: productId },  // Cross-reference
    { refName: 'assignedUserRef', toNodeId: userId }  // User assignment
  ],
  settings: { ... }
});

// Add blocking dependency after creation
await client.addRef(ticketId, {
  refName: 'blockedByRef',
  toNodeId: blockingTicketId
});
```

### Querying via Refs

```typescript
// Get all tickets assigned to a user
const userTickets = await client.queryNodes({
  filter: `type is "core.ticket" and refs.assignedUserRef.toNodeId is "${userId}"`
});

// Get all tickets in a product (using productRef instead of parent queries)
const productTickets = await client.queryNodes({
  filter: `type is "core.ticket" and refs.productRef.toNodeId is "${productId}"`
});

// Get all tickets blocked by a specific ticket
const blockedTickets = await client.queryNodes({
  filter: `type is "core.ticket" and refs.blockedByRef.toNodeId is "${blockingTicketId}"`
});

// Get all tickets that are blocking anything (have blockedByRef)
const blockingTickets = await client.queryNodes({
  filter: `type is "core.ticket" and refs.blockedByRef exists`
});
```

### Common Ref Patterns

**Task Refs:**
```typescript
{
  refs: [
    { refName: 'productRef', toNodeId: productId },      // Required
    { refName: 'teamRef', toNodeId: teamId },            // Optional
    { refName: 'assignedUserRef', toNodeId: userId },    // Optional
    { refName: 'releaseRef', toNodeId: releaseId }       // Optional
  ]
}
```

**Ticket Refs:**
```typescript
{
  refs: [
    { refName: 'productRef', toNodeId: productId },      // Recommended for easier querying
    { refName: 'assignedUserRef', toNodeId: userId },    // User assignment
    { refName: 'blockedByRef', toNodeId: ticketId }      // Dependency (can have multiple)
  ]
}
```

**💡 TIP**: Always add `productRef` to tickets, even if they're under a task. This enables single-query access to all product tickets.

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

**⚠️ CRITICAL: Always use `parentRef`, NEVER `parentId`**

The API accepts `parentId` but it will silently fail or create orphaned nodes. This is a known footgun.

```typescript
// ✅ CORRECT - Use parentRef
await client.createNode({
  type: 'core.ticket',
  name: 'My Ticket',
  parentRef: taskId,  // ← Always use parentRef
  settings: { ... }
});

// ❌ WRONG - parentId will fail
await client.createNode({
  type: 'core.ticket',
  name: 'My Ticket',
  parentId: taskId,  // ← This is NOT the same as parentRef!
  settings: { ... }
});

// ❌ WRONG - Don't query with parentId either
filter: `parentId is "${taskId}"`  // ← Wrong

// ✅ CORRECT - Use parent.id in queries
filter: `parent.id is "${taskId}"`  // ← Correct
```

**Why this matters**: `parentRef` creates the parent-child relationship. `parentId` is just a field that does nothing.

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

Both tasks and tickets support comments using the **command system** (not child nodes).

**⚠️ DESIGN NOTE**: Comments use a different pattern than time entries:
- **Time Entries**: Stored as `core.entry` child nodes ✅
- **Comments**: Stored in NodeDataStore via commands ✅

**Why the difference?**
- Time entries need to be queryable, aggregated, and filtered
- Comments are append-only, chronological, and don't need complex queries
- Commands provide simpler API for comment CRUD operations

This is intentional but creates two mental models in the same system.

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

### 4. Use Identity Tags Consistently

**⚠️ IMPORTANT: Identity tag order and content matters for filtering.**

**Standard Identity Patterns** (use these exactly):

```typescript
// Tasks
identity: ['task', 'work-item', 'plm']  // All tasks use this

// Tickets - always start with 'ticket', 'plm', then type
identity: ['ticket', 'plm', 'bug']      // Bug ticket
identity: ['ticket', 'plm', 'feature']  // Feature ticket
identity: ['ticket', 'plm', 'task']     // Task ticket
identity: ['ticket', 'plm', 'chore']    // Chore ticket

// Time entries
identity: ['entry', 'time-log', 'plm']  // All time entries use this
```

**Filtering by Identity**:
```typescript
// Get all bugs
filter: `identity contains ["bug"]`

// Get all PLM tickets (any type)
filter: `identity contains ["plm"]`

// ❌ Don't use inconsistent tags
identity: ['bug', 'ticket']  // Wrong order
identity: ['ticket']         // Missing 'plm'
```

### 5. Store Time Entries as Child Nodes

✅ **Do**: Create `core.entry` nodes under tickets
❌ **Don't**: Store time entries in JSON arrays in settings

### 6. Keep Calculated Fields in Sync

**⚠️ CRITICAL: actualHours and progress will drift if not recalculated!**

These fields are **stored** in settings but **calculated** from child nodes. You MUST update them whenever children change.

```typescript
/**
 * Update ticket's actualHours after adding/updating/deleting time entries
 */
async function recalculateActualHours(client: PluginClient, ticketId: string) {
  // Query all time entries
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

  return actualHours;
}

/**
 * Update task's progress after adding/updating/deleting tickets
 */
async function recalculateTaskProgress(client: PluginClient, taskId: string) {
  // Query all tickets in task
  const tickets = await client.queryNodes({
    filter: `type is "core.ticket" and parent.id is "${taskId}"`
  });

  if (tickets.length === 0) {
    await client.updateNodeSettings(taskId, { progress: 0 });
    return 0;
  }

  // Count completed
  const completed = tickets.filter(
    t => t.settings?.status === 'completed'
  ).length;

  const progress = Math.round((completed / tickets.length) * 100);

  // Update task
  await client.updateNodeSettings(taskId, {
    progress,
    completed: progress === 100
  });

  return progress;
}

// ⚠️ IMPORTANT: Call these helpers after ANY change to child nodes
await client.createNode({ type: 'core.entry', ... });
await recalculateActualHours(client, ticketId);

await client.updateNodeSettings(ticketId, { status: 'completed' });
await recalculateTaskProgress(client, taskId);
```

**💡 TIP**: Consider creating custom hooks or backend triggers to automate this.

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

- [DESIGN-DECISIONS.md](./DESIGN-DECISIONS.md) - **READ THIS** - Design decisions, known issues, and workarounds
- [API-QUICK-REFERENCE.md](./API-QUICK-REFERENCE.md) - Quick copy-paste examples
- [UI-PATTERNS.md](./UI-PATTERNS.md) - Frontend components and patterns
- [V2-OVERVIEW.md](/home/user/code/go/nube/rubix/docs/system/v1/plm-plugin/V2-OVERVIEW.md) - PLM V2 architecture
- [plugin-client README](/home/user/code/go/nube/rubix-sdk/frontend-sdk/plugin-client/README.md) - SDK usage
