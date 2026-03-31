/**
 * Project table component
 */

import { useEffect, useState } from 'react';

// @ts-ignore - SDK types are resolved at build time
import {
  Button,
  RightClickMenu,
  RightClickMenuItem,
} from '@rubix-sdk/frontend';
import { Project } from '@features/project/types/project.types';
import { formatPrice, formatProjectCode } from '@features/project/utils/project-formatters';
import { EditIcon, TrashIcon } from '@shared/components/icons';
import { ProjectStatusBadge } from './ProjectStatusBadge';

export interface ProjectTableDisplaySettings {
  showCode: boolean;
  showType: boolean;
  showStatus: boolean;
  showPrice: boolean;
  compactMode: boolean;
}

interface ProjectTableProps {
  projects: Project[];
  displaySettings: ProjectTableDisplaySettings;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string, projectName: string, projectCode?: string) => void;
}

const CELL_PADDING = {
  compact: '6px 4px',
  normal: '8px 4px',
} as const;

interface ProjectContextMenuState {
  project: Project;
  x: number;
  y: number;
}

export function ProjectTable({
  projects,
  displaySettings,
  onEdit,
  onDelete,
}: ProjectTableProps) {
  const [contextMenu, setContextMenu] = useState<ProjectContextMenuState | null>(null);
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

  const handleDelete = (project: Project) => {
    console.log('[ProjectTable] Delete clicked - Project:', project);
    console.log('[ProjectTable] Project ID:', project.id);
    console.log('[ProjectTable] Project Name:', project.name);
    onDelete(project.id, project.name, project.settings?.projectCode);
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
            <th style={{ padding: cellPadding, fontWeight: 600 }}>Name</th>
            {displaySettings.showCode && (
              <th style={{ padding: cellPadding, fontWeight: 600 }}>Code</th>
            )}
            {displaySettings.showType && (
              <th style={{ padding: cellPadding, fontWeight: 600 }}>Type</th>
            )}
            {displaySettings.showStatus && (
              <th style={{ padding: cellPadding, fontWeight: 600 }}>Status</th>
            )}
            {displaySettings.showPrice && (
              <th
                style={{
                  padding: cellPadding,
                  fontWeight: 600,
                  textAlign: 'right',
                }}
              >
                Price
              </th>
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
          {projects.map((project) => (
            <tr
              key={project.id}
              style={{
                borderBottom: '1px solid #f0f0f0',
                transition: 'background 0.15s',
              }}
              className="cursor-context-menu hover:bg-accent/30"
              onContextMenu={(event) => {
                event.preventDefault();
                setContextMenu({
                  project,
                  x: event.clientX,
                  y: event.clientY,
                });
              }}
            >
              <td style={{ padding: cellPadding }}>{project.name}</td>
              {displaySettings.showCode && (
                <td style={{ padding: cellPadding, color: '#666' }}>
                  {formatProjectCode(project.settings?.projectCode)}
                </td>
              )}
              {displaySettings.showType && (
                <td style={{ padding: cellPadding }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 500,
                    background: project.settings?.projectType === 'software' ? '#e0f2fe' : project.settings?.projectType === 'project' ? '#faf5ff' : '#f0fdf4',
                    color: project.settings?.projectType === 'software' ? '#0369a1' : project.settings?.projectType === 'project' ? '#7c3aed' : '#166534',
                  }}>
                    {project.settings?.projectType ?
                      project.settings.projectType.charAt(0).toUpperCase() + project.settings.projectType.slice(1)
                      : '-'}
                  </span>
                </td>
              )}
              {displaySettings.showStatus && (
                <td style={{ padding: cellPadding }}>
                  <ProjectStatusBadge status={project.settings?.status} />
                </td>
              )}
              {displaySettings.showPrice && (
                <td
                  style={{
                    padding: cellPadding,
                    textAlign: 'right',
                    fontFamily: 'monospace',
                  }}
                >
                  {formatPrice(project.settings?.price)}
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
                    onClick={() => onEdit(project)}
                    size={displaySettings.compactMode ? 'sm' : 'sm'}
                    variant="outline"
                    title="Edit project"
                  >
                    <EditIcon size={displaySettings.compactMode ? 12 : 14} />
                  </Button>
                  <Button
                    onClick={() => handleDelete(project)}
                    size={displaySettings.compactMode ? 'sm' : 'sm'}
                    variant="outline"
                    title="Delete project"
                    className="text-[var(--rubix-destructive)]"
                  >
                    <TrashIcon size={displaySettings.compactMode ? 12 : 14} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
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
            onEdit(contextMenu.project);
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
            handleDelete(contextMenu.project);
            setContextMenu(null);
          }}
        />
      </RightClickMenu>
    </>
  );
}
