/**
 * ProjectTypeTabs - Tabbed interface for filtering projects by type
 *
 * Tabs:
 * - All: Shows all projects
 * - Software: Filters to settings.projectType is "software"
 * - Hardware: Filters to settings.projectType is "hardware"
 */

import { Package, Cpu, HardDrive, FolderKanban } from 'lucide-react';
// @ts-ignore - SDK types are resolved at build time
import { FilteredTableWithTabs, type FilteredTab } from '@rubix-sdk/frontend/components';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';

import type { Project } from '@features/project/types/project.types';
import { ProjectTable, type ProjectTableDisplaySettings } from '@features/project/components/ProjectTable';

const TABS: FilteredTab[] = [
  {
    value: 'all',
    label: 'All',
    icon: Package,
    filter: undefined, // No filter - show all
  },
  {
    value: 'hardware',
    label: 'Hardware',
    icon: HardDrive,
    filter: 'settings.projectType is "hardware"',
  },
  {
    value: 'software',
    label: 'Software',
    icon: Cpu,
    filter: 'settings.projectType is "software"',
  },
  {
    value: 'project',
    label: 'Projects',
    icon: FolderKanban,
    filter: 'settings.projectType is "project"',
  },
];

interface ProjectsPageTabsProps {
  client: PluginClient;
  displaySettings: ProjectTableDisplaySettings;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string, projectName: string, projectCode?: string) => void;
}

export function ProjectsPageTabs({
  client,
  displaySettings,
  onEdit,
  onDelete,
}: ProjectsPageTabsProps) {
  return (
    <FilteredTableWithTabs<Project>
      tabs={TABS}
      baseFilter='type is "plm.project"'
      client={client}
      renderTable={(projects, isRefreshing) => (
        <div className={isRefreshing ? 'opacity-50 pointer-events-none' : ''}>
          <div className="border rounded-lg">
            <ProjectTable
              projects={projects}
              displaySettings={displaySettings}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      )}
      renderEmpty={() => (
        <div className="border rounded-lg p-12 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground">
              No projects match the current filter
            </p>
          </div>
        </div>
      )}
    />
  );
}
