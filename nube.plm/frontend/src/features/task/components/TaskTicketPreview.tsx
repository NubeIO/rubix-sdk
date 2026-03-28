/**
 * TaskTicketPreview - Inline preview of tickets in a popover
 */

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Ticket as TicketIcon } from 'lucide-react';
// @ts-ignore - SDK types are resolved at build time
import { Badge } from '@rubix-sdk/frontend/common/ui';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Ticket } from '@features/ticket/types/ticket.types';
import { TaskStatusBadge } from './TaskStatusBadge';

interface TaskTicketPreviewProps {
  taskId: string;
  client: PluginClient;
}

export function TaskTicketPreview({ taskId, client }: TaskTicketPreviewProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, [taskId]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const nodes = await client.queryNodes({
        filter: `type is "plm.ticket" and parentId is "${taskId}"`,
      });
      setTickets(nodes as Ticket[]);
    } catch (err) {
      console.error('[TaskTicketPreview] Failed to fetch tickets:', err);
      setError('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 w-64">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading tickets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center p-4 w-64 text-destructive">
        <AlertCircle className="h-4 w-4 mr-2" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="p-4 w-64 text-center text-muted-foreground">
        <TicketIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No tickets yet</p>
      </div>
    );
  }

  return (
    <div className="w-80 max-h-96 overflow-y-auto">
      <div className="p-2 border-b bg-muted/50">
        <h4 className="font-semibold text-sm px-2 py-1">
          Tickets ({tickets.length})
        </h4>
      </div>
      <div className="divide-y">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="p-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{ticket.name}</p>
                {ticket.settings?.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {ticket.settings.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1 items-end flex-shrink-0">
                <TaskStatusBadge status={ticket.settings?.status} />
                {ticket.settings?.ticketType && (
                  <Badge variant="outline" className="text-xs">
                    {ticket.settings.ticketType}
                  </Badge>
                )}
              </div>
            </div>
            {ticket.settings?.priority && (
              <div className="mt-2">
                <Badge
                  variant={
                    ticket.settings.priority === 'critical' || ticket.settings.priority === 'high'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="text-xs"
                >
                  {ticket.settings.priority}
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
