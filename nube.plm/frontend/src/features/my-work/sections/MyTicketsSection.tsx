import type { Ticket } from '@features/ticket/types/ticket.types';

// @ts-ignore - SDK types
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Badge,
} from '@rubix-sdk/frontend/common/ui';

interface MyTicketsSectionProps {
  tickets: (Ticket & { productName: string; taskName: string })[];
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  'completed': 'default',
  'in-progress': 'secondary',
  'pending': 'outline',
  'cancelled': 'destructive',
  'blocked': 'destructive',
};

function formatHours(actual?: number, estimated?: number): string {
  const a = actual ?? 0;
  if (estimated && estimated > 0) return `${a}/${estimated}`;
  return a > 0 ? String(a) : '-';
}

export function MyTicketsSection({ tickets }: MyTicketsSectionProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">No tickets assigned to you.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Ticket</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="text-right">Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="text-sm">{ticket.productName}</TableCell>
              <TableCell className="text-sm">{ticket.taskName || '-'}</TableCell>
              <TableCell className="text-sm font-medium">{ticket.name}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[ticket.settings?.status || ''] || 'outline'}>
                  {ticket.settings?.status || 'pending'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{ticket.settings?.priority || '-'}</TableCell>
              <TableCell className="text-sm text-right">
                {formatHours(ticket.settings?.actualHours, ticket.settings?.estimatedHours)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
