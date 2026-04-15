import { GATES } from '@shared/constants/gates';
import type { ProductSummary } from '../types/program.types';

interface ProjectCardProps {
  summary: ProductSummary;
  onClick?: () => void;
}

function getHealthLabel(summary: ProductSummary): { label: string; color: string } {
  const activeProg = summary.gateProgress.find(g => g.status === 'active');
  if (!activeProg) {
    if (summary.gateProgress.every(g => g.status === 'done')) return { label: 'Complete', color: 'text-emerald-400' };
    return { label: 'Not Started', color: 'text-zinc-500' };
  }
  if (activeProg.averageProgress >= 70) return { label: 'On Track', color: 'text-emerald-400' };
  if (activeProg.averageProgress >= 40) return { label: 'In Progress', color: 'text-yellow-400' };
  return { label: 'At Risk', color: 'text-red-400' };
}

export function ProjectCard({ summary, onClick }: ProjectCardProps) {
  const gate = summary.currentGate ? GATES.find(g => g.id === summary.currentGate) : null;
  const health = getHealthLabel(summary);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-4 py-3 text-left transition hover:bg-zinc-800/80 hover:border-zinc-600 w-full cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-zinc-100 truncate">
          {summary.product.name || 'Unnamed Product'}
        </div>
        <div className="text-xs text-zinc-500 mt-0.5">
          {summary.tasks.length} task{summary.tasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="text-xs text-zinc-400 text-center min-w-[70px]">
        {gate ? `${gate.id.toUpperCase()} ${gate.name}` : 'No gate'}
      </div>

      <div className={`text-xs font-medium min-w-[70px] text-center ${health.color}`}>
        {health.label}
      </div>

      <div className="flex items-center gap-2 min-w-[80px]">
        <div className="flex-1 h-1.5 rounded-full bg-zinc-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${summary.overallProgress}%` }}
          />
        </div>
        <span className="text-xs text-zinc-400 w-8 text-right">{summary.overallProgress}%</span>
      </div>
    </button>
  );
}
