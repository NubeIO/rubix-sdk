/**
 * Tasks Section V2 - Kanban board with drag-and-drop
 */

import { useEffect, useState } from 'react';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { Plus } from 'lucide-react';
import type { Product } from '../../types/product.types';
import { TaskDialog } from '../components/TaskDialog';
import { DeleteTaskDialog } from '../components/DeleteTaskDialog';
import { TaskBoard } from '@features/task/components/TaskBoard';
import { TaskDetailDialog } from '@features/task/components/TaskDetailDialog';
import { normalizeTaskStatus } from '@shared/utils/task-status';
import type { Task } from '@features/task/types/task.types';

interface TasksSectionV2Props {
  product: Product;
  client: any;
  onStatsUpdate: (stats: any) => void;
}

export function TasksSectionV2({ product, client, onStatsUpdate }: TasksSectionV2Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [deletingTask, setDeletingTask] = useState<any | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchTasks();
  }, [product.id, refreshKey]);

  const fetchTicketCounts = async (taskList: Task[]) => {
    try {
      const counts: Record<string, number> = {};
      let allTickets: any[] = [];

      // Fetch ticket counts for all tasks in parallel
      await Promise.all(
        taskList.map(async (task) => {
          try {
            const tickets = await client.queryNodes({
              filter: `type is "plm.ticket" and parentId is "${task.id}"`,
            });
            counts[task.id] = tickets?.length || 0;
            allTickets = [...allTickets, ...(tickets || [])];
          } catch (err) {
            console.error(`[TasksSectionV2] Failed to fetch tickets for task ${task.id}:`, err);
            counts[task.id] = 0;
          }
        })
      );

      setTicketCounts(counts);

      // Calculate ticket statistics for overview
      const totalTickets = allTickets.length;
      const ticketsByStatus = allTickets.reduce((acc: Record<string, number>, ticket: any) => {
        const status = ticket.settings?.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      const blockedTickets = ticketsByStatus['blocked'] || 0;
      const completedTickets = ticketsByStatus['completed'] || 0;

      // Update stats with ticket information
      onStatsUpdate({
        totalTickets,
        blockedTickets,
        completedTickets,
        ticketsByStatus,
      });
    } catch (err) {
      console.error('[TasksSectionV2] Failed to fetch ticket counts:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const nodes = await client.queryNodes({
        filter: `type is "plm.task" and parent.id is "${product.id}"`,
      });

      const taskList: Task[] = (nodes || []).map((node: any) => ({
        id: node.id,
        name: node.name,
        type: node.type,
        parentId: node.parentId,
        settings: {
          ...node.settings,
          status: normalizeTaskStatus(node.settings?.status, node.settings?.completed),
        },
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
      }));

      setTasks(taskList);

      // Fetch ticket counts
      if (taskList.length > 0) {
        fetchTicketCounts(taskList);
      }

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

  const handleTaskUpdate = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
            <p className="text-sm text-muted-foreground">
              Track and manage product development tasks
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading tasks...</div>
        </div>
      </div>
    );
  }

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

      {/* Kanban Board with Drag & Drop */}
      {tasks.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first task to start organizing work for this product.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </div>
        </div>
      ) : (
        <TaskBoard
          tasks={tasks}
          client={client}
          ticketCounts={ticketCounts}
          onTaskUpdate={handleTaskUpdate}
          onEditTask={(task) => setEditingTask(task)}
          onViewTickets={(task) => setViewingTask(task)}
        />
      )}

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

      {/* Task Detail Dialog (View Tickets) */}
      {viewingTask && (
        <TaskDetailDialog
          task={viewingTask}
          product={product}
          client={client}
          onClose={() => setViewingTask(null)}
          onEdit={(task) => {
            setViewingTask(null);
            setEditingTask(task);
          }}
          onDelete={(taskId, taskName) => {
            setViewingTask(null);
            setDeletingTask({ id: taskId, name: taskName });
          }}
        />
      )}
    </div>
  );
}
