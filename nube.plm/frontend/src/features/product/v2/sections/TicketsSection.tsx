/**
 * Tickets Section - Unified view of all tickets across all tasks
 */

import { useEffect, useState, useMemo } from 'react';
// @ts-ignore - SDK types are resolved at build time
import { Button, Badge } from '@rubix-sdk/frontend/common/ui';
import { Plus, Filter, Search, ExternalLink } from 'lucide-react';
import type { Product } from '../../types/product.types';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Ticket } from '@features/ticket/types/ticket.types';
import type { Task } from '@features/task/types/task.types';
import { TicketDialog } from '@features/ticket/components/TicketDialog';
import { DeleteTicketDialog } from '@features/ticket/components/DeleteTicketDialog';
import { TaskStatusBadge } from '@features/task/components/TaskStatusBadge';

interface TicketsSectionProps {
  product: Product;
  client: PluginClient;
  onStatsUpdate: (stats: any) => void;
}

interface TicketWithTask extends Ticket {
  taskName?: string;
  taskId?: string;
}

export function TicketsSection({ product, client, onStatsUpdate }: TicketsSectionProps) {
  const [tickets, setTickets] = useState<TicketWithTask[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchData();
  }, [product.id, refreshKey]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch all tasks for this product
      const taskNodes = await client.queryNodes({
        filter: `type is "plm.task" and parent.id is "${product.id}"`,
      });
      const taskList = taskNodes as Task[];
      setTasks(taskList);

      // Fetch all tickets for all tasks
      const allTickets: TicketWithTask[] = [];
      await Promise.all(
        taskList.map(async (task) => {
          try {
            const ticketNodes = await client.queryNodes({
              filter: `type is "plm.ticket" and parentId is "${task.id}"`,
            });
            const taskTickets = (ticketNodes as Ticket[]).map((ticket) => ({
              ...ticket,
              taskName: task.name,
              taskId: task.id,
            }));
            allTickets.push(...taskTickets);
          } catch (err) {
            console.error(`[TicketsSection] Failed to fetch tickets for task ${task.id}:`, err);
          }
        })
      );

      setTickets(allTickets);

      // Update stats
      const totalTickets = allTickets.length;
      const ticketsByStatus = allTickets.reduce((acc: Record<string, number>, ticket) => {
        const status = ticket.settings?.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      onStatsUpdate({
        totalTickets,
        completedTickets: ticketsByStatus['completed'] || 0,
        blockedTickets: ticketsByStatus['blocked'] || 0,
        ticketsByStatus,
      });
    } catch (err) {
      console.error('[TicketsSection] Failed to fetch tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Search filter
      if (searchQuery && !ticket.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && ticket.settings?.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && ticket.settings?.priority !== priorityFilter) {
        return false;
      }

      // Task filter
      if (taskFilter !== 'all' && ticket.taskId !== taskFilter) {
        return false;
      }

      return true;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter, taskFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredTickets.length;
    const byStatus = filteredTickets.reduce((acc: Record<string, number>, ticket) => {
      const status = ticket.settings?.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      pending: byStatus['pending'] || 0,
      inProgress: byStatus['in-progress'] || 0,
      blocked: byStatus['blocked'] || 0,
      review: byStatus['review'] || 0,
      completed: byStatus['completed'] || 0,
      cancelled: byStatus['cancelled'] || 0,
    };
  }, [filteredTickets]);

  const handleCreateTicket = (taskId?: string) => {
    setSelectedTaskId(taskId || null);
    setEditingTicket(null);
    setCreateDialogOpen(true);
  };

  const handleEditTicket = (ticket: TicketWithTask) => {
    setSelectedTaskId(ticket.taskId || null);
    setEditingTicket(ticket);
    setCreateDialogOpen(true);
  };

  const handleDeleteTicket = (ticket: Ticket) => {
    setDeletingTicket(ticket);
  };

  const handleTicketSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setCreateDialogOpen(false);
    setEditingTicket(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTicket) return;

    try {
      await client.deleteNode(deletingTicket.id);
      setDeletingTicket(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error('[TicketsSection] Failed to delete ticket:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
            <p className="text-sm text-muted-foreground">
              All tickets across all tasks
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading tickets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
          <p className="text-sm text-muted-foreground">
            All tickets across all tasks
          </p>
        </div>
        <Button onClick={() => handleCreateTicket()}>
          <Plus className="mr-2 h-4 w-4" />
          Create Ticket
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-xs text-muted-foreground">In Progress</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
          <div className="text-xs text-muted-foreground">Blocked</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.review}</div>
          <div className="text-xs text-muted-foreground">Review</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-md bg-background"
          />
        </div>

        <select
          value={taskFilter}
          onChange={(e) => setTaskFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-md bg-background"
        >
          <option value="all">All Tasks</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-md bg-background"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="review">Review</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-md bg-background"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || taskFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setPriorityFilter('all');
              setTaskFilter('all');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Tickets Table */}
      {filteredTickets.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-2">
              {tickets.length === 0 ? 'No tickets yet' : 'No tickets match your filters'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {tickets.length === 0
                ? 'Create your first ticket to start tracking work items.'
                : 'Try adjusting your filters or search query.'}
            </p>
            {tickets.length === 0 && (
              <Button onClick={() => handleCreateTicket()}>
                <Plus className="mr-2 h-4 w-4" />
                Create Ticket
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Ticket</th>
                <th className="text-left p-3 text-sm font-medium">Task</th>
                <th className="text-left p-3 text-sm font-medium">Status</th>
                <th className="text-left p-3 text-sm font-medium">Type</th>
                <th className="text-left p-3 text-sm font-medium">Priority</th>
                <th className="text-left p-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b hover:bg-muted/30 transition-colors">
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
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{ticket.taskName || 'Unknown'}</span>
                      {ticket.taskId && (
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
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <TaskStatusBadge status={ticket.settings?.status} />
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">
                      {ticket.settings?.ticketType || 'task'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={
                        ticket.settings?.priority === 'critical' || ticket.settings?.priority === 'high'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="text-xs"
                    >
                      {ticket.settings?.priority || 'medium'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTicket(ticket)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTicket(ticket)}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Ticket Dialog */}
      {createDialogOpen && (
        <TicketDialog
          client={client}
          taskId={selectedTaskId || tasks[0]?.id}
          ticket={editingTicket || undefined}
          onClose={() => {
            setCreateDialogOpen(false);
            setEditingTicket(null);
            setSelectedTaskId(null);
          }}
          onSuccess={handleTicketSuccess}
        />
      )}

      {/* Delete Ticket Dialog */}
      {deletingTicket && (
        <DeleteTicketDialog
          open={!!deletingTicket}
          onOpenChange={(open) => {
            if (!open) setDeletingTicket(null);
          }}
          ticketName={deletingTicket.name}
          onConfirm={handleConfirmDelete}
          isDeleting={false}
        />
      )}
    </div>
  );
}
