/**
 * Tasks Section V2 - Kanban-style task board
 */

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { Plus, Calendar, User, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '../../types/product.types';
import { TaskDialog } from '../components/TaskDialog';
import { DeleteTaskDialog } from '../components/DeleteTaskDialog';
import { formatTaskDate } from '@features/task/utils/task-date';
import { normalizeTaskStatus, type TaskStatusValue } from '@features/task/utils/task-status';

interface Task {
  id: string;
  name: string;
  status: TaskStatusValue;
  priority?: string;
  assignee?: string;
  dueDate?: string;
}

interface TasksSectionV2Props {
  product: Product;
  client: any;
  onStatsUpdate: (stats: any) => void;
}

export function TasksSectionV2({ product, client, onStatsUpdate }: TasksSectionV2Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [product.id]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const nodes = await client.queryNodes({
        filter: `type is "plm.task" and parentId is "${product.id}"`,
      });

      const taskList: Task[] = (nodes || []).map((node: any) => ({
        id: node.id,
        name: node.name,
        status: normalizeTaskStatus(node.settings?.status, node.settings?.completed),
        priority: node.settings?.priority || 'Medium',
        assignee: node.settings?.assignee || 'Unassigned',
        dueDate: node.settings?.dueDate,
      }));

      setTasks(taskList);

      // Update stats
      onStatsUpdate({
        totalTasks: taskList.length,
      });
    } catch (err) {
      console.error('[TasksSectionV2] Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: Array<{ id: string; label: string; status: Task['status']; dotColor: string }> = [
    { id: 'pending', label: 'Pending', status: 'pending', dotColor: 'bg-gray-400' },
    { id: 'in-progress', label: 'In Progress', status: 'in-progress', dotColor: 'bg-amber-500' },
    { id: 'completed', label: 'Completed', status: 'completed', dotColor: 'bg-emerald-500' },
    { id: 'cancelled', label: 'Cancelled', status: 'cancelled', dotColor: 'bg-slate-400' },
  ];

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Low':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateStr?: string) => {
    return formatTaskDate(dateStr);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage product development tasks
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.status);

          return (
            <Card key={column.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className={cn('inline-block h-2 w-2 rounded-full', column.dotColor)} />
                  {column.label}
                  <Badge variant="secondary" className="ml-auto">
                    {columnTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : columnTasks.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No tasks
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <Card key={task.id} className="group transition-all hover:shadow-md">
                      <CardContent className="p-4">
                        {/* Priority badge */}
                        {task.priority && (
                          <Badge className={cn('mb-2 text-xs', getPriorityColor(task.priority))}>
                            {task.priority}
                          </Badge>
                        )}

                        {/* Task title */}
                        <div className="mb-3 font-medium">{task.name}</div>

                        {/* Task meta */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assignee}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(task.dueDate)}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setEditingTask(task)}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() => setDeletingTask(task)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Task Dialog */}
      {showCreateDialog && (
        <TaskDialog
          client={client}
          productId={product.id}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={fetchTasks}
        />
      )}

      {/* Edit Task Dialog */}
      {editingTask && (
        <TaskDialog
          client={client}
          productId={product.id}
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSuccess={fetchTasks}
        />
      )}

      {/* Delete Task Dialog */}
      {deletingTask && (
        <DeleteTaskDialog
          client={client}
          task={deletingTask}
          onClose={() => setDeletingTask(null)}
          onSuccess={fetchTasks}
        />
      )}
    </div>
  );
}
