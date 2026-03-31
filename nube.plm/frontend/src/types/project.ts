/**
 * Project domain types
 */

export interface Project {
  id: string;
  name: string;
  settings?: ProjectSettings;
}

export interface ProjectSettings {
  projectCode?: string;
  description?: string;
  status?: ProjectStatus;
  price?: number;
}

export type ProjectStatus = 'Design' | 'Prototype' | 'Production' | 'Discontinued';

export const PROJECT_STATUSES: ProjectStatus[] = [
  'Design',
  'Prototype',
  'Production',
  'Discontinued',
];
