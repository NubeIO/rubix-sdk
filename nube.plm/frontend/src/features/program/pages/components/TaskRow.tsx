import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GATES, type GateId } from '@shared/constants/gates';
import { CATEGORIES } from '@shared/constants/categories';
import { getTaskGate } from '@shared/utils/gate-helpers';
import { STATUS_STYLE, STATUSES } from '../constants';
import { Dropdown } from './Dropdown';

export function TaskRow({ task, showProject, showGate, isExpanded, tickets, onToggle, onUpdateStatus, onUpdateGate, onUpdateCategory, onEdit, onDelete, onAddTicket, onDeleteTicket }: {
  task: any;
  showProject?: boolean;
  showGate: boolean;
  isExpanded: boolean;
  tickets?: any[];
  onToggle: () => void;
  onUpdateStatus: (s: string) => void;
  onUpdateGate: (g: GateId) => void;
  onUpdateCategory: (c: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddTicket: () => void;
  onDeleteTicket: (id: string) => void;
}) {
  const status = task.settings?.status || 'pending';
  const category = task.settings?.category || '';
  const gate = getTaskGate(task.settings?.tags);
  const progress = task.settings?.progress || 0;
  const style = STATUS_STYLE[status] || STATUS_STYLE.pending;

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-2 hover:bg-muted/50 transition group border-b border-border/20">
        {/* Expand toggle */}
        <button onClick={onToggle} className="w-5 text-center text-[10px] text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
          {isExpanded ? '\u25BC' : '\u25B6'}
        </button>

        {/* Status dot + name */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
          <button onClick={onEdit} className="text-xs text-foreground truncate hover:text-primary transition cursor-pointer text-left">
            {task.name}
          </button>
        </div>

        {/* Project name (multi-project view) */}
        {showProject && (
          <span className="w-[90px] text-[10px] text-muted-foreground truncate shrink-0" title={task._productName}>
            {task._productName || '\u2014'}
          </span>
        )}

        {/* Category */}
        <Dropdown
          value={category}
          placeholder="Category"
          options={CATEGORIES.map(c => ({ value: c.id, label: c.name }))}
          onChange={onUpdateCategory}
          width="w-[90px]"
        />

        {/* Gate (only in "All" tab) */}
        {showGate && (
          <Dropdown
            value={gate || ''}
            placeholder="Gate"
            options={GATES.map(g => ({ value: g.id, label: `${g.id.toUpperCase()} ${g.name}` }))}
            onChange={(v) => onUpdateGate(v as GateId)}
            width="w-[80px]"
          />
        )}

        {/* Status */}
        <Dropdown
          value={status}
          placeholder="Status"
          options={STATUSES.map(s => ({ value: s, label: s.replace('-', ' ') }))}
          onChange={onUpdateStatus}
          width="w-[100px]"
        />

        {/* Progress */}
        <div className="w-[60px] flex items-center gap-1 shrink-0">
          <Progress value={progress} className="flex-1 h-1" />
          <span className="text-[10px] text-muted-foreground w-6 text-right">{progress}%</span>
        </div>

        {/* Assignee */}
        <span className="w-[70px] text-[11px] text-muted-foreground truncate text-center">
          {task.settings?.assignee || '\u2014'}
        </span>

        {/* Actions */}
        <div className="w-[100px] flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
          <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] text-muted-foreground" onClick={onAddTicket}>+ticket</Button>
          <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] text-muted-foreground" onClick={onEdit}>edit</Button>
          <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-destructive" onClick={onDelete}>del</Button>
        </div>
      </div>

      {/* Expanded: tickets */}
      {isExpanded && (
        <div className="bg-muted/30 border-b border-border/30">
          {!tickets ? (
            <div className="px-12 py-2 text-[11px] text-muted-foreground">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="px-12 py-2 flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground italic">No tickets</span>
              <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" onClick={onAddTicket}>+ Add ticket</Button>
            </div>
          ) : (
            <>
              {tickets.map((ticket: any) => {
                const ts = ticket.settings?.status || 'pending';
                const tsStyle = STATUS_STYLE[ts] || STATUS_STYLE.pending;
                return (
                  <div key={ticket.id} className="flex items-center gap-2 px-4 py-1 pl-12 hover:bg-muted/50 transition group/ticket">
                    <span className="text-[10px] text-muted-foreground">{'\u251C'}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${tsStyle.dot}`} />
                    <span className="text-[11px] text-muted-foreground flex-1 truncate">{ticket.name}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tsStyle.bg} ${tsStyle.text} capitalize`}>
                      {ts.replace('-', ' ')}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground capitalize">{ticket.settings?.priority || ''}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 px-1 text-[10px] text-muted-foreground hover:text-destructive opacity-0 group-hover/ticket:opacity-100"
                      onClick={() => onDeleteTicket(ticket.id)}
                    >
                      del
                    </Button>
                  </div>
                );
              })}
              <div className="px-12 py-1">
                <Button variant="link" size="sm" className="h-auto p-0 text-[10px] text-primary/70" onClick={onAddTicket}>+ Add ticket</Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
