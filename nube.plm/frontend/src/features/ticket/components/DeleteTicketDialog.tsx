/**
 * Delete Ticket Dialog - Confirmation before removing a ticket
 */

import { useState, type MouseEvent } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Ticket } from '../types/ticket.types';

interface DeleteTicketDialogProps {
  client: any;
  ticket: Ticket;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

export function DeleteTicketDialog({
  client,
  ticket,
  onClose,
  onSuccess,
}: DeleteTicketDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await client.deleteNode(ticket.id);
      await onSuccess();
      onClose();
    } catch (deleteError) {
      console.error('[DeleteTicketDialog] Failed to delete ticket:', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete ticket');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={true} onOpenChange={(open: boolean) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the ticket and any progress contribution it makes to the parent task.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg border bg-muted/40 p-3">
          <div className="text-sm font-medium">{ticket.name}</div>
          <div className="mt-1 text-xs text-muted-foreground">{ticket.id}</div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.preventDefault();
              void handleDelete();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Ticket'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
