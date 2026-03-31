import { useEffect, useMemo, useState } from 'react';
import { Factory, Plus, Search, BarChart3, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Project } from '../../types/project.types';
import {
  ProductionRunForm,
  ProductionRunStatusBadge,
  UnitForm,
  OverviewTab,
  UnitsTab,
} from '@features/production-run/components';
import { useProductionRun, useProductionRuns } from '@features/production-run/hooks';
import type { ManufacturingRun, ManufacturingUnit } from '@features/production-run/types';

interface ManufacturingSectionProps {
  project: Project;
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
  project,
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
  const [activeTab, setActiveTab] = useState('overview');

  // Search State for runs
  const [runSearchQuery, setRunSearchQuery] = useState('');

  const runsState = useProductionRuns({
    orgId,
    deviceId,
    projectId: project.id,
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

  // Filter runs based on search
  const filteredRuns = useMemo(() => {
    if (!runSearchQuery) return runsState.runs;

    const query = runSearchQuery.toLowerCase();
    return runsState.runs.filter((run) =>
      run.name.toLowerCase().includes(query) ||
      run.settings?.runNumber?.toLowerCase().includes(query)
    );
  }, [runsState.runs, runSearchQuery]);

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
            Manage production runs and serialized unit output for {project.name}.
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
            {aggregateStats.completedRuns} completed across this project
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

      {/* Run Selector - Compact searchable dropdown */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Select Production Run
              </CardTitle>
              <CardDescription>Choose a run to view and manage its units</CardDescription>
            </div>

            {runsState.runs.length > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row lg:w-[500px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search runs..."
                    value={runSearchQuery}
                    onChange={(e) => setRunSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedRunId || ''} onValueChange={setSelectedRunId}>
                  <SelectTrigger className="w-full sm:w-[240px]">
                    <SelectValue placeholder="Select a run..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredRuns.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No runs found
                      </div>
                    ) : (
                      filteredRuns.map((run) => (
                        <SelectItem key={run.id} value={run.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{run.settings?.runNumber || 'Pending'}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-sm">{run.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>

        {selectedRun && (
          <CardContent>
            <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{selectedRun.name}</span>
                  <Badge variant="outline">{selectedRun.settings?.runNumber || 'Pending'}</Badge>
                  <ProductionRunStatusBadge status={selectedRun.settings?.status} />
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedRun.settings?.hardwareVersion || 'No hardware version'} • Target: {selectedRun.settings?.targetQuantity || 0} units
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingRun(selectedRun)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDeleteRun(selectedRun)}>
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        {runsState.runs.length === 0 && (
          <CardContent>
            <div className="rounded-xl border border-dashed p-10 text-center">
              <Factory className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No manufacturing runs yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create the first batch to start tracking units.
              </p>
              <Button className="mt-4" onClick={() => setCreateRunOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Run
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {selectedRun ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 h-auto p-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-background px-4 py-2 data-[state=active]:shadow-sm"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="units"
              className="data-[state=active]:bg-background px-4 py-2 data-[state=active]:shadow-sm"
            >
              <Package className="mr-2 h-4 w-4" />
              Units {units.length > 0 && `(${units.length})`}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'overview' && (
            <TabsContent value="overview">
              <OverviewTab
                run={selectedRun}
                units={units}
                producedCount={producedCount}
                qaFailures={qaFailures}
                onEditRun={() => setEditingRun(selectedRun)}
                onDeleteRun={() => handleDeleteRun(selectedRun)}
                onUpdateRun={async (settings) => {
                  await runsState.updateRun({
                    id: selectedRun.id,
                    settings,
                  });
                  await runState.refetch();
                }}
              />
            </TabsContent>
          )}

          {activeTab === 'units' && (
            <TabsContent value="units">
              <UnitsTab
                units={units}
                loading={runState.loading}
                onAddUnit={() => {
                  setEditingUnit(null);
                  setUnitDialogOpen(true);
                }}
                onEditUnit={(unit) => {
                  setEditingUnit(unit);
                  setUnitDialogOpen(true);
                }}
                onDeleteUnit={handleDeleteUnit}
              />
            </TabsContent>
          )}
        </Tabs>
      ) : (
        runsState.runs.length > 0 && (
          <Card>
            <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
              <Factory className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">No run selected</h3>
                <p className="text-sm text-muted-foreground">
                  Select a manufacturing run from above to view and manage its units.
                </p>
              </div>
            </CardContent>
          </Card>
        )
      )}

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
