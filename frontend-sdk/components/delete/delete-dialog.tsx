/**
 * DeleteDialog - Reusable Delete Confirmation Component
 *
 * Generic delete confirmation dialog that can be used across
 * main frontend and plugins.
 *
 * Features:
 * - Automatic loading state handling
 * - Customizable content
 * - Destructive action styling
 * - Accessible (keyboard navigation, screen readers)
 *
 * @example
 * ```tsx
 * <DeleteDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Team"
 *   itemName="Engineering Team"
 *   onConfirm={handleDelete}
 *   isDeleting={isDeleting}
 * />
 * ```
 */

import { Loader2, Trash2 } from 'lucide-react';
import * as React from 'react';

import { Button } from '../../common/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../common/ui/dialog';

export interface DeleteDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback when dialog visibility changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title (defaults to "Delete Item") */
  title?: string;
  /** Name of the item being deleted (shown in description) */
  itemName?: string;
  /** Custom description text (overrides default) */
  description?: React.ReactNode;
  /** Additional warning text below description */
  warningText?: string;
  /** Callback when delete is confirmed */
  onConfirm: () => void | Promise<void>;
  /** Loading state (shows spinner on delete button) */
  isDeleting?: boolean;
  /** Custom delete button text (defaults to "Delete") */
  deleteButtonText?: string;
  /** Custom cancel button text (defaults to "Cancel") */
  cancelButtonText?: string;
  /** Show trash icon on delete button (defaults to true) */
  showIcon?: boolean;
}

export function DeleteDialog({
  open,
  onOpenChange,
  title = 'Delete Item',
  itemName,
  description,
  warningText = 'This action cannot be undone.',
  onConfirm,
  isDeleting = false,
  deleteButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  showIcon = true,
}: DeleteDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // Let parent handle errors via toast/error boundary
      console.error('Delete failed:', error);
    }
  };

  // Default description if none provided
  const defaultDescription = itemName ? (
    <>
      Are you sure you want to delete{' '}
      <span className="font-semibold">&quot;{itemName}&quot;</span>?
    </>
  ) : (
    'Are you sure you want to delete this item?'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ?? defaultDescription}
          </DialogDescription>
        </DialogHeader>

        {warningText && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">{warningText}</p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {cancelButtonText}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : showIcon ? (
              <Trash2 className="mr-2 h-4 w-4" />
            ) : null}
            {deleteButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
