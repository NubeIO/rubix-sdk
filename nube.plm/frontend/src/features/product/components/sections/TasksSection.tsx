import { useState, useEffect } from 'react';

// @ts-ignore - SDK components
import { SettingsSection } from '@rubix-sdk/frontend/common/ui/settings-section';
import { Button } from '@rubix-sdk/frontend/common/ui/button';
// @ts-ignore - SDK icons
import { ListChecks, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';

import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Product } from '@features/product/types/product.types';
import type { Task } from '@features/task/types/task.types';
import { TaskStatusBadge } from '@features/task/components/TaskStatusBadge';

interface TasksSectionProps {
  product: Product;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const TASK_STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const TASK_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export function TasksSection({
  product,
  orgId,
  deviceId,
  baseUrl = '',
  token,
  isExpanded,
  onToggle,
}: TasksSectionProps) {
  // Create plugin client - use SDK directly!
  const client = createPluginClient({ orgId, deviceId, baseUrl, token });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded) {
      fetchTasks();
    }
  }, [isExpanded, product.id]);

  const fetchTasks = async () => {
    setLoading(true);

    try {
      // Use SDK queryNodes instead of raw fetch
      const fetchedTasks = await client.queryNodes({
        filter: `type is "core.task" and parentId is "${product.id}"`,
      });
      setTasks(fetchedTasks as Task[]);
    } catch (err) {
      console.error('[TasksSection] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskName.trim()) {
      setError('Task name is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Use SDK createNode instead of TaskAPI
      await client.createNode({
        type: 'core.task',
        name: taskName.trim(),
        parentId: product.id,
        settings: {
          description: taskDescription.trim() || undefined,
          status: taskStatus,
          priority: taskPriority,
          progress: 0,
        },
      });

      // Reset form
      setTaskName('');
      setTaskDescription('');
      setTaskStatus('todo');
      setTaskPriority('medium');
      setCreateDialogOpen(false);

      // Refresh tasks
      await fetchTasks();
    } catch (err) {
      console.error('[TasksSection] Failed to create task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };


  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.settings?.status === 'todo').length,
    inProgress: tasks.filter((t) => t.settings?.status === 'in_progress').length,
    completed: tasks.filter((t) => t.settings?.status === 'completed').length,
  };

  const avgProgress =
    tasks.length > 0
      ? Math.round(
          tasks.reduce((sum, t) => sum + (t.settings?.progress || 0), 0) / tasks.length
        )
      : 0;

  return (
    <>
      <SettingsSection
        title="Tasks"
        icon={ListChecks}
        description={`${taskStats.total} tasks • ${taskStats.completed} completed`}
        isExpanded={isExpanded}
        onToggle={onToggle}
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setCreateDialogOpen(true);
            }}
          >
            <Plus size={14} />
            Add Task
          </Button>
        }
      >
        <div className="space-y-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-2xl font-bold">{taskStats.total}</div>
            <div className="text-muted-foreground text-xs">Total</div>
          </div>
          <div className="rounded-lg border bg-blue-50 p-3">
            <div className="text-2xl font-bold text-blue-700">{taskStats.inProgress}</div>
            <div className="text-muted-foreground text-xs">In Progress</div>
          </div>
          <div className="rounded-lg border bg-green-50 p-3">
            <div className="text-2xl font-bold text-green-700">{taskStats.completed}</div>
            <div className="text-muted-foreground text-xs">Completed</div>
          </div>
          <div className="rounded-lg border bg-gray-50 p-3">
            <div className="text-2xl font-bold text-gray-700">{avgProgress}%</div>
            <div className="text-muted-foreground text-xs">Avg Progress</div>
          </div>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground text-sm mb-2">No tasks yet</div>
            <div className="text-muted-foreground text-xs">
              Use right-click menu → "Task Management" to create tasks
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[300px] overflow-auto">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{task.name}</span>
                        <TaskStatusBadge status={task.settings?.status} />
                      </div>
                      {task.settings?.description && (
                        <p className="text-muted-foreground text-xs line-clamp-1">
                          {task.settings.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {task.settings?.priority && (
                          <span className="text-[10px] text-muted-foreground">
                            Priority: <span className="font-medium">{task.settings.priority}</span>
                          </span>
                        )}
                        {task.settings?.assignee && (
                          <span className="text-[10px] text-muted-foreground">
                            Assignee: <span className="font-medium">{task.settings.assignee}</span>
                          </span>
                        )}
                        {typeof task.settings?.progress === 'number' && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${task.settings.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {Math.round(task.settings.progress)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info text */}
            <div className="pt-2 border-t text-center">
              <p className="text-xs text-muted-foreground">
                Right-click product → "Task Management" for full view
              </p>
            </div>
          </>
        )}
      </div>
    </SettingsSection>

    {/* Create Task Dialog */}
    {createDialogOpen && (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) setCreateDialogOpen(false);
        }}
      >
        <div className="bg-background rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Create Task</h2>
            <button
              onClick={() => setCreateDialogOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Product
              </label>
              <input
                type="text"
                value={product.name}
                disabled
                className="w-full px-3 py-2 border rounded-md text-sm bg-muted"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Task Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Enter task name..."
                className="w-full px-3 py-2 border rounded-md text-sm"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Enter task description..."
                rows={3}
                className="w-full px-3 py-2 border rounded-md text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Status</label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/50 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !taskName.trim()}>
                {submitting ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  );
}
