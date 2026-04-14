import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { GATES, type GateId } from '@shared/constants/gates';
import { CATEGORIES } from '@shared/constants/categories';
import { getTaskGate } from '@shared/utils/gate-helpers';
import { STATUS_STYLE, STATUSES } from '../constants';
import { Dropdown } from './Dropdown';
import { DueDate } from './DueDate';
import { ActivityFeed } from './ActivityFeed';

export function TaskRow({ task, showProject, showGate, isExpanded, tickets, isSelected, projectColor, onSelect, client, onToggle, onUpdateStatus, onUpdateGate, onUpdateCategory, onEdit, onDelete, onAddTicket, onEditTicket, onDeleteTicket, onUpdateDueDate }: {
  task: any;
  showProject?: boolean;
  showGate: boolean;
  isExpanded: boolean;
  tickets?: any[];
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
}) {
  const status = task.settings?.status || 'pending';
  const category = task.settings?.category || '';
  const gate = getTaskGate(task.settings?.tags);
  const progress = task.settings?.progress || 0;
  const dueDate = task.settings?.dueDate;
  const style = STATUS_STYLE[status] || STATUS_STYLE.pending;

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

        {/* Status dot + name — constrained width so it doesn't push everything */}
        <div className="w-[280px] flex items-center gap-2 min-w-0 shrink-0">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
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

        {/* Assignee */}
        <span className="w-[80px] text-xs text-muted-foreground truncate text-center">
          {task.settings?.assignee || '\u2014'}
        </span>

        {/* Actions */}
        <div className="w-[100px] flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[11px] text-muted-foreground" onClick={onAddTicket}>+ticket</Button>
          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[11px] text-muted-foreground" onClick={onEdit}>edit</Button>
          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-destructive" onClick={onDelete}>del</Button>
        </div>
      </div>

      {/* Expanded: tickets + activity */}
      {isExpanded && (
        <div className="bg-muted/30 border-b border-border/30">
          {/* Tickets */}
          {!tickets ? (
            <div className="px-12 py-2 text-xs text-muted-foreground">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="px-12 py-2 flex items-center gap-3">
              <span className="text-xs text-muted-foreground italic">No tickets</span>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onAddTicket}>+ Add ticket</Button>
            </div>
          ) : (
            <>
              {tickets.map((ticket: any) => {
                const ts = ticket.settings?.status || 'pending';
                const tsStyle = STATUS_STYLE[ts] || STATUS_STYLE.pending;
                return (
                  <div key={ticket.id} className="flex items-center gap-2 px-4 py-1.5 pl-14 hover:bg-muted/50 transition group/ticket">
                    <span className="text-xs text-muted-foreground">{'\u251C'}</span>
                    <div className={`w-2 h-2 rounded-full ${tsStyle.dot}`} />
                    <button
                      onClick={() => onEditTicket(ticket)}
                      className="text-sm text-foreground/80 flex-1 truncate text-left hover:text-primary transition cursor-pointer"
                    >
                      {ticket.name}
                    </button>
                    <Badge variant="outline" className={`text-[11px] px-2 py-0.5 ${tsStyle.bg} ${tsStyle.text} capitalize`}>
                      {ts.replace('-', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">{ticket.settings?.priority || ''}</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/ticket:opacity-100 transition">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                        onClick={() => onEditTicket(ticket)}
                      >
                        edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 px-1.5 text-[11px] text-muted-foreground hover:text-destructive"
                        onClick={() => onDeleteTicket(ticket.id)}
                      >
                        del
                      </Button>
                    </div>
                  </div>
                );
              })}
              <div className="px-14 py-1.5">
                <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary/70" onClick={onAddTicket}>+ Add ticket</Button>
              </div>
            </>
          )}

          {/* Activity feed */}
          {client && (
            <>
              <Separator className="mx-14" />
              <ActivityFeed taskId={task.id} client={client} />
            </>
          )}
        </div>
      )}
    </>
  );
}
