/**
 * Project-specific hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { Project, ProjectSettings } from '@features/project/types/project.types';
import { usePLMHierarchy } from '@shared/hooks/use-plm-hierarchy';

export interface UseProjectsConfig {
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: string | null;
  createProject: (input: { name: string; parentId: string; settings: ProjectSettings }) => Promise<void>;
  updateProject: (projectId: string, input: { name?: string; settings: ProjectSettings }) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  refetch: () => Promise<void>;
  projectsCollectionId: string | null;
  hierarchyLoading: boolean;
  hierarchyError: string | null;
}

export function useProjects(config: UseProjectsConfig): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create plugin client - use SDK directly!
  const client = createPluginClient({
    orgId: config.orgId,
    deviceId: config.deviceId,
    baseUrl: config.baseUrl,
    token: config.token,
  });

  // Get PLM hierarchy (projects collection ID)
  const { collections, loading: hierarchyLoading, error: hierarchyError } = usePLMHierarchy(
    config.orgId,
    config.deviceId,
    config.baseUrl,
    config.token
  );

  console.log('[useProjects] Hierarchy state:', {
    collections,
    hierarchyLoading,
    hierarchyError,
  });

  const fetchProjects = useCallback(async () => {
    console.log('[useProjects] fetchProjects called', {
      orgId: config.orgId,
      deviceId: config.deviceId,
      baseUrl: config.baseUrl,
      hasToken: !!config.token,
    });

    if (!config.orgId || !config.deviceId) {
      console.warn('[useProjects] Missing orgId or deviceId');
      setLoading(false);
      return;
    }

    try {
      console.log('[useProjects] Fetching projects with SDK...');

      // Use projects collection as parent filter (if available)
      const parentId = collections.projects || undefined;
      const filter = parentId
        ? `parent.id is "${parentId}" and type is "plm.project"`
        : 'type is "plm.project"';

      console.log('[useProjects] Calling SDK queryNodes with filter:', filter);
      const fetchedProjects = await client.queryNodes({ filter });
      console.log('[useProjects] Got projects:', {
        count: fetchedProjects.length,
        projects: fetchedProjects,
      });
      setProjects(fetchedProjects as Project[]);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(errorMsg);
      console.error('[useProjects] Fetch error:', {
        error: err,
        message: errorMsg,
        stack: err instanceof Error ? err.stack : undefined,
      });
    } finally {
      console.log('[useProjects] Setting loading=false');
      setLoading(false);
    }
  }, [config.orgId, config.deviceId, config.baseUrl, config.token, collections.projects]);

  const createProject = useCallback(
    async (input: { name: string; parentId: string; settings: ProjectSettings }) => {
      if (!collections.projects) {
        throw new Error('Projects collection not found - restart plugin');
      }

      const newProjectCode = typeof input.settings?.projectCode === 'string'
        ? input.settings.projectCode
        : '';
      if (newProjectCode && projects.some((project) => (
        project.settings?.projectCode === newProjectCode
      ))) {
        throw new Error(`Project code '${input.settings?.projectCode}' already exists`);
      }

      // Use SDK createNode instead of ProjectsAPI
      await client.createNode(input.parentId, {
        type: 'plm.project',
        name: input.name,
        settings: input.settings,
      });
      await fetchProjects();
    },
    [client, collections.projects, fetchProjects, projects]
  );

  const updateProject = useCallback(
    async (projectId: string, input: { name?: string; settings: ProjectSettings }) => {
      // Update name if provided
      if (input.name) {
        await client.updateNode(projectId, { name: input.name });
      }
      // Update settings (uses PATCH endpoint for deep merge)
      await client.updateNodeSettings(projectId, input.settings);
      await fetchProjects();
    },
    [client, fetchProjects]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      // Use SDK deleteNode instead of ProjectsAPI
      await client.deleteNode(projectId);
      await fetchProjects();
    },
    [client, fetchProjects]
  );

  // Initial fetch
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Auto-refresh
  useEffect(() => {
    if (!config.autoRefresh || !config.refreshInterval) return;

    const intervalId = setInterval(fetchProjects, config.refreshInterval);
    return () => clearInterval(intervalId);
  }, [config.autoRefresh, config.refreshInterval, fetchProjects]);

  const result = {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
    projectsCollectionId: collections.projects || null,
    hierarchyLoading,
    hierarchyError,
  };

  console.log('[useProjects] Returning result:', {
    projectsCount: projects.length,
    loading,
    error,
    projectsCollectionId: collections.projects || null,
    hierarchyLoading,
    hierarchyError,
  });

  return result;
}
