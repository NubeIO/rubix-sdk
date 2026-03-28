/**
 * DroppableColumn - A droppable column for the Kanban board
 */

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
// @ts-ignore - SDK types are resolved at build time
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@rubix-sdk/frontend/common/ui';
import type { Task } from '../types/task.types';
import { TaskCard } from './TaskCard';

interface DroppableColumnProps {
  id: string;
  label: string;
  tasks: Task[];
  onEditTask?: (task: Task) => void;
  onViewTickets?: (task: Task) => void;
}

export function DroppableColumn({ id, label, tasks, onEditTask, onViewTickets }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <Card
      ref={setNodeRef}
      className={`flex flex-col h-full transition-colors ${
        isOver ? 'ring-2 ring-primary' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>{label}</span>
          <Badge variant="secondary" className="ml-2">
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto max-h-[calc(100vh-300px)]">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No tasks
            </div>
          ) : (
            <div>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                  onViewTickets={onViewTickets}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
}
