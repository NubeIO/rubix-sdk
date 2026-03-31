/**
 * Ticket Table Component
 */

import { Button } from '@rubix-sdk/frontend/common/ui';
import { Plus } from 'lucide-react';
import { TicketTableRow } from './TicketTableRow';
import type { Ticket } from '@features/ticket/types/ticket.types';

interface TicketWithTask extends Ticket {
  taskName?: string;
  taskId?: string;
}

interface TicketTableProps {
  tickets: TicketWithTask[];
  hasTickets: boolean;
  onEdit: (ticket: TicketWithTask) => void;
  onDelete: (ticket: Ticket) => void;
  onCreate: () => void;
}

export function TicketTable({
  tickets,
  hasTickets,
  onEdit,
  onDelete,
  onCreate
}: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-semibold mb-2">
            {hasTickets ? 'No tickets match your filters' : 'No tickets yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {hasTickets
              ? 'Try adjusting your filters or search query.'
              : 'Create your first ticket to start tracking work items.'}
          </p>
          {!hasTickets && (
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
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
          {tickets.map((ticket) => (
            <TicketTableRow
              key={ticket.id}
              ticket={ticket}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
