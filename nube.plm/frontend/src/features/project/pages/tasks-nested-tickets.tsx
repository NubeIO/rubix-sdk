/**
 * Nested Tickets Table - Shows tickets for a specific task
 * Lazy loaded when task row is expanded
 */

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
// @ts-ignore
import { Button } from '@rubix-sdk/frontend/common/ui';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Ticket } from '@features/ticket/types/ticket.types';
import type { Task } from '@features/task/types/task.types';
import { Badge } from '@/components/ui/badge';
import { TicketDialog } from '@features/ticket/components/TicketDialog';
import { DeleteTicketDialog } from '@features/ticket/components/DeleteTicketDialog';

interface TasksNestedTicketsProps {
  task: Task;
  client: PluginClient;
}

export function TasksNestedTickets({ task, client }: TasksNestedTicketsProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchTickets();
  }, [task.id]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const nodes = await client.queryNodes({
        filter: `type is "plm.ticket" and parentId is "${task.id}"`,
      });
      console.log('[TasksNestedTickets] Fetched tickets for task:', task.id, nodes);
      setTickets(nodes as Ticket[]);
    } catch (err) {
      console.error('[TasksNestedTickets] Failed to fetch tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketSuccess = async () => {
    await fetchTickets();
  };

  if (isLoading) {
    return (
      <tr>
        <td colSpan={100} className="p-4 bg-muted/30">
          <div className="text-sm text-muted-foreground text-center">
            Loading tickets...
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr>
        <td colSpan={100} className="p-0 bg-muted/30">
          <div className="px-8 py-4">
            {/* Add Ticket Button */}
            <div className="mb-3">
              <Button
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Ticket
              </Button>
            </div>

            {/* Nested Tickets Table */}
            {tickets.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6 border rounded-md bg-background">
                No tickets yet. Click "Add Ticket" to create one.
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden bg-background">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Ticket Name</th>
                      <th className="text-left p-2 font-medium w-24">Type</th>
                      <th className="text-left p-2 font-medium w-32">Status</th>
                      <th className="text-left p-2 font-medium w-24">Priority</th>
                      <th className="text-left p-2 font-medium w-32">Assignee</th>
                      <th className="text-right p-2 font-medium w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="border-t hover:bg-muted/20">
                        <td className="p-2">
                          <div className="font-medium">{ticket.name}</div>
                          {ticket.settings?.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {ticket.settings.description}
                            </div>
                          )}
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">
                            {ticket.settings?.ticketType || 'task'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={
                              ticket.settings?.status === 'completed'
                                ? 'default'
                                : ticket.settings?.status === 'in-progress'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="text-xs"
                          >
                            {ticket.settings?.status || 'pending'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={
                              ticket.settings?.priority === 'Critical' ||
                              ticket.settings?.priority === 'High'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {ticket.settings?.priority || 'Medium'}
                          </Badge>
                        </td>
                        <td className="p-2 text-xs">
                          {ticket.settings?.assignee || (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTicket(ticket)}
                              title="Edit ticket"
                              className="h-7 w-7 p-0"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingTicket(ticket)}
                              title="Delete ticket"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </td>
      </tr>

      {/* Create Ticket Dialog */}
      {showCreateDialog && (
        <TicketDialog
          client={client}
          taskId={task.id}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleTicketSuccess}
        />
      )}

      {/* Edit Ticket Dialog */}
      {editingTicket && (
        <TicketDialog
          client={client}
          taskId={task.id}
          ticket={editingTicket}
          onClose={() => setEditingTicket(null)}
          onSuccess={handleTicketSuccess}
        />
      )}

      {/* Delete Ticket Dialog */}
      {deletingTicket && (
        <DeleteTicketDialog
          client={client}
          ticket={deletingTicket}
          onClose={() => setDeletingTicket(null)}
          onSuccess={handleTicketSuccess}
        />
      )}
    </>
  );
}
