/**
 * Development Pipeline — Two-panel workspace
 *
 * Left:  Project list (compact, clickable)
 * Right: Selected project → gate tabs → task table → ticket management
 */

import { createRoot, type Root } from 'react-dom/client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import '@rubix-sdk/frontend/globals.css';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
// @ts-ignore
import { Skeleton } from '@rubix-sdk/frontend/common/ui';

import { GATES, type GateId } from '@shared/constants/gates';
import { CATEGORIES } from '@shared/constants/categories';
import { useProgramDashboard } from '../hooks/use-program-dashboard';
import { getTaskGate, setTaskGate, computeGateProgress } from '@shared/utils/gate-helpers';
import type { GateProgress, ProductSummary } from '../types/program.types';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// @ts-ignore
import { UserPicker, type SelectedUser } from '@rubix-sdk/frontend/common/ui/user-picker';

// ── Constants ────────────────────────────────────────────────────────

interface Props {
  orgId: string;
  deviceId: string;
  baseUrl: string;
  token?: string;
}

const STATUSES = ['pending', 'in-progress', 'blocked', 'review', 'completed', 'cancelled'] as const;

const STATUS_STYLE: Record<string, { dot: string; bg: string; text: string }> = {
  completed:     { dot: 'bg-emerald-500', bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400' },
  'in-progress': { dot: 'bg-blue-500',    bg: 'bg-blue-500/15 border-blue-500/30',       text: 'text-blue-400' },
  blocked:       { dot: 'bg-red-500',     bg: 'bg-red-500/15 border-red-500/30',          text: 'text-red-400' },
  review:        { dot: 'bg-amber-500',   bg: 'bg-amber-500/15 border-amber-500/30',      text: 'text-amber-400' },
  pending:       { dot: 'bg-zinc-500',    bg: 'bg-zinc-500/10 border-zinc-700',            text: 'text-zinc-400' },
  cancelled:     { dot: 'bg-zinc-700',    bg: 'bg-zinc-700/20 border-zinc-700',            text: 'text-zinc-600' },
};

// ── Main Component ───────────────────────────────────────────────────

function ProgramDashboard({ orgId, deviceId, baseUrl, token }: Props) {
  const { productData, isLoading, error, refetch } = useProgramDashboard({ orgId, deviceId, baseUrl, token });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeGate, setActiveGate] = useState<GateId | 'all'>('all');
  const [showTaskDialog, setShowTaskDialog] = useState<{ productId: string; gate?: GateId; task?: any } | null>(null);
  const [showTicketDialog, setShowTicketDialog] = useState<{ taskId: string; taskName: string } | null>(null);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [serviceNodeId, setServiceNodeId] = useState<string | null>(null);

  const client = useMemo(
    () => createPluginClient({ orgId, deviceId, baseUrl, token }),
    [orgId, deviceId, baseUrl, token],
  );

  // Auto-select first project
  const selected = useMemo(() => {
    if (selectedProjectId) return productData.find(p => p.product.id === selectedProjectId) || null;
    if (productData.length > 0) return productData[0];
    return null;
  }, [productData, selectedProjectId]);

  // Tasks for active gate tab
  const visibleTasks = useMemo(() => {
    if (!selected) return [];
    if (activeGate === 'all') return selected.tasks;
    return selected.tasks.filter((t: any) => getTaskGate(t.settings?.tags) === activeGate);
  }, [selected, activeGate]);

  // Tickets per task (from the dashboard hook, tasks already loaded)
  // We'll fetch tickets lazily when a task is expanded
  const [taskTickets, setTaskTickets] = useState<Record<string, any[]>>({});

  const loadTickets = useCallback(async (taskId: string) => {
    if (taskTickets[taskId]) return;
    try {
      const result = await client.queryNodes({ filter: `type is "plm.ticket" and parent.id is "${taskId}"` });
      const tickets = Array.isArray(result) ? result : (result as any).nodes || [];
      setTaskTickets(prev => ({ ...prev, [taskId]: tickets }));
    } catch (err) {
      console.error('Failed to load tickets:', err);
    }
  }, [client, taskTickets]);

  const toggleTask = useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) { next.delete(taskId); } else { next.add(taskId); loadTickets(taskId); }
      return next;
    });
  }, [loadTickets]);

  // Summary stats
  const stats = useMemo(() => {
    const active = productData.filter(p => p.currentGate !== null).length;
    const total = productData.reduce((s, p) => s + p.tasks.length, 0);
    const done = productData.reduce(
      (s, p) => s + p.tasks.filter((t: any) => t.settings?.status === 'completed').length, 0,
    );
    return { active, total, done };
  }, [productData]);

  // ── CRUD ──

  const updateTaskField = useCallback(async (taskId: string, field: string, value: string) => {
    try { await client.updateNodeSettings(taskId, { [field]: value }); refetch(); }
    catch (err) { console.error(`Failed to update ${field}:`, err); }
  }, [client, refetch]);

  const updateTaskGate = useCallback(async (task: any, gateId: GateId) => {
    await updateTaskField(task.id, 'tags', setTaskGate(task.settings?.tags, gateId));
  }, [updateTaskField]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!confirm('Delete this task and all its tickets?')) return;
    try { await client.deleteNode(taskId); refetch(); }
    catch (err) { console.error('Failed to delete task:', err); }
  }, [client, refetch]);

  const deleteTicket = useCallback(async (ticketId: string, taskId: string) => {
    if (!confirm('Delete this ticket?')) return;
    try {
      await client.deleteNode(ticketId);
      setTaskTickets(prev => ({ ...prev, [taskId]: (prev[taskId] || []).filter((t: any) => t.id !== ticketId) }));
      refetch();
    } catch (err) { console.error('Failed to delete ticket:', err); }
  }, [client, refetch]);

  // Find parent node for creating projects (plm.service or plm.products)
  const findServiceNode = useCallback(async () => {
    if (serviceNodeId) return serviceNodeId;
    try {
      // Try plm.products collection first (preferred parent)
      let result = await client.queryNodes({ filter: `type is "plm.products"` });
      let nodes = Array.isArray(result) ? result : (result as any).nodes || [];
      if (nodes.length > 0) { setServiceNodeId(nodes[0].id); return nodes[0].id; }
      // Fall back to plm.service
      result = await client.queryNodes({ filter: `type is "plm.service"` });
      nodes = Array.isArray(result) ? result : (result as any).nodes || [];
      if (nodes.length > 0) { setServiceNodeId(nodes[0].id); return nodes[0].id; }
    } catch (err) { console.error('Failed to find service node:', err); }
    return null;
  }, [client, serviceNodeId]);

  const createProject = useCallback(async (name: string, settings: Record<string, any> = {}) => {
    const parentId = await findServiceNode();
    if (!parentId) { alert('Could not find PLM service node. Create a PLM service first.'); return; }
    try {
      const node = await client.createNode(parentId, {
        type: 'plm.product', name, identity: ['product', 'plm'], settings,
      });
      refetch();
      // Auto-select the new project
      if (node && (node as any).id) setSelectedProjectId((node as any).id);
    } catch (err) { console.error('Failed to create project:', err); }
  }, [client, refetch, findServiceNode]);

  // ── Error / Loading ──

  if (error) {
    return <div className="p-8 text-red-400"><p className="font-medium">Failed to load dashboard</p><p className="text-sm mt-1 text-zinc-500">{error}</p></div>;
  }

  // ── Render ──

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-zinc-100">
      {/* Top bar */}
      <div className="shrink-0 px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Development Pipeline</h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {stats.active} active project{stats.active !== 1 ? 's' : ''} &middot; {stats.done}/{stats.total} tasks completed
          </p>
        </div>
        {selected && (
          <button
            onClick={() => setShowTaskDialog({ productId: selected.product.id, gate: activeGate !== 'all' ? activeGate : undefined })}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md transition"
          >
            + New Task
          </button>
        )}
      </div>

      {/* Two-panel body */}
      <div className="flex-1 flex min-h-0">
        {/* ── Left panel: project list ── */}
        <div className="w-[220px] shrink-0 border-r border-zinc-800 overflow-y-auto">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Projects</span>
            <button
              onClick={() => setShowProjectDialog(true)}
              className="text-[10px] text-blue-400 hover:text-blue-300 transition"
            >
              + New
            </button>
          </div>
          {isLoading ? (
            <div className="px-3 space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 rounded" />)}</div>
          ) : productData.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-xs text-zinc-600">No projects yet</p>
              <button onClick={() => setShowProjectDialog(true)} className="text-[11px] text-blue-400 hover:text-blue-300 mt-2 transition">
                + Create first project
              </button>
            </div>
          ) : (
            productData.map(p => {
              const isActive = selected?.product.id === p.product.id;
              const curGate = p.currentGate ? GATES.find(g => g.id === p.currentGate) : null;
              return (
                <button
                  key={p.product.id}
                  onClick={() => { setSelectedProjectId(p.product.id); setActiveGate('all'); }}
                  className={`w-full text-left px-3 py-2 transition cursor-pointer
                    ${isActive ? 'bg-blue-500/10 border-l-2 border-blue-500' : 'border-l-2 border-transparent hover:bg-zinc-800/50'}`}
                >
                  <div className="text-xs font-medium text-zinc-200 truncate">{p.product.name || 'Unnamed'}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full bg-zinc-700 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${p.overallProgress}%` }} />
                    </div>
                    <span className="text-[10px] text-zinc-500">{p.overallProgress}%</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    {curGate ? curGate.id.toUpperCase() : 'No gate'} &middot; {p.tasks.length} task{p.tasks.length !== 1 ? 's' : ''}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* ── Right panel: workspace ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
              Select a project to get started
            </div>
          ) : (
            <>
              {/* Gate tabs */}
              <div className="shrink-0 px-4 pt-3 pb-0 border-b border-zinc-800 flex items-center gap-1 overflow-x-auto">
                <GateTab
                  label="All"
                  count={selected.tasks.length}
                  isActive={activeGate === 'all'}
                  onClick={() => setActiveGate('all')}
                />
                {GATES.map(g => {
                  const gp = selected.gateProgress.find(gp => gp.gateId === g.id);
                  const count = gp?.totalTasks || 0;
                  return (
                    <GateTab
                      key={g.id}
                      label={`${g.id.toUpperCase()} ${g.name}`}
                      count={count}
                      status={gp?.status}
                      isActive={activeGate === g.id}
                      onClick={() => setActiveGate(g.id)}
                    />
                  );
                })}
              </div>

              {/* Gate info bar */}
              {activeGate !== 'all' && (
                <div className="shrink-0 px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/50 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-zinc-200">
                      {activeGate.toUpperCase()} &mdash; {GATES.find(g => g.id === activeGate)?.name}
                    </span>
                    <span className="text-xs text-zinc-500 ml-3">
                      {GATES.find(g => g.id === activeGate)?.description}
                    </span>
                  </div>
                </div>
              )}

              {/* Task table */}
              <div className="flex-1 overflow-y-auto">
                {/* Column headers */}
                <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-1.5 bg-zinc-900/80 backdrop-blur border-b border-zinc-800/50 text-[10px] text-zinc-500 uppercase tracking-wider">
                  <span className="w-5" />
                  <span className="flex-1">Task</span>
                  <span className="w-[90px]">Category</span>
                  {activeGate === 'all' && <span className="w-[80px]">Gate</span>}
                  <span className="w-[100px]">Status</span>
                  <span className="w-[60px] text-center">Progress</span>
                  <span className="w-[70px] text-center">Assignee</span>
                  <span className="w-[100px]" />
                </div>

                {visibleTasks.length === 0 ? (
                  <div className="px-4 py-16 text-center">
                    <p className="text-sm text-zinc-500">
                      {activeGate === 'all' ? 'No tasks yet' : `No tasks in ${activeGate.toUpperCase()}`}
                    </p>
                    <button
                      onClick={() => setShowTaskDialog({ productId: selected.product.id, gate: activeGate !== 'all' ? activeGate : undefined })}
                      className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition"
                    >
                      + Create first task
                    </button>
                  </div>
                ) : (
                  visibleTasks.map((task: any) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      showGate={activeGate === 'all'}
                      isExpanded={expandedTasks.has(task.id)}
                      tickets={taskTickets[task.id]}
                      onToggle={() => toggleTask(task.id)}
                      onUpdateStatus={(s) => updateTaskField(task.id, 'status', s)}
                      onUpdateGate={(g) => updateTaskGate(task, g)}
                      onUpdateCategory={(c) => updateTaskField(task.id, 'category', c)}
                      onEdit={() => setShowTaskDialog({ productId: selected.product.id, task })}
                      onDelete={() => deleteTask(task.id)}
                      onAddTicket={() => setShowTicketDialog({ taskId: task.id, taskName: task.name })}
                      onDeleteTicket={(ticketId) => deleteTicket(ticketId, task.id)}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Dialogs ── */}
      {showTaskDialog && (
        <TaskFormDialog
          defaultGate={showTaskDialog.gate}
          editTask={showTaskDialog.task}
          client={client}
          saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              let nodeId: string;
              if (showTaskDialog.task) {
                nodeId = showTaskDialog.task.id;
                await client.updateNode(nodeId, { name: data.name });
                await client.updateNodeSettings(nodeId, data.settings);
              } else {
                const node = await client.createNode(showTaskDialog.productId, {
                  type: 'plm.task', name: data.name, identity: ['task', 'plm'], settings: data.settings,
                });
                nodeId = (node as any)?.id;
              }
              // Persist user assignments
              if (nodeId && data.assignees) {
                await client.replaceAssignedUsers(nodeId, data.assignees);
              }
              setShowTaskDialog(null);
              refetch();
            } catch (err) { console.error('Failed to save task:', err); }
            finally { setSaving(false); }
          }}
          onClose={() => setShowTaskDialog(null)}
        />
      )}
      {showProjectDialog && (
        <ProjectFormDialog
          saving={saving}
          onSave={async (name, settings) => {
            setSaving(true);
            try { await createProject(name, settings); setShowProjectDialog(false); }
            finally { setSaving(false); }
          }}
          onClose={() => setShowProjectDialog(false)}
        />
      )}
      {showTicketDialog && (
        <TicketFormDialog
          taskName={showTicketDialog.taskName}
          saving={saving}
          onSave={async (data) => {
            setSaving(true);
            try {
              await client.createNode(showTicketDialog.taskId, {
                type: 'plm.ticket', name: data.name, identity: ['ticket', 'plm'], settings: data.settings,
              });
              // Refresh tickets for that task
              setTaskTickets(prev => ({ ...prev, [showTicketDialog.taskId]: undefined as any }));
              loadTickets(showTicketDialog.taskId);
              setShowTicketDialog(null);
              refetch();
            } catch (err) { console.error('Failed to create ticket:', err); }
            finally { setSaving(false); }
          }}
          onClose={() => setShowTicketDialog(null)}
        />
      )}
    </div>
  );
}

// ── Gate Tab ──────────────────────────────────────────────────────────

function GateTab({ label, tooltip, count, status, isActive, onClick }: {
  label: string; count: number; status?: string; isActive: boolean; onClick: () => void;
}) {
  const dotColor = status === 'done' ? 'bg-emerald-500' : status === 'active' ? 'bg-blue-500' : count > 0 ? 'bg-zinc-500' : 'bg-zinc-700';
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition border-b-2 cursor-pointer whitespace-nowrap
        ${isActive
          ? 'border-blue-500 text-blue-400'
          : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
      {count > 0 && <span className="text-[10px] text-zinc-600">{count}</span>}
    </button>
  );
}

// ── Task Row ─────────────────────────────────────────────────────────

function TaskRow({ task, showGate, isExpanded, tickets, onToggle, onUpdateStatus, onUpdateGate, onUpdateCategory, onEdit, onDelete, onAddTicket, onDeleteTicket }: {
  task: any; showGate: boolean; isExpanded: boolean; tickets?: any[];
  onToggle: () => void; onUpdateStatus: (s: string) => void; onUpdateGate: (g: GateId) => void;
  onUpdateCategory: (c: string) => void; onEdit: () => void; onDelete: () => void;
  onAddTicket: () => void; onDeleteTicket: (id: string) => void;
}) {
  const status = task.settings?.status || 'pending';
  const category = task.settings?.category || '';
  const gate = getTaskGate(task.settings?.tags);
  const progress = task.settings?.progress || 0;
  const style = STATUS_STYLE[status] || STATUS_STYLE.pending;

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-900/50 transition group border-b border-zinc-800/20">
        {/* Expand toggle */}
        <button onClick={onToggle} className="w-5 text-center text-[10px] text-zinc-600 hover:text-zinc-300 cursor-pointer shrink-0">
          {isExpanded ? '\u25BC' : '\u25B6'}
        </button>

        {/* Status dot + name */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
          <button onClick={onEdit} className="text-xs text-zinc-200 truncate hover:text-blue-400 transition cursor-pointer text-left">
            {task.name}
          </button>
        </div>

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
          <div className="flex-1 h-1 rounded-full bg-zinc-700 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[10px] text-zinc-500 w-6 text-right">{progress}%</span>
        </div>

        {/* Assignee */}
        <span className="w-[70px] text-[11px] text-zinc-500 truncate text-center">
          {task.settings?.assignee || '\u2014'}
        </span>

        {/* Actions */}
        <div className="w-[100px] flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
          <ActionBtn label="+ticket" onClick={onAddTicket} />
          <ActionBtn label="edit" onClick={onEdit} />
          <ActionBtn label="del" onClick={onDelete} className="hover:text-red-400" />
        </div>
      </div>

      {/* Expanded: tickets */}
      {isExpanded && (
        <div className="bg-zinc-900/30 border-b border-zinc-800/30">
          {!tickets ? (
            <div className="px-12 py-2 text-[11px] text-zinc-600">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="px-12 py-2 flex items-center gap-3">
              <span className="text-[11px] text-zinc-600 italic">No tickets</span>
              <button onClick={onAddTicket} className="text-[10px] text-blue-400 hover:text-blue-300 transition">+ Add ticket</button>
            </div>
          ) : (
            <>
              {tickets.map((ticket: any) => {
                const ts = ticket.settings?.status || 'pending';
                const tsStyle = STATUS_STYLE[ts] || STATUS_STYLE.pending;
                return (
                  <div key={ticket.id} className="flex items-center gap-2 px-4 py-1 pl-12 hover:bg-zinc-800/30 transition group/ticket">
                    <span className="text-[10px] text-zinc-600">\u251C</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${tsStyle.dot}`} />
                    <span className="text-[11px] text-zinc-400 flex-1 truncate">{ticket.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${tsStyle.bg} ${tsStyle.text} capitalize`}>
                      {ts.replace('-', ' ')}
                    </span>
                    <span className="text-[10px] text-zinc-600 capitalize">{ticket.settings?.priority || ''}</span>
                    <button
                      onClick={() => onDeleteTicket(ticket.id)}
                      className="text-[10px] text-zinc-600 hover:text-red-400 opacity-0 group-hover/ticket:opacity-100 transition px-1"
                    >
                      del
                    </button>
                  </div>
                );
              })}
              <div className="px-12 py-1">
                <button onClick={onAddTicket} className="text-[10px] text-blue-400/70 hover:text-blue-300 transition">+ Add ticket</button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ── Reusable bits ────────────────────────────────────────────────────

function ActionBtn({ label, onClick, className = '' }: { label: string; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`text-[10px] text-zinc-600 hover:text-zinc-300 px-1.5 py-0.5 rounded hover:bg-zinc-800 transition ${className}`}>
      {label}
    </button>
  );
}

function Dropdown({ value, placeholder, options, onChange, width }: {
  value: string; placeholder: string; options: { value: string; label: string }[]; onChange: (v: string) => void; width: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className={`${width} h-6 text-[11px] border-zinc-700/40 bg-transparent px-1.5 shrink-0`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o.value} value={o.value} className="text-xs capitalize">{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Task Form Dialog ─────────────────────────────────────────────────

function TaskFormDialog({ defaultGate, editTask, client, saving, onSave, onClose }: {
  defaultGate?: GateId; editTask?: any; client: any; saving: boolean;
  onSave: (data: { name: string; settings: Record<string, any>; assignees: SelectedUser[] }) => void; onClose: () => void;
}) {
  const isEdit = !!editTask;
  const [name, setName] = useState(editTask?.name || '');
  const [category, setCategory] = useState<string>(editTask?.settings?.category || '');
  const [gate, setGate] = useState<string>(editTask ? (getTaskGate(editTask.settings?.tags) || '') : (defaultGate || ''));
  const [status, setStatus] = useState(editTask?.settings?.status || 'pending');
  const [priority, setPriority] = useState(editTask?.settings?.priority || 'Medium');
  const [assignees, setAssignees] = useState<SelectedUser[]>([]);
  const [startDate, setStartDate] = useState(editTask?.settings?.startDate || '');
  const [dueDate, setDueDate] = useState(editTask?.settings?.dueDate || '');
  const [progress, setProgress] = useState(String(editTask?.settings?.progress || 0));

  // Load existing assignees when editing
  useEffect(() => {
    if (editTask?.id) {
      client.getAssignedUsers(editTask.id).then((refs: any[]) => {
        if (refs?.length) {
          setAssignees(refs.map((r: any) => ({ userId: r.toNodeId, userName: r.displayName || '' })));
        }
      }).catch(() => {});
    }
  }, [editTask?.id, client]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const tags = gate ? setTaskGate(editTask?.settings?.tags, gate as GateId) : (editTask?.settings?.tags || '');
    onSave({
      name: name.trim(),
      settings: { category, tags, status, priority, startDate, dueDate, progress: Number(progress) || 0 },
      assignees,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[520px] bg-zinc-900 border-zinc-700 text-zinc-100">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Task' : 'New Task'}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <Field label="Task Name *">
            <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="e.g. Finalise PCB layout" className="bg-zinc-800 border-zinc-700" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Gate">
              <Select value={gate || undefined} onValueChange={setGate}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue placeholder="Select gate" /></SelectTrigger>
                <SelectContent>{GATES.map(g => <SelectItem key={g.id} value={g.id}>{g.id.toUpperCase()} &mdash; {g.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={category || undefined} onValueChange={setCategory}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Status">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('-', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent>{['Low', 'Medium', 'High', 'Critical'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Assignee(s)">
              <UserPicker client={client} value={assignees} onChange={setAssignees} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Start Date"><Input type="date" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} className="bg-zinc-800 border-zinc-700" /></Field>
            <Field label="Due Date"><Input type="date" value={dueDate} onChange={(e: any) => setDueDate(e.target.value)} className="bg-zinc-800 border-zinc-700" /></Field>
            <Field label="Progress (%)"><Input type="number" min="0" max="100" value={progress} onChange={(e: any) => setProgress(e.target.value)} className="bg-zinc-800 border-zinc-700" /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition">Cancel</button>
            <button onClick={handleSubmit} disabled={!name.trim() || saving} className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md disabled:opacity-50 transition">
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Ticket Form Dialog ───────────────────────────────────────────────

function TicketFormDialog({ taskName, saving, onSave, onClose }: {
  taskName: string; saving: boolean;
  onSave: (data: { name: string; settings: Record<string, any> }) => void; onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [ticketType, setTicketType] = useState('task');
  const [status, setStatus] = useState('pending');
  const [priority, setPriority] = useState('Medium');

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[420px] bg-zinc-900 border-zinc-700 text-zinc-100">
        <DialogHeader>
          <DialogTitle>New Ticket</DialogTitle>
          <p className="text-xs text-zinc-500 mt-1">Under: {taskName}</p>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Field label="Ticket Name *">
            <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="e.g. Review IO spacing" className="bg-zinc-800 border-zinc-700" autoFocus />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Type">
              <Select value={ticketType} onValueChange={setTicketType}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent>{['task', 'bug', 'feature', 'chore'].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('-', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent>{['Low', 'Medium', 'High', 'Critical'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition">Cancel</button>
            <button
              onClick={() => { if (!name.trim()) return; onSave({ name: name.trim(), settings: { ticketType, status, priority } }); }}
              disabled={!name.trim() || saving}
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Create Ticket'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Project Form Dialog ──────────────────────────────────────────────

const PRODUCT_CATEGORIES = ['hardware', 'software', 'hybrid', 'firmware', 'bundle'] as const;
const PRODUCT_STATUSES = ['Design', 'Prototype', 'Production', 'Discontinued'] as const;

function ProjectFormDialog({ saving, onSave, onClose }: {
  saving: boolean; onSave: (name: string, settings: Record<string, any>) => void; onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [category, setCategory] = useState('hardware');
  const [status, setStatus] = useState('Design');

  const canSubmit = name.trim().length > 0 && productCode.trim().length >= 3;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave(name.trim(), { productCode: productCode.trim(), category, status, currency: 'USD' });
  };

  // Auto-generate product code from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!productCode || productCode === autoCode(name)) {
      setProductCode(autoCode(val));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[420px] bg-zinc-900 border-zinc-700 text-zinc-100">
        <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <Field label="Project Name *">
            <Input
              value={name}
              onChange={(e: any) => handleNameChange(e.target.value)}
              placeholder="e.g. Zone Controller Gen-02"
              className="bg-zinc-800 border-zinc-700"
              autoFocus
            />
          </Field>
          <Field label="Product Code * (min 3 chars, unique)">
            <Input
              value={productCode}
              onChange={(e: any) => setProductCode(e.target.value)}
              placeholder="e.g. zc-gen02"
              className="bg-zinc-800 border-zinc-700"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md disabled:opacity-50 transition"
            >
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Generate a URL-safe code from a name */
function autoCode(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-xs text-zinc-400">{label}</label>{children}</div>;
}

// ── Mount / Unmount ──────────────────────────────────────────────────

export default {
  mount: (container: HTMLElement, props?: Props) => {
    const root = createRoot(container);
    root.render(<ProgramDashboard orgId={props?.orgId || ''} deviceId={props?.deviceId || ''} baseUrl={props?.baseUrl || ''} token={props?.token} />);
    return root;
  },
  unmount: (root: Root) => { root.unmount(); },
};
