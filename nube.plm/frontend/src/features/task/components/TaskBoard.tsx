/**
 * TaskBoard - Kanban board with drag-and-drop
 */

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
} from '@dnd-kit/core';
// @ts-ignore - SDK types are resolved at build time
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Task } from '../types/task.types';
import { TaskCard } from './TaskCard';
import { DroppableColumn } from './DroppableColumn';
import { normalizeTaskStatus, type TaskStatusValue } from '../utils/task-status';

const COLUMNS: {
  id: TaskStatusValue;
  label: string;
  color: string;
}[] = [
  { id: 'pending', label: 'Pending', color: 'bg-gray-100' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-blue-100' },
  { id: 'blocked', label: 'Blocked', color: 'bg-red-100' },
  { id: 'review', label: 'Review', color: 'bg-purple-100' },
  { id: 'completed', label: 'Completed', color: 'bg-green-100' },
  { id: 'cancelled', label: 'Cancelled', color: 'bg-gray-100' },
];

interface TaskBoardProps {
  tasks: Task[];
  client: PluginClient;
  ticketCounts?: Record<string, number>;
  onTaskUpdate?: () => void;
  onEditTask?: (task: Task) => void;
  onViewTickets?: (task: Task) => void;
}

export function TaskBoard({ tasks, client, ticketCounts = {}, onTaskUpdate, onEditTask, onViewTickets }: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts
      },
    })
  );

  // Group tasks by status
  const tasksByStatus = COLUMNS.reduce((acc, column) => {
    acc[column.id] = tasks.filter(
      (task) => normalizeTaskStatus(task.settings?.status) === column.id
    );
    return acc;
  }, {} as Record<TaskStatusValue, Task[]>);

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task;
    setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Could add visual feedback here
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Determine the target column
    let targetColumn = over.id as string;

    // If dropped over another task, find which column that task is in
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask) {
      targetColumn = normalizeTaskStatus(overTask.settings?.status);
    }

    // Validate it's a valid status
    const isValidStatus = COLUMNS.some((col) => col.id === targetColumn);
    if (!isValidStatus) return;

    const newStatus = targetColumn as TaskStatusValue;
    const currentStatus = normalizeTaskStatus(task.settings?.status);

    // If status hasn't changed, do nothing
    if (newStatus === currentStatus) return;

    console.log('[TaskBoard] Moving task:', {
      taskId,
      taskName: task.name,
      from: currentStatus,
      to: newStatus,
    });

    // Update the task status
    try {
      setIsUpdating(true);
      await client.updateNodeSettings(taskId, {
        status: newStatus,
      });
      console.log('[TaskBoard] Task status updated successfully');

      // Trigger refresh
      onTaskUpdate?.();
    } catch (error) {
      console.error('[TaskBoard] Failed to update task status:', error);
      // TODO: Show error toast
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
        {COLUMNS.map((column) => {
          const columnTasks = tasksByStatus[column.id] || [];
          return (
            <DroppableColumn
              key={column.id}
              id={column.id}
              label={column.label}
              tasks={columnTasks}
              ticketCounts={ticketCounts}
              onEditTask={onEditTask}
              onViewTickets={onViewTickets}
            />
          );
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 scale-105 opacity-90">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
