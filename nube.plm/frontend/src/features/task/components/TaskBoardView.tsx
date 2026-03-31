/**
 * TaskBoardView - Kanban board view with data fetching
 */

import { useEffect, useState } from 'react';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Task } from '../types/task.types';
import { TaskBoard } from './TaskBoard';

interface TaskBoardViewProps {
  client: PluginClient;
  projectId: string;
  refreshKey?: number;
}

export function TaskBoardView({ client, projectId, refreshKey }: TaskBoardViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchTasks() {
      setIsLoading(true);
      try {
        const nodes = await client.queryNodes({
          filter: `type is "plm.task" and parent.id is "${projectId}"`,
        });
        setTasks(nodes as Task[]);
      } catch (error) {
        console.error('[TaskBoardView] Failed to fetch tasks:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTasks();
  }, [client, projectId, refreshKey, localRefreshKey]);

  const handleTaskUpdate = () => {
    setLocalRefreshKey((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
          <p className="text-muted-foreground">
            Create your first task to start organizing work for this project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TaskBoard
      tasks={tasks}
      client={client}
      onTaskUpdate={handleTaskUpdate}
    />
  );
}
