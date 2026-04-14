export const STATUSES = ['pending', 'in-progress', 'blocked', 'review', 'completed', 'cancelled'] as const;

export type TaskStatus = (typeof STATUSES)[number];

export const STATUS_STYLE: Record<string, { dot: string; bg: string; text: string }> = {
  completed:     { dot: 'bg-emerald-500', bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400' },
  'in-progress': { dot: 'bg-blue-500',    bg: 'bg-blue-500/15 border-blue-500/30',       text: 'text-blue-400' },
  blocked:       { dot: 'bg-red-500',     bg: 'bg-red-500/15 border-red-500/30',          text: 'text-red-400' },
  review:        { dot: 'bg-amber-500',   bg: 'bg-amber-500/15 border-amber-500/30',      text: 'text-amber-400' },
  pending:       { dot: 'bg-zinc-500',    bg: 'bg-zinc-500/10 border-zinc-700',            text: 'text-zinc-400' },
  cancelled:     { dot: 'bg-zinc-700',    bg: 'bg-zinc-700/20 border-zinc-700',            text: 'text-zinc-600' },
};

export const PRODUCT_CATEGORIES = ['hardware', 'software', 'hybrid', 'firmware', 'bundle'] as const;
export const PRODUCT_STATUSES = ['Design', 'Prototype', 'Production', 'Discontinued'] as const;

