/**
 * Task table component
 */

import { useEffect, useState } from 'react';

// @ts-ignore - SDK types are resolved at build time
import { Button } from '@rubix-sdk/frontend/common/ui';
// @ts-ignore
import { RightClickMenu, RightClickMenuItem } from '@rubix-sdk/frontend/components/context-menu';
import { Task } from '@features/task/types/task.types';
import { EditIcon, TrashIcon } from '@shared/components/icons';
import { TaskStatusBadge } from './TaskStatusBadge';

export interface TaskTableDisplaySettings {
  showStatus: boolean;
  showPriority: boolean;
  showProgress: boolean;
  showAssignee: boolean;
  compactMode: boolean;
}

interface TaskTableProps {
  tasks: Task[];
  displaySettings: TaskTableDisplaySettings;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string, taskName: string) => void;
}

const CELL_PADDING = {
  compact: '6px 4px',
  normal: '8px 4px',
} as const;

interface TaskContextMenuState {
  task: Task;
  x: number;
  y: number;
}

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  low: { bg: '#f3f4f6', color: '#6b7280' },
  medium: { bg: '#fef3c7', color: '#92400e' },
  high: { bg: '#fed7aa', color: '#9a3412' },
  critical: { bg: '#fee2e2', color: '#991b1b' },
};

export function TaskTable({
  tasks,
  displaySettings,
  onEdit,
  onDelete,
}: TaskTableProps) {
  const [contextMenu, setContextMenu] = useState<TaskContextMenuState | null>(null);
  const cellPadding = displaySettings.compactMode ? CELL_PADDING.compact : CELL_PADDING.normal;

  useEffect(() => {
    if (!contextMenu) {
      return undefined;
    }

    const closeMenu = () => setContextMenu(null);

    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);

    return () => {
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, [contextMenu]);

  const handleDelete = (task: Task) => {
    console.log('[TaskTable] Delete clicked - Task:', task);
    onDelete(task.id, task.name);
  };

  return (
    <>
      <table
        className="w-full text-xs"
        style={{
          borderCollapse: 'collapse',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
            <th style={{ padding: cellPadding, fontWeight: 600 }}>Task Name</th>
            {displaySettings.showStatus && (
              <th style={{ padding: cellPadding, fontWeight: 600 }}>Status</th>
            )}
            {displaySettings.showPriority && (
              <th style={{ padding: cellPadding, fontWeight: 600 }}>Priority</th>
            )}
            {displaySettings.showProgress && (
              <th style={{ padding: cellPadding, fontWeight: 600 }}>Progress</th>
            )}
            {displaySettings.showAssignee && (
              <th style={{ padding: cellPadding, fontWeight: 600 }}>Assignee</th>
            )}
            <th
              style={{
                padding: cellPadding,
                fontWeight: 600,
                textAlign: 'right',
                width: displaySettings.compactMode ? 60 : 80,
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const priority = task.settings?.priority || 'medium';
            const priorityStyle = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;

            return (
              <tr
                key={task.id}
                style={{
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'background 0.15s',
                }}
                className="cursor-context-menu hover:bg-accent/30"
                onContextMenu={(event) => {
                  event.preventDefault();
                  setContextMenu({
                    task,
                    x: event.clientX,
                    y: event.clientY,
                  });
                }}
              >
                <td style={{ padding: cellPadding }}>
                  <div>
                    <div className="font-medium">{task.name}</div>
                    {task.settings?.description && (
                      <div className="text-muted-foreground text-[10px] mt-0.5 line-clamp-1">
                        {task.settings.description}
                      </div>
                    )}
                  </div>
                </td>
                {displaySettings.showStatus && (
                  <td style={{ padding: cellPadding }}>
                    <TaskStatusBadge status={task.settings?.status} />
                  </td>
                )}
                {displaySettings.showPriority && (
                  <td style={{ padding: cellPadding }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 500,
                        background: priorityStyle.bg,
                        color: priorityStyle.color,
                        textTransform: 'capitalize',
                      }}
                    >
                      {priority}
                    </span>
                  </td>
                )}
                {displaySettings.showProgress && (
                  <td style={{ padding: cellPadding }}>
                    <div className="flex items-center gap-2">
                      <div
                        style={{
                          width: '60px',
                          height: '6px',
                          background: '#e5e7eb',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${task.settings?.progress || 0}%`,
                            height: '100%',
                            background: '#3b82f6',
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {Math.round(task.settings?.progress || 0)}%
                      </span>
                    </div>
                  </td>
                )}
                {displaySettings.showAssignee && (
                  <td style={{ padding: cellPadding, color: '#666' }}>
                    {task.settings?.assignee || '-'}
                  </td>
                )}
                <td
                  style={{
                    padding: cellPadding,
                    textAlign: 'right',
                  }}
                >
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <Button
                      onClick={() => onEdit(task)}
                      size={displaySettings.compactMode ? 'sm' : 'sm'}
                      variant="outline"
                      title="Edit task"
                    >
                      <EditIcon size={displaySettings.compactMode ? 12 : 14} />
                    </Button>
                    <Button
                      onClick={() => handleDelete(task)}
                      size={displaySettings.compactMode ? 'sm' : 'sm'}
                      variant="outline"
                      title="Delete task"
                      className="text-[var(--rubix-destructive)]"
                    >
                      <TrashIcon size={displaySettings.compactMode ? 12 : 14} />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <RightClickMenu
        open={!!contextMenu}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        onClose={() => setContextMenu(null)}
      >
        <RightClickMenuItem
          icon={<EditIcon size={16} />}
          label="Edit"
          onSelect={() => {
            if (!contextMenu) {
              return;
            }
            onEdit(contextMenu.task);
            setContextMenu(null);
          }}
        />
        <RightClickMenuItem
          icon={<TrashIcon size={16} />}
          label="Delete"
          destructive
          onSelect={() => {
            if (!contextMenu) {
              return;
            }
            handleDelete(contextMenu.task);
            setContextMenu(null);
          }}
        />
      </RightClickMenu>
    </>
  );
}
