import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { GateId } from '@shared/constants/gates';
import { TaskRow } from './TaskRow';
import { BulkActionBar } from './BulkActionBar';

interface TaskListViewProps {
  visibleTasks: any[];
  activeGate: GateId | 'all';
  showProject: boolean;
  expandedTasks: Set<string>;
  taskTickets: Record<string, any[]>;
  taskAssignees: Record<string, { id: string; name: string }[]>;
  ticketAssignees: Record<string, { id: string; name: string }[]>;
  selectedTaskIds: Set<string>;
  projectColorMap: Record<string, string>;
  client: any;
  getTaskProgress: (task: any) => number;
  onToggleTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  onClearSelection: () => void;
  onBulkStatus: (status: string) => void;
  onBulkGate: (gateId: GateId) => void;
  onBulkDelete: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdateGate: (task: any, gateId: GateId) => void;
  onUpdateCategory: (id: string, category: string) => void;
  onUpdateDueDate: (id: string, date: string) => void;
  onEditTask: (task: any) => void;
  onDeleteTask: (id: string) => void;
  onAddTicket: (task: any) => void;
  onEditTicket: (task: any, ticket: any) => void;
  onDeleteTicket: (ticketId: string, taskId: string) => void;
  onUpdateTicketField: (ticketId: string, taskId: string, field: string, value: string) => void;
  onCreateFirst: () => void;
}

interface ProjectGroup {
  projectId: string;
  projectName: string;
  projectColor: string;
  tasks: any[];
}

export function TaskListView({
  visibleTasks, activeGate, showProject,
  expandedTasks, taskTickets, taskAssignees, ticketAssignees, selectedTaskIds, projectColorMap, client,
  getTaskProgress, onToggleTask, onSelectTask,
  onClearSelection, onBulkStatus, onBulkGate, onBulkDelete,
  onUpdateStatus, onUpdateGate, onUpdateCategory, onUpdateDueDate,
  onEditTask, onDeleteTask, onAddTicket, onEditTicket, onDeleteTicket,
  onUpdateTicketField, onCreateFirst,
}: TaskListViewProps) {
  // Group tasks by project when multiple projects shown
  const groupedTasks = useMemo((): ProjectGroup[] => {
    if (!showProject) {
      return [{ projectId: '', projectName: '', projectColor: '', tasks: visibleTasks }];
    }
    const map = new Map<string, ProjectGroup>();
    for (const task of visibleTasks) {
      const pid = task.parentId || '';
      if (!map.has(pid)) {
        map.set(pid, {
          projectId: pid,
          projectName: task._productName || 'Unknown',
          projectColor: projectColorMap[pid] || '#3b82f6',
          tasks: [],
        });
      }
      map.get(pid)!.tasks.push(task);
    }
    return Array.from(map.values());
  }, [visibleTasks, showProject, projectColorMap]);

  const renderTaskRow = (task: any) => {
    const effectiveTask = task.settings?.autoProgress
      ? { ...task, settings: { ...task.settings, progress: getTaskProgress(task) } }
      : task;
    return (
      <TaskRow
        key={task.id}
        task={effectiveTask}
        showProject={false}
        showGate={activeGate === 'all'}
        isExpanded={expandedTasks.has(task.id)}
        tickets={taskTickets[task.id]}
        assignees={taskAssignees[task.id]}
        ticketAssignees={ticketAssignees}
        isSelected={selectedTaskIds.has(task.id)}
        projectColor={projectColorMap[task.parentId]}
        onSelect={onSelectTask}
        client={client}
        onToggle={() => onToggleTask(task.id)}
        onUpdateStatus={(s) => onUpdateStatus(task.id, s)}
        onUpdateGate={(g) => onUpdateGate(task, g)}
        onUpdateCategory={(c) => onUpdateCategory(task.id, c)}
        onUpdateDueDate={(date) => onUpdateDueDate(task.id, date)}
        onEdit={() => onEditTask(task)}
        onDelete={() => onDeleteTask(task.id)}
        onAddTicket={() => onAddTicket(task)}
        onEditTicket={(ticket) => onEditTicket(task, ticket)}
        onDeleteTicket={(ticketId) => onDeleteTicket(ticketId, task.id)}
        onUpdateTicketField={(ticketId, field, value) => onUpdateTicketField(ticketId, task.id, field, value)}
      />
    );
  };

  return (
    <>
      <BulkActionBar
        count={selectedTaskIds.size}
        onClear={onClearSelection}
        onBulkStatus={onBulkStatus}
        onBulkGate={onBulkGate}
        onBulkDelete={onBulkDelete}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Column headers */}
        <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-muted/80 backdrop-blur border-b border-border/50 text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
          <span className="w-4" />
          <span className="w-5" />
          <span className="w-[280px]">Task</span>
          <span className="w-[100px]">Category</span>
          {activeGate === 'all' && <span className="w-[150px]">Gate</span>}
          <span className="w-[110px]">Status</span>
          <span className="w-[110px] text-center">Due</span>
          <span className="w-[65px] text-center">Progress</span>
          <span className="w-[100px] text-center">Assignee</span>
          <span className="w-[100px]" />
        </div>

        {visibleTasks.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {activeGate === 'all' ? 'No tasks yet' : `No tasks in ${activeGate.toUpperCase()}`}
            </p>
            <Button variant="link" size="sm" className="mt-3" onClick={onCreateFirst}>
              + Create first task
            </Button>
          </div>
        ) : showProject ? (
          // Grouped by project
          groupedTasks.map(group => (
            <div key={group.projectId}>
              <div
                className="flex items-center gap-2 px-4 py-2 bg-muted/60 border-b border-border/40"
                style={{ borderLeft: `3px solid ${group.projectColor}` }}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.projectColor }} />
                <span className="text-sm font-semibold text-foreground">{group.projectName}</span>
                <span className="text-xs text-muted-foreground">
                  {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}
                </span>
              </div>
              {group.tasks.map(renderTaskRow)}
            </div>
          ))
        ) : (
          // Single project — no grouping headers
          visibleTasks.map(renderTaskRow)
        )}
      </div>
    </>
  );
}
