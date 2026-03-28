/**
 * Task status badge component
 */

import { normalizeTaskStatus } from '@features/task/utils/task-status';

interface TaskStatusBadgeProps {
  status?: string;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: '#f3f4f6', color: '#374151', label: 'Pending' },
  'in-progress': { bg: '#dbeafe', color: '#1e40af', label: 'In Progress' },
  blocked: { bg: '#fee2e2', color: '#b91c1c', label: 'Blocked' },
  review: { bg: '#dbeafe', color: '#1d4ed8', label: 'In Review' },
  completed: { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
  cancelled: { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelled' },
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const normalizedStatus = normalizeTaskStatus(status);
  const style = STATUS_STYLES[normalizedStatus];

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 500,
        background: style.bg,
        color: style.color,
      }}
    >
      {style.label}
    </span>
  );
}
