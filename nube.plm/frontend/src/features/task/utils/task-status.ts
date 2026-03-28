export const TASK_STATUS_VALUES = ['pending', 'in-progress', 'completed', 'cancelled'] as const;

export type TaskStatusValue = (typeof TASK_STATUS_VALUES)[number];

export function normalizeTaskStatus(status?: string, completed?: boolean): TaskStatusValue {
  if (completed) {
    return 'completed';
  }

  const normalized = status?.trim().toLowerCase().replace(/_/g, '-');

  switch (normalized) {
    case 'completed':
      return 'completed';
    case 'in-progress':
    case 'inprogress':
      return 'in-progress';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'todo':
    case 'pending':
    default:
      return 'pending';
  }
}
