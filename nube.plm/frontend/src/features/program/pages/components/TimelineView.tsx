import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Gantt, ViewMode, type Task as GanttTask } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarDays } from 'lucide-react';
import { getTaskGate } from '@shared/utils/gate-helpers';

// ── Color helpers ──

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

// ── Date helpers ──

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
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

// ── Constants ──

const COL_WIDTH = 65;
const PAD_WEEKS = 52; // ~1 year padding for free scrolling
const HEADER_HEIGHT = 52;

// ── Today overlay — computes position of "today" and renders a line + past shade ──

function TodayOverlay({
  chartStartDate,
  scrollLeft,
  containerWidth,
  containerHeight,
}: {
  chartStartDate: Date;
  scrollLeft: number;
  containerWidth: number;
  containerHeight: number;
}) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Milliseconds from chart start to today
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysFromStart = (now.getTime() - chartStartDate.getTime()) / msPerDay;
  // Each column = 7 days
  const todayX = (daysFromStart / 7) * COL_WIDTH;

  // Position relative to the visible viewport (account for scroll)
  const visibleX = todayX - scrollLeft;

  // Don't render if today line is way off screen
  if (visibleX < -50 || visibleX > containerWidth + 50) return null;

  return (
    <>
      {/* Past shade — everything left of today */}
      {visibleX > 0 && (
        <div
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            width: Math.min(visibleX, containerWidth),
            height: containerHeight,
            background: 'rgba(0, 0, 0, 0.04)',
          }}
        />
      )}
      {/* Today vertical line */}
      <div
        className="absolute top-0 pointer-events-none"
        style={{
          left: visibleX,
          width: 2,
          height: containerHeight,
          background: 'rgba(59, 130, 246, 0.5)',
        }}
      />
      {/* Today label */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: visibleX - 18,
          top: 4,
          fontSize: '9px',
          fontWeight: 600,
          color: 'rgba(59, 130, 246, 0.8)',
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '1px 4px',
          borderRadius: '3px',
          letterSpacing: '0.03em',
        }}
      >
        TODAY
      </div>
    </>
  );
}

// ── Quick-jump quarter helpers ──

function getQuarterStart(year: number, quarter: number): Date {
  return new Date(year, (quarter - 1) * 3, 1);
}

// ── Props ──

interface TimelineViewProps {
  tasks: any[];
  tickets: Record<string, any[]>;
  projectColorMap: Record<string, string>;
  onEditTask: (task: any) => void;
}

export function TimelineView({ tasks, tickets, projectColorMap, onEditTask }: TimelineViewProps) {
  const [viewDate, setViewDate] = useState(() => startOfWeek(new Date()));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 400 });

  // Track scroll position for the today overlay
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => setScrollLeft(el.scrollLeft);
    el.addEventListener('scroll', onScroll, { passive: true });

    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    obs.observe(el);

    return () => {
      el.removeEventListener('scroll', onScroll);
      obs.disconnect();
    };
  }, []);

  // Compute the chart's absolute start date (earliest task minus padding)
  const chartStartDate = useMemo(() => {
    if (tasks.length === 0) return startOfWeek(new Date());

    let earliest = new Date();
    for (const task of tasks) {
      if (task.settings?.startDate) {
        const d = new Date(`${task.settings.startDate}T00:00:00`);
        if (d < earliest) earliest = d;
      }
      if (task.settings?.dueDate) {
        const d = new Date(`${task.settings.dueDate}T00:00:00`);
        if (d < earliest) earliest = d;
      }
    }
    // The library pads by preStepsCount weeks before the earliest date
    return addWeeks(startOfWeek(earliest), -PAD_WEEKS);
  }, [tasks]);

  // Range label
  const rangeLabel = useMemo(() => {
    const end = addWeeks(viewDate, 12);
    const from = formatMonthYear(viewDate);
    const to = formatMonthYear(end);
    return from === to ? from : `${from} — ${to}`;
  }, [viewDate]);

  const isAtToday = useMemo(() => {
    const today = startOfWeek(new Date());
    return Math.abs(viewDate.getTime() - today.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }, [viewDate]);

  // Current year for quarter buttons
  const currentYear = new Date().getFullYear();

  // Navigation
  const goBack = useCallback(() => setViewDate(prev => addWeeks(prev, -4)), []);
  const goBackFar = useCallback(() => setViewDate(prev => addMonths(prev, -3)), []);
  const goForward = useCallback(() => setViewDate(prev => addWeeks(prev, 4)), []);
  const goForwardFar = useCallback(() => setViewDate(prev => addMonths(prev, 3)), []);
  const goToday = useCallback(() => setViewDate(startOfWeek(new Date())), []);
  const goToQuarter = useCallback((q: number) => setViewDate(startOfWeek(getQuarterStart(currentYear, q))), [currentYear]);

  const taskLookup = useMemo(() => {
    const map = new Map<string, any>();
    tasks.forEach(t => map.set(t.id, t));
    return map;
  }, [tasks]);

  // Convert tasks + tickets into gantt-task-react format
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

  const handleExpanderClick = useCallback((_task: GanttTask) => {}, []);

  // Figure out which quarter we're viewing for the button highlight
  const activeQuarter = useMemo(() => {
    for (let q = 1; q <= 4; q++) {
      const qs = getQuarterStart(currentYear, q);
      if (Math.abs(viewDate.getTime() - startOfWeek(qs).getTime()) < 7 * 24 * 60 * 60 * 1000) return q;
    }
    return null;
  }, [viewDate, currentYear]);

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
      <div className="shrink-0 px-4 py-2 flex items-center gap-2 border-b border-border/50">
        {/* Navigation: <<  <  Today  >  >> */}
        <div className="flex items-center border border-border rounded-md overflow-hidden">
          <button
            onClick={goBackFar}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
            title="Back 3 months"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={goBack}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition border-l border-border"
            title="Back 4 weeks"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={goToday}
            className={`px-2 py-1.5 transition border-x border-border
              ${isAtToday
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            title="Jump to today"
          >
            <CalendarDays className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={goForward}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition border-r border-border"
            title="Forward 4 weeks"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={goForwardFar}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
            title="Forward 3 months"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Range label */}
        <span className="text-xs font-medium text-foreground">{rangeLabel}</span>

        <div className="flex-1" />

        {/* Quarter quick-jumps */}
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] text-muted-foreground/60 mr-1">{currentYear}</span>
          {[1, 2, 3, 4].map(q => (
            <Button
              key={q}
              variant={activeQuarter === q ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-[11px] text-muted-foreground"
              onClick={() => goToQuarter(q)}
              title={`Q${q} ${currentYear}`}
            >
              Q{q}
            </Button>
          ))}
        </div>
      </div>

      {/* Gantt chart with today overlay */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 overflow-auto" ref={scrollRef}>
          <Gantt
            tasks={ganttTasks}
            viewMode={ViewMode.Week}
            viewDate={viewDate}
            preStepsCount={PAD_WEEKS}
            onClick={handleClick}
            onExpanderClick={handleExpanderClick}
            columnWidth={COL_WIDTH}
            listCellWidth=""
            rowHeight={40}
            headerHeight={HEADER_HEIGHT}
            barCornerRadius={6}
            barFill={65}
            todayColor="rgba(59, 130, 246, 0.04)"
            arrowColor="#a1a1aa"
            fontSize="11px"
            TooltipContent={CustomTooltip}
          />
        </div>

        {/* Today line + past shade overlay */}
        <TodayOverlay
          chartStartDate={chartStartDate}
          scrollLeft={scrollLeft}
          containerWidth={containerSize.w}
          containerHeight={containerSize.h}
        />
      </div>

      {/* Style overrides */}
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
