import { GATES, type GateId } from '@shared/constants/gates';
import type { GateProgress } from '../types/program.types';

interface GateProgressCardProps {
  progress: GateProgress;
  targetDate?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const statusStyles = {
  done: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', bar: 'bg-emerald-500', text: 'text-emerald-400' },
  active: { bg: 'bg-blue-500/15', border: 'border-blue-500/40', bar: 'bg-blue-500', text: 'text-blue-400' },
  upcoming: { bg: 'bg-zinc-500/10', border: 'border-zinc-700', bar: 'bg-zinc-600', text: 'text-zinc-500' },
};

export function GateProgressCard({ progress, targetDate, isSelected, onClick }: GateProgressCardProps) {
  const gate = GATES.find(g => g.id === progress.gateId);
  if (!gate) return null;

  const style = statusStyles[progress.status];
  const pct = progress.averageProgress;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-all min-w-[120px]
        ${style.bg} ${style.border}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-zinc-900' : ''}
        hover:brightness-110 cursor-pointer`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {gate.id.toUpperCase()}
        </span>
        {progress.status === 'active' && (
          <span className="text-[10px] text-blue-400">&#9664; Active</span>
        )}
      </div>
      <span className="text-xs font-medium text-zinc-200 leading-tight">{gate.name}</span>
      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full ${style.bar} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-medium ${style.text}`}>{pct}%</span>
        <span className="text-[10px] text-zinc-500">
          {progress.completedTasks}/{progress.totalTasks}
        </span>
      </div>
      {targetDate && (
        <span className="text-[10px] text-zinc-500">{targetDate}</span>
      )}
    </button>
  );
}
