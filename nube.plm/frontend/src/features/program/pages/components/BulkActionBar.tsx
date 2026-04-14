import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { GATES, type GateId } from '@shared/constants/gates';
import { STATUSES } from '../constants';

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  onBulkStatus: (status: string) => void;
  onBulkGate: (gate: GateId) => void;
  onBulkDelete: () => void;
}

export function BulkActionBar({ count, onClear, onBulkStatus, onBulkGate, onBulkDelete }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-primary/20">
      <Badge variant="secondary" className="text-xs">
        {count} selected
      </Badge>

      <Separator orientation="vertical" className="h-4" />

      <span className="text-[10px] text-muted-foreground">Set status:</span>
      <Select onValueChange={onBulkStatus}>
        <SelectTrigger className="h-6 w-[120px] text-[11px] border-input bg-transparent">
          <SelectValue placeholder="Status..." />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map(s => (
            <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace('-', ' ')}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-[10px] text-muted-foreground">Move to gate:</span>
      <Select onValueChange={(v) => onBulkGate(v as GateId)}>
        <SelectTrigger className="h-6 w-[140px] text-[11px] border-input bg-transparent">
          <SelectValue placeholder="Gate..." />
        </SelectTrigger>
        <SelectContent>
          {GATES.map(g => (
            <SelectItem key={g.id} value={g.id} className="text-xs">{g.id.toUpperCase()} {g.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-1" />

      <Button variant="destructive" size="sm" className="h-6 text-[11px]" onClick={onBulkDelete}>
        Delete {count}
      </Button>
      <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground" onClick={onClear}>
        Clear selection
      </Button>
    </div>
  );
}
