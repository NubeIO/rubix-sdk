import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Ticket } from '@features/ticket/types/ticket.types';

interface TicketsReportProps {
  tickets: Ticket[];
}

const TYPE_COLORS: Record<string, string> = {
  bug: 'bg-red-100 text-red-700',
  feature: 'bg-blue-100 text-blue-700',
  chore: 'bg-slate-100 text-slate-700',
  task: 'bg-violet-100 text-violet-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-slate-100 text-slate-700',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  blocked: 'bg-red-100 text-red-700',
  review: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const k = key(item);
    if (!result[k]) result[k] = [];
    result[k].push(item);
  }
  return result;
}

export function TicketsReport({ tickets }: TicketsReportProps) {
  const byType = groupBy(tickets, (t) => t.settings?.ticketType || 'task');
  const byPriority = groupBy(tickets, (t) => t.settings?.priority || 'Medium');
  const byStatus = groupBy(tickets, (t) => t.settings?.status || 'pending');

  if (tickets.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tickets found for selected products.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">Tickets Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {/* By Type */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">By Type</h4>
            <div className="space-y-2">
              {Object.entries(byType)
                .sort((a, b) => b[1].length - a[1].length)
                .map(([type, items]) => (
                  <div key={type} className="flex items-center justify-between">
                    <Badge className={TYPE_COLORS[type] || ''} variant="outline">
                      {type}
                    </Badge>
                    <span className="text-sm font-semibold">{items.length}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* By Priority */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">By Priority</h4>
            <div className="space-y-2">
              {['Critical', 'High', 'Medium', 'Low'].map((priority) => {
                const count = byPriority[priority]?.length || 0;
                if (count === 0) return null;
                return (
                  <div key={priority} className="flex items-center justify-between">
                    <Badge className={PRIORITY_COLORS[priority] || ''} variant="outline">
                      {priority}
                    </Badge>
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Status */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">By Status</h4>
            <div className="space-y-2">
              {Object.entries(byStatus)
                .sort((a, b) => b[1].length - a[1].length)
                .map(([status, items]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge className={STATUS_COLORS[status] || ''} variant="outline">
                      {status}
                    </Badge>
                    <span className="text-sm font-semibold">{items.length}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
