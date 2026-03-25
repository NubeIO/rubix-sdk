/**
 * TasksListTab - Shows all tasks across all products
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
// @ts-ignore - SDK types are resolved at build time
import { Skeleton } from '@rubix-sdk/frontend/common/ui';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';

import type { Task } from '@features/task/types/task.types';
import type { Product } from '@features/product/types/product.types';
import { TasksListTable, type TasksListTableDisplaySettings } from './tasks-list-table';

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

interface TasksListTabProps {
  products: Product[];
  productsLoading: boolean;
  client: PluginClient;
  displaySettings: TasksListTableDisplaySettings;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string, taskName: string) => void;
}

export function TasksListTab({
  products,
  productsLoading,
  client,
  displaySettings,
  onEdit,
  onDelete,
}: TasksListTabProps) {
  // Show loading state while products are loading
  if (productsLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <FilteredTableWithTabs<Task>
      tabs={TABS}
      baseFilter='type is "core.task" and identity contains ["plm"]'
      client={client}
      renderTable={(tasks, isRefreshing) => (
        <div className={isRefreshing ? 'opacity-50 pointer-events-none' : ''}>
          <div className="border rounded-lg">
            <TasksListTable
              tasks={tasks}
              products={products}
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
              No tasks match the current filter. Create tasks from individual products to see them here.
            </p>
          </div>
        </div>
      )}
    />
  );
}
