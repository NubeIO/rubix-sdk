import type { Project } from '@features/project/types/project.types';
import {
  DeleteProjectDialogSDK as DeleteProjectDialog,
  CreateProjectDialogSDK,
  EditProjectDialogSDK,
} from '@features/project/components';
import type { CreateProjectDialogProps } from '@features/project/components/create-project-dialog-sdk';
import type { EditProjectDialogProps } from '@features/project/components/edit-project-dialog-sdk';

interface DeletingProject {
  id: string;
  name: string;
  code?: string;
}

interface ProjectsPageDialogsProps {
  orgId: string;
  deviceId: string;
  baseUrl: string;
  token?: string;
  projectsCollectionId?: string | null;
  templateNodeId?: string;
  createDialogOpen: boolean;
  editingProject: Project | null;
  deletingProject: DeletingProject | null;
  onCloseCreate: () => void;
  onCreate: CreateProjectDialogProps['onSubmit'];
  onCloseEdit: () => void;
  onEdit: EditProjectDialogProps['onSubmit'];
  onCloseDelete: () => void;
  onDelete: (projectId: string) => Promise<void>;
}

export function ProjectsPageDialogs({
  orgId,
  deviceId,
  baseUrl,
  token,
  projectsCollectionId,
  templateNodeId,
  createDialogOpen,
  editingProject,
  deletingProject,
  onCloseCreate,
  onCreate,
  onCloseEdit,
  onEdit,
  onCloseDelete,
  onDelete,
}: ProjectsPageDialogsProps) {
  return (
    <>
      {createDialogOpen && (
        <CreateProjectDialogSDK
          orgId={orgId}
          deviceId={deviceId}
          baseUrl={baseUrl}
          token={token}
          projectsCollectionId={projectsCollectionId || ''}
          templateNodeId={templateNodeId}
          open={createDialogOpen}
          onClose={onCloseCreate}
          onSubmit={onCreate}
        />
      )}

      {editingProject && (
        <EditProjectDialogSDK
          orgId={orgId}
          deviceId={deviceId}
          baseUrl={baseUrl}
          token={token}
          project={editingProject}
          open={true}
          onClose={onCloseEdit}
          onSubmit={onEdit}
        />
      )}

      {deletingProject && (
        <DeleteProjectDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              onCloseDelete();
            }
          }}
          projectName={deletingProject.name}
          onConfirm={async () => {
            await onDelete(deletingProject.id);
            onCloseDelete();
          }}
        />
      )}
    </>
  );
}
