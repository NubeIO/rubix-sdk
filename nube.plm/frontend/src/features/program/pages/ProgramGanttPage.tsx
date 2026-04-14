/**
 * Program Gantt - Per-product category-based Gantt with gate markers
 *
 * Attached to plm.product node type. Shows:
 * - Categories on the left, tasks grouped within each category
 * - Timeline grid with week columns and gate markers
 * - Task bars coloured by status, expandable to show tickets
 */

import { createRoot, type Root } from 'react-dom/client';
import { useState, useMemo } from 'react';
import '@rubix-sdk/frontend/globals.css';
// @ts-ignore
import { Skeleton } from '@rubix-sdk/frontend/common/ui';

import { GATES, type GateId } from '@shared/constants/gates';
import { useProgramGantt } from '../hooks/use-program-gantt';
import { computeDateRange, computeBarSpan, generateMonthLabels, generateWeekLabels } from '../utils/gantt-helpers';
import type { GanttTask, CategoryGroup } from '../types/program.types';

interface ProgramGanttProps {
  orgId: string;
  deviceId: string;
  baseUrl: string;
  token?: string;
  nodeId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-500',
  'in-progress': 'bg-blue-500',
  blocked: 'bg-red-500',
  review: 'bg-amber-500',
  pending: 'bg-zinc-600',
  cancelled: 'bg-zinc-700',
};

function ProgramGantt({ orgId, deviceId, baseUrl, token, nodeId }: ProgramGanttProps) {
  const productId = nodeId || '';
  const { categoryGroups, isLoading, error } = useProgramGantt(
    { orgId, deviceId, baseUrl, token },
    productId
  );

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Compute date range from all tasks
  const allTasks = useMemo(() => categoryGroups.flatMap(g => g.tasks), [categoryGroups]);
  const { rangeStart, totalWeeks } = useMemo(() => computeDateRange(allTasks), [allTasks]);
  const weekLabels = useMemo(() => generateWeekLabels(totalWeeks), [totalWeeks]);
  const monthLabels = useMemo(() => generateMonthLabels(rangeStart, totalWeeks), [rangeStart, totalWeeks]);

  // Start with all categories expanded
  useMemo(() => {
    if (categoryGroups.length > 0 && expandedCategories.size === 0) {
      setExpandedCategories(new Set(categoryGroups.map(g => g.category.id)));
    }
  }, [categoryGroups]);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTask = (id: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (error) {
    return (
      <div className="p-8 text-red-400">
        <p className="font-medium">Failed to load Gantt data</p>
        <p className="text-sm mt-1 text-zinc-500">{error}</p>
      </div>
    );
  }

  if (!productId) {
    return (
      <div className="p-8 text-zinc-500 text-sm">
        No product selected. Navigate to a product node to see its Gantt chart.
      </div>
    );
  }

  const LEFT_COL_W = 'min-w-[320px] w-[320px]';
  const OWNER_COL_W = 'min-w-[80px] w-[80px]';

  return (
    <div className="h-full overflow-auto bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800 px-4 py-3">
        <h1 className="text-base font-semibold">Delivery Gantt</h1>
        <div className="flex gap-3 mt-2">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
              <span className="text-[10px] text-zinc-500 capitalize">{status.replace('-', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : categoryGroups.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-sm">
          No tasks found for this product. Create tasks with categories and gate tags to see the Gantt chart.
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Timeline Header */}
          <div className="flex border-b border-zinc-800 sticky top-[72px] z-10 bg-zinc-950">
            <div className={`${LEFT_COL_W} shrink-0 px-3 py-1 text-[10px] text-zinc-500 border-r border-zinc-800`}>
              Category / Task
            </div>
            <div className={`${OWNER_COL_W} shrink-0 px-2 py-1 text-[10px] text-zinc-500 border-r border-zinc-800`}>
              Owner
            </div>
            <div className="flex-1 flex flex-col">
              {/* Month row */}
              <div className="flex border-b border-zinc-800/50">
                {monthLabels.map((m, i) => (
                  <div
                    key={i}
                    className="text-[10px] text-zinc-500 text-center py-0.5 border-r border-zinc-800/30"
                    style={{ width: `${m.span * 48}px`, minWidth: `${m.span * 48}px` }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
              {/* Week row */}
              <div className="flex">
                {weekLabels.map((w, i) => (
                  <div
                    key={i}
                    className="text-[9px] text-zinc-600 text-center py-0.5 border-r border-zinc-800/20"
                    style={{ width: '48px', minWidth: '48px' }}
                  >
                    {w}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Groups */}
          {categoryGroups.map(group => (
            <div key={group.category.id}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(group.category.id)}
                className="flex w-full items-center border-b border-zinc-800/50 bg-zinc-900/60 hover:bg-zinc-900 transition cursor-pointer"
              >
                <div className={`${LEFT_COL_W} shrink-0 px-3 py-2 flex items-center gap-2`}>
                  <span className="text-[10px] text-zinc-500">
                    {expandedCategories.has(group.category.id) ? '&#9660;' : '&#9654;'}
                  </span>
                  <span className="text-xs font-medium text-zinc-300">{group.category.name}</span>
                  <span className="text-[10px] text-zinc-600">({group.tasks.length})</span>
                </div>
                <div className={`${OWNER_COL_W} shrink-0`} />
                <div className="flex-1" />
              </button>

              {/* Tasks */}
              {expandedCategories.has(group.category.id) &&
                group.tasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    rangeStart={rangeStart}
                    totalWeeks={totalWeeks}
                    isExpanded={expandedTasks.has(task.id)}
                    onToggle={() => toggleTask(task.id)}
                    leftColW={LEFT_COL_W}
                    ownerColW={OWNER_COL_W}
                  />
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface TaskRowProps {
  task: GanttTask;
  rangeStart: Date;
  totalWeeks: number;
  isExpanded: boolean;
  onToggle: () => void;
  leftColW: string;
  ownerColW: string;
}

function TaskRow({ task, rangeStart, totalWeeks, isExpanded, onToggle, leftColW, ownerColW }: TaskRowProps) {
  const barSpan = computeBarSpan(task.startDate, task.dueDate, rangeStart, totalWeeks);
  const statusColor = STATUS_COLORS[task.status || 'pending'] || STATUS_COLORS.pending;

  return (
    <>
      <div className="flex items-center border-b border-zinc-800/30 hover:bg-zinc-900/40 transition group">
        <div className={`${leftColW} shrink-0 px-3 py-1.5 flex items-center gap-2`}>
          {task.tickets.length > 0 ? (
            <button onClick={onToggle} className="text-[10px] text-zinc-500 w-3 cursor-pointer">
              {isExpanded ? '&#9660;' : '&#9654;'}
            </button>
          ) : (
            <span className="w-3" />
          )}
          <span className="text-xs text-zinc-200 truncate">{task.name}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded capitalize ${statusColor} text-white`}>
            {(task.status || 'pending').replace('-', ' ')}
          </span>
        </div>
        <div className={`${ownerColW} shrink-0 px-2`}>
          <span className="text-[11px] text-zinc-400 truncate">{task.assignee || '-'}</span>
        </div>
        <div className="flex-1 relative h-6">
          {/* Grid lines */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: totalWeeks }).map((_, i) => (
              <div key={i} className="border-r border-zinc-800/15" style={{ width: '48px', minWidth: '48px' }} />
            ))}
          </div>
          {/* Task bar */}
          {barSpan && (
            <div
              className={`absolute top-1 h-4 rounded ${statusColor} opacity-80`}
              style={{
                left: `${barSpan[0] * 48 + 2}px`,
                width: `${Math.max((barSpan[1] - barSpan[0] + 1) * 48 - 4, 8)}px`,
              }}
            >
              {task.progress != null && task.progress > 0 && (
                <div
                  className="h-full rounded bg-white/20"
                  style={{ width: `${task.progress}%` }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded tickets */}
      {isExpanded &&
        task.tickets.map(ticket => (
          <div key={ticket.id} className="flex items-center border-b border-zinc-800/20 bg-zinc-950/60">
            <div className={`${leftColW} shrink-0 px-3 py-1 pl-10`}>
              <span className="text-[11px] text-zinc-500">
                {'\u251C'} {ticket.name}
              </span>
            </div>
            <div className={`${ownerColW} shrink-0`} />
            <div className="flex-1" />
          </div>
        ))}
    </>
  );
}

// Module Federation mount/unmount API
export default {
  mount: (container: HTMLElement, props?: ProgramGanttProps) => {
    const root = createRoot(container);
    root.render(
      <ProgramGantt
        orgId={props?.orgId || ''}
        deviceId={props?.deviceId || ''}
        baseUrl={props?.baseUrl || ''}
        token={props?.token}
        nodeId={(props as any)?.nodeId}
      />
    );
    return root;
  },
  unmount: (root: Root) => {
    root.unmount();
  },
};
