# Comments System - Implementation Guide

**Date**: 2026-03-28
**Status**: Commands Defined, Helpers Created

---

## How Comments Work

Comments use the **command pattern** instead of child nodes:

- ✅ Stored in NodeDataStore (not as separate nodes)
- ✅ Accessed via commands: `listComments`, `addComment`, `deleteComment`
- ✅ Simpler than child nodes for append-only data
- ✅ No complex queries needed

See [DESIGN-DECISIONS.md](./DESIGN-DECISIONS.md) for why we chose this pattern.

---

## Commands Defined

Commands are configured in `config/nodes.yaml` for both tasks and tickets:

### plm.task Commands
```yaml
commands:
  - name: listComments
    description: List all comments on this task
    method: GET

  - name: addComment
    description: Add a comment to this task
    method: POST
    params:
      - name: text
        type: string
        required: true
      - name: userId
        type: string
        required: true
      - name: userName
        type: string
        required: false

  - name: deleteComment
    description: Delete a comment from this task
    method: DELETE
    params:
      - name: commentId
        type: string
        required: true
```

### plm.ticket Commands
Same commands as above - tickets have identical comment functionality.

---

## Helper Functions

**File**: `features/comments/utils/comment-helpers.ts`

### 1. List Comments

```typescript
import { listComments } from '@features/comments/utils/comment-helpers';

const comments = await listComments(client, taskId);
console.log(`Found ${comments.length} comments`);

// Returns:
// [
//   {
//     id: "comment_123",
//     text: "This task is blocked",
//     userId: "user_abc",
//     userName: "Alice Smith",
//     createdAt: "2026-03-28T10:30:00Z"
//   }
// ]
```

### 2. Add Comment

```typescript
import { addComment } from '@features/comments/utils/comment-helpers';

const comment = await addComment(client, taskId, {
  text: 'We need to refactor this before proceeding',
  userId: 'user_123',
  userName: 'Bob Johnson'  // Optional
});

console.log('Comment added:', comment.id);
```

### 3. Delete Comment

```typescript
import { deleteComment } from '@features/comments/utils/comment-helpers';

await deleteComment(client, taskId, commentId);
console.log('Comment deleted');
```

### 4. Get Comment Count

```typescript
import { getCommentCount } from '@features/comments/utils/comment-helpers';

const count = await getCommentCount(client, taskId);
console.log(`${count} comments`);
```

---

## UI Component

**File**: `features/comments/components/CommentsSection.tsx`

### Basic Usage

```typescript
import { CommentsSection } from '@features/comments/components/CommentsSection';

function TaskDetailPage({ task, client }) {
  return (
    <div>
      <h1>{task.name}</h1>

      {/* Comments section */}
      <CommentsSection
        nodeId={task.id}
        nodeType="task"
        client={client}
        currentUserId="user_123"
        currentUserName="Alice Smith"
      />
    </div>
  );
}
```

### Features

- ✅ Display all comments with author and timestamp
- ✅ Add new comments with textarea
- ✅ Delete own comments (permission check)
- ✅ Relative timestamps ("2h ago", "Just now")
- ✅ Loading states
- ✅ Empty state message

---

## API Details

### Command Endpoint

Commands are executed via:
```
POST /api/v1/orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/commands/{commandName}
```

### Example: Add Comment (Raw Fetch)

```typescript
const response = await fetch(
  `/api/v1/orgs/${orgId}/devices/${deviceId}/nodes/${taskId}/commands/addComment`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      text: 'This is a comment',
      userId: 'user_123',
      userName: 'Alice'
    })
  }
);

const result = await response.json();
// { comment: { id: "comment_xyz", text: "...", ... } }
```

### Example: List Comments (Raw Fetch)

```typescript
const response = await fetch(
  `/api/v1/orgs/${orgId}/devices/${deviceId}/nodes/${taskId}/commands/listComments`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const result = await response.json();
// { comments: [ { id: "...", text: "...", ... } ] }
```

### Example: Delete Comment (Raw Fetch)

```typescript
const response = await fetch(
  `/api/v1/orgs/${orgId}/devices/${deviceId}/nodes/${taskId}/commands/deleteComment`,
  {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      commentId: 'comment_123'
    })
  }
);
```

---

## Integration Examples

### 1. Task Detail Page

```typescript
import { CommentsSection } from '@features/comments/components/CommentsSection';

export function TaskDetailPage({ task, client, currentUser }) {
  return (
    <div className="space-y-6">
      {/* Task info */}
      <TaskHeader task={task} />

      {/* Tickets section */}
      <TicketsSectionV2 task={task} client={client} />

      {/* Comments section */}
      <CommentsSection
        nodeId={task.id}
        nodeType="task"
        client={client}
        currentUserId={currentUser.id}
        currentUserName={currentUser.name}
      />
    </div>
  );
}
```

### 2. Ticket Detail Page

```typescript
import { CommentsSection } from '@features/comments/components/CommentsSection';

export function TicketDetailPage({ ticket, client, currentUser }) {
  return (
    <div className="space-y-6">
      {/* Ticket info */}
      <TicketHeader ticket={ticket} />

      {/* Time entries */}
      <TimeEntriesSection ticket={ticket} client={client} />

      {/* Comments section */}
      <CommentsSection
        nodeId={ticket.id}
        nodeType="ticket"
        client={client}
        currentUserId={currentUser.id}
        currentUserName={currentUser.name}
      />
    </div>
  );
}
```

### 3. Show Comment Count Badge

```typescript
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { getCommentCount } from '@features/comments/utils/comment-helpers';

function TaskRow({ task, client }) {
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    getCommentCount(client, task.id).then(setCommentCount);
  }, [task.id]);

  return (
    <div className="flex items-center gap-2">
      <span>{task.name}</span>
      {commentCount > 0 && (
        <Badge variant="secondary">
          {commentCount} comment{commentCount !== 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
}
```

---

## Backend Implementation (Placeholder)

The commands need to be implemented in the backend plugin. Here's the expected behavior:

### addComment Command Handler

```go
// Expected backend implementation
func (p *Plugin) HandleAddComment(nodeId string, params map[string]interface{}) (interface{}, error) {
    text := params["text"].(string)
    userId := params["userId"].(string)
    userName := params["userName"].(string)

    comment := Comment{
        ID: uuid.New().String(),
        Text: text,
        UserId: userId,
        UserName: userName,
        CreatedAt: time.Now(),
    }

    // Store in NodeDataStore
    // (implementation depends on your backend structure)

    return map[string]interface{}{
        "comment": comment,
    }, nil
}
```

### listComments Command Handler

```go
func (p *Plugin) HandleListComments(nodeId string, params map[string]interface{}) (interface{}, error) {
    // Retrieve from NodeDataStore
    comments := p.dataStore.GetComments(nodeId)

    return map[string]interface{}{
        "comments": comments,
    }, nil
}
```

### deleteComment Command Handler

```go
func (p *Plugin) HandleDeleteComment(nodeId string, params map[string]interface{}) (interface{}, error) {
    commentId := params["commentId"].(string)

    // Delete from NodeDataStore
    err := p.dataStore.DeleteComment(nodeId, commentId)

    return nil, err
}
```

---

## Testing

### Manual Test Steps

1. **Create a task**
2. **Add comment**: Use CommentsSection component
3. **Verify comment appears** in list
4. **Add another comment** from different user
5. **Delete own comment** (should work)
6. **Try to delete other user's comment** (should not show delete button)
7. **Refresh page** - comments should persist

### API Test with curl

```bash
# Add comment
curl -X POST "http://localhost:9000/api/v1/orgs/test/devices/$DEVICE_ID/nodes/$TASK_ID/commands/addComment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a test comment",
    "userId": "user_123",
    "userName": "Test User"
  }'

# List comments
curl "http://localhost:9000/api/v1/orgs/test/devices/$DEVICE_ID/nodes/$TASK_ID/commands/listComments" \
  -H "Authorization: Bearer $TOKEN"

# Delete comment
curl -X DELETE "http://localhost:9000/api/v1/orgs/test/devices/$DEVICE_ID/nodes/$TASK_ID/commands/deleteComment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "commentId": "comment_abc123"
  }'
```

---

## Summary

### ✅ What's Ready

- Commands defined in nodes.yaml for tasks and tickets
- Helper functions created (`comment-helpers.ts`)
- UI component created (`CommentsSection.tsx`)
- Full documentation with examples

### ⚠️ What's Needed

- Backend implementation of command handlers
- Testing once backend is ready
- Optional: Add @mentions support
- Optional: Add rich text formatting
- Optional: Add comment editing

### 📁 Files Created

```
features/comments/
├── utils/
│   └── comment-helpers.ts          # ✅ List, add, delete, count
└── components/
    └── CommentsSection.tsx         # ✅ Full UI component
```

### 🚀 Next Steps

1. Implement backend command handlers in Go plugin
2. Test comments on tasks
3. Test comments on tickets
4. Add CommentsSection to TaskDetailPage
5. Add CommentsSection to TicketDetailPage (when created)
6. Optional: Add comment count badges to task/ticket lists

---

## See Also

- [DESIGN-DECISIONS.md](./DESIGN-DECISIONS.md) - Why commands instead of child nodes
- [API-QUICK-REFERENCE.md](./API-QUICK-REFERENCE.md) - Other API patterns
- [UI-IMPLEMENTATION-STATUS.md](./UI-IMPLEMENTATION-STATUS.md) - Overall progress
