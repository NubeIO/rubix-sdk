import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import {
  CalendarRange,
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  Package2,
  SquarePen,
} from 'lucide-react';
import { Gantt, ViewMode, type Task as GanttTask } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
// @ts-ignore - SDK types are resolved at build time
import { Button } from '@rubix-sdk/frontend/common/ui';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Product } from '@features/product/types/product.types';
import type { Task } from '@features/task/types/task.types';
import type { Ticket } from '@features/ticket/types/ticket.types';
import { TaskFilters } from './TaskFilters';

type GanttContext = 'all-products' | 'single-product';
type GanttView = ViewMode.Day | ViewMode.Week | ViewMode.Month;

interface GanttRow extends GanttTask {
  sourceId: string;
  rowKind: 'task' | 'ticket';
}

interface TasksGanttViewProps {
  tasks: Task[];
  products?: Product[];
  client: PluginClient;
  context: GanttContext;
  productId?: string;
  onTaskEdit?: (task: Task) => void;
  view?: 'table' | 'gantt';
  onViewChange?: (view: 'table' | 'gantt') => void;
}

interface GanttListHeaderProps {
  headerHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
}

interface GanttListTableProps {
  rowHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
  locale: string;
  tasks: GanttTask[];
  selectedTaskId: string;
  setSelectedTask: (taskId: string) => void;
  onExpanderClick: (task: GanttTask) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const VIEW_OPTIONS: Array<{ label: string; value: GanttView }> = [
  { label: 'Day', value: ViewMode.Day },
  { label: 'Week', value: ViewMode.Week },
  { label: 'Month', value: ViewMode.Month },
];

function parseDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function clampProgress(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function taskProgress(task: Task): number {
  if (typeof task.settings?.progress === 'number') {
    return clampProgress(task.settings.progress);
  }

  switch (task.settings?.status) {
    case 'completed':
      return 100;
    case 'in-progress':
      return 55;
    case 'cancelled':
      return 0;
    default:
      return 15;
  }
}

function ticketProgress(ticket: Ticket): number {
  switch (ticket.settings?.status) {
    case 'completed':
      return 100;
    case 'review':
      return 85;
    case 'in-progress':
      return 60;
    case 'blocked':
      return 35;
    case 'cancelled':
      return 0;
    default:
      return 10;
  }
}

function taskDates(task: Task): { start: Date; end: Date } {
  const start = parseDate(task.settings?.startDate) || parseDate(task.createdAt) || new Date();
  const end = parseDate(task.settings?.dueDate) || addDays(start, 7);
  return end >= start ? { start, end } : { start, end: addDays(start, 1) };
}

function ticketDates(ticket: Ticket): { start: Date; end: Date } {
  const start =
    parseDate(ticket.settings?.createdDate) ||
    parseDate(ticket.createdAt) ||
    new Date();
  const end = parseDate(ticket.settings?.dueDate) || addDays(start, 3);
  return end >= start ? { start, end } : { start, end: addDays(start, 1) };
}

function taskPalette(status?: string) {
  switch (status) {
    case 'completed':
      return {
        backgroundColor: '#2f855a',
        backgroundSelectedColor: '#276749',
        progressColor: '#9ae6b4',
        progressSelectedColor: '#c6f6d5',
      };
    case 'in-progress':
      return {
        backgroundColor: '#1d4ed8',
        backgroundSelectedColor: '#1e40af',
        progressColor: '#93c5fd',
        progressSelectedColor: '#bfdbfe',
      };
    case 'cancelled':
      return {
        backgroundColor: '#6b7280',
        backgroundSelectedColor: '#4b5563',
        progressColor: '#d1d5db',
        progressSelectedColor: '#e5e7eb',
      };
    default:
      return {
        backgroundColor: '#b45309',
        backgroundSelectedColor: '#92400e',
        progressColor: '#fcd34d',
        progressSelectedColor: '#fde68a',
      };
  }
}

function ticketPalette(status?: string) {
  switch (status) {
    case 'completed':
      return {
        backgroundColor: '#8fd19e',
        backgroundSelectedColor: '#6cbc80',
        progressColor: '#e8fff0',
        progressSelectedColor: '#f3fff7',
      };
    case 'blocked':
      return {
        backgroundColor: '#f59e0b',
        backgroundSelectedColor: '#d97706',
        progressColor: '#fde68a',
        progressSelectedColor: '#fef3c7',
      };
    default:
      return {
        backgroundColor: '#7c9cf5',
        backgroundSelectedColor: '#5f7fe0',
        progressColor: '#dbe7ff',
        progressSelectedColor: '#eef4ff',
      };
  }
}

export function TasksGanttView({
  tasks,
  products = [],
  client,
  context,
  productId,
  onTaskEdit,
  view,
  onViewChange,
}: TasksGanttViewProps) {
  const [viewMode, setViewMode] = useState<GanttView>(ViewMode.Week);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [taskTickets, setTaskTickets] = useState<Map<string, Ticket[]>>(new Map());
  const [loadingTickets, setLoadingTickets] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const productMap = useMemo(
    () => products.reduce<Record<string, Product>>((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {}),
    [products]
  );

  // Apply filters to tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (statusFilter !== 'all' && task.settings?.status !== statusFilter) {
        return false;
      }
      // Product filter
      if (productFilter !== 'all' && task.parentId !== productFilter) {
        return false;
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return task.name.toLowerCase().includes(query);
      }
      return true;
    });
  }, [tasks, statusFilter, productFilter, searchQuery]);

  const taskMap = useMemo(
    () => filteredTasks.reduce<Record<string, Task>>((acc, task) => {
      acc[task.id] = task;
      return acc;
    }, {}),
    [filteredTasks]
  );

  const loadTickets = useCallback(async (taskId: string) => {
    if (taskTickets.has(taskId)) {
      return;
    }

    setLoadingTickets((prev) => new Set(prev).add(taskId));

    try {
      const nodes = await client.queryNodes({
        filter: `type is "plm.ticket" and parentId is "${taskId}"`,
      });
      setTaskTickets((prev) => {
        const next = new Map(prev);
        next.set(taskId, nodes as Ticket[]);
        return next;
      });
    } catch (error) {
      console.error('[TasksGanttView] Failed to load tickets:', error);
    } finally {
      setLoadingTickets((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [client, taskTickets]);

  const toggleTaskExpansion = useCallback(async (taskId: string) => {
    const isExpanded = expandedTasks.has(taskId);

    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });

    if (!isExpanded && !taskTickets.has(taskId)) {
      await loadTickets(taskId);
    }
  }, [expandedTasks, loadTickets, taskTickets]);

  const ganttRows = useMemo<GanttRow[]>(() => {
    const rows: GanttRow[] = [];

    filteredTasks.forEach((task) => {
      const dates = taskDates(task);
      const productName =
        context === 'single-product'
          ? products[0]?.name || productId || 'Current product'
          : productMap[task.parentId || '']?.name || 'Unassigned';

      rows.push({
        id: task.id,
        sourceId: task.id,
        rowKind: 'task',
        name: task.name,
        start: dates.start,
        end: dates.end,
        progress: taskProgress(task),
        type: 'task',
        hideChildren: !expandedTasks.has(task.id),
        project: productName,
        styles: taskPalette(task.settings?.status),
      });

      if (expandedTasks.has(task.id)) {
        const tickets = taskTickets.get(task.id) || [];
        tickets.forEach((ticket) => {
          const ticketTimeline = ticketDates(ticket);
          rows.push({
            id: `ticket-${ticket.id}`,
            sourceId: ticket.id,
            rowKind: 'ticket',
            name: ticket.name,
            start: ticketTimeline.start,
            end: ticketTimeline.end,
            progress: ticketProgress(ticket),
            type: 'task',
            project: task.id,
            isDisabled: true,
            styles: ticketPalette(ticket.settings?.status),
          });
        });
      }
    });

    return rows;
  }, [context, expandedTasks, productId, productMap, products, taskTickets, filteredTasks]);

  const handleExpanderClick = useCallback(async (item: GanttTask) => {
    const row = item as GanttRow;
    if (row.rowKind !== 'task') {
      return;
    }

    await toggleTaskExpansion(row.sourceId);
  }, [toggleTaskExpansion]);

  const handleDoubleClick = useCallback((item: GanttTask) => {
    const row = item as GanttRow;
    if (row.rowKind !== 'task' || !onTaskEdit) {
      return;
    }

    const task = taskMap[row.sourceId];
    if (task) {
      onTaskEdit(task);
    }
  }, [onTaskEdit, taskMap]);

  const hasScheduledTasks = ganttRows.length > 0;

  const TaskListHeader = useCallback(
    ({ headerHeight, rowWidth, fontFamily, fontSize }: GanttListHeaderProps) => (
      <div
        className="border-b bg-slate-50 px-4 text-slate-900"
        style={{
          height: headerHeight,
          width: rowWidth,
          fontFamily,
          fontSize,
        }}
      >
        <div className="flex h-full items-center justify-between gap-3">
          <span className="font-semibold">Workstream</span>
          <span className="text-xs uppercase tracking-[0.18em] text-slate-600">
            Timeline
          </span>
        </div>
      </div>
    ),
    []
  );

  const TaskListTable = useCallback(
    ({
      rowHeight,
      rowWidth,
      fontFamily,
      fontSize,
      tasks: chartTasks,
      selectedTaskId,
      setSelectedTask,
      onExpanderClick,
    }: GanttListTableProps) => (
      <div
        style={{ width: rowWidth, fontFamily, fontSize }}
        className="bg-white"
      >
        {chartTasks.map((item) => {
          const row = item as GanttRow;
          const isTicket = row.rowKind === 'ticket';
          const parentTask = isTicket ? taskMap[row.project || ''] : null;
          const isLoading = !isTicket && loadingTickets.has(row.sourceId);
          const isSelected = selectedTaskId === row.id;
          const productName = !isTicket
            ? productMap[taskMap[row.sourceId]?.parentId || '']?.name || row.project
            : parentTask?.name;

          return (
            <div
              key={row.id}
              className={`flex w-full items-center gap-3 border-b px-3 text-left transition-colors ${
                isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
              } ${isTicket ? 'pl-10' : ''}`}
              style={{ height: rowHeight } as CSSProperties}
            >
              {!isTicket ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onExpanderClick(item);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  title={row.hideChildren ? 'Show tickets' : 'Hide tickets'}
                >
                  {isLoading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : row.hideChildren ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <span className="h-7 w-7 rounded-md border border-dashed border-slate-200 bg-slate-50" />
              )}

              <button
                type="button"
                onClick={() => setSelectedTask(row.id)}
                onDoubleClick={() => {
                  if (!isTicket && onTaskEdit) {
                    const task = taskMap[row.sourceId];
                    if (task) {
                      onTaskEdit(task);
                    }
                  }
                }}
                className="min-w-0 flex-1 text-left"
              >
                <div className="truncate font-medium text-slate-900">
                  {row.name}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {isTicket
                    ? `Ticket under ${productName || 'task'}`
                    : productName || 'No product'}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    ),
    [loadingTickets, onTaskEdit, productMap, taskMap]
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <TaskFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        productFilter={productFilter}
        onProductFilterChange={setProductFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        products={products}
        showSearch={true}
        resultCount={filteredTasks.length}
        totalCount={tasks.length}
        view={view}
        onViewChange={onViewChange}
      />

      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CalendarRange className="h-4 w-4" />
            <span className="font-medium">Timeline</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Active
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Completed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              Planned
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {VIEW_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={viewMode === option.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode(option.value)}
              className="h-7 px-3"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {!hasScheduledTasks ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <Package2 className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No tasks to schedule yet</h3>
          <p className="mt-2 text-sm text-slate-600">
            Create a task and it will appear here with a default timeline if dates are missing.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3 text-slate-900">
            <div className="text-sm font-medium">
              {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'} on the board
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <SquarePen className="h-3.5 w-3.5" />
              Double-click to edit
            </div>
          </div>

          <div className="overflow-x-auto bg-[linear-gradient(180deg,#fff_0%,#f8fafc_100%)]">
            <Gantt
              tasks={ganttRows}
              viewMode={viewMode}
              listCellWidth="360px"
              columnWidth={viewMode === ViewMode.Month ? 100 : viewMode === ViewMode.Day ? 60 : 80}
              rowHeight={54}
              barCornerRadius={6}
              barFill={65}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontSize="13px"
              todayColor="rgba(15, 23, 42, 0.06)"
              onDoubleClick={handleDoubleClick}
              onExpanderClick={handleExpanderClick}
              TaskListHeader={TaskListHeader}
              TaskListTable={TaskListTable}
            />
          </div>
        </div>
      )}
    </div>
  );
}
