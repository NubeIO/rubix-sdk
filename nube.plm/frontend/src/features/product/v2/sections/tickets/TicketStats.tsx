/**
 * Ticket Statistics Cards
 */

interface TicketStatsProps {
  total: number;
  pending: number;
  inProgress: number;
  blocked: number;
  review: number;
  completed: number;
}

export function TicketStats({
  total,
  pending,
  inProgress,
  blocked,
  review,
  completed
}: TicketStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="border rounded-lg p-4">
        <div className="text-2xl font-bold">{total}</div>
        <div className="text-xs text-muted-foreground">Total</div>
      </div>
      <div className="border rounded-lg p-4">
        <div className="text-2xl font-bold text-gray-600">{pending}</div>
        <div className="text-xs text-muted-foreground">Pending</div>
      </div>
      <div className="border rounded-lg p-4">
        <div className="text-2xl font-bold text-blue-600">{inProgress}</div>
        <div className="text-xs text-muted-foreground">In Progress</div>
      </div>
      <div className="border rounded-lg p-4">
        <div className="text-2xl font-bold text-red-600">{blocked}</div>
        <div className="text-xs text-muted-foreground">Blocked</div>
      </div>
      <div className="border rounded-lg p-4">
        <div className="text-2xl font-bold text-purple-600">{review}</div>
        <div className="text-xs text-muted-foreground">Review</div>
      </div>
      <div className="border rounded-lg p-4">
        <div className="text-2xl font-bold text-green-600">{completed}</div>
        <div className="text-xs text-muted-foreground">Completed</div>
      </div>
    </div>
  );
}
