import { useState, useEffect } from 'react';

// @ts-ignore - SDK components
import { SettingsSection } from '@rubix-sdk/frontend/common/ui/settings-section';
import { Button } from '@rubix-sdk/frontend/common/ui/button';
// @ts-ignore - SDK icons
import { ListChecks, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';

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

export function TasksSection({
  product,
  orgId,
  deviceId,
  baseUrl = '',
  token,
  isExpanded,
  onToggle,
}: TasksSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      fetchTasks();
    }
  }, [isExpanded, product.id]);

  const fetchTasks = async () => {
    setLoading(true);

    try {
      const filter = `type is "core.task" and parentId is "${product.id}"`;
      const url = `${baseUrl}/orgs/${orgId}/devices/${deviceId}/query?filter=${encodeURIComponent(filter)}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }

      const data = await response.json();
      const fetchedTasks = Array.isArray(data) ? data : [];
      setTasks(fetchedTasks);
    } catch (err) {
      console.error('[TasksSection] Fetch error:', err);
    } finally {
      setLoading(false);
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
    <SettingsSection
      title="Tasks"
      icon={ListChecks}
      description={`${taskStats.total} tasks • ${taskStats.completed} completed`}
      isExpanded={isExpanded}
      onToggle={onToggle}
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
  );
}
