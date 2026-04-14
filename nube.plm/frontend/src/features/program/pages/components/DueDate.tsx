import { Badge } from '@/components/ui/badge';

function getDueStatus(dueDate?: string): { label: string; className: string } | null {
  if (!dueDate) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T12:00:00`);
  if (isNaN(due.getTime())) return null;

  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `${Math.abs(diffDays)}d overdue`, className: 'bg-red-500/15 text-red-400 border-red-500/30' };
  }
  if (diffDays === 0) {
    return { label: 'Due today', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  }
  if (diffDays <= 7) {
    return { label: `${diffDays}d left`, className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  }
  return { label: `${diffDays}d`, className: 'text-muted-foreground border-border' };
}

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' }).format(d);
}

export function DueDate({ date }: { date?: string }) {
  if (!date) {
    return <span className="text-[10px] text-muted-foreground/40">{'\u2014'}</span>;
  }

  const status = getDueStatus(date);
  if (!status) {
    return <span className="text-[10px] text-muted-foreground">{date}</span>;
  }

  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${status.className}`}>
      {formatShortDate(date)} · {status.label}
    </Badge>
  );
}
