/**
 * Form data types
 */

export interface ProjectFormData {
  name: string;
  projectCode: string;
  description: string;
  status: string;
  price: string;
}

export type ProjectFormErrors = Partial<Record<keyof ProjectFormData, string>>;

export const DEFAULT_FORM_DATA: ProjectFormData = {
  name: '',
  projectCode: '',
  description: '',
  status: 'Design',
  price: '',
};
