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

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import { GATES, type GateId } from '@shared/constants/gates';
import { useProgramDashboard } from '../hooks/use-program-dashboard';
import { getTaskGate, setTaskGate, computeGateProgress } from '@shared/utils/gate-helpers';

import { GateTab } from './components/GateTab';
import { MiniStat } from './components/MiniStat';
import { TaskRow } from './components/TaskRow';
import { FilterBar, EMPTY_FILTERS, type TaskFilters } from './components/FilterBar';
import { TaskFormDialog } from './dialogs/TaskFormDialog';
import { TicketFormDialog } from './dialogs/TicketFormDialog';
import { ProjectFormDialog } from './dialogs/ProjectFormDialog';

// ── Types ───────────────────────────────────────────────────────────

interface Props {
  orgId: string;
  deviceId: string;
  baseUrl: string;
  token?: string;
}

// ── Main Component ──────────────────────────────────────────────────

function ProgramDashboard({ orgId, deviceId, baseUrl, token }: Props) {
  const { productData, isLoading, error, refetch } = useProgramDashboard({ orgId, deviceId, baseUrl, token });
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [activeGate, setActiveGate] = useState<GateId | 'all'>('all');
  const [filters, setFilters] = useState<TaskFilters>({ ...EMPTY_FILTERS });
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

  // Auto-select all projects when data loads
  useEffect(() => {
    if (productData.length > 0 && selectedProjectIds.size === 0) {
      setSelectedProjectIds(new Set(productData.map(p => p.product.id)));
    }
  }, [productData]);

  // Toggle project selection
  const toggleProject = useCallback((id: string) => {
    setSelectedProjectIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAllProjects = useCallback(() => {
    setSelectedProjectIds(new Set(productData.map(p => p.product.id)));
  }, [productData]);

  const selectNoneProjects = useCallback(() => {
    setSelectedProjectIds(new Set());
  }, []);

  // Selected projects data
  const selectedProjects = useMemo(() =>
    productData.filter(p => selectedProjectIds.has(p.product.id)),
  [productData, selectedProjectIds]);

  // All unique assignees across all tasks (for user filter)
  const allAssignees = useMemo(() => {
    const names = new Set<string>();
    productData.forEach(p => p.tasks.forEach((t: any) => {
      const a = t.settings?.assignee;
      if (a) names.add(a);
    }));
    return Array.from(names).sort();
  }, [productData]);

  // Combined tasks from selected projects, filtered by gate tab + advanced filters
  const visibleTasks = useMemo(() => {
    let tasks = selectedProjects.flatMap(p =>
      p.tasks.map((t: any) => ({ ...t, _productName: p.product.name }))
    );
    if (activeGate !== 'all') {
      tasks = tasks.filter((t: any) => getTaskGate(t.settings?.tags) === activeGate);
    }
    if (filters.statuses.size > 0) {
      tasks = tasks.filter((t: any) => filters.statuses.has(t.settings?.status || 'pending'));
    }
    if (filters.priorities.size > 0) {
      tasks = tasks.filter((t: any) => filters.priorities.has(t.settings?.priority || 'Medium'));
    }
    if (filters.categories.size > 0) {
      tasks = tasks.filter((t: any) => filters.categories.has(t.settings?.category || ''));
    }
    if (filters.assignees.size > 0) {
      tasks = tasks.filter((t: any) => filters.assignees.has(t.settings?.assignee || ''));
    }
    if (filters.gates.size > 0) {
      tasks = tasks.filter((t: any) => {
        const g = getTaskGate(t.settings?.tags);
        return g ? filters.gates.has(g) : false;
      });
    }
    return tasks;
  }, [selectedProjects, activeGate, filters]);

  // Gate progress across selected projects
  const combinedGateProgress = useMemo(() => {
    const allTasks = selectedProjects.flatMap(p => p.tasks);
    return computeGateProgress(allTasks);
  }, [selectedProjects]);

  // Lazy ticket loading
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

  // Stats — computed from visible (filtered) tasks
  const stats = useMemo(() => {
    const total = visibleTasks.length;
    const done = visibleTasks.filter((t: any) => t.settings?.status === 'completed').length;
    const inProgress = visibleTasks.filter((t: any) => t.settings?.status === 'in-progress').length;
    const blocked = visibleTasks.filter((t: any) => t.settings?.status === 'blocked').length;
    const avgProgress = total > 0
      ? Math.round(visibleTasks.reduce((s: number, t: any) => s + (t.settings?.progress || 0), 0) / total)
      : 0;
    return { total, done, inProgress, blocked, avgProgress, projects: selectedProjects.length };
  }, [visibleTasks, selectedProjects]);

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

  // Find parent node for creating projects
  const findServiceNode = useCallback(async () => {
    if (serviceNodeId) return serviceNodeId;
    try {
      let result = await client.queryNodes({ filter: `type is "plm.products"` });
      let nodes = Array.isArray(result) ? result : (result as any).nodes || [];
      if (nodes.length > 0) { setServiceNodeId(nodes[0].id); return nodes[0].id; }
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
      if (node && (node as any).id) setSelectedProjectIds(prev => new Set(prev).add((node as any).id));
    } catch (err) { console.error('Failed to create project:', err); }
  }, [client, refetch, findServiceNode]);

  // ── Error / Loading ──

  if (error) {
    return (
      <div className="p-8 text-destructive">
        <p className="font-medium">Failed to load dashboard</p>
        <p className="text-sm mt-1 text-muted-foreground">{error}</p>
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Top bar + stats */}
      <div className="shrink-0 border-b border-border">
        <div className="px-5 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">Development Pipeline</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stats.projects} project{stats.projects !== 1 ? 's' : ''} selected
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FilterBar filters={filters} onChange={setFilters} allAssignees={allAssignees} />
            {selectedProjects.length === 1 && (
              <Button
                size="sm"
                onClick={() => setShowTaskDialog({ productId: selectedProjects[0].product.id, gate: activeGate !== 'all' ? activeGate : undefined })}
              >
                + New Task
              </Button>
            )}
          </div>
        </div>
        {/* Stats row */}
        {!isLoading && (
          <div className="px-5 pb-3 flex items-center gap-4">
            <MiniStat label="Tasks" value={`${stats.done}/${stats.total}`} sub="completed" />
            <MiniStat label="In Progress" value={String(stats.inProgress)} color="text-blue-400" />
            <MiniStat label="Blocked" value={String(stats.blocked)} color={stats.blocked > 0 ? 'text-red-400' : undefined} />
            <MiniStat label="Avg Progress" value={`${stats.avgProgress}%`} />
            <div className="flex-1" />
            <div className="flex items-center gap-1 w-[200px]">
              <Progress value={stats.avgProgress} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground w-8 text-right">{stats.avgProgress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Two-panel body */}
      <div className="flex-1 flex min-h-0">
        {/* ── Left panel: project list ── */}
        <div className="w-[220px] shrink-0 border-r border-border overflow-y-auto">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Projects</span>
            <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" onClick={() => setShowProjectDialog(true)}>
              + New
            </Button>
          </div>
          {isLoading ? (
            <div className="px-3 space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 rounded" />)}</div>
          ) : productData.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-xs text-muted-foreground">No projects yet</p>
              <Button variant="link" size="sm" className="h-auto p-0 text-[11px] mt-2" onClick={() => setShowProjectDialog(true)}>
                + Create first project
              </Button>
            </div>
          ) : (
            <>
              <div className="px-3 pb-1 flex items-center gap-2">
                <button onClick={selectAllProjects} className="text-[10px] text-muted-foreground hover:text-foreground transition">All</button>
                <span className="text-[10px] text-muted-foreground/40">/</span>
                <button onClick={selectNoneProjects} className="text-[10px] text-muted-foreground hover:text-foreground transition">None</button>
              </div>
              {productData.map(p => {
                const isChecked = selectedProjectIds.has(p.product.id);
                const curGate = p.currentGate ? GATES.find(g => g.id === p.currentGate) : null;
                return (
                  <button
                    key={p.product.id}
                    onClick={() => toggleProject(p.product.id)}
                    className={`w-full text-left px-3 py-2 transition cursor-pointer
                      ${isChecked ? 'bg-primary/8 border-l-2 border-primary' : 'border-l-2 border-transparent hover:bg-muted/50 opacity-60'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 transition
                        ${isChecked ? 'bg-primary border-primary' : 'border-muted-foreground/50'}`}>
                        {isChecked && <span className="text-[8px] text-primary-foreground leading-none">{'\u2713'}</span>}
                      </div>
                      <span className="text-xs font-medium text-foreground truncate">{p.product.name || 'Unnamed'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 ml-5">
                      <Progress value={p.overallProgress} className="flex-1 h-1" />
                      <span className="text-[10px] text-muted-foreground">{p.overallProgress}%</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 ml-5">
                      {curGate ? curGate.id.toUpperCase() : 'No gate'} &middot; {p.tasks.length} task{p.tasks.length !== 1 ? 's' : ''}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* ── Right panel: workspace ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {selectedProjects.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select one or more projects to view tasks
            </div>
          ) : (
            <>
              {/* Gate tabs */}
              <div className="shrink-0 px-4 pt-3 pb-0 border-b border-border flex items-center gap-1 overflow-x-auto">
                <GateTab
                  label="All"
                  count={visibleTasks.length}
                  isActive={activeGate === 'all'}
                  onClick={() => setActiveGate('all')}
                />
                {GATES.map(g => {
                  const gp = combinedGateProgress.find(gp => gp.gateId === g.id);
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

              {/* Task table */}
              <div className="flex-1 overflow-y-auto">
                {/* Column headers */}
                <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-1.5 bg-muted/80 backdrop-blur border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider">
                  <span className="w-5" />
                  <span className="flex-1">Task</span>
                  {selectedProjects.length > 1 && <span className="w-[90px]">Project</span>}
                  <span className="w-[90px]">Category</span>
                  {activeGate === 'all' && <span className="w-[80px]">Gate</span>}
                  <span className="w-[100px]">Status</span>
                  <span className="w-[60px] text-center">Progress</span>
                  <span className="w-[70px] text-center">Assignee</span>
                  <span className="w-[100px]" />
                </div>

                {visibleTasks.length === 0 ? (
                  <div className="px-4 py-16 text-center">
                    <p className="text-sm text-muted-foreground">
                      {activeGate === 'all' ? 'No tasks yet' : `No tasks in ${activeGate.toUpperCase()}`}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-3"
                      onClick={() => selectedProjects.length === 1 && setShowTaskDialog({ productId: selectedProjects[0].product.id, gate: activeGate !== 'all' ? activeGate : undefined })}
                    >
                      + Create first task
                    </Button>
                  </div>
                ) : (
                  visibleTasks.map((task: any) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      showProject={selectedProjects.length > 1}
                      showGate={activeGate === 'all'}
                      isExpanded={expandedTasks.has(task.id)}
                      tickets={taskTickets[task.id]}
                      onToggle={() => toggleTask(task.id)}
                      onUpdateStatus={(s) => updateTaskField(task.id, 'status', s)}
                      onUpdateGate={(g) => updateTaskGate(task, g)}
                      onUpdateCategory={(c) => updateTaskField(task.id, 'category', c)}
                      onEdit={() => setShowTaskDialog({ productId: task.parentId, task })}
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

// ── Mount / Unmount ─────────────────────────────────────────────────

export default {
  mount: (container: HTMLElement, props?: Props) => {
    const root = createRoot(container);
    root.render(<ProgramDashboard orgId={props?.orgId || ''} deviceId={props?.deviceId || ''} baseUrl={props?.baseUrl || ''} token={props?.token} />);
    return root;
  },
  unmount: (root: Root) => { root.unmount(); },
};
