import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ManufacturingRun, ManufacturingUnit } from '@features/production-run/types/production-run.types';

type RunWithProduct = ManufacturingRun & { productName: string };

interface ManufacturingReportProps {
  runs: RunWithProduct[];
  units: ManufacturingUnit[];
}

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-slate-100 text-slate-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  qa: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function ManufacturingReport({ runs, units }: ManufacturingReportProps) {
  if (runs.length === 0) return null;

  // Group units by run
  const unitsByRun = new Map<string, ManufacturingUnit[]>();
  for (const unit of units) {
    const runId = unit.parentId || '';
    if (!unitsByRun.has(runId)) unitsByRun.set(runId, []);
    unitsByRun.get(runId)!.push(unit);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">Manufacturing Runs</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Run #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-right">Target</TableHead>
              <TableHead className="text-right">Produced</TableHead>
              <TableHead className="text-right">QA Failures</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => {
              const runUnits = unitsByRun.get(run.id) || [];
              const produced = runUnits.filter((u) =>
                u.settings?.status && u.settings.status !== 'rma'
              ).length;
              const qaFail = runUnits.filter((u) =>
                u.settings?.qaStatus === 'fail' || u.settings?.status === 'qa-fail'
              ).length;
              const target = Number(run.settings?.targetQuantity || 0);
              const pct = target > 0 ? Math.round((produced / target) * 100) : 0;

              return (
                <TableRow key={run.id}>
                  <TableCell className="text-muted-foreground">{run.productName}</TableCell>
                  <TableCell className="font-medium">
                    {run.settings?.runNumber || run.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={STATUS_COLORS[run.settings?.status || 'planned'] || ''}
                      variant="outline"
                    >
                      {run.settings?.status || 'planned'}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-32">
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{target}</TableCell>
                  <TableCell className="text-right">{produced}</TableCell>
                  <TableCell className="text-right">{qaFail}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
