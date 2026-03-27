/**
 * TasksPageTabs - Tabbed interface for filtering tasks by status
 *
 * Tabs:
 * - All: Shows all tasks
 * - To Do: Filters to status is "todo"
 * - In Progress: Filters to status is "in_progress"
 * - Completed: Filters to status is "completed"
 */

import { ListChecks, CircleDot, Loader2, CheckCircle2 } from 'lucide-react';
// @ts-ignore - SDK types are resolved at build time
import { FilteredTableWithTabs, type FilteredTab } from '@rubix-sdk/frontend/components';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';

import type { Task } from '@features/task/types/task.types';
import { TaskTable, type TaskTableDisplaySettings } from '@features/task/components/TaskTable';

const TABS: FilteredTab[] = [
  {
    value: 'all',
    label: 'All',
    icon: ListChecks,
    filter: undefined, // No filter - show all
  },
  {
    value: 'todo',
    label: 'To Do',
    icon: CircleDot,
    filter: 'settings.status is "todo"',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    icon: Loader2,
    filter: 'settings.status is "in_progress"',
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: CheckCircle2,
    filter: 'settings.status is "completed"',
  },
];

interface TasksPageTabsProps {
  client: PluginClient;
  productId: string;
  displaySettings: TaskTableDisplaySettings;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string, taskName: string) => void;
}

export function TasksPageTabs({
  client,
  productId,
  displaySettings,
  onEdit,
  onDelete,
}: TasksPageTabsProps) {
  return (
    <FilteredTableWithTabs<Task>
      tabs={TABS}
      baseFilter={`type is "core.task" and parentId is "${productId}"`}
      client={client}
      renderTable={(tasks, isRefreshing) => (
        <div className={isRefreshing ? 'opacity-50 pointer-events-none' : ''}>
          <div className="border rounded-lg">
            <TaskTable
              tasks={tasks}
              displaySettings={displaySettings}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      )}
      renderEmpty={() => (
        <div className="border rounded-lg p-12 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
            <p className="text-muted-foreground">
              No tasks match the current filter. Create your first task to get started.
            </p>
          </div>
        </div>
      )}
    />
  );
}
