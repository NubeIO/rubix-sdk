# Task and Ticket Comments Implementation

## Overview

Comments for tasks and tickets are implemented using the existing `core.note` node with its built-in comment commands. This approach:
- ✅ Reuses existing, tested functionality
- ✅ No backend Go code needed in the PLM plugin
- ✅ Comments are properly encapsulated in dedicated nodes
- ✅ Works with the existing NodeDataStore pattern

## Architecture

### Storage Pattern

Each task or ticket has a single `core.note` child node that stores all comments:

```
plm.task (task_abc123)
└── core.note (_comments)        ← Hidden child node stores comments
    └── NodeDataStore entries    ← Each comment is a data store item
```

### How It Works

1. **Note Node Creation**: When the first comment is added, a `core.note` child node is created automatically
   - Name: `_comments`
   - Hidden: `true` (won't appear in tree UI)
   - Type: `core.note` (uses core node, no profile needed)

2. **Comment Storage**: Comments are stored in `NodeDataStoreItem` table:
   - `node_id`: The note node's ID
   - `bucket`: "comments"
   - `index`: Sequential index (0, 1, 2, ...)
   - `data`: JSON with comment fields (id, text, userId, createdAt)

3. **Command Execution**: All comment operations use the note node's commands:
   - `listComments` (GET) - Returns all comments
   - `addComment` (POST) - Adds a new comment
   - `deleteComment` (DELETE) - Removes a comment by ID

## Backend Implementation

### Configuration Changes

**1. Added `core.note` to plugin.json**

```json
{
  "coreNodeTypes": [
    "core.asset",
    "core.component",
    "core.document",
    "core.entry",
    "core.note",      // ← Added this
    "core.product",
    "core.service",
    "core.task",
    "core.ticket"
  ]
}
```

This allows the PLM plugin to create and use `core.note` nodes.

**2. Removed command definitions from nodes.yaml**

We removed the `addComment`, `listComments`, `deleteComment` command declarations from `plm.task` and `plm.ticket` in nodes.yaml since:
- These commands are not implemented in PLM backend code
- The commands actually exist on the `core.note` node
- The frontend handles finding/creating the note node and executing commands on it

## Frontend Implementation

### Files

```
nube.plm/frontend/src/features/comments/
├── components/
│   └── CommentsSection.tsx         ← Reusable UI component
└── utils/
    └── comment-helpers.ts          ← Backend integration functions
```

### Key Functions (comment-helpers.ts)

**1. getOrCreateCommentsNode()**

Finds or creates the `_comments` note node:

```typescript
async function getOrCreateCommentsNode(
  client: PluginClient,
  parentNodeId: string
): Promise<string> {
  // Query for existing note
  const result = await client.queryNodes({
    filter: `parent.id is "${parentNodeId}" and type is "core.note" and name is "_comments"`
  });

  if (result.nodes?.length > 0) {
    return result.nodes[0].id;
  }

  // Create new note node
  const node = await client.createNode({
    type: 'core.note',
    name: '_comments',
    parentRef: parentNodeId,
    settings: { hidden: true, noteType: 'comments' }
  });

  return node.id;
}
```

**2. listComments()**

Fetches all comments for a task/ticket:

```typescript
export async function listComments(
  client: PluginClient,
  nodeId: string
): Promise<Comment[]> {
  const noteNodeId = await getOrCreateCommentsNode(client, nodeId);
  const result = await executeGetCommand(client, noteNodeId, 'listComments');
  return result?.comments || [];
}
```

**3. addComment()**

Adds a new comment:

```typescript
export async function addComment(
  client: PluginClient,
  nodeId: string,
  input: { text: string; userId: string; userName?: string }
): Promise<Comment> {
  const noteNodeId = await getOrCreateCommentsNode(client, nodeId);
  const result = await executePostCommand(
    client,
    noteNodeId,
    'addComment',
    { text: input.text.trim() }
  );
  return {
    id: result.result.id,
    text: result.result.text,
    userId: input.userId,
    userName: input.userName || input.userId,
    createdAt: result.result.createdAt
  };
}
```

**4. deleteComment()**

Deletes a comment by ID:

```typescript
export async function deleteComment(
  client: PluginClient,
  nodeId: string,
  commentId: string
): Promise<void> {
  const noteNodeId = await getOrCreateCommentsNode(client, nodeId);
  await executeDeleteCommand(
    client,
    noteNodeId,
    'deleteComment',
    { id: commentId }
  );
}
```

### UI Component (CommentsSection.tsx)

A reusable React component that:
- Displays comments with user info and timestamps
- Allows adding new comments
- Allows deleting own comments
- Shows relative timestamps ("2h ago", "Just now", etc.)
- Auto-refreshes after add/delete

**Usage:**

```tsx
import { CommentsSection } from '@/features/comments/components/CommentsSection';

<CommentsSection
  nodeId={task.id}
  nodeType="task"
  client={client}
  currentUserId="user_123"
  currentUserName="Alice Smith"
/>
```

### Integration in Task Detail Page

**File:** `nube.plm/frontend/src/features/task/pages/TaskDetailPage.tsx`

Added a new "comments" section:

1. Created `TaskCommentsSection` component
2. Added "comments" to `TaskSectionId` type
3. Added comments to the sidebar navigation
4. Wired up section rendering

**File:** `nube.plm/frontend/src/features/task/sections/TaskCommentsSection.tsx`

```tsx
export function TaskCommentsSection({ task, client }: Props) {
  return (
    <div className="space-y-6">
      <h2>Comments</h2>
      <CommentsSection
        nodeId={task.id}
        nodeType="task"
        client={client}
        currentUserId={...}
        currentUserName={...}
      />
    </div>
  );
}
```

## Command Reference (core.note)

The `core.note` node provides these commands:

### listComments (GET)

**Parameters:** None

**Response:**
```json
{
  "success": true,
  "comments": [
    {
      "id": "cmt_abc123",
      "text": "This is a comment",
      "userId": "user_xyz",
      "userName": "Alice Smith",
      "createdAt": "2026-03-28T10:30:00Z"
    }
  ],
  "count": 1
}
```

### addComment (POST)

**Parameters:**
```json
{
  "text": "Comment text here"
}
```

**Response:**
```json
{
  "success": true,
  "id": "cmt_abc123",
  "text": "Comment text here",
  "createdAt": "2026-03-28T10:30:00Z"
}
```

**Notes:**
- `userId` is automatically set from `job.CreatedBy` (the authenticated user)
- Comment ID is auto-generated using `niceid.NewShortID("cmt")`

### deleteComment (DELETE)

**Parameters:**
```json
{
  "id": "cmt_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comment deleted successfully",
  "deletedId": "cmt_abc123"
}
```

## Testing

### Backend (Go)

The `core.note` commands are already tested in the Rubix core:
- `nodes/core/v2/note/commands.go`
- Uses NodeDataStore for persistence
- Tested with GORM/SQLite

### Frontend Testing

1. **Create a task**
2. **Open task detail page**
3. **Navigate to Comments section**
4. **Add a comment** - Should appear immediately
5. **Delete a comment** - Should remove it
6. **Refresh the page** - Comments should persist

### Manual API Testing

```bash
# 1. Get task ID
TASK_ID="task_abc123"

# 2. Create a note node (or let frontend do it)
curl -X POST "$BASE_URL/nodes" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "core.note",
    "name": "_comments",
    "parentRef": "'$TASK_ID'",
    "settings": {"hidden": true, "noteType": "comments"}
  }'

# Get note ID from response
NOTE_ID="note_xyz789"

# 3. Add a comment
curl -X POST "$BASE_URL/nodes/$NOTE_ID/commands/addComment/execute" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"text": "This is a test comment"}'

# 4. List comments
curl "$BASE_URL/nodes/$NOTE_ID/commands/listComments/execute" \
  -H "Authorization: Bearer $TOKEN"

# 5. Delete a comment
curl -X DELETE "$BASE_URL/nodes/$NOTE_ID/commands/deleteComment/execute" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id": "cmt_abc123"}'
```

## Why This Approach?

### ✅ Advantages

1. **Reuses Core Functionality** - The `core.note` node already has working, tested commands
2. **No Backend Code** - PLM plugin doesn't need Go code for comment commands
3. **Encapsulation** - Comments are in their own node, not mixed with task/ticket data
4. **Scalable** - NodeDataStore handles large comment threads efficiently
5. **Consistent Pattern** - Uses same command pattern as other operations

### ❌ Alternative Approaches (Not Used)

**Option 1: Implement commands on plm.task/plm.ticket**
- ❌ Requires writing Go backend code in PLM plugin
- ❌ Duplicates logic that already exists in core.note
- ❌ More maintenance burden

**Option 2: Store comments in task/ticket settings**
- ❌ Settings get large and slow with many comments
- ❌ No built-in indexing or pagination
- ❌ Harder to query/search comments

**Option 3: Create plm.comment nodes as children**
- ❌ More complex tree structure
- ❌ Each comment is a full node (overhead)
- ❌ Harder to implement pagination

## Future Enhancements

- [ ] Comment editing
- [ ] Comment reactions (👍, ❤️, etc.)
- [ ] @mentions with notifications
- [ ] Rich text formatting (markdown)
- [ ] File attachments
- [ ] Comment threading/replies
- [ ] Search across comments
- [ ] Comment count badge in sidebar

## Related Files

**Backend:**
- `/home/user/code/go/nube/rubix/nodes/core/v2/note/commands.go` - Command implementations
- `/home/user/code/go/nube/rubix-sdk/nube.plm/plugin.json` - Plugin manifest
- `/home/user/code/go/nube/rubix-sdk/nube.plm/config/nodes.yaml` - Node type configs

**Frontend:**
- `nube.plm/frontend/src/features/comments/` - Comments feature
- `nube.plm/frontend/src/features/task/sections/TaskCommentsSection.tsx` - Task integration
- `frontend-sdk/plugin-client/commands.ts` - SDK command functions

**Docs:**
- `docs/HOWTO-CORE-NODE.md` - Guide for using core nodes in plugins
- `docs/sessions/comments.md` - This file

## Questions?

- How do comments work? → They're stored in a hidden `core.note` child node
- Do I need to write backend code? → No, `core.note` already has the commands
- Can I use this pattern for other features? → Yes! Time entries, attachments, etc.
- How do I test? → Open a task detail page and try adding comments
