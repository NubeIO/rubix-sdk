/**
 * ProjectsListTab - Extracted projects view for tab container
 *
 * Shows projects table with filtering (All, Software, Hardware)
 */

import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Project } from '@features/project/types/project.types';
import type { ProjectTableDisplaySettings } from '@features/project/components/ProjectTable';
import { ProjectsPageTabs } from './projects-page-tabs';

interface ProjectsListTabProps {
  client: PluginClient;
  displaySettings: ProjectTableDisplaySettings;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string, projectName: string, projectCode?: string) => void;
}

export function ProjectsListTab({
  client,
  displaySettings,
  onEdit,
  onDelete,
}: ProjectsListTabProps) {
  return (
    <ProjectsPageTabs
      client={client}
      displaySettings={displaySettings}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
