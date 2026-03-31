/**
 * Ticket Table Row Component
 */

import { Button, Badge } from '@rubix-sdk/frontend/common/ui';
import { ExternalLink } from 'lucide-react';
import { TaskStatusBadge } from '@features/task/components/TaskStatusBadge';
import type { Ticket } from '@features/ticket/types/ticket.types';

interface TicketWithTask extends Ticket {
  taskName?: string;
  taskId?: string;
}

interface TicketTableRowProps {
  ticket: TicketWithTask;
  onEdit: (ticket: TicketWithTask) => void;
  onDelete: (ticket: Ticket) => void;
}

export function TicketTableRow({ ticket, onEdit, onDelete }: TicketTableRowProps) {
  const getPriorityVariant = (priority?: string) => {
    if (priority === 'Critical' || priority === 'High') {
      return 'destructive';
    }
    return 'secondary';
  };

  return (
    <tr className="border-b hover:bg-muted/30 transition-colors">
      {/* Ticket Name & Description */}
      <td className="p-3">
        <div>
          <div className="font-medium">{ticket.name}</div>
          {ticket.settings?.description && (
            <div className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {ticket.settings.description}
            </div>
          )}
        </div>
      </td>

      {/* Task Name */}
      <td className="p-3">
        {ticket.taskId ? (
          <div className="flex items-center gap-1">
            <span className="text-sm">{ticket.taskName}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => {
                // TODO: Navigate to task
                console.log('Navigate to task:', ticket.taskId);
              }}
              title="View task"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground italic">Project</span>
        )}
      </td>

      {/* Status */}
      <td className="p-3">
        <TaskStatusBadge status={ticket.settings?.status} />
      </td>

      {/* Type */}
      <td className="p-3">
        <Badge variant="outline" className="text-xs">
          {ticket.settings?.ticketType || 'task'}
        </Badge>
      </td>

      {/* Priority */}
      <td className="p-3">
        <Badge
          variant={getPriorityVariant(ticket.settings?.priority)}
          className="text-xs"
        >
          {ticket.settings?.priority || 'Medium'}
        </Badge>
      </td>

      {/* Actions */}
      <td className="p-3">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(ticket)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(ticket)}
            className="text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
