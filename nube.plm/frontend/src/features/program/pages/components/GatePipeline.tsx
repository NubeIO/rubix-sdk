import { Progress } from '@/components/ui/progress';
import { GATES, type GateId } from '@shared/constants/gates';
import { ChevronRight } from 'lucide-react';

interface GateProgress {
  gateId: string;
  totalTasks: number;
  completedTasks: number;
  averageProgress: number;
  status: 'done' | 'active' | 'upcoming';
}

interface GatePipelineProps {
  gateProgress: GateProgress[];
  activeGate: GateId | 'all';
  onSelectGate: (gate: GateId | 'all') => void;
}

const STATUS_COLORS = {
  done:     { border: 'border-emerald-500/40', bg: 'bg-emerald-500/8',  dot: 'bg-emerald-500', text: 'text-emerald-400', progress: 'text-emerald-500' },
  active:   { border: 'border-blue-500/40',    bg: 'bg-blue-500/8',     dot: 'bg-blue-500',    text: 'text-blue-400',    progress: 'text-blue-500' },
  upcoming: { border: 'border-border/60',       bg: 'bg-transparent',    dot: 'bg-zinc-600',    text: 'text-muted-foreground', progress: 'text-muted-foreground' },
};

export function GatePipeline({ gateProgress, activeGate, onSelectGate }: GatePipelineProps) {
  return (
    <div className="shrink-0 border-b border-border/50">
      {/* All tasks quick-filter */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-1.5">
        <button
          onClick={() => onSelectGate('all')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer
            ${activeGate === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
        >
          All gates
        </button>
        <span className="text-[11px] text-muted-foreground/50 ml-1">Click a gate to filter</span>
      </div>

      {/* Pipeline cards */}
      <div className="px-4 pb-3 flex items-stretch gap-1 overflow-x-auto">
        {GATES.map((gate, i) => {
          const gp = gateProgress.find(g => g.gateId === gate.id);
          const totalTasks = gp?.totalTasks || 0;
          const completedTasks = gp?.completedTasks || 0;
          const avgProgress = gp?.averageProgress || 0;
          const status = gp?.status || 'upcoming';
          const colors = STATUS_COLORS[status];
          const isActive = activeGate === gate.id;

          return (
            <div key={gate.id} className="flex items-stretch">
              {/* Connector arrow between cards */}
              {i > 0 && (
                <div className="flex items-center px-0.5 text-border">
                  <ChevronRight className="h-3 w-3" />
                </div>
              )}
              <button
                onClick={() => onSelectGate(isActive ? 'all' : gate.id as GateId)}
                className={`flex flex-col gap-1 px-3 py-2 rounded-lg border transition cursor-pointer min-w-[120px]
                  ${isActive
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                    : `${colors.border} ${colors.bg} hover:border-muted-foreground/40`}`}
              >
                {/* Gate label + status dot */}
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                  <span className={`text-[11px] font-semibold uppercase tracking-wide ${isActive ? 'text-foreground' : colors.text}`}>
                    {gate.id.toUpperCase()}
                  </span>
                </div>

                {/* Gate name */}
                <span className={`text-[11px] leading-tight ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {gate.name}
                </span>

                {/* Stats row */}
                {totalTasks > 0 ? (
                  <div className="flex flex-col gap-1 mt-0.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] ${colors.text}`}>
                        {completedTasks}/{totalTasks} done
                      </span>
                      <span className={`text-[10px] font-medium ${colors.progress}`}>
                        {avgProgress}%
                      </span>
                    </div>
                    <Progress value={avgProgress} className="h-1" />
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground/40 mt-0.5">No tasks</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
