# Ticket System - UI Patterns

**Date**: 2026-03-28

Visual patterns and component guidelines for displaying tasks, tickets, and time entries.

---

## Layout Patterns

### 1. Kanban Board (Recommended for Tasks)

```
┌──────────────────────────────────────────────────────────────────┐
│  Tasks                                         [+ Create Task]    │
├──────────────┬──────────────┬──────────────┬──────────────────────┤
│   Pending    │ In Progress  │   Review     │     Completed        │
│     (3)      │     (5)      │     (2)      │        (12)          │
├──────────────┼──────────────┼──────────────┼──────────────────────┤
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────────────┐ │
│ │ HIGH     │ │ │ CRITICAL │ │ │ MEDIUM   │ │ │ Build Auth       │ │
│ │ Build    │ │ │ Fix Auth │ │ │ Add Tests│ │ │ ✓ Completed      │ │
│ │ Frontend │ │ │ Bugs     │ │ │          │ │ │ 45hrs / 40hrs    │ │
│ │          │ │ │          │ │ │ 👤 Alice │ │ │ 8 tickets done   │ │
│ │ 👤 Team  │ │ │ 👤 Bob   │ │ │ 📅 Today │ │ │                  │ │
│ │ 📅 Apr15 │ │ │ 📅 ASAP  │ │ │          │ │ │                  │ │
│ │ 5 tickets│ │ │ 3 tickets│ │ │ Edit Del │ │ │                  │ │
│ │ Edit Del │ │ │ Edit Del │ │ │          │ │ │                  │ │
│ └──────────┘ │ └──────────┘ │ └──────────┘ │ └──────────────────┘ │
│              │              │              │                      │
│ ┌──────────┐ │ ┌──────────┐ │              │                      │
│ │ MEDIUM   │ │ │ HIGH     │ │              │                      │
│ │ Update   │ │ │ Refactor │ │              │                      │
│ │ Docs     │ │ │ API      │ │              │                      │
│ └──────────┘ │ └──────────┘ │              │                      │
└──────────────┴──────────────┴──────────────┴──────────────────────┘
```

**Best for**: High-level task overview at product level

**Code Example**:
```typescript
<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
  {['pending', 'in-progress', 'review', 'completed'].map(status => (
    <Card key={status}>
      <CardHeader>
        <CardTitle>
          {status}
          <Badge>{getTasksByStatus(status).length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {getTasksByStatus(status).map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </CardContent>
    </Card>
  ))}
</div>
```

---

### 2. Table View with Expandable Rows (Best for Task → Ticket)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Tasks & Tickets                                  [+ Create Task]    │
├────┬────────────────────┬────────────┬──────────┬──────────┬────────┤
│ ▼  │ Name               │ Status     │ Priority │ Assignee │ Due    │
├────┼────────────────────┼────────────┼──────────┼──────────┼────────┤
│ ▼  │ 📋 Build Auth      │ In Progress│ HIGH     │ Team     │ Apr 15 │
│    ├────────────────────┼────────────┼──────────┼──────────┼────────┤
│    │   🎫 Choose lib    │ Done       │ Medium   │ Alice    │ Mar 20 │
│    │   🎫 Design UI     │ In Progress│ High     │ Bob      │ Mar 25 │
│    │   🎫 JWT logic     │ Pending    │ High     │ Alice    │ Mar 30 │
│    │   🎫 Write tests   │ Pending    │ Medium   │ -        │ Apr 05 │
├────┼────────────────────┼────────────┼──────────┼──────────┼────────┤
│ ▶  │ 📋 Fix Bugs        │ Review     │ CRITICAL │ Bob      │ Today  │
├────┼────────────────────┼────────────┼──────────┼──────────┼────────┤
│ ▼  │ 📋 Update Docs     │ Pending    │ LOW      │ -        │ Apr 20 │
│    ├────────────────────┼────────────┼──────────┼──────────┼────────┤
│    │   🎫 API docs      │ Pending    │ Low      │ -        │ -      │
│    │   🎫 README        │ Pending    │ Low      │ -        │ -      │
└────┴────────────────────┴────────────┴──────────┴──────────┴────────┘
```

**Best for**: Detailed view showing task-ticket hierarchy

**Code Example**:
```typescript
<Table>
  {tasks.map(task => (
    <Fragment key={task.id}>
      <TableRow>
        <TableCell onClick={() => toggleExpand(task.id)}>
          {expanded[task.id] ? '▼' : '▶'}
        </TableCell>
        <TableCell>
          📋 {task.name}
          <Badge>{getTicketCount(task.id)}</Badge>
        </TableCell>
        <TableCell><StatusBadge status={task.status} /></TableCell>
        <TableCell><PriorityBadge priority={task.priority} /></TableCell>
        <TableCell>{task.assignee}</TableCell>
        <TableCell>{formatDate(task.dueDate)}</TableCell>
      </TableRow>

      {expanded[task.id] && getTickets(task.id).map(ticket => (
        <TableRow key={ticket.id} className="bg-muted/30">
          <TableCell></TableCell>
          <TableCell className="pl-8">
            🎫 {ticket.name}
          </TableCell>
          <TableCell><StatusBadge status={ticket.status} /></TableCell>
          <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
          <TableCell>{ticket.assignee}</TableCell>
          <TableCell>{formatDate(ticket.dueDate)}</TableCell>
        </TableRow>
      ))}
    </Fragment>
  ))}
</Table>
```

---

### 3. Master-Detail View

```
┌───────────────────────────┬──────────────────────────────────────┐
│  Tasks                    │  Task Details                        │
│                           │                                      │
│ ┌───────────────────────┐ │  Build Authentication System         │
│ │ ● Build Auth          │ │  Status: In Progress  Priority: High│
│ │   5 tickets  Progress │ │  Assignee: Engineering Team         │
│ │   ████████░░ 80%      │ │  Due: April 15, 2026                │
│ └───────────────────────┘ │                                      │
│                           │  Description:                        │
│ ┌───────────────────────┐ │  Add OAuth2 authentication with JWT │
│ │ ○ Fix Bugs            │ │  tokens and session management.      │
│ │   3 tickets           │ │                                      │
│ └───────────────────────┘ │  ┌────────────────────────────────┐ │
│                           │  │ Tickets (5)        [+ Add]     │ │
│ ┌───────────────────────┐ │  ├────────────────────────────────┤ │
│ │ ○ Update Docs         │ │  │ ✓ Choose library    Alice     │ │
│ │   2 tickets           │ │  │ ◐ Design login UI   Bob       │ │
│ └───────────────────────┘ │  │ ○ Add JWT logic     Alice     │ │
│                           │  │ ○ Write tests       -         │ │
│ [+ Create Task]           │  │ ○ Deploy to staging Team      │ │
│                           │  └────────────────────────────────┘ │
│                           │                                      │
│                           │  ┌────────────────────────────────┐ │
│                           │  │ Time Logged (12.5 hrs)         │ │
│                           │  ├────────────────────────────────┤ │
│                           │  │ Mar 23  Alice   2.5h  JWT work│ │
│                           │  │ Mar 24  Bob     4.0h  UI design│ │
│                           │  │ Mar 25  Alice   6.0h  Testing │ │
│                           │  └────────────────────────────────┘ │
└───────────────────────────┴──────────────────────────────────────┘
```

**Best for**: Focused work on a single task with all context visible

---

### 4. Nested List View

```
📋 Build Authentication System [In Progress] [HIGH]
   👤 Engineering Team  📅 Due: Apr 15  ⏱️ 36/80 hrs
   ├─ ✓ 🎫 Choose authentication library [Completed]
   │     👤 Alice  ⏱️ 2 hrs
   ├─ ◐ 🎫 Design login UI [In Progress]
   │     👤 Bob  📅 Due: Mar 25  ⏱️ 6/8 hrs
   │     └─ ⏰ Mar 24: 4 hrs - Initial mockups
   │     └─ ⏰ Mar 25: 2 hrs - Responsive layout
   ├─ ○ 🎫 Implement JWT validation [Pending]
   │     👤 Alice  📅 Due: Mar 30  ⏱️ 0/4 hrs
   └─ ○ 🎫 Write integration tests [Pending]
         👤 Unassigned  📅 Due: Apr 5

📋 Fix Critical Bugs [Review] [CRITICAL]
   👤 Bob  📅 Due: Today  ⏱️ 8/6 hrs ⚠️
   ├─ ✓ 🎫 Memory leak in auth module
   └─ ◐ 🎫 Session timeout issues
```

**Best for**: Overview with drill-down capability

---

## Component Patterns

### Task Card Component

```typescript
interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TaskCard({ task, onClick, onEdit, onDelete }: TaskCardProps) {
  const ticketCount = useTicketCount(task.id);
  const progress = calculateProgress(task);

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        {/* Priority Badge */}
        <PriorityBadge priority={task.settings?.priority} className="mb-2" />

        {/* Task Title */}
        <h3 className="font-semibold text-lg mb-2">{task.name}</h3>

        {/* Description */}
        {task.settings?.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {task.settings.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {task.settings?.assignee || 'Unassigned'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(task.settings?.dueDate)}
          </span>
          <span className="flex items-center gap-1">
            <ListChecks className="h-3 w-3" />
            {ticketCount} tickets
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}>
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}>
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Ticket List Item Component

```typescript
interface TicketListItemProps {
  ticket: Ticket;
  indented?: boolean;
  showTaskName?: boolean;
}

export function TicketListItem({
  ticket,
  indented = false,
  showTaskName = false
}: TicketListItemProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 border-b hover:bg-accent/50 cursor-pointer",
      indented && "pl-8 bg-muted/20"
    )}>
      {/* Status Icon */}
      <StatusIcon status={ticket.settings?.status} />

      {/* Ticket Icon */}
      <span className="text-lg">🎫</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{ticket.name}</div>
        {showTaskName && (
          <div className="text-xs text-muted-foreground">
            in: {ticket.parentTaskName}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 text-xs">
        <PriorityBadge priority={ticket.settings?.priority} size="sm" />
        <Avatar size="sm">{ticket.settings?.assignee}</Avatar>
        <DateBadge date={ticket.settings?.dueDate} />
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Log Time</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

---

## Status Icons & Colors

### Status Badges

```typescript
const STATUS_CONFIG = {
  pending: {
    icon: CircleDot,
    color: 'bg-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    label: 'Pending'
  },
  'in-progress': {
    icon: Loader2,
    color: 'bg-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    label: 'In Progress'
  },
  blocked: {
    icon: AlertCircle,
    color: 'bg-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    label: 'Blocked'
  },
  review: {
    icon: Eye,
    color: 'bg-purple-500',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    label: 'Review'
  },
  completed: {
    icon: CheckCircle2,
    color: 'bg-green-500',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    label: 'Completed'
  },
  cancelled: {
    icon: CircleOff,
    color: 'bg-gray-400',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-600',
    label: 'Cancelled'
  }
};

export function StatusBadge({ status }: { status?: string }) {
  const config = STATUS_CONFIG[status || 'pending'] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <Badge className={cn(
      'flex items-center gap-1',
      config.bg,
      config.border,
      config.text
    )}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
```

### Priority Badges

```typescript
const PRIORITY_CONFIG = {
  low: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    label: 'Low'
  },
  medium: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    label: 'Medium'
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    label: 'High'
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    label: 'Critical'
  }
};

export function PriorityBadge({ priority }: { priority?: string }) {
  const config = PRIORITY_CONFIG[priority || 'medium'] || PRIORITY_CONFIG.medium;

  return (
    <Badge className={cn(
      config.bg,
      config.border,
      config.text
    )}>
      {config.label}
    </Badge>
  );
}
```

---

## Date Formatting

```typescript
export function formatTaskDate(dateStr?: string): string {
  if (!dateStr) return 'No date';

  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  const isPast = date < today && !isToday;

  if (isToday) return '📅 Today';
  if (isTomorrow) return '📅 Tomorrow';
  if (isPast) return `⚠️ ${formatRelative(date)}`;

  return formatRelative(date);
}

function formatRelative(date: Date): string {
  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `in ${days}d`;
  if (days < 30) return `in ${Math.ceil(days / 7)}w`;

  return date.toLocaleDateString();
}
```

---

## Empty States

### No Tasks

```typescript
<div className="border rounded-lg p-12 text-center">
  <div className="max-w-md mx-auto">
    <ListChecks className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
    <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
    <p className="text-muted-foreground mb-4">
      Create your first task to start organizing work for this product.
    </p>
    <Button onClick={onCreateTask}>
      <Plus className="mr-2 h-4 w-4" />
      Create Task
    </Button>
  </div>
</div>
```

### No Tickets in Task

```typescript
<div className="p-8 text-center border-2 border-dashed rounded-lg">
  <Ticket className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
  <h4 className="font-semibold mb-2">No tickets yet</h4>
  <p className="text-sm text-muted-foreground mb-3">
    Break this task down into actionable tickets.
  </p>
  <Button size="sm" onClick={onCreateTicket}>
    <Plus className="mr-2 h-3 w-3" />
    Add Ticket
  </Button>
</div>
```

---

## Mobile Patterns

### Compact Task Card (Mobile)

```
┌─────────────────────────────┐
│ HIGH                        │
│ Build Authentication        │
│ In Progress  ████████░░ 80% │
│ 👤 Team  📅 Apr 15  🎫 5    │
│ [View] [Edit]               │
└─────────────────────────────┘
```

### Bottom Sheet for Details (Mobile)

```
      [Swipe down to close]
┌─────────────────────────────┐
│ Build Authentication        │
│ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ │
│                             │
│ Status: In Progress         │
│ Priority: HIGH              │
│ Assignee: Engineering Team  │
│ Due: April 15, 2026         │
│                             │
│ ┌─────────────────────────┐ │
│ │ Tickets (5)             │ │
│ │ ✓ Choose library        │ │
│ │ ◐ Design UI             │ │
│ │ ○ JWT logic             │ │
│ │ ○ Tests                 │ │
│ └─────────────────────────┘ │
│                             │
│ [Edit Task] [Delete]        │
└─────────────────────────────┘
```

---

## Keyboard Shortcuts

```typescript
const SHORTCUTS = {
  'n': 'Create new task',
  't': 'Create new ticket',
  'e': 'Edit selected',
  'd': 'Delete selected',
  '/': 'Focus search',
  'Escape': 'Close dialog',
  'ArrowUp/Down': 'Navigate list',
  'Enter': 'Open selected'
};

// Implementation
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;

    switch (e.key) {
      case 'n':
        setShowCreateTaskDialog(true);
        break;
      case 't':
        setShowCreateTicketDialog(true);
        break;
      // ... etc
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

---

## Comments Component

### Comments Thread Component

```typescript
import { useState, useEffect } from 'react';
import { executeGetCommand, executePostCommand, executeDeleteCommand } from '@rubix-sdk/frontend/plugin-client/commands';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Trash2 } from 'lucide-react';

interface Comment {
  id: string;
  text: string;
  userId?: string;
  userName?: string;
  createdAt: string;
}

interface CommentsThreadProps {
  client: PluginClient;
  nodeId: string;
  nodeType: 'task' | 'ticket';
}

export function CommentsThread({ client, nodeId, nodeType }: CommentsThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const result = await executeGetCommand<{
        comments: Comment[];
      }>(client, nodeId, 'listComments');
      setComments(result.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await executePostCommand(client, nodeId, 'addComment', {
        text: newComment
      });
      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await executeDeleteCommand(client, nodeId, 'deleteComment', {
        id: commentId
      });
      await fetchComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [nodeId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Comment List */}
        <div className="space-y-4 mb-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="border-l-2 border-muted pl-4 py-2">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm">
                    <span className="font-semibold">
                      {comment.userName || 'Unknown User'}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleAddComment}
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Inline Comment Badge

Show comment count as a badge:

```typescript
export function CommentBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <MessageSquare className="h-3 w-3" />
      <span>{count}</span>
    </div>
  );
}

// Usage in task/ticket cards
<TaskCard>
  <div className="flex items-center gap-2">
    <h3>{task.name}</h3>
    <CommentBadge count={commentCount} />
  </div>
</TaskCard>
```

### Comment Input with Markdown Preview (Optional)

```typescript
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CommentInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState('');

  return (
    <Tabs defaultValue="write">
      <TabsList>
        <TabsTrigger value="write">Write</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="write">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment... (Markdown supported)"
          rows={4}
        />
      </TabsContent>
      <TabsContent value="preview">
        <div className="border rounded-md p-3 min-h-[100px]">
          {text || <span className="text-muted-foreground">Nothing to preview</span>}
        </div>
      </TabsContent>
      <Button onClick={() => { onSubmit(text); setText(''); }} className="mt-2">
        Post Comment
      </Button>
    </Tabs>
  );
}
```

### Compact Comments List

For showing in task detail sidebar:

```typescript
export function CompactCommentsList({ comments }: { comments: Comment[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Recent Comments ({comments.length})
      </h4>
      {comments.slice(0, 3).map(comment => (
        <div key={comment.id} className="text-xs border-l-2 pl-2 py-1">
          <div className="font-medium">{comment.userName}</div>
          <div className="text-muted-foreground line-clamp-2">{comment.text}</div>
        </div>
      ))}
      {comments.length > 3 && (
        <Button variant="link" size="sm" className="text-xs">
          View all {comments.length} comments
        </Button>
      )}
    </div>
  );
}
```

---

## See Also

- [README.md](./README.md) - Architecture overview
- [API-QUICK-REFERENCE.md](./API-QUICK-REFERENCE.md) - API patterns
- [DESIGN-DECISIONS.md](./DESIGN-DECISIONS.md) - Design decisions and known issues
