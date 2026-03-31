/**
 * Project-specific utilities
 */

import { ProjectFormData, ProjectFormErrors } from './types';

export function validateProjectForm(formData: ProjectFormData): {
  isValid: boolean;
  errors: ProjectFormErrors;
} {
  const errors: ProjectFormErrors = {};

  if (!formData.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!formData.projectCode.trim()) {
    errors.projectCode = 'Project code is required';
  }

  if (formData.price && parseFloat(formData.price) < 0) {
    errors.price = 'Price must be 0 or greater';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formatPrice(price?: number): string {
  if (price == null) return '—';
  return `$${price.toFixed(2)}`;
}

export function formatProjectCode(code?: string): string {
  return code || '—';
}
