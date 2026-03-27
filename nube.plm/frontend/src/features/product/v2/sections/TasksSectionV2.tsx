/**
 * Tasks Section V2 - Kanban-style task board with full CRUD
 */

import { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { Plus, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { urls } from '@rubix-sdk/frontend/plugin-client/url-builder';
import type { Product } from '../../types/product.types';
import { TaskCreateDialog } from './TaskCreateDialog';
import { TaskEditDialog } from './TaskEditDialog';

interface Task {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority?: string;
  assignee?: string;
  dueDate?: string;
  settings?: Record<string, any>;
}

interface TasksSectionV2Props {
  product: Product;
  client: any;
  onStatsUpdate: (stats: any) => void;
}

// Sortable Task Card Component
function SortableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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
    if (!dateStr) return 'No due date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group cursor-pointer transition-all hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Priority badge */}
        {task.priority && (
          <Badge className={cn('mb-2 text-xs', getPriorityColor(task.priority))}>
            {String(task.priority)}
          </Badge>
        )}

        {/* Task title */}
        <div className="mb-3 font-medium">{String(task.name || 'Untitled')}</div>

        {/* Task meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {task.assignee || 'Unassigned'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(task.dueDate)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Droppable Column Component
function DroppableColumn({
  column,
  tasks,
  isLoading,
  onTaskClick,
  onCreateClick,
}: {
  column: { id: string; label: string; status: Task['status']; dotColor: string };
  tasks: Task[];
  isLoading: boolean;
  onTaskClick: (task: Task) => void;
  onCreateClick: () => void;
}) {
  const { setNodeRef } = useDroppable({
    id: column.status,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className={cn('inline-block h-2 w-2 rounded-full', column.dotColor)} />
          {column.label}
          <Badge variant="secondary" className="ml-auto">
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent ref={setNodeRef} className="min-h-[200px] space-y-3">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No tasks
            {column.status === 'pending' && (
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={onCreateClick}>
                  <Plus className="mr-2 h-3 w-3" />
                  Create First Task
                </Button>
              </div>
            )}
          </div>
        ) : (
          <SortableContext
            id={column.id}
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))}
          </SortableContext>
        )}
      </CardContent>
    </Card>
  );
}

export function TasksSectionV2({ product, client, onStatsUpdate }: TasksSectionV2Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Get client config for URL builder
  const clientConfig = useMemo(() => ({
    orgId: client.config.orgId,
    deviceId: client.config.deviceId,
    baseUrl: client.config.baseUrl,
    token: client.config.token,
  }), [client]);

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Drag distance threshold to distinguish from click
      },
    })
  );

  useEffect(() => {
    fetchTasks();
  }, [product.id]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      // Query for tasks
      const result = await client.queryNodes({
        filter: `parent.id is "${product.id}" and type is "plm.task"`,
      });

      const taskList: Task[] = (result.nodes || []).map((node: any) => ({
        id: node.id,
        name: node.name,
        status: node.settings?.status || 'pending',
        priority: node.settings?.priority || 'Medium',
        assignee: node.settings?.assignee || 'Unassigned',
        dueDate: node.settings?.dueDate,
        settings: node.settings,
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
  ];

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  // Handle drag end - update task status
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const newStatus = over.id as Task['status'];
    const task = tasks.find((t) => t.id === taskId);

    if (!task || task.status === newStatus) return;

    try {
      // Optimistic update - update UI immediately
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      // Update via settings PATCH endpoint (NOT updateNode)
      const url = urls.node.settingsPatch(clientConfig, taskId);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(clientConfig.token && { Authorization: `Bearer ${clientConfig.token}` }),
        },
        body: JSON.stringify({
          status: newStatus, // Only update status field (deep merge)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      // Update stats after successful change
      updateTaskStats();
    } catch (error) {
      console.error('[TasksSectionV2] Failed to update task status:', error);
      // Revert optimistic update
      await fetchTasks();
    }
  };

  // Update task stats
  const updateTaskStats = () => {
    onStatsUpdate({
      totalTasks: tasks.length,
      tasksCompletedThisWeek: tasks.filter(t => t.status === 'completed').length,
    });
  };

  // Handle task click to open edit dialog
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
            <p className="text-sm text-muted-foreground">
              Track and manage product development tasks
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        </div>

        {/* Kanban Board with Drag & Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-6 md:grid-cols-3">
            {columns.map((column) => {
              const columnTasks = getTasksByStatus(column.status);

              return (
                <DroppableColumn
                  key={column.id}
                  column={column}
                  tasks={columnTasks}
                  isLoading={isLoading}
                  onTaskClick={handleTaskClick}
                  onCreateClick={() => setIsCreateDialogOpen(true)}
                />
              );
            })}
          </div>
        </DndContext>
      </div>

      {/* Create Task Dialog */}
      <TaskCreateDialog
        productId={product.id}
        orgId={clientConfig.orgId}
        deviceId={clientConfig.deviceId}
        baseUrl={clientConfig.baseUrl}
        token={clientConfig.token}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onTaskCreated={fetchTasks}
      />

      {/* Edit Task Dialog */}
      {selectedTask && (
        <TaskEditDialog
          task={selectedTask}
          orgId={clientConfig.orgId}
          deviceId={clientConfig.deviceId}
          baseUrl={clientConfig.baseUrl}
          token={clientConfig.token}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onTaskUpdated={fetchTasks}
          onTaskDeleted={fetchTasks}
        />
      )}
    </>
  );
}
