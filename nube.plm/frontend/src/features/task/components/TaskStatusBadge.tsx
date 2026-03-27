/**
 * Task status badge component
 */

interface TaskStatusBadgeProps {
  status?: string;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  todo: { bg: '#f3f4f6', color: '#374151', label: 'To Do' },
  in_progress: { bg: '#dbeafe', color: '#1e40af', label: 'In Progress' },
  review: { bg: '#fef3c7', color: '#92400e', label: 'Review' },
  blocked: { bg: '#fee2e2', color: '#991b1b', label: 'Blocked' },
  completed: { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
  cancelled: { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelled' },
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const style = STATUS_STYLES[status || 'todo'] || STATUS_STYLES.todo;

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
