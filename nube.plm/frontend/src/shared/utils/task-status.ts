export const TASK_STATUS_VALUES = ['pending', 'in-progress', 'blocked', 'review', 'completed', 'cancelled'] as const;

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
      return 'in-progress';
    case 'blocked':
      return 'blocked';
    case 'review':
      return 'review';
    case 'cancelled':
      return 'cancelled';
    case 'pending':
    default:
      return 'pending';
  }
}
