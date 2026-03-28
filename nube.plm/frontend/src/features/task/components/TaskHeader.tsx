/**
 * Task Header - Top bar with task metadata and quick actions
 */

import { ClipboardList, Edit, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import type { Task } from '../types/task.types';
import { TaskStatusBadge } from './TaskStatusBadge';

interface TaskHeaderProps {
  task: Task;
  onEdit: () => void;
  isLoading?: boolean;
}

export function TaskHeader({ task, onEdit, isLoading }: TaskHeaderProps) {
  const priority = task.settings?.priority || 'Medium';
  const category = task.settings?.category || 'Task';

  return (
    <div className="flex h-20 items-center justify-between border-b bg-card px-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ClipboardList className="h-6 w-6" />
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold tracking-tight">{task.name}</h1>
            <TaskStatusBadge status={task.settings?.status} />
            <Badge variant="outline" className="text-xs">
              {priority}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {category}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono">TASK: {task.id.slice(0, 16)}...</span>
            <span>•</span>
            <span>Assignee: {task.settings?.assignee || 'Unassigned'}</span>
            <span>•</span>
            <span>Progress: {task.settings?.progress || 0}%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search task workspace..."
            className="h-10 w-64 pl-9"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          disabled={isLoading}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>
    </div>
  );
}
