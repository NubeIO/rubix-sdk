import { useEffect, useMemo, useState } from 'react';
import { Box, Factory, PackagePlus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Product } from '../../types/product.types';
import {
  ProductionRunForm,
  ProductionRunProgress,
  ProductionRunStatusBadge,
  UnitForm,
  UnitTable,
} from '@features/production-run/components';
import { useProductionRun, useProductionRuns } from '@features/production-run/hooks';
import type { ManufacturingRun, ManufacturingUnit } from '@features/production-run/types';

interface ManufacturingSectionProps {
  product: Product;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  onStatsUpdate: (stats: any) => void;
}

function getProducedCount(run: ManufacturingRun | null, units: ManufacturingUnit[]) {
  const backendValue = Number(run?.settings?.producedCount ?? 0);
  return Math.max(units.length, backendValue);
}

function getQaFailures(run: ManufacturingRun | null, units: ManufacturingUnit[]) {
  const backendValue = Number(run?.settings?.qaFailures ?? 0);
  const computedValue = units.filter((unit) => unit.settings?.qaStatus === 'fail').length;
  return Math.max(backendValue, computedValue);
}

export function ManufacturingSection({
  product,
  orgId,
  deviceId,
  baseUrl,
  token,
  onStatsUpdate,
}: ManufacturingSectionProps) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [createRunOpen, setCreateRunOpen] = useState(false);
  const [editingRun, setEditingRun] = useState<ManufacturingRun | null>(null);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ManufacturingUnit | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const runsState = useProductionRuns({
    orgId,
    deviceId,
    productId: product.id,
    baseUrl,
    token,
  });

  const runState = useProductionRun({
    orgId,
    deviceId,
    runId: selectedRunId,
    baseUrl,
    token,
  });

  useEffect(() => {
    if (!selectedRunId && runsState.runs.length > 0) {
      setSelectedRunId(runsState.runs[0].id);
    }

    if (selectedRunId && !runsState.runs.some((run) => run.id === selectedRunId)) {
      setSelectedRunId(runsState.runs[0]?.id || null);
    }
  }, [runsState.runs, selectedRunId]);

  const selectedRun = runState.run;
  const units = runState.units;

  const aggregateStats = useMemo(() => {
    const totalRuns = runsState.runs.length;
    const totalUnits = runsState.runs.reduce((count, run) => {
      return count + Number(run.settings?.producedCount || 0);
    }, 0);
    const completedRuns = runsState.runs.filter((run) => run.settings?.status === 'completed').length;

    return { totalRuns, totalUnits, completedRuns };
  }, [runsState.runs]);

  useEffect(() => {
    onStatsUpdate({
      manufacturingRuns: aggregateStats.totalRuns,
      manufacturedUnits: aggregateStats.totalUnits,
      completedRuns: aggregateStats.completedRuns,
    });
  }, [aggregateStats.completedRuns, aggregateStats.totalRuns, aggregateStats.totalUnits, onStatsUpdate]);

  const handleCreateRun = async (input: { name: string; settings: any }) => {
    setActionError(null);
    await runsState.createRun(input);
    await runsState.refetch();
  };

  const handleUpdateRun = async (input: { name: string; settings: any }) => {
    if (!editingRun) {
      return;
    }

    setActionError(null);
    await runsState.updateRun({
      id: editingRun.id,
      name: input.name,
      settings: input.settings,
    });
    await runState.refetch();
    setEditingRun(null);
  };

  const handleDeleteRun = async (run: ManufacturingRun) => {
    if (!window.confirm(`Delete manufacturing run "${run.name}"?`)) {
      return;
    }

    try {
      setActionError(null);
      await runsState.deleteRun(run.id);
      if (selectedRunId === run.id) {
        setSelectedRunId(null);
      }
    } catch (deleteError) {
      console.error('[ManufacturingSection] Failed to delete run:', deleteError);
      setActionError(deleteError instanceof Error ? deleteError.message : 'Failed to delete run');
    }
  };

  const handleSaveUnit = async (input: { name: string; settings: any }) => {
    if (!selectedRun) {
      throw new Error('Select a run before adding units');
    }

    setActionError(null);

    if (editingUnit) {
      await runState.updateUnit({
        id: editingUnit.id,
        name: input.name,
        settings: input.settings,
      });
      setEditingUnit(null);
      return;
    }

    await runState.createUnit(input);
  };

  const handleDeleteUnit = async (unit: ManufacturingUnit) => {
    if (!window.confirm(`Delete unit "${unit.settings?.serialNumber || unit.name}"?`)) {
      return;
    }

    try {
      setActionError(null);
      await runState.deleteUnit(unit.id);
    } catch (deleteError) {
      console.error('[ManufacturingSection] Failed to delete unit:', deleteError);
      setActionError(deleteError instanceof Error ? deleteError.message : 'Failed to delete unit');
    }
  };

  const producedCount = getProducedCount(selectedRun, units);
  const qaFailures = getQaFailures(selectedRun, units);

  if (runsState.loading && runsState.runs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manufacturing</h2>
          <p className="text-sm text-muted-foreground">Loading manufacturing runs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manufacturing</h2>
          <p className="text-sm text-muted-foreground">
            Manage production runs and serialized unit output for {product.name}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => runsState.refetch()}>
            Refresh
          </Button>
          <Button onClick={() => setCreateRunOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Run
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {runsState.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {runsState.error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Runs</CardDescription>
            <CardTitle className="text-3xl">{aggregateStats.totalRuns}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {aggregateStats.completedRuns} completed across this product
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Recorded Output</CardDescription>
            <CardTitle className="text-3xl">{aggregateStats.totalUnits}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Units reported by run counters and imported children
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>QA Failures</CardDescription>
            <CardTitle className="text-3xl">{qaFailures}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Live count for the selected run
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Runs
            </CardTitle>
            <CardDescription>Select a run to inspect units and progress.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {runsState.runs.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                No manufacturing runs yet. Create the first batch to start tracking units.
              </div>
            ) : (
              runsState.runs.map((run) => {
                const isActive = run.id === selectedRunId;
                return (
                  <button
                    key={run.id}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isActive ? 'border-black bg-black text-white' : 'hover:bg-muted/40'
                    }`}
                    onClick={() => setSelectedRunId(run.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{run.name}</div>
                        <div className={`text-xs ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                          {run.settings?.runNumber || 'Run number pending'}
                        </div>
                      </div>
                      {!isActive && <ProductionRunStatusBadge status={run.settings?.status} />}
                    </div>
                    <div className={`mt-3 text-sm ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {run.settings?.hardwareVersion || 'No hardware version'} • {run.settings?.targetQuantity || 0} target
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {selectedRun ? (
            <>
              <Card>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{selectedRun.name}</CardTitle>
                      <ProductionRunStatusBadge status={selectedRun.settings?.status} />
                      <Badge variant="outline">{selectedRun.settings?.runNumber || 'Run number pending'}</Badge>
                    </div>
                    <CardDescription>
                      Facility {selectedRun.settings?.facilityLocation || 'not set'} • Hardware {selectedRun.settings?.hardwareVersion || 'n/a'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditingRun(selectedRun)}>
                      Edit Run
                    </Button>
                    <Button variant="outline" onClick={() => handleDeleteRun(selectedRun)}>
                      Delete Run
                    </Button>
                    <Button onClick={() => {
                      setEditingUnit(null);
                      setUnitDialogOpen(true);
                    }}>
                      <PackagePlus className="mr-2 h-4 w-4" />
                      Add Unit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <ProductionRunProgress
                    producedCount={producedCount}
                    targetQuantity={Number(selectedRun.settings?.targetQuantity || 0)}
                  />

                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border p-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Produced</div>
                      <div className="mt-2 text-2xl font-semibold">{producedCount}</div>
                    </div>
                    <div className="rounded-xl border p-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Target</div>
                      <div className="mt-2 text-2xl font-semibold">{Number(selectedRun.settings?.targetQuantity || 0)}</div>
                    </div>
                    <div className="rounded-xl border p-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">QA Failures</div>
                      <div className="mt-2 text-2xl font-semibold">{qaFailures}</div>
                    </div>
                    <div className="rounded-xl border p-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Production Date</div>
                      <div className="mt-2 text-sm font-medium">{selectedRun.settings?.productionDate || 'Not set'}</div>
                    </div>
                  </div>

                  {selectedRun.settings?.batchNotes && (
                    <div className="rounded-xl border bg-muted/20 p-4 text-sm">
                      <div className="font-medium">Batch Notes</div>
                      <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{selectedRun.settings.batchNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Box className="h-5 w-5" />
                      Produced Units
                    </CardTitle>
                    <CardDescription>
                      Serialized `core.asset` children under the selected run.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingUnit(null);
                      setUnitDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Unit
                  </Button>
                </CardHeader>
                <CardContent>
                  {runState.loading && units.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      Loading units...
                    </div>
                  ) : (
                    <UnitTable
                      units={units}
                      onEdit={(unit) => {
                        setEditingUnit(unit);
                        setUnitDialogOpen(true);
                      }}
                      onDelete={handleDeleteUnit}
                    />
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
                <Factory className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">No run selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Pick a manufacturing run from the left or create a new one to start tracking units.
                  </p>
                </div>
                <Button onClick={() => setCreateRunOpen(true)}>Create Manufacturing Run</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ProductionRunForm
        open={createRunOpen}
        onClose={() => setCreateRunOpen(false)}
        onSubmit={handleCreateRun}
      />

      <ProductionRunForm
        open={Boolean(editingRun)}
        run={editingRun}
        onClose={() => setEditingRun(null)}
        onSubmit={handleUpdateRun}
      />

      {selectedRun && (
        <UnitForm
          open={unitDialogOpen}
          run={selectedRun}
          unit={editingUnit}
          onClose={() => {
            setUnitDialogOpen(false);
            setEditingUnit(null);
          }}
          onSubmit={handleSaveUnit}
        />
      )}
    </div>
  );
}
