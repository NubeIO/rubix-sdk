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
import * as React from 'react';
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
export declare function DeleteDialog({ open, onOpenChange, title, itemName, description, warningText, onConfirm, isDeleting, deleteButtonText, cancelButtonText, showIcon, }: DeleteDialogProps): import("react/jsx-runtime").JSX.Element;
