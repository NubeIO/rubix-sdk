import { useState, useMemo, useCallback } from 'react';
import { Gantt, ViewMode, type Task as GanttTask } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { Button } from '@/components/ui/button';
import { getTaskGate } from '@shared/utils/gate-helpers';

// ── Darken a hex color for the progress fill ──

function darken(hex: string, amount = 0.25): string {
  const c = hex.replace('#', '');
  const r = Math.max(0, Math.round(parseInt(c.substring(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(c.substring(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(c.substring(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lighten(hex: string, amount = 0.35): string {
  const c = hex.replace('#', '');
  const r = Math.min(255, Math.round(parseInt(c.substring(0, 2), 16) + (255 - parseInt(c.substring(0, 2), 16)) * amount));
  const g = Math.min(255, Math.round(parseInt(c.substring(2, 4), 16) + (255 - parseInt(c.substring(2, 4), 16)) * amount));
  const b = Math.min(255, Math.round(parseInt(c.substring(4, 6), 16) + (255 - parseInt(c.substring(4, 6), 16)) * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ── Status labels ──

const STATUS_LABELS: Record<string, string> = {
  completed: 'Done',
  'in-progress': 'In Progress',
  blocked: 'Blocked',
  review: 'Review',
  pending: 'Pending',
  cancelled: 'Cancelled',
};

// ── Range presets ──

type RangeKey = '1m' | '3m' | '6m' | '1y' | '2y';

const RANGE_LABELS: { key: RangeKey; label: string; months: number }[] = [
  { key: '1m', label: '1 Month', months: 1 },
  { key: '3m', label: '3 Months', months: 3 },
  { key: '6m', label: '6 Months', months: 6 },
  { key: '1y', label: '1 Year', months: 12 },
  { key: '2y', label: '2 Years', months: 24 },
];

function rangeToViewMode(key: RangeKey): ViewMode {
  switch (key) {
    case '1m': return ViewMode.Week;
    case '3m': return ViewMode.Week;
    case '6m': return ViewMode.Month;
    case '1y': return ViewMode.Month;
    case '2y': return ViewMode.Year;
  }
}

function rangeToColumnWidth(key: RangeKey): number {
  switch (key) {
    case '1m': return 80;
    case '3m': return 50;
    case '6m': return 100;
    case '1y': return 60;
    case '2y': return 80;
  }
}

function shiftMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Custom tooltip ──

function CustomTooltip({ task, fontFamily }: { task: GanttTask; fontSize: string; fontFamily: string }) {
  const duration = Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24));
  return (
    <div style={{ fontFamily, fontSize: '12px', padding: '10px 14px', background: '#1a1a2e', color: '#e4e4e7', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', maxWidth: '260px' }}>
      <div style={{ fontWeight: 600, marginBottom: '6px', color: '#fff' }}>{task.name}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px' }}>
        <span>{formatDate(task.start)} — {formatDate(task.end)}</span>
        <span>{duration} day{duration !== 1 ? 's' : ''} · {task.progress}% complete</span>
      </div>
      {task.progress > 0 && (
        <div style={{ marginTop: '8px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
          <div style={{ width: `${task.progress}%`, height: '100%', borderRadius: '2px', background: task.styles?.progressColor || '#3b82f6' }} />
        </div>
      )}
    </div>
  );
}

// ── Props ──

interface TimelineViewProps {
  tasks: any[];
  tickets: Record<string, any[]>;
  projectColorMap: Record<string, string>;
  onEditTask: (task: any) => void;
}

export function TimelineView({ tasks, tickets, projectColorMap, onEditTask }: TimelineViewProps) {
  const [range, setRange] = useState<RangeKey>('3m');
  const [viewDate, setViewDate] = useState(() => startOfMonth(new Date()));

  const rangeInfo = RANGE_LABELS.find(r => r.key === range)!;

  const goBack = useCallback(() => {
    setViewDate(prev => shiftMonths(prev, -rangeInfo.months));
  }, [rangeInfo.months]);

  const goForward = useCallback(() => {
    setViewDate(prev => shiftMonths(prev, rangeInfo.months));
  }, [rangeInfo.months]);

  const goToday = useCallback(() => {
    setViewDate(startOfMonth(new Date()));
  }, []);

  const taskLookup = useMemo(() => {
    const map = new Map<string, any>();
    tasks.forEach(t => map.set(t.id, t));
    return map;
  }, [tasks]);

  // Convert tasks + tickets into gantt-task-react format using project colors
  const ganttTasks = useMemo((): GanttTask[] => {
    const result: GanttTask[] = [];
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const defaultEnd = new Date(defaultStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const task of tasks) {
      const gate = getTaskGate(task.settings?.tags);
      const hasStart = !!task.settings?.startDate;
      const hasEnd = !!task.settings?.dueDate;

      const start = hasStart ? new Date(`${task.settings.startDate}T00:00:00`) : defaultStart;
      const end = hasEnd ? new Date(`${task.settings.dueDate}T23:59:59`) : (hasStart ? new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000) : defaultEnd);

      // Use project color for bar
      const projectColor = projectColorMap[task.parentId] || '#3b82f6';

      const taskTickets = tickets[task.id] || [];
      const isProject = taskTickets.length > 0;

      const status = task.settings?.status || 'pending';
      const statusLabel = STATUS_LABELS[status] || status;

      result.push({
        id: task.id,
        name: `${task.name}${gate ? ` [${gate.toUpperCase()}]` : ''} · ${statusLabel}`,
        type: isProject ? 'project' : 'task',
        start,
        end: end > start ? end : new Date(start.getTime() + 24 * 60 * 60 * 1000),
        progress: task.settings?.progress || 0,
        isDisabled: !hasStart && !hasEnd,
        hideChildren: false,
        styles: {
          backgroundColor: projectColor,
          backgroundSelectedColor: darken(projectColor, 0.1),
          progressColor: darken(projectColor),
          progressSelectedColor: darken(projectColor, 0.3),
        },
      });

      // Tickets as child bars — lighter shade of project color
      const ticketColor = lighten(projectColor, 0.3);
      for (const ticket of taskTickets) {
        const ts = ticket.settings?.status || 'pending';
        const ticketProgress = ts === 'completed' ? 100 : ts === 'in-progress' ? 50 : 0;
        const ticketStatusLabel = STATUS_LABELS[ts] || ts;

        result.push({
          id: ticket.id,
          name: `${ticket.name} · ${ticketStatusLabel}`,
          type: 'task',
          start,
          end: end > start ? end : new Date(start.getTime() + 24 * 60 * 60 * 1000),
          progress: ticketProgress,
          project: task.id,
          isDisabled: true,
          styles: {
            backgroundColor: ticketColor,
            backgroundSelectedColor: ticketColor,
            progressColor: projectColor,
            progressSelectedColor: projectColor,
          },
        });
      }
    }

    return result;
  }, [tasks, tickets, projectColorMap]);

  const handleClick = useCallback((ganttTask: GanttTask) => {
    const task = taskLookup.get(ganttTask.id);
    if (task) onEditTask(task);
  }, [taskLookup, onEditTask]);

  const handleExpanderClick = useCallback((_task: GanttTask) => {
    // Handled internally by the library
  }, []);

  if (ganttTasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        No tasks to display. Add tasks with start/due dates to see the timeline.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden gantt-wrapper">
      {/* Controls */}
      <div className="shrink-0 px-4 py-2 flex items-center gap-1.5 border-b border-border/50">
        <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px]" onClick={goBack}>
          {'\u2190'}
        </Button>
        <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px]" onClick={goToday}>
          Today
        </Button>
        <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px]" onClick={goForward}>
          {'\u2192'}
        </Button>
        <div className="w-px h-5 bg-border mx-2" />
        {RANGE_LABELS.map(r => (
          <Button
            key={r.key}
            variant={range === r.key ? 'default' : 'ghost'}
            size="sm"
            className={`h-7 px-2.5 text-[11px] ${range === r.key ? '' : 'text-muted-foreground'}`}
            onClick={() => setRange(r.key)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {/* Gantt chart */}
      <div className="flex-1 overflow-auto">
        <Gantt
          tasks={ganttTasks}
          viewMode={rangeToViewMode(range)}
          viewDate={viewDate}
          onClick={handleClick}
          onExpanderClick={handleExpanderClick}
          columnWidth={rangeToColumnWidth(range)}
          listCellWidth=""
          rowHeight={40}
          headerHeight={52}
          barCornerRadius={6}
          barFill={65}
          todayColor="rgba(59, 130, 246, 0.06)"
          arrowColor="#a1a1aa"
          fontSize="11px"
          TooltipContent={CustomTooltip}
        />
      </div>

      {/* Style overrides for the library */}
      <style>{`
        .gantt-wrapper svg {
          background: transparent !important;
        }
        .gantt-wrapper ._3_ygE,
        .gantt-wrapper ._3ZbQT {
          border-color: hsl(var(--border)) !important;
        }
        .gantt-wrapper ._34SS0:nth-of-type(even) {
          background-color: hsl(var(--muted) / 0.3) !important;
        }
        .gantt-wrapper ._34SS0:nth-of-type(odd) {
          background-color: transparent !important;
        }
        .gantt-wrapper ._2eZzQ {
          border-color: hsl(var(--border) / 0.3) !important;
        }
      `}</style>
    </div>
  );
}
