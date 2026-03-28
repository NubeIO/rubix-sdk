/**
 * Tickets Section V2 - Table view for task tickets
 */

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { Plus, Calendar, User, Edit2, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '../types/task.types';
import type { Ticket } from '@features/ticket/types/ticket.types';
import { TicketDialog } from '@features/ticket/components/TicketDialog';
import { DeleteTicketDialog } from '@features/ticket/components/DeleteTicketDialog';
import { normalizeTicketStatus } from '@features/ticket/utils/ticket-helpers';
import { recalculateTaskProgress } from '../utils/task-helpers';

type TicketStatus = NonNullable<Ticket['settings']>['status'];

interface TicketsSectionV2Props {
  task: Task;
  client: any;
  onStatsUpdate: (stats: any) => void;
  onRefresh: () => void;
}

export function TicketsSectionV2({ task, client, onStatsUpdate, onRefresh }: TicketsSectionV2Props) {
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
        filter: `type is "plm.ticket" and p.id is "${task.id}"`,
      });

      const ticketList: Ticket[] = (nodes || []).map((node: any) => ({
        id: node.id,
        name: node.name,
        type: 'plm.ticket' as const,
        parentId: node.parentId,
        settings: {
          ticketType: node.settings?.ticketType || 'task',
          status: normalizeTicketStatus(node.settings?.status),
          priority: node.settings?.priority || 'Medium',
          assignee: node.settings?.assignee || 'Unassigned',
          dueDate: node.settings?.dueDate,
          estimatedHours: node.settings?.estimatedHours || 0,
          actualHours: node.settings?.actualHours || 0,
        },
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
      }));

      setTickets(ticketList);

      // Update stats
      const completed = ticketList.filter(t => t.settings?.status === 'completed').length;
      const inProgress = ticketList.filter(t => t.settings?.status === 'in-progress').length;
      const blocked = ticketList.filter(t => t.settings?.status === 'blocked').length;

      onStatsUpdate({
        totalTickets: ticketList.length,
        ticketsCompleted: completed,
        ticketsInProgress: inProgress,
        ticketsBlocked: blocked,
        progress: ticketList.length > 0 ? Math.round((completed / ticketList.length) * 100) : 0,
      });
    } catch (err) {
      console.error('[TicketsSectionV2] Failed to fetch tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketCreated = async () => {
    await fetchTickets();
    // Recalculate task progress
    try {
      await recalculateTaskProgress(client, task.id);
      onRefresh();
    } catch (err) {
      console.error('[TicketsSectionV2] Failed to recalculate progress:', err);
    }
  };

  const handleTicketUpdated = async () => {
    await fetchTickets();
    // Recalculate task progress
    try {
      await recalculateTaskProgress(client, task.id);
      onRefresh();
    } catch (err) {
      console.error('[TicketsSectionV2] Failed to recalculate progress:', err);
    }
  };

  const statusSummary: Array<{
    id: string;
    label: string;
    status: TicketStatus;
    dotColor: string;
  }> = [
    { id: 'pending', label: 'Pending', status: 'pending', dotColor: 'bg-gray-400' },
    { id: 'in-progress', label: 'In Progress', status: 'in-progress', dotColor: 'bg-amber-500' },
    { id: 'blocked', label: 'Blocked', status: 'blocked', dotColor: 'bg-red-500' },
    { id: 'review', label: 'Review', status: 'review', dotColor: 'bg-blue-500' },
    { id: 'completed', label: 'Completed', status: 'completed', dotColor: 'bg-emerald-500' },
    { id: 'cancelled', label: 'Cancelled', status: 'cancelled', dotColor: 'bg-slate-400' },
  ];

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Low':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getTicketTypeIcon = (type?: string) => {
    switch (type) {
      case 'bug':
        return '🐛';
      case 'feature':
        return '✨';
      case 'chore':
        return '🔧';
      default:
        return '📝';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No due date';
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays}d`;
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    const updatedA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const updatedB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return updatedB - updatedA;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
          <p className="text-sm text-muted-foreground">
            Manage work items, bugs, and features for this task
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Ticket
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statusSummary.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <span className={cn('inline-block h-2.5 w-2.5 rounded-full', item.dotColor)} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <Badge variant="secondary">
                {tickets.filter((ticket) => ticket.settings?.status === item.status).length}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Ticket List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading tickets...
            </div>
          ) : sortedTickets.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No tickets found for this task yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Ticket</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Priority</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Assignee</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Due</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Hours</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="max-w-[320px]">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-base">{getTicketTypeIcon(ticket.settings?.ticketType)}</span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{ticket.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{ticket.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {ticket.settings?.status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('border text-xs', getPriorityColor(ticket.settings?.priority))}>
                        {ticket.settings?.priority || 'Medium'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 text-sm">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {ticket.settings?.assignee || 'Unassigned'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(ticket.settings?.dueDate)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {ticket.settings?.actualHours || 0}/{ticket.settings?.estimatedHours || 0}h
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => setEditingTicket(ticket)}
                        >
                          <Edit2 className="mr-1 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() => setDeletingTicket(ticket)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Ticket Dialog */}
      {showCreateDialog && (
        <TicketDialog
          client={client}
          taskId={task.id}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleTicketCreated}
        />
      )}

      {/* Edit Ticket Dialog */}
      {editingTicket && (
        <TicketDialog
          client={client}
          taskId={task.id}
          ticket={editingTicket}
          onClose={() => setEditingTicket(null)}
          onSuccess={handleTicketUpdated}
        />
      )}

      {/* Delete Ticket Dialog */}
      {deletingTicket && (
        <DeleteTicketDialog
          client={client}
          ticket={deletingTicket}
          onClose={() => setDeletingTicket(null)}
          onSuccess={handleTicketUpdated}
        />
      )}
    </div>
  );
}
