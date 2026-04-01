/**
 * Task Detail Dialog - View task details with expandable tickets section
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
// @ts-ignore
import { Button } from '@rubix-sdk/frontend/common/ui';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Task } from '@features/task/types/task.types';
import type { Product } from '@features/product/types/product.types';
import type { Ticket } from '@features/ticket/types/ticket.types';
import { TicketDialog } from '@features/ticket/components/TicketDialog';
import { DeleteTicketDialog } from '@features/ticket/components/DeleteTicketDialog';
import { Badge } from '@/components/ui/badge';
import { TaskStatusBadge } from '@features/task/components/TaskStatusBadge';

interface TaskDetailDialogProps {
  task: Task;
  product?: Product;
  client: PluginClient;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string, taskName: string) => void;
}

export function TaskDetailDialog({
  task,
  product,
  client,
  onClose,
  onEdit,
  onDelete,
}: TaskDetailDialogProps) {
  const [ticketsExpanded, setTicketsExpanded] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsLoaded, setTicketsLoaded] = useState(false);

  // Ticket CRUD dialog states
  const [assigneeDisplay, setAssigneeDisplay] = useState('Unassigned');
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    client.getAssignedUsers(task.id).then((refs: any[]) => {
      if (refs?.length) setAssigneeDisplay(refs.map((r: any) => r.displayName || 'Unknown').join(', '));
    }).catch(() => {});
  }, [task.id, client]);

  // Fetch tickets when expanded
  const fetchTickets = useCallback(async () => {
    if (ticketsLoaded) return; // Already loaded

    try {
      setTicketsLoading(true);
      const nodes = await client.queryNodes({
        filter: `type is "plm.ticket" and parentId is "${task.id}"`,
      });
      console.log('[TaskDetailDialog] Fetched tickets:', nodes);
      setTickets(nodes as Ticket[]);
      setTicketsLoaded(true);
    } catch (err) {
      console.error('[TaskDetailDialog] Failed to fetch tickets:', err);
    } finally {
      setTicketsLoading(false);
    }
  }, [client, task.id, ticketsLoaded]);

  useEffect(() => {
    if (ticketsExpanded && !ticketsLoaded) {
      fetchTickets();
    }
  }, [ticketsExpanded, ticketsLoaded, fetchTickets]);

  const handleToggleTickets = () => {
    setTicketsExpanded(!ticketsExpanded);
  };

  const handleCreateTicket = () => {
    setEditingTicket(null);
    setTicketDialogOpen(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setTicketDialogOpen(true);
  };

  const handleDeleteTicket = (ticket: Ticket) => {
    setDeletingTicket(ticket);
  };

  const handleTicketSuccess = async () => {
    // Refresh tickets list
    setTicketsLoaded(false);
    await fetchTickets();
  };

  const handleTicketDeleted = async () => {
    // Refresh tickets list after successful deletion
    setDeletingTicket(null);
    setTicketsLoaded(false);
    await fetchTickets();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-background rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{task.name}</h2>
              {product && (
                <p className="text-sm text-muted-foreground">
                  Product: <span className="font-medium">{product.name}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {/* Task Details */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <TaskStatusBadge status={task.settings?.status} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Priority</label>
                <div className="mt-1">
                  <Badge
                    variant={
                      task.settings?.priority === 'critical' || task.settings?.priority === 'high'
                        ? 'destructive'
                        : 'default'
                    }
                  >
                    {task.settings?.priority || 'Medium'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Assignee</label>
                <p className="mt-1">{assigneeDisplay}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                <p className="mt-1">
                  {task.settings?.dueDate
                    ? new Date(task.settings.dueDate).toLocaleDateString()
                    : 'No date'}
                </p>
              </div>
            </div>

            {task.settings?.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1 text-sm">{task.settings.description}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Progress: {task.settings?.progress || 0}%
              </label>
              <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${task.settings?.progress || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tickets Section */}
          <div className="border-t pt-4">
            <button
              onClick={handleToggleTickets}
              className="flex items-center justify-between w-full text-left hover:bg-muted/50 p-2 rounded-md transition-colors"
            >
              <div className="flex items-center gap-2">
                {ticketsExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <h3 className="font-semibold">
                  Tickets {ticketsLoaded && `(${tickets.length})`}
                </h3>
              </div>
              {ticketsExpanded && (
                <Button
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleCreateTicket();
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Ticket
                </Button>
              )}
            </button>

            {ticketsExpanded && (
              <div className="mt-3 space-y-2">
                {ticketsLoading ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">
                    Loading tickets...
                  </p>
                ) : tickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">
                    No tickets yet. Click "Add Ticket" to create one.
                  </p>
                ) : (
                  tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border rounded-md p-3 flex items-center justify-between hover:bg-muted/30"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{ticket.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {ticket.settings?.ticketType || 'task'}
                          </Badge>
                          <TaskStatusBadge status={ticket.settings?.status} />
                        </div>
                        {ticket.settings?.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {ticket.settings.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTicket(ticket)}
                          title="Edit ticket"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTicket(ticket)}
                          title="Delete ticket"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-6 border-t mt-6">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => onDelete(task.id, task.name)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Task
            </Button>
            <Button onClick={() => onEdit(task)}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit Task
            </Button>
          </div>
        </div>
      </div>

      {/* Ticket Create/Edit Dialog */}
      {ticketDialogOpen && (
        <TicketDialog
          client={client}
          taskId={task.id}
          ticket={editingTicket || undefined}
          onClose={() => {
            setTicketDialogOpen(false);
            setEditingTicket(null);
          }}
          onSuccess={handleTicketSuccess}
        />
      )}

      {/* Ticket Delete Dialog */}
      {deletingTicket && (
        <DeleteTicketDialog
          client={client}
          ticket={deletingTicket}
          onClose={() => setDeletingTicket(null)}
          onSuccess={handleTicketDeleted}
        />
      )}
    </>
  );
}
