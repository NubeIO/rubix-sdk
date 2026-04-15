import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, List, BarChart3, Plus, CheckCircle2, Loader2, AlertTriangle, TrendingUp, Milestone } from 'lucide-react';
import { MiniStat } from './MiniStat';
import { FilterBar, type TaskFilters } from './FilterBar';
import { PRODUCT_CATEGORIES } from '../constants';

interface DashboardHeaderProps {
  stats: { total: number; done: number; inProgress: number; blocked: number; avgProgress: number; projects: number };
  filters: TaskFilters;
  allAssignees: string[];
  isLoading: boolean;
  viewMode: 'list' | 'timeline';
  canAddTask: boolean;
  hasProjects: boolean;
  showGates: boolean;
  onToggleGates: () => void;
  onRefetch: () => void;
  onFiltersChange: (f: TaskFilters) => void;
  onViewModeChange: (m: 'list' | 'timeline') => void;
  onNewTask: () => void;
  onNewProjectAndTask: (projectName: string, projectCategory: string) => void;
}

export function DashboardHeader({
  stats, filters, allAssignees, isLoading, viewMode,
  canAddTask, hasProjects, showGates, onToggleGates, onRefetch, onFiltersChange, onViewModeChange, onNewTask,
  onNewProjectAndTask,
}: DashboardHeaderProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardName, setWizardName] = useState('');
  const [wizardCategory, setWizardCategory] = useState('software');

  const handleNewTask = () => {
    if (!hasProjects) {
      setShowWizard(true);
    } else {
      onNewTask();
    }
  };

  const handleWizardSubmit = () => {
    const name = wizardName.trim();
    if (!name) return;
    onNewProjectAndTask(name, wizardCategory);
    setShowWizard(false);
    setWizardName('');
    setWizardCategory('software');
  };

  return (
    <>
      <div className="shrink-0 border-b border-border">
        {/* Top row: title + actions */}
        <div className="px-5 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">Development Pipeline</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stats.projects} project{stats.projects !== 1 ? 's' : ''} selected
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Filter button */}
            <FilterBar filters={filters} onChange={onFiltersChange} allAssignees={allAssignees} />

            {/* Gates toggle */}
            <Button
              variant={showGates ? 'secondary' : 'outline'}
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={onToggleGates}
              title={showGates ? 'Hide gates' : 'Show gates'}
            >
              <Milestone className="h-3 w-3" />
              Gates
            </Button>

            <div className="w-px h-5 bg-border mx-0.5" />

            {/* Refresh */}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onRefetch} title="Refresh">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>

            {/* View toggle — icon buttons */}
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 transition ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onViewModeChange('timeline')}
                className={`p-1.5 transition ${viewMode === 'timeline' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Timeline view"
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* New task — icon button */}
            <Button
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleNewTask}
              title={hasProjects ? 'New task' : 'Create project & task'}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats cards row */}
        {!isLoading && (
          <div className="px-5 pb-3 flex items-center gap-2 overflow-x-auto">
            <MiniStat
              label="Tasks"
              value={`${stats.done}/${stats.total}`}
              sub="completed"
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <MiniStat
              label="In Progress"
              value={String(stats.inProgress)}
              color="text-blue-400"
              icon={<Loader2 className="h-4 w-4" />}
            />
            <MiniStat
              label="Blocked"
              value={String(stats.blocked)}
              color={stats.blocked > 0 ? 'text-red-400' : undefined}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            <MiniStat
              label="Avg Progress"
              value={`${stats.avgProgress}%`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>
        )}
      </div>

      {/* Wizard dialog — shown when user clicks + with no projects */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create your first project</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Before adding tasks you need at least one project. Let's set one up.
            </p>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Project name</label>
              <Input
                placeholder="e.g. Smart Thermostat v2"
                value={wizardName}
                onChange={(e: any) => setWizardName(e.target.value)}
                onKeyDown={(e: any) => { if (e.key === 'Enter') handleWizardSubmit(); }}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
              <Select value={wizardCategory} onValueChange={setWizardCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setShowWizard(false)}>Cancel</Button>
            <Button size="sm" onClick={handleWizardSubmit} disabled={!wizardName.trim()}>
              Create project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
