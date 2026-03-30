import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ManufacturingRun, ManufacturingUnit } from '../types';
import { ProductionRunProgress } from './ProductionRunProgress';
import { ProductionDateTracker } from './ProductionDateTracker';
import { ProductionRunStatusBadge } from './ProductionRunStatusBadge';

interface OverviewTabProps {
  run: ManufacturingRun;
  units: ManufacturingUnit[];
  producedCount: number;
  qaFailures: number;
  onEditRun: () => void;
  onDeleteRun: () => void;
  onUpdateRun: (settings: any) => Promise<void>;
}

export function OverviewTab({
  run,
  units,
  producedCount,
  qaFailures,
  onEditRun,
  onDeleteRun,
  onUpdateRun,
}: OverviewTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{run.name}</CardTitle>
            <ProductionRunStatusBadge status={run.settings?.status} />
            <Badge variant="outline">{run.settings?.runNumber || 'Run number pending'}</Badge>
          </div>
          <CardDescription>
            Facility {run.settings?.facilityLocation || 'not set'} • Hardware{' '}
            {run.settings?.hardwareVersion || 'n/a'}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEditRun}>
            Edit Run
          </Button>
          <Button variant="outline" onClick={onDeleteRun}>
            Delete Run
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <ProductionRunProgress
          producedCount={producedCount}
          targetQuantity={Number(run.settings?.targetQuantity || 0)}
        />

        <ProductionDateTracker run={run} onUpdate={onUpdateRun} />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Produced</div>
            <div className="mt-2 text-2xl font-semibold">{producedCount}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Target</div>
            <div className="mt-2 text-2xl font-semibold">
              {Number(run.settings?.targetQuantity || 0)}
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              QA Failures
            </div>
            <div className="mt-2 text-2xl font-semibold">{qaFailures}</div>
          </div>
        </div>

        {run.settings?.batchNotes && (
          <div className="rounded-xl border bg-muted/20 p-4 text-sm">
            <div className="font-medium">Batch Notes</div>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
              {run.settings.batchNotes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
