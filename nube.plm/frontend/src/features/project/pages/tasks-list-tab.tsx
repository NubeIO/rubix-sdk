/**
 * TasksListTab - Shows all tasks across all projects with enhanced data table
 */

import { useEffect, useState, useCallback } from 'react';
// @ts-ignore - SDK types are resolved at build time
import { Skeleton } from '@rubix-sdk/frontend/common/ui';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';

import type { Task } from '@features/task/types/task.types';
import type { Project } from '@features/project/types/project.types';
import { TasksDataTable } from './tasks-data-table';
import { TasksGanttView } from '@features/task/components/TasksGanttView';

interface TasksListTabProps {
  projects: Project[];
  projectsLoading: boolean;
  client: PluginClient;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string, taskName: string) => void;
}

export function TasksListTab({
  projects,
  projectsLoading,
  client,
  onEdit,
  onDelete,
}: TasksListTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'table' | 'gantt'>('table');

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const nodes = await client.queryNodes({
        filter: 'type is "plm.task"',
      });
      console.log('[TasksListTab] Fetched tasks:', nodes);
      setTasks(nodes as Task[]);
    } catch (err) {
      console.error('[TasksListTab] Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Show loading state while projects are loading
  if (projectsLoading || isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  console.log('[TasksListTab] Rendering with tasks:', tasks.length, 'projects:', projects.length);

  if (tasks.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
        <p className="text-muted-foreground">
          Create your first task to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {view === 'table' ? (
        <TasksDataTable
          tasks={tasks}
          projects={projects}
          client={client}
          onEdit={onEdit}
          onDelete={onDelete}
          view={view}
          onViewChange={setView}
        />
      ) : (
        <TasksGanttView
          tasks={tasks}
          projects={projects}
          client={client}
          context="all-projects"
          onTaskEdit={onEdit}
          view={view}
          onViewChange={setView}
        />
      )}
    </div>
  );
}
