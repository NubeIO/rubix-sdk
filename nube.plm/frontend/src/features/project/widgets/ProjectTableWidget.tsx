/**
 * Project Table Widget
 *
 * Feature-first architecture - all project code in projects/
 * Refactored from 962 lines monolith to ~140 line orchestrator
 */

import { useState } from 'react';
// @ts-ignore - SDK types are resolved at build time
import { Button, Skeleton } from '@rubix-sdk/frontend/common/ui';
import '@rubix-sdk/frontend/globals.css';

import { Project } from '@features/project/types/project.types';
import { useProjects } from '@features/project/hooks/use-projects';
import { PlusIcon } from '@shared/components/icons';
import { ProjectTable } from '@features/project/components/ProjectTable';
import {
  DeleteProjectDialogSDK as DeleteProjectDialog,
  CreateProjectDialogSDK,
  EditProjectDialogSDK,
} from '@features/project/components';

export interface WidgetSettings {
  display?: {
    showCode?: boolean;
    showStatus?: boolean;
    showPrice?: boolean;
    compactMode?: boolean;
  };
  refresh?: {
    interval?: number;
    enableAutoRefresh?: boolean;
  };
}

export interface ProjectTableWidgetProps {
  orgId?: string;
  deviceId?: string;
  baseUrl?: string;
  token?: string;
  settings?: WidgetSettings;
  config?: Record<string, unknown>;
  nodeId?: string;
}

export default function ProjectTableWidget({
  orgId,
  deviceId,
  baseUrl,
  token,
  settings,
}: ProjectTableWidgetProps) {
  // Parse settings with defaults
  const showCode = settings?.display?.showCode ?? true;
  const showStatus = settings?.display?.showStatus ?? true;
  const showPrice = settings?.display?.showPrice ?? true;
  const compactMode = settings?.display?.compactMode ?? false;
  const interval = (settings?.refresh?.interval ?? 30) * 1000;
  const autoRefresh = settings?.refresh?.enableAutoRefresh ?? true;

  // Projects CRUD (includes PLM hierarchy initialization)
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    createProject,
    updateProject,
    deleteProject,
    projectsCollectionId,
    hierarchyLoading,
    hierarchyError,
  } = useProjects({
    orgId: orgId || '',
    deviceId: deviceId || '',
    baseUrl,
    token,
    autoRefresh,
    refreshInterval: interval,
  });

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  // Computed
  const canCreate = !!(orgId && deviceId && baseUrl && projectsCollectionId);
  const loading = hierarchyLoading || projectsLoading;
  const error = hierarchyError || projectsError;

  const displaySettings = {
    showCode,
    showStatus,
    showPrice,
    compactMode,
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-4">
        <div className="mb-3">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-sm">
        <div className="text-destructive mb-3">Error: {error}</div>
      </div>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground text-center mb-4 text-sm">
          No projects found. Create one to get started.
        </div>
        <div className="text-center">
          <Button onClick={() => setCreateDialogOpen(true)} disabled={!canCreate} size="sm">
            <PlusIcon size={compactMode ? 12 : 14} />
            New Project
          </Button>
        </div>

        {/* TODO: Re-implement with multi-settings SDK
        <CreateProjectDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={createProject}
        />
        */}
      </div>
    );
  }

  // Main content
  return (
    <div className="p-4 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-muted-foreground">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} disabled={!canCreate} size="sm">
          <PlusIcon size={14} />
          New Project
        </Button>
      </div>

      {/* Table */}
      <ProjectTable
        projects={projects}
        displaySettings={displaySettings}
        onEdit={(project) => setEditingProject(project)}
        onDelete={(projectId, projectName, projectCode) =>
          setDeletingProject({
            id: projectId,
            name: projectName,
            settings: projectCode ? { projectCode } : {},
          })
        }
      />

      {/* Create Project Dialog */}
      {createDialogOpen && (
        <CreateProjectDialogSDK
          orgId={orgId || ''}
          deviceId={deviceId || ''}
          baseUrl={baseUrl}
          token={token}
          projectsCollectionId={projectsCollectionId || ''}
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={createProject}
        />
      )}

      {/* Edit Project Dialog */}
      {editingProject && (
        <EditProjectDialogSDK
          orgId={orgId || ''}
          deviceId={deviceId || ''}
          baseUrl={baseUrl}
          token={token}
          project={editingProject}
          open={true}
          onClose={() => setEditingProject(null)}
          onSubmit={updateProject}
        />
      )}

      {deletingProject && (
        <DeleteProjectDialog
          open={true}
          projectName={deletingProject.name}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingProject(null);
            }
          }}
          onConfirm={async () => {
            await deleteProject(deletingProject.id);
            setDeletingProject(null);
          }}
        />
      )}
    </div>
  );
}
