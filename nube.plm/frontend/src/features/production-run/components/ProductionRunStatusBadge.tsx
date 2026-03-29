import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ManufacturingRunStatus } from '../types';

const STATUS_STYLES: Record<ManufacturingRunStatus, string> = {
  planned: 'border-slate-200 bg-slate-100 text-slate-700',
  'in-progress': 'border-blue-200 bg-blue-100 text-blue-700',
  qa: 'border-amber-200 bg-amber-100 text-amber-700',
  completed: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  cancelled: 'border-rose-200 bg-rose-100 text-rose-700',
};

export function ProductionRunStatusBadge({ status }: { status?: ManufacturingRunStatus }) {
  const value = status || 'planned';

  return (
    <Badge
      variant="outline"
      className={cn('capitalize', STATUS_STYLES[value])}
    >
      {value.replace('-', ' ')}
    </Badge>
  );
}
