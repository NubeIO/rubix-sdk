/**
 * Delete Task Dialog - Using SHARED SDK Component
 */

import { DeleteDialog } from '@rubix-sdk/frontend';

interface DeleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
}

export function DeleteTaskDialog({
  open,
  onOpenChange,
  taskName,
  onConfirm,
  isDeleting = false,
}: DeleteTaskDialogProps) {
  return (
    <DeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Task"
      itemName={taskName}
      onConfirm={onConfirm}
      isDeleting={isDeleting}
    />
  );
}
