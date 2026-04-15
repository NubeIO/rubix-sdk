import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GATES, type GateId } from '@shared/constants/gates';
import { CATEGORIES } from '@shared/constants/categories';
import { getTaskGate } from '@shared/utils/gate-helpers';
import { STATUSES } from '../constants';
import { Dropdown } from './Dropdown';
import { DueDate } from './DueDate';
import { ActivityFeed } from './ActivityFeed';
import { StatusIcon, getStatusRowBg } from './StatusIcon';

function AvatarStack({ users }: { users: { id: string; name: string }[] }) {
  if (!users || users.length === 0) return <span className="text-xs text-muted-foreground/40">{'\u2014'}</span>;
  return (
    <div className="flex items-center -space-x-1.5" title={users.map(a => a.name).join(', ')}>
      {users.slice(0, 3).map((a, i) => (
        <div
          key={a.id}
          className="w-5 h-5 rounded-full bg-muted border-2 border-background flex items-center justify-center"
          style={{ zIndex: 3 - i }}
        >
          <span className="text-[8px] font-semibold text-muted-foreground leading-none">
            {a.name ? a.name.split(/\s+/).map(p => p[0]).join('').toUpperCase().slice(0, 2) : '?'}
          </span>
        </div>
      ))}
      {users.length > 3 && (
        <div className="w-5 h-5 rounded-full bg-muted border-2 border-background flex items-center justify-center" style={{ zIndex: 0 }}>
          <span className="text-[8px] font-medium text-muted-foreground">+{users.length - 3}</span>
        </div>
      )}
    </div>
  );
}

export function TaskRow({ task, showProject, showGate, isExpanded, tickets, assignees, ticketAssignees, isSelected, projectColor, onSelect, client, onToggle, onUpdateStatus, onUpdateGate, onUpdateCategory, onEdit, onDelete, onAddTicket, onEditTicket, onDeleteTicket, onUpdateDueDate, onUpdateTicketField }: {
  task: any;
  showProject?: boolean;
  showGate: boolean;
  isExpanded: boolean;
  tickets?: any[];
  assignees?: { id: string; name: string }[];
  ticketAssignees?: Record<string, { id: string; name: string }[]>;
  isSelected?: boolean;
  projectColor?: string;
  onSelect?: (id: string) => void;
  client?: any;
  onToggle: () => void;
  onUpdateStatus: (s: string) => void;
  onUpdateGate: (g: GateId) => void;
  onUpdateCategory: (c: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddTicket: () => void;
  onEditTicket: (ticket: any) => void;
  onDeleteTicket: (id: string) => void;
  onUpdateDueDate?: (date: string) => void;
  onUpdateTicketField?: (ticketId: string, field: string, value: string) => void;
}) {
  const status = task.settings?.status || 'pending';
  const category = task.settings?.category || '';
  const gate = getTaskGate(task.settings?.tags);
  const progress = task.settings?.progress || 0;
  const dueDate = task.settings?.dueDate;

  return (
    <>
      <div
        className={`flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50 transition group border-b border-border/20
        ${isSelected ? 'bg-primary/5' : ''}`}
        style={projectColor ? { borderLeft: `3px solid ${projectColor}` } : undefined}
      >
        {/* Bulk select checkbox */}
        {onSelect && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(task.id); }}
            className="w-4 shrink-0 flex items-center justify-center"
          >
            <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition cursor-pointer
              ${isSelected ? 'bg-primary border-primary' : 'border-input hover:border-muted-foreground'}`}>
              {isSelected && <span className="text-[8px] text-primary-foreground leading-none">{'\u2713'}</span>}
            </div>
          </button>
        )}

        {/* Expand toggle */}
        <button onClick={onToggle} className="w-5 text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
          {isExpanded ? '\u25BC' : '\u25B6'}
        </button>

        {/* Status icon + name — constrained width so it doesn't push everything */}
        <div className="w-[280px] flex items-center gap-2 min-w-0 shrink-0">
          <StatusIcon status={status} size="md" />
          <button onClick={onEdit} className="text-sm text-foreground truncate hover:text-primary transition cursor-pointer text-left">
            {task.name}
          </button>
        </div>

        {/* Project name (multi-project view) */}
        {showProject && (
          <div className="w-[100px] flex items-center gap-1.5 shrink-0" title={task._productName}>
            {projectColor && <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: projectColor }} />}
            <span className="text-xs text-muted-foreground truncate">
              {task._productName || '\u2014'}
            </span>
          </div>
        )}

        {/* Category */}
        <Dropdown
          value={category}
          placeholder="Category"
          options={CATEGORIES.map(c => ({ value: c.id, label: c.name }))}
          onChange={onUpdateCategory}
          width="w-[100px]"
        />

        {/* Gate (only in "All" tab) — wider to fit text like "G4 Client Acceptance" */}
        {showGate && (
          <Dropdown
            value={gate || ''}
            placeholder="Gate"
            options={GATES.map(g => ({ value: g.id, label: `${g.id.toUpperCase()} ${g.name}` }))}
            onChange={(v) => onUpdateGate(v as GateId)}
            width="w-[150px]"
          />
        )}

        {/* Status */}
        <Dropdown
          value={status}
          placeholder="Status"
          options={STATUSES.map(s => ({ value: s, label: s.replace('-', ' ') }))}
          onChange={onUpdateStatus}
          width="w-[110px]"
        />

        {/* Due date — clickable to edit */}
        <div className="w-[110px] shrink-0 flex items-center justify-center">
          <DueDate date={dueDate} onChange={onUpdateDueDate} />
        </div>

        {/* Progress */}
        <div className="w-[65px] flex items-center gap-1 shrink-0">
          <Progress value={progress} className="flex-1 h-1.5" />
          <span className="text-xs text-muted-foreground w-7 text-right">{progress}%</span>
        </div>

        {/* Assignees */}
        <div className="w-[100px] shrink-0 flex items-center justify-center">
          <AvatarStack users={assignees || []} />
        </div>

        {/* Actions */}
        <div className="w-[100px] flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[11px] text-muted-foreground" onClick={onAddTicket}>+ticket</Button>
          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[11px] text-muted-foreground" onClick={onEdit}>edit</Button>
          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-destructive" onClick={onDelete}>del</Button>
        </div>
      </div>

      {/* Expanded: tickets + activity */}
      {isExpanded && (
        <div className="border-b border-border/30">
          <div className="flex">
            {/* Left accent bar — visual connection to parent task */}
            <div className="w-10 shrink-0 flex justify-center">
              <div className="w-px bg-border" />
            </div>

            {/* Ticket content area */}
            <div className="flex-1 py-2 pr-4">
              {/* Section header */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Tickets
                </span>
                {tickets && tickets.length > 0 && (
                  <span className="text-[10px] text-muted-foreground/60">
                    {tickets.filter((t: any) => t.settings?.status === 'completed').length}/{tickets.filter((t: any) => t.settings?.status !== 'cancelled').length} done
                  </span>
                )}
                <div className="flex-1" />
                <Button variant="ghost" size="sm" className="h-5 px-2 text-[11px] text-primary/70" onClick={onAddTicket}>+ Add</Button>
              </div>

              {/* Tickets */}
              {!tickets ? (
                <div className="py-2 text-xs text-muted-foreground">Loading...</div>
              ) : tickets.length === 0 ? (
                <div className="py-3 text-center">
                  <p className="text-xs text-muted-foreground/60 italic">No tickets yet</p>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs mt-1" onClick={onAddTicket}>+ Create first ticket</Button>
                </div>
              ) : (
                <div className="rounded-md border border-border/50 overflow-hidden">
                  {/* Ticket column headers */}
                  <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/40">
                    <span className="w-5" />
                    <span className="flex-1">Name</span>
                    <span className="w-[110px]">Status</span>
                    <span className="w-[100px]">Priority</span>
                    <span className="w-[70px] text-center">Assignee</span>
                    <span className="w-[80px]" />
                  </div>

                  {tickets.map((ticket: any, idx: number) => {
                    const ts = ticket.settings?.status || 'pending';
                    const isLast = idx === tickets.length - 1;
                    const isDone = ts === 'completed';
                    return (
                      <div
                        key={ticket.id}
                        className={`flex items-center gap-2 px-3 py-2 transition group/ticket hover:bg-muted/40
                          ${!isLast ? 'border-b border-border/30' : ''}
                          ${getStatusRowBg(ts)}`}
                      >
                        {/* Status icon */}
                        <StatusIcon status={ts} />

                        {/* Ticket name */}
                        <button
                          onClick={() => onEditTicket(ticket)}
                          className={`text-sm flex-1 truncate text-left transition cursor-pointer
                            ${isDone
                              ? 'text-muted-foreground line-through decoration-muted-foreground/30'
                              : 'text-foreground hover:text-primary'}`}
                        >
                          {ticket.name}
                        </button>

                        {/* Status dropdown */}
                        <Dropdown
                          value={ts}
                          placeholder="Status"
                          options={STATUSES.map(s => ({ value: s, label: s.replace('-', ' ') }))}
                          onChange={(v) => onUpdateTicketField?.(ticket.id, 'status', v)}
                          width="w-[110px]"
                        />

                        {/* Priority dropdown */}
                        <Dropdown
                          value={ticket.settings?.priority || 'Medium'}
                          placeholder="Priority"
                          options={['Low', 'Medium', 'High', 'Critical'].map(p => ({ value: p, label: p }))}
                          onChange={(v) => onUpdateTicketField?.(ticket.id, 'priority', v)}
                          width="w-[100px]"
                        />

                        {/* Assignee */}
                        <div className="w-[70px] shrink-0 flex items-center justify-center">
                          <AvatarStack users={ticketAssignees?.[ticket.id] || []} />
                        </div>

                        {/* Actions */}
                        <div className="w-[80px] flex items-center justify-end gap-0.5 opacity-0 group-hover/ticket:opacity-100 transition shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                            onClick={() => onEditTicket(ticket)}
                          >
                            edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-destructive"
                            onClick={() => onDeleteTicket(ticket.id)}
                          >
                            del
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Activity feed */}
              {client && (
                <div className="mt-3">
                  <ActivityFeed taskId={task.id} client={client} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
