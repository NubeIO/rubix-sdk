import { useState } from 'react';

import type { Project } from '@features/project/types/project.types';

interface UseProjectsPageStateOptions {
  onRefresh: () => Promise<void>;
}

export function useProjectsPageState({
  onRefresh,
}: UseProjectsPageStateOptions) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<{
    id: string;
    name: string;
    code?: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const startTime = Date.now();

    await onRefresh();

    const elapsed = Date.now() - startTime;
    if (elapsed < 500) {
      await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
    }

    setIsRefreshing(false);
  };

  return {
    createDialogOpen,
    editingProject,
    deletingProject,
    isRefreshing,
    openCreateDialog: () => setCreateDialogOpen(true),
    closeCreateDialog: () => setCreateDialogOpen(false),
    openEditDialog: (project: Project) => setEditingProject(project),
    closeEditDialog: () => setEditingProject(null),
    openDeleteDialog: (projectId: string, projectName: string, projectCode?: string) =>
      setDeletingProject({ id: projectId, name: projectName, code: projectCode }),
    closeDeleteDialog: () => setDeletingProject(null),
    handleRefresh,
  };
}
