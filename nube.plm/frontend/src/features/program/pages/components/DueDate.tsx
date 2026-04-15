import { useState, useRef, useEffect } from 'react';
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

export function DueDate({ date, onChange }: { date?: string; onChange?: (date: string) => void }) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.showPicker?.();
      inputRef.current.focus();
    }
  }, [editing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && onChange) {
      onChange(val);
    }
    setEditing(false);
  };

  if (editing && onChange) {
    return (
      <input
        ref={inputRef}
        type="date"
        defaultValue={date || ''}
        onChange={handleChange}
        onBlur={() => setEditing(false)}
        className="h-7 text-xs bg-transparent border border-input rounded px-1.5 w-full text-foreground"
      />
    );
  }

  if (!date) {
    return (
      <button
        onClick={() => onChange && setEditing(true)}
        className={`text-xs text-muted-foreground/50 hover:text-muted-foreground transition ${onChange ? 'cursor-pointer' : ''}`}
        title={onChange ? 'Click to set date' : undefined}
      >
        {'\u2014'}
      </button>
    );
  }

  const status = getDueStatus(date);
  if (!status) {
    return (
      <button
        onClick={() => onChange && setEditing(true)}
        className={`text-xs text-muted-foreground ${onChange ? 'cursor-pointer hover:text-foreground transition' : ''}`}
      >
        {date}
      </button>
    );
  }

  return (
    <button
      onClick={() => onChange && setEditing(true)}
      className={onChange ? 'cursor-pointer' : ''}
      title={onChange ? 'Click to change date' : undefined}
    >
      <Badge variant="outline" className={`text-[11px] px-1.5 py-0.5 font-normal whitespace-nowrap ${status.className}`}>
        {formatShortDate(date)} · {status.label}
      </Badge>
    </button>
  );
}
