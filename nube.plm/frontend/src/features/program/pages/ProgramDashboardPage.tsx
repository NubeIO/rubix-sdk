/**
 * Development Pipeline — Two-panel workspace
 *
 * Left:  Project list (compact, clickable)
 * Right: Selected project → gate tabs → task table → ticket management
 */

import { createRoot, type Root } from 'react-dom/client';
import '@rubix-sdk/frontend/globals.css';

import { GATES } from '@shared/constants/gates';
import { useDashboardState } from '../hooks/use-dashboard-state';

import { GateTab } from './components/GateTab';
import { DashboardHeader } from './components/DashboardHeader';
import { ProjectSidebar } from './components/ProjectSidebar';
import { TaskListView } from './components/TaskListView';
import { TimelineView } from './components/TimelineView';
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
  const d = useDashboardState({ orgId, deviceId, baseUrl, token });

  if (d.error) {
    return (
      <div className="p-8 text-destructive">
        <p className="font-medium">Failed to load dashboard</p>
        <p className="text-sm mt-1 text-muted-foreground">{d.error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <DashboardHeader
        stats={d.stats}
        filters={d.filters}
        allAssignees={d.allAssignees}
        isLoading={d.isLoading}
        viewMode={d.viewMode}
        canAddTask={d.selectedProjects.length > 0}
        onRefetch={d.refetch}
        onFiltersChange={d.setFilters}
        onViewModeChange={d.setViewMode}
        onNewTask={() => d.setShowTaskDialog({ productId: d.selectedProjects[0].product.id, gate: d.activeGate !== 'all' ? d.activeGate : undefined })}
      />

      {/* Two-panel body */}
      <div className="flex-1 flex min-h-0">
        <ProjectSidebar
          productData={d.productData}
          selectedProjectIds={d.selectedProjectIds}
          isLoading={d.isLoading}
          onToggle={d.toggleProject}
          onSelectAll={d.selectAllProjects}
          onSelectNone={d.selectNoneProjects}
          onNewProject={() => d.setShowProjectDialog(true)}
          onRename={d.renameProject}
          onChangeIcon={d.changeProjectIcon}
          onChangeColor={d.changeProjectColor}
        />

        {/* Right panel: workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {d.selectedProjects.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select one or more projects to view tasks
            </div>
          ) : (
            <>
              {/* Gate tabs */}
              <div className="shrink-0 px-4 pt-3 pb-0 border-b border-border flex items-center gap-1 overflow-x-auto">
                <GateTab
                  label="All"
                  count={d.visibleTasks.length}
                  isActive={d.activeGate === 'all'}
                  onClick={() => d.setActiveGate('all')}
                />
                {GATES.map(g => {
                  const gp = d.combinedGateProgress.find(gp => gp.gateId === g.id);
                  const count = gp?.totalTasks || 0;
                  return (
                    <GateTab
                      key={g.id}
                      label={`${g.id.toUpperCase()} ${g.name}`}
                      count={count}
                      status={gp?.status}
                      isActive={d.activeGate === g.id}
                      onClick={() => d.setActiveGate(g.id)}
                    />
                  );
                })}
              </div>

              {d.viewMode === 'list' ? (
                <TaskListView
                  visibleTasks={d.visibleTasks}
                  activeGate={d.activeGate}
                  showProject={d.selectedProjects.length > 1}
                  expandedTasks={d.expandedTasks}
                  taskTickets={d.taskTickets}
                  selectedTaskIds={d.selectedTaskIds}
                  projectColorMap={d.projectColorMap}
                  client={d.client}
                  getTaskProgress={d.getTaskProgress}
                  onToggleTask={d.toggleTask}
                  onSelectTask={d.toggleTaskSelection}
                  onClearSelection={() => d.setSelectedTaskIds(new Set())}
                  onBulkStatus={d.bulkUpdateStatus}
                  onBulkGate={d.bulkUpdateGate}
                  onBulkDelete={d.bulkDelete}
                  onUpdateStatus={(id, s) => d.updateTaskField(id, 'status', s)}
                  onUpdateGate={d.updateTaskGate}
                  onUpdateCategory={(id, c) => d.updateTaskField(id, 'category', c)}
                  onEditTask={(task) => d.setShowTaskDialog({ productId: task.parentId, task })}
                  onDeleteTask={d.deleteTask}
                  onAddTicket={(task) => d.setShowTicketDialog({ taskId: task.id, taskName: task.name })}
                  onEditTicket={(task, ticket) => d.setShowTicketDialog({ taskId: task.id, taskName: task.name, ticket })}
                  onDeleteTicket={d.deleteTicket}
                  onCreateFirst={() => d.selectedProjects.length > 0 && d.setShowTaskDialog({ productId: d.selectedProjects[0].product.id, gate: d.activeGate !== 'all' ? d.activeGate : undefined })}
                />
              ) : (
                <TimelineView
                  tasks={d.visibleTasks.map((t: any) => t.settings?.autoProgress
                    ? { ...t, settings: { ...t.settings, progress: d.getTaskProgress(t) } }
                    : t
                  )}
                  tickets={d.taskTickets}
                  projectColorMap={d.projectColorMap}
                  onEditTask={(task) => d.setShowTaskDialog({ productId: task.parentId, task })}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {d.showTaskDialog && (
        <TaskFormDialog
          defaultGate={d.showTaskDialog.gate}
          editTask={d.showTaskDialog.task}
          client={d.client}
          saving={d.saving}
          projects={d.selectedProjects.map(p => ({ id: p.product.id, name: p.product.name }))}
          defaultProductId={d.showTaskDialog.productId}
          onSave={d.saveTask}
          onClose={() => d.setShowTaskDialog(null)}
        />
      )}
      {d.showProjectDialog && (
        <ProjectFormDialog
          saving={d.saving}
          onSave={d.saveProject}
          onClose={() => d.setShowProjectDialog(false)}
        />
      )}
      {d.showTicketDialog && (
        <TicketFormDialog
          taskName={d.showTicketDialog.taskName}
          editTicket={d.showTicketDialog.ticket}
          saving={d.saving}
          onSave={d.saveTicket}
          onClose={() => d.setShowTicketDialog(null)}
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
