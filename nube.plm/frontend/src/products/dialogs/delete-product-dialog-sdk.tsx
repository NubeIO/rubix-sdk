/**
 * Delete Product Dialog - Using SHARED SDK Component
 *
 * This uses the EXACT SAME DeleteDialog as the host.
 * ONE import from @rubix-sdk/frontend - truly shared!
 */

import { DeleteDialog } from '@rubix-sdk/frontend';

interface DeleteProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
}

export function DeleteProductDialogSDK({
  open,
  onOpenChange,
  productName,
  onConfirm,
  isDeleting = false,
}: DeleteProductDialogProps) {
  return (
    <DeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Product"
      itemName={productName}
      onConfirm={onConfirm}
      isDeleting={isDeleting}
    />
  );
}
