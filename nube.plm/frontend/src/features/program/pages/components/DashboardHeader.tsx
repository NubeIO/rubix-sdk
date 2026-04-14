import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw } from 'lucide-react';
import { MiniStat } from './MiniStat';
import { FilterBar, type TaskFilters } from './FilterBar';

interface DashboardHeaderProps {
  stats: { total: number; done: number; inProgress: number; blocked: number; avgProgress: number; projects: number };
  filters: TaskFilters;
  allAssignees: string[];
  isLoading: boolean;
  viewMode: 'list' | 'timeline';
  canAddTask: boolean;
  onRefetch: () => void;
  onFiltersChange: (f: TaskFilters) => void;
  onViewModeChange: (m: 'list' | 'timeline') => void;
  onNewTask: () => void;
}

export function DashboardHeader({
  stats, filters, allAssignees, isLoading, viewMode,
  canAddTask, onRefetch, onFiltersChange, onViewModeChange, onNewTask,
}: DashboardHeaderProps) {
  return (
    <div className="shrink-0 border-b border-border">
      <div className="px-5 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Development Pipeline</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {stats.projects} project{stats.projects !== 1 ? 's' : ''} selected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onRefetch} title="Refresh data">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-2.5 py-1 text-[11px] font-medium transition ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              List
            </button>
            <button
              onClick={() => onViewModeChange('timeline')}
              className={`px-2.5 py-1 text-[11px] font-medium transition ${viewMode === 'timeline' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Timeline
            </button>
          </div>
          {canAddTask && (
            <Button size="sm" onClick={onNewTask}>+ New Task</Button>
          )}
        </div>
      </div>
      <div className="px-5 py-2 border-b border-border/50">
        <FilterBar filters={filters} onChange={onFiltersChange} allAssignees={allAssignees} />
      </div>
      {!isLoading && (
        <div className="px-5 pb-3 flex items-center gap-4">
          <MiniStat label="Tasks" value={`${stats.done}/${stats.total}`} sub="completed" />
          <MiniStat label="In Progress" value={String(stats.inProgress)} color="text-blue-400" />
          <MiniStat label="Blocked" value={String(stats.blocked)} color={stats.blocked > 0 ? 'text-red-400' : undefined} />
          <MiniStat label="Avg Progress" value={`${stats.avgProgress}%`} />
          <div className="flex-1" />
          <div className="flex items-center gap-1 w-[200px]">
            <Progress value={stats.avgProgress} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground w-8 text-right">{stats.avgProgress}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
