/**
 * Project domain types
 */

import type { Node } from '../../../../../frontend-sdk/ras/types';

export interface ProjectSettings {
  projectCode?: string;
  description?: string;
  projectType?: ProjectType;
  status?: ProjectStatus;
  price?: number;
  [key: string]: unknown;
}

export type Project = Node & {
  id: string;
  name: string;
  settings?: ProjectSettings;
};

export type ProjectType = 'software' | 'hardware' | 'project';

export const PROJECT_TYPES: ProjectType[] = ['software', 'hardware', 'project'];

export type ProjectStatus = 'Design' | 'Prototype' | 'Production' | 'Discontinued' | 'planned' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export const PROJECT_STATUSES: ProjectStatus[] = [
  'Design',
  'Prototype',
  'Production',
  'Discontinued',
];

export const PROJECT_ONLY_STATUSES: ProjectStatus[] = [
  'planned',
  'active',
  'on_hold',
  'completed',
  'cancelled',
];

export interface ProjectFormData {
  name: string;
  projectCode: string;
  description: string;
  projectType: ProjectType;
  status: ProjectStatus;
  price: string;
}

export type ProjectFormErrors = Partial<Record<keyof ProjectFormData, string>>;

export const DEFAULT_FORM_DATA: ProjectFormData = {
  name: '',
  projectCode: '',
  description: '',
  projectType: 'software',
  status: 'Design',
  price: '',
};
