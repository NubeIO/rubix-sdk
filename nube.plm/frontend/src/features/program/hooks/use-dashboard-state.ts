/**
 * All state, callbacks, and derived data for ProgramDashboard.
 * Extracted to keep the page component focused on layout.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { EMPTY_FILTERS, type TaskFilters } from '../pages/components/FilterBar';
import type { GateId } from '@shared/constants/gates';
import type { SelectedUser } from '@rubix-sdk/frontend/common/ui/user-picker';
import { useProgramDashboard } from './use-program-dashboard';
import { getTaskGate, setTaskGate, computeGateProgress } from '@shared/utils/gate-helpers';

interface DashboardOpts {
  orgId: string;
  deviceId: string;
  baseUrl: string;
  token?: string;
}

export function useDashboardState({ orgId, deviceId, baseUrl, token }: DashboardOpts) {
  const { productData, isLoading, error, refetch } = useProgramDashboard({ orgId, deviceId, baseUrl, token });

  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [activeGate, setActiveGate] = useState<GateId | 'all'>('all');
  const [filters, setFilters] = useState<TaskFilters>({ ...EMPTY_FILTERS });
  const [showTaskDialog, setShowTaskDialog] = useState<{ productId: string; gate?: GateId; task?: any } | null>(null);
  const [showTicketDialog, setShowTicketDialog] = useState<{ taskId: string; taskName: string; ticket?: any } | null>(null);
  const [showProjectDialog, setShowProjectDialog] = useState<{ editProject?: any } | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [serviceNodeId, setServiceNodeId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

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

  // ── Project selection ──

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

  const selectedProjects = useMemo(() =>
    productData.filter(p => selectedProjectIds.has(p.product.id)),
  [productData, selectedProjectIds]);

  // ── Org users + assignees ──

  const [orgUsers, setOrgUsers] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    client.listUsers().then((users: any[]) => {
      setOrgUsers((users || []).map((u: any) => ({ id: u.id, name: u.name || u.settings?.email || u.id })));
    }).catch(() => {});
  }, [client]);

  const allAssignees = useMemo(() => {
    const names = new Set<string>();
    orgUsers.forEach(u => names.add(u.name));
    productData.forEach(p => p.tasks.forEach((t: any) => {
      const a = t.settings?.assignee;
      if (a) names.add(a);
    }));
    return Array.from(names).sort();
  }, [productData, orgUsers]);

  // ── Visible tasks (filtered) ──

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

  // ── Gate progress ──

  const combinedGateProgress = useMemo(() => {
    const allTasks = selectedProjects.flatMap(p => p.tasks);
    return computeGateProgress(allTasks);
  }, [selectedProjects]);

  // ── Ticket loading ──

  const [taskTickets, setTaskTickets] = useState<Record<string, any[]>>({});

  const loadTickets = useCallback(async (taskId: string, force = false) => {
    if (!force) {
      // Skip if already loaded — but use the setter to read current state, avoiding stale closure
      const alreadyLoaded = await new Promise<boolean>(resolve => {
        setTaskTickets(prev => { resolve(!!prev[taskId]); return prev; });
      });
      if (alreadyLoaded) return;
    }
    try {
      const result = await client.queryNodes({ filter: `type is "plm.ticket" and parent.id is "${taskId}"` });
      const tickets = Array.isArray(result) ? result : (result as any).nodes || [];
      setTaskTickets(prev => ({ ...prev, [taskId]: tickets }));
    } catch (err) {
      console.error('Failed to load tickets:', err);
    }
  }, [client]);

  const toggleTask = useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) { next.delete(taskId); } else { next.add(taskId); loadTickets(taskId); }
      return next;
    });
  }, [loadTickets]);

  // ── Task progress ──

  const getTaskProgress = useCallback((task: any): number => {
    if (!task.settings?.autoProgress) return task.settings?.progress || 0;
    const tickets = taskTickets[task.id];
    if (!tickets || tickets.length === 0) return 0;
    const completed = tickets.filter((t: any) => t.settings?.status === 'completed').length;
    return Math.round((completed / tickets.length) * 100);
  }, [taskTickets]);

  // ── Stats ──

  const stats = useMemo(() => {
    const total = visibleTasks.length;
    const done = visibleTasks.filter((t: any) => t.settings?.status === 'completed').length;
    const inProgress = visibleTasks.filter((t: any) => t.settings?.status === 'in-progress').length;
    const blocked = visibleTasks.filter((t: any) => t.settings?.status === 'blocked').length;
    const avgProgress = total > 0
      ? Math.round(visibleTasks.reduce((s: number, t: any) => s + getTaskProgress(t), 0) / total)
      : 0;
    return { total, done, inProgress, blocked, avgProgress, projects: selectedProjects.length };
  }, [visibleTasks, selectedProjects, getTaskProgress]);

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

  // ── Bulk actions ──

  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  }, []);

  const bulkUpdateStatus = useCallback(async (status: string) => {
    await Promise.all(Array.from(selectedTaskIds).map(id => client.updateNodeSettings(id, { status })));
    setSelectedTaskIds(new Set());
    refetch();
  }, [client, selectedTaskIds, refetch]);

  const bulkUpdateGate = useCallback(async (gateId: GateId) => {
    const tasks = visibleTasks.filter((t: any) => selectedTaskIds.has(t.id));
    await Promise.all(tasks.map((t: any) =>
      client.updateNodeSettings(t.id, { tags: setTaskGate(t.settings?.tags, gateId) })
    ));
    setSelectedTaskIds(new Set());
    refetch();
  }, [client, selectedTaskIds, visibleTasks, refetch]);

  const bulkDelete = useCallback(async () => {
    if (!confirm(`Delete ${selectedTaskIds.size} task(s) and all their tickets?`)) return;
    await Promise.all(Array.from(selectedTaskIds).map(id => client.deleteNode(id)));
    setSelectedTaskIds(new Set());
    refetch();
  }, [client, selectedTaskIds, refetch]);

  // ── Project CRUD ──

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

  const renameProject = useCallback(async (productId: string, name: string) => {
    try { await client.updateNode(productId, { name }); refetch(); }
    catch (err) { console.error('Failed to rename project:', err); }
  }, [client, refetch]);

  const changeProjectIcon = useCallback(async (productId: string, icon: string) => {
    try { await client.updateNodeSettings(productId, { icon }); refetch(); }
    catch (err) { console.error('Failed to change icon:', err); }
  }, [client, refetch]);

  const changeProjectColor = useCallback(async (productId: string, iconColor: string) => {
    try { await client.updateNodeSettings(productId, { iconColor }); refetch(); }
    catch (err) { console.error('Failed to change color:', err); }
  }, [client, refetch]);

  const projectColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    productData.forEach(p => { map[p.product.id] = p.product.settings?.iconColor || '#3b82f6'; });
    return map;
  }, [productData]);

  // ── Dialog save handlers ──

  const saveTask = useCallback(async (data: { name: string; settings: Record<string, any>; assignees: SelectedUser[]; productId?: string }) => {
    if (!showTaskDialog) return;
    setSaving(true);
    try {
      let nodeId: string;
      if (showTaskDialog.task) {
        nodeId = showTaskDialog.task.id;
        await client.updateNode(nodeId, { name: data.name });
        await client.updateNodeSettings(nodeId, data.settings);
      } else {
        const parentProductId = data.productId || showTaskDialog.productId;
        const node = await client.createNode(parentProductId, {
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
  }, [showTaskDialog, client, refetch]);

  const saveProject = useCallback(async (name: string, settings: Record<string, any>) => {
    setSaving(true);
    try {
      if (showProjectDialog?.editProject) {
        const id = showProjectDialog.editProject.id;
        await client.updateNode(id, { name });
        await client.updateNodeSettings(id, settings);
      } else {
        await createProject(name, settings);
      }
      setShowProjectDialog(null);
      refetch();
    } catch (err) { console.error('Failed to save project:', err); }
    finally { setSaving(false); }
  }, [showProjectDialog, client, createProject, refetch]);

  const deleteProject = useCallback(async (productId: string) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await client.deleteNode(productId);
      setSelectedProjectIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      refetch();
    } catch (err) { console.error('Failed to delete project:', err); }
  }, [client, refetch]);

  const saveTicket = useCallback(async (data: { name: string; settings: Record<string, any> }) => {
    if (!showTicketDialog) return;
    setSaving(true);
    try {
      if (showTicketDialog.ticket) {
        await client.updateNode(showTicketDialog.ticket.id, { name: data.name });
        await client.updateNodeSettings(showTicketDialog.ticket.id, data.settings);
      } else {
        await client.createNode(showTicketDialog.taskId, {
          type: 'plm.ticket', name: data.name, identity: ['ticket', 'plm'], settings: data.settings,
        });
      }
      loadTickets(showTicketDialog.taskId, true);
      setShowTicketDialog(null);
      refetch();
    } catch (err) { console.error('Failed to save ticket:', err); }
    finally { setSaving(false); }
  }, [showTicketDialog, client, refetch, loadTickets]);

  return {
    // Data
    productData, isLoading, error, refetch,
    client,
    // Project selection
    selectedProjectIds, selectedProjects, toggleProject, selectAllProjects, selectNoneProjects,
    // Gate / filters
    activeGate, setActiveGate, filters, setFilters, allAssignees,
    // Tasks
    visibleTasks, combinedGateProgress, expandedTasks, taskTickets,
    getTaskProgress, toggleTask,
    // Task CRUD
    updateTaskField, updateTaskGate, deleteTask, deleteTicket,
    // Bulk
    selectedTaskIds, setSelectedTaskIds, toggleTaskSelection,
    bulkUpdateStatus, bulkUpdateGate, bulkDelete,
    // Project CRUD
    renameProject, changeProjectIcon, changeProjectColor, deleteProject, projectColorMap,
    // View
    viewMode, setViewMode,
    // Stats
    stats,
    // Dialogs
    showTaskDialog, setShowTaskDialog,
    showTicketDialog, setShowTicketDialog,
    showProjectDialog, setShowProjectDialog,
    saving, saveTask, saveProject, saveTicket,
  };
}
