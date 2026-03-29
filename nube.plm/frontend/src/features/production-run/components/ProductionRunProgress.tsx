import { Progress } from '@/components/ui/progress';

interface ProductionRunProgressProps {
  producedCount: number;
  targetQuantity: number;
}

export function ProductionRunProgress({
  producedCount,
  targetQuantity,
}: ProductionRunProgressProps) {
  const target = Math.max(targetQuantity, 0);
  const percent = target > 0 ? Math.min(100, Math.round((producedCount / target) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Build Progress</span>
        <span className="font-medium">
          {producedCount}/{targetQuantity} units
        </span>
      </div>
      <Progress value={percent} className="h-2.5" />
      <p className="text-xs text-muted-foreground">{percent}% complete</p>
    </div>
  );
}
