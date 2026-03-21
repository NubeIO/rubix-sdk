/**
 * Delete product confirmation dialog
 */

import { useState } from 'react';
// Import from plugin's own UI components - no SDK dependency for UI
import { Button } from '@/ui/button';
// ZERO-DEPENDENCY Dialog (no Radix UI, no external libs)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/zero-dialog';

interface DeleteProductDialogProps {
  open: boolean;
  productId: string;
  productName: string;
  productCode?: string;
  onClose: () => void;
  onConfirm: (productId: string) => Promise<void>;
}

export function DeleteProductDialog({
  open,
  productId,
  productName,
  productCode,
  onClose,
  onConfirm
}: DeleteProductDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    console.log('[DeleteProductDialog] Confirming delete - ID:', productId);
    setIsDeleting(true);
    try {
      await onConfirm(productId);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-[var(--rubix-muted-foreground)]">
          Are you sure you want to delete <strong>{productName}</strong>
          {productCode && (
            <span> ({productCode})</span>
          )}
          ? This action cannot be undone.
        </p>

        <DialogFooter>
          <Button onClick={handleClose} disabled={isDeleting} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isDeleting} variant="destructive">
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
