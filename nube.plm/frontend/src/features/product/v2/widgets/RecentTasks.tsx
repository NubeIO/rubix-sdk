/**
 * Recent Tasks Widget - Shows 5 most recent tasks
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTaskDate } from '@shared/utils/task-date';
import type { TaskStatusValue } from '@shared/utils/task-status';

interface Task {
  id: string;
  name: string;
  status: TaskStatusValue;
  assignee?: string;
  dueDate?: string;
}

interface RecentTasksProps {
  tasks: Task[];
  onViewAll: () => void;
}

export function RecentTasks({ tasks, onViewAll }: RecentTasksProps) {
  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500';
      case 'in-progress':
        return 'bg-amber-500';
      case 'cancelled':
        return 'bg-slate-400';
      default:
        return 'bg-gray-400';
    }
  };

  const formatDate = (dateStr?: string) => {
    return formatTaskDate(dateStr);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-bold">Recent Tasks</CardTitle>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          View All
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {tasks.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No tasks found. Create your first task to get started.
          </div>
        ) : (
          <div className="space-y-1">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-primary/5"
              >
                {/* Status dot */}
                <div className={cn('h-2 w-2 shrink-0 rounded-full', getStatusDotColor(task.status))} />

                {/* Task info */}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{task.name}</div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    {task.assignee && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.assignee}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
