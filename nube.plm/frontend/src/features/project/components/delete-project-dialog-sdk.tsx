/**
 * Delete Project Dialog - Using SHARED SDK Component
 *
 * This uses the EXACT SAME DeleteDialog as the host.
 * ONE import from @rubix-sdk/frontend - truly shared!
 */

import { DeleteDialog } from '@rubix-sdk/frontend';

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
}

export function DeleteProjectDialogSDK({
  open,
  onOpenChange,
  projectName,
  onConfirm,
  isDeleting = false,
}: DeleteProjectDialogProps) {
  return (
    <DeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Project"
      itemName={projectName}
      onConfirm={onConfirm}
      isDeleting={isDeleting}
    />
  );
}
