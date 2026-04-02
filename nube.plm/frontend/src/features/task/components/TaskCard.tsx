/**
 * TaskCard - Individual task card for Kanban board
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// @ts-ignore - SDK types are resolved at build time
import { Badge, Card, CardContent, Button } from '@rubix-sdk/frontend/common/ui';
import { Calendar, User, GripVertical, Edit2, Ticket } from 'lucide-react';
import type { Task } from '../types/task.types';

interface TaskCardProps {
  task: Task;
  ticketCount?: number;
  assigneeName?: string;
  onClick?: () => void;
  onEdit?: (task: Task) => void;
  onViewTickets?: (task: Task) => void;
}

export function TaskCard({ task, ticketCount = 0, assigneeName, onClick, onEdit, onViewTickets }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dueDate = task.settings?.dueDate;
  const assignee = assigneeName || task.settings?.assignee;
  const priority = task.settings?.priority;

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card
        className="group hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <CardContent className="p-3">
          {/* Drag Handle */}
          <div
            className="flex items-start gap-2 mb-2"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-2">{task.name}</h4>
            </div>
          </div>

          {/* Priority Badge */}
          {priority && (
            <div className="mb-2">
              <Badge
                variant={
                  priority === 'critical' || priority === 'high'
                    ? 'destructive'
                    : priority === 'medium'
                    ? 'default'
                    : 'secondary'
                }
                className="text-xs"
              >
                {priority}
              </Badge>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            {assignee && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate max-w-[80px]">{assignee}</span>
              </span>
            )}
            {dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>

          {/* Action Buttons - Always Visible */}
          <div className="flex gap-1 border-t pt-2 mt-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
            {onViewTickets && (
              <Button
                variant={ticketCount > 0 ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewTickets(task);
                }}
              >
                <Ticket className="h-3 w-3 mr-1" />
                Tickets
                {ticketCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {ticketCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
