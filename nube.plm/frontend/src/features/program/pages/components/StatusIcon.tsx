/**
 * Shared status icon component for tasks and tickets.
 * Renders a coloured icon based on the status string.
 */

import { CheckCircle2, Circle, Loader2, AlertTriangle, Eye, Ban, type LucideProps } from 'lucide-react';

const STATUS_CONFIG: Record<string, {
  icon: React.FC<LucideProps>;
  color: string;       // icon color class
  bg: string;          // row tint class (optional, for completed/blocked highlights)
}> = {
  completed:     { icon: CheckCircle2,  color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
  'in-progress': { icon: Loader2,       color: 'text-blue-500',    bg: '' },
  blocked:       { icon: AlertTriangle,  color: 'text-red-500',     bg: 'bg-red-500/5' },
  review:        { icon: Eye,            color: 'text-amber-500',   bg: '' },
  pending:       { icon: Circle,         color: 'text-zinc-400',    bg: '' },
  cancelled:     { icon: Ban,            color: 'text-zinc-500',    bg: '' },
};

const DEFAULT_CONFIG = STATUS_CONFIG.pending;

interface StatusIconProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusIcon({ status, size = 'sm', className = '' }: StatusIconProps) {
  const config = STATUS_CONFIG[status] || DEFAULT_CONFIG;
  const Icon = config.icon;
  const px = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return <Icon className={`${px} ${config.color} shrink-0 ${className}`} />;
}

/** Returns the row background tint class for a status (e.g. green tint for completed). */
export function getStatusRowBg(status: string): string {
  return (STATUS_CONFIG[status] || DEFAULT_CONFIG).bg;
}

/** Returns the icon color class for a status. */
export function getStatusColor(status: string): string {
  return (STATUS_CONFIG[status] || DEFAULT_CONFIG).color;
}
