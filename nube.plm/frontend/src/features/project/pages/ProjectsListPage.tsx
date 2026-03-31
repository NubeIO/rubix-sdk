/**
 * Projects Page - Full page view for project management
 *
 * Accessible via right-click → "Open page" on PLM nodes
 */

import { createRoot, type Root } from 'react-dom/client';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Package, ListChecks } from 'lucide-react';
import '@rubix-sdk/frontend/globals.css';
// @ts-ignore - SDK types are resolved at build time
import { Button, Skeleton, Tabs, type Tab } from '@rubix-sdk/frontend/common/ui';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { PlusIcon } from '@shared/components/icons';

import { usePLMHierarchy } from '@shared/hooks/use-plm-hierarchy';
import { ProjectsListTab } from './projects-list-tab';
import { TasksListTab } from './tasks-list-tab';
import { ProjectsPageDialogs } from './projects-page-dialogs';
import { CreateTaskDialog } from './create-task-dialog';
import { EditTaskDialog } from './edit-task-dialog';
import { DeleteTaskDialog } from './delete-task-dialog';
import { useProjectsPageState } from './use-projects-page-state';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@features/task/types/task.types';
import type { Project, ProjectSettings } from '@features/project/types/project.types';
import { createCommentsNode } from '@features/comments/utils/comment-helpers';

export interface ProjectsPageProps {
  orgId: string;
  deviceId: string;
  baseUrl: string;
  token?: string;
}

function ProjectsPage({
  orgId,
  deviceId,
  baseUrl,
  token,
}: ProjectsPageProps) {
  console.log('[ProjectsPage] Render with props:', {
    orgId,
    deviceId,
    baseUrl,
    hasToken: !!token,
  });

  // PLM hierarchy (for projectsCollectionId)
  const { collections, loading: hierarchyLoading, error: hierarchyError } = usePLMHierarchy(
    orgId,
    deviceId,
    baseUrl,
    token
  );

  // Main tabs state
  const [activeMainTab, setActiveMainTab] = useState('projects');

  // Create plugin client - use SDK directly! (memoized to prevent infinite re-renders)
  const client = useMemo(
    () => createPluginClient({ orgId, deviceId, baseUrl, token }),
    [orgId, deviceId, baseUrl, token]
  );

  // Project CRUD operations - use SDK directly, no API wrapper!
  const createProject = useCallback(async (input: { name: string; parentId: string; settings: ProjectSettings }) => {
    if (!collections.projects) {
      throw new Error('Projects collection not found - restart plugin');
    }
    await client.createNode(input.parentId, {
      type: 'plm.project',
      name: input.name,
      settings: input.settings,
    });
  }, [client, collections.projects]);

  const updateProject = useCallback(async (projectId: string, input: { name?: string; settings: ProjectSettings }) => {
    // Update name if provided
    if (input.name) {
      await client.updateNode(projectId, { name: input.name });
    }
    // Update settings (uses PATCH endpoint for deep merge)
    await client.updateNodeSettings(projectId, input.settings);
  }, [client]);

  const deleteProject = useCallback(async (projectId: string) => {
    await client.deleteNode(projectId);
  }, [client]);

  // Task CRUD operations - use SDK directly!
  const updateTask = useCallback(async (taskId: string, input: UpdateTaskInput) => {
    // Update name if provided
    if (input.name) {
      await client.updateNode(taskId, { name: input.name });
    }
    // Update settings if provided (uses PATCH endpoint for deep merge)
    if (input.settings) {
      await client.updateNodeSettings(taskId, input.settings);
    }
  }, [client]);

  const deleteTask = useCallback(async (taskId: string) => {
    await client.deleteNode(taskId);
  }, [client]);

  const canCreate = !!(orgId && deviceId && baseUrl && collections.projects);

  console.log('[ProjectsPage] Hierarchy loaded:', {
    collections,
    hierarchyLoading,
    hierarchyError,
    canCreate,
  });

  const projectDisplaySettings = {
    showCode: true,
    showType: true,
    showStatus: true,
    showPrice: true,
    compactMode: false,
  };

  // Main tabs configuration
  const mainTabs: Tab[] = [
    { value: 'projects', label: 'Projects', icon: Package },
    { value: 'tasks', label: 'Tasks', icon: ListChecks },
  ];

  // Project dialog states
  const {
    createDialogOpen,
    editingProject,
    deletingProject,
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
    openDeleteDialog,
    closeDeleteDialog,
  } = useProjectsPageState({
    onRefresh: async () => {
      // No-op: tabs handle their own refresh
    },
  });

  // Task dialog states
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);
  const [projectRefreshKey, setProjectRefreshKey] = useState(0);

  // Fetch projects when Tasks tab is active OR when task dialogs open
  useEffect(() => {
    // Only fetch when tasks tab is active or any task dialog is open
    if (activeMainTab !== 'tasks' && !createTaskDialogOpen && !editingTask) {
      return;
    }

    let mounted = true;

    async function fetchProjects() {
      try {
        setProjectsLoading(true);

        // Use SDK queryNodes instead of raw fetch
        const loadedProjects = await client.queryNodes({
          filter: 'type is "plm.project"',
        });

        if (mounted) {
          console.log('[ProjectsPage] Projects loaded:', loadedProjects.length);
          setAllProjects(loadedProjects as Project[]);
        }
      } catch (error) {
        console.error('[ProjectsPage] Failed to fetch projects:', error);
      } finally {
        if (mounted) {
          setProjectsLoading(false);
        }
      }
    }

    if (orgId && deviceId && baseUrl) {
      fetchProjects();
    }

    return () => {
      mounted = false;
    };
  }, [activeMainTab, createTaskDialogOpen, editingTask, client, orgId, deviceId, baseUrl]);

  const openCreateTaskDialog = useCallback(() => {
    console.log('[ProjectsPage] Opening create task dialog, projects available:', allProjects.length);
    setCreateTaskDialogOpen(true);
  }, [allProjects]);

  const closeCreateTaskDialog = useCallback(() => {
    setCreateTaskDialogOpen(false);
  }, []);

  const openEditTaskDialog = useCallback((task: Task) => {
    console.log('[ProjectsPage] Opening edit task dialog:', task);
    setEditingTask(task);
  }, []);

  const closeEditTaskDialog = useCallback(() => {
    setEditingTask(null);
  }, []);

  const openDeleteTaskDialog = useCallback((taskId: string, taskName: string) => {
    console.log('[ProjectsPage] Opening delete task dialog:', { taskId, taskName });
    setDeletingTask({ id: taskId, name: taskName });
  }, []);

  const closeDeleteTaskDialog = useCallback(() => {
    setDeletingTask(null);
  }, []);

  // Create task - use SDK directly!
  const createTask = useCallback(async (input: CreateTaskInput) => {
    console.log('[ProjectsPage] Creating task:', input);
    const task = await client.createNode(input.parentId, {
      type: 'plm.task',
      name: input.name,
      settings: input.settings || {},
    });
    // Create the bound comments node immediately
    await createCommentsNode(client, task.id);
    setTaskRefreshKey((prev) => prev + 1); // Force refresh tasks tab
  }, [client]);

  // Loading state
  if (hierarchyLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (hierarchyError) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <h3 className="font-semibold text-destructive mb-2">Error Loading Projects</h3>
            <p className="text-sm text-destructive/90">{hierarchyError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-8 h-full overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Projects & Tasks</h1>
            </div>
            <div className="flex gap-2 items-center">
              {activeMainTab === 'projects' ? (
                <Button onClick={openCreateDialog} disabled={!canCreate}>
                  <PlusIcon size={16} />
                  Create Project
                </Button>
              ) : activeMainTab === 'tasks' ? (
                <Button onClick={openCreateTaskDialog}>
                  <PlusIcon size={16} />
                  Create Task
                </Button>
              ) : null}
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs
            tabs={mainTabs}
            value={activeMainTab}
            onValueChange={setActiveMainTab}
          />

          {/* Tab Content - Lazy loaded */}
          <div className="mt-4">
            {activeMainTab === 'projects' ? (
              <ProjectsListTab
                key={projectRefreshKey}
                client={client}
                displaySettings={projectDisplaySettings}
                onEdit={openEditDialog}
                onDelete={(projectId, projectName, projectCode) => {
                  console.log('[ProjectsPage] Delete project - ID:', projectId, 'Name:', projectName);
                  openDeleteDialog(projectId, projectName, projectCode);
                }}
              />
            ) : activeMainTab === 'tasks' ? (
              <TasksListTab
                key={taskRefreshKey}
                projects={allProjects}
                projectsLoading={projectsLoading}
                client={client}
                onEdit={openEditTaskDialog}
                onDelete={(taskId, taskName) => {
                  console.log('[ProjectsPage] Delete task - ID:', taskId, 'Name:', taskName);
                  openDeleteTaskDialog(taskId, taskName);
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <ProjectsPageDialogs
        orgId={orgId}
        deviceId={deviceId}
        baseUrl={baseUrl}
        token={token}
        projectsCollectionId={collections.projects}
        templateNodeId={undefined}
        createDialogOpen={createDialogOpen}
        editingProject={editingProject}
        deletingProject={deletingProject}
        onCloseCreate={() => {
          console.log('[ProjectsPage] Create dialog closed');
          closeCreateDialog();
        }}
        onCreate={async (data) => {
          console.log('[ProjectsPage] Create project submitted:', data);
          await createProject(data);
          closeCreateDialog();
          setProjectRefreshKey((prev) => prev + 1); // Force refresh projects tab
        }}
        onCloseEdit={closeEditDialog}
        onEdit={async (projectId, data) => {
          await updateProject(projectId, data);
          setProjectRefreshKey((prev) => prev + 1); // Force refresh projects tab
        }}
        onCloseDelete={closeDeleteDialog}
        onDelete={async (projectId) => {
          await deleteProject(projectId);
          setProjectRefreshKey((prev) => prev + 1); // Force refresh projects tab
        }}
      />

      {/* Task Create Dialog */}
      {createTaskDialogOpen && (
        <CreateTaskDialog
          projects={allProjects}
          onClose={closeCreateTaskDialog}
          onCreate={async (input) => {
            await createTask(input);
            closeCreateTaskDialog();
          }}
        />
      )}

      {/* Task Edit Dialog */}
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          projects={allProjects}
          onClose={closeEditTaskDialog}
          onUpdate={async (taskId, input) => {
            await updateTask(taskId, input);
            closeEditTaskDialog();
            setTaskRefreshKey((prev) => prev + 1); // Force refresh
          }}
        />
      )}

      {/* Task Delete Dialog */}
      {deletingTask && (
        <DeleteTaskDialog
          open={!!deletingTask}
          onOpenChange={(open) => {
            if (!open) closeDeleteTaskDialog();
          }}
          taskName={deletingTask.name}
          onConfirm={async () => {
            setIsDeletingTask(true);
            try {
              await deleteTask(deletingTask.id);
              closeDeleteTaskDialog();
              setTaskRefreshKey((prev) => prev + 1); // Force refresh
            } finally {
              setIsDeletingTask(false);
            }
          }}
          isDeleting={isDeletingTask}
        />
      )}
    </>
  );
}

// Export mount/unmount API for Module Federation
export default {
  mount: (container: HTMLElement, props?: ProjectsPageProps) => {
    console.log('[ProjectsPage] mount() called with props:', props);
    const root = createRoot(container);
    root.render(
      <ProjectsPage
        orgId={props?.orgId || ''}
        deviceId={props?.deviceId || ''}
        baseUrl={props?.baseUrl || ''}
        token={props?.token}
      />
    );
    return root;
  },

  unmount: (root: Root) => {
    console.log('[ProjectsPage] unmount() called');
    root.unmount();
  },
};
