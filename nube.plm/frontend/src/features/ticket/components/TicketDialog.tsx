/**
 * Ticket Dialog - Create and edit tickets under a task
 */

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TicketForm, type TicketFormValues } from './TicketForm';
import type { Ticket } from '../types/ticket.types';
import { normalizeTicketStatus, TICKET_IDENTITY } from '../utils/ticket-helpers';

interface TicketDialogProps {
  client: any;
  taskId: string;
  ticket?: Ticket;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

const DEFAULT_VALUES: TicketFormValues = {
  name: '',
  description: '',
  ticketType: 'task',
  status: 'pending',
  priority: 'Medium',
  assignee: '',
  dueDate: '',
  estimatedHours: '',
};

export function TicketDialog({ client, taskId, ticket, onClose, onSuccess }: TicketDialogProps) {
  const isEditMode = Boolean(ticket);
  const [values, setValues] = useState<TicketFormValues>(DEFAULT_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticket) {
      setValues(DEFAULT_VALUES);
      return;
    }

    setValues({
      name: ticket.name || '',
      description: ticket.settings?.description || '',
      ticketType: ticket.settings?.ticketType || 'task',
      status: normalizeTicketStatus(ticket.settings?.status) as TicketFormValues['status'],
      priority: ticket.settings?.priority || 'Medium',
      assignee: ticket.settings?.assignee || '',
      dueDate: ticket.settings?.dueDate || '',
      estimatedHours: ticket.settings?.estimatedHours ? String(ticket.settings.estimatedHours) : '',
    });
  }, [ticket]);

  const identity = useMemo(() => {
    switch (values.ticketType) {
      case 'bug':
        return TICKET_IDENTITY.BUG;
      case 'feature':
        return TICKET_IDENTITY.FEATURE;
      case 'chore':
        return TICKET_IDENTITY.CHORE;
      default:
        return TICKET_IDENTITY.TASK;
    }
  }, [values.ticketType]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!values.name.trim()) {
      setError('Ticket name is required');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        description: values.description || undefined,
        ticketType: values.ticketType,
        status: normalizeTicketStatus(values.status),
        priority: values.priority,
        assignee: values.assignee || 'Unassigned',
        dueDate: values.dueDate || undefined,
        estimatedHours: values.estimatedHours ? Number(values.estimatedHours) : 0,
      };

      if (isEditMode && ticket) {
        if (values.name.trim() !== ticket.name) {
          await client.updateNode(ticket.id, { name: values.name.trim() });
        }

        await client.updateNodeSettings(ticket.id, payload);
      } else {
        await client.createNode(taskId, {
          type: 'plm.ticket',
          name: values.name.trim(),
          identity,
          settings: payload,
        });
      }

      await onSuccess();
      onClose();
    } catch (submitError) {
      console.error('[TicketDialog] Failed to save ticket:', submitError);
      setError(submitError instanceof Error ? submitError.message : 'Failed to save ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Ticket' : 'Create Ticket'}</DialogTitle>
          <DialogDescription>
            Capture the work item details and keep the parent task progress in sync.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <TicketForm values={values} onChange={setValues} disabled={isSubmitting} />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Ticket')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
