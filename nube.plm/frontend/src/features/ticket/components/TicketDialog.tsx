/**
 * Ticket Dialog - Create and edit tickets under a task
 */

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TicketForm, type TicketFormValues } from './TicketForm';
import type { Ticket } from '../types/ticket.types';
import { normalizeTicketStatus, TICKET_IDENTITY } from '../utils/ticket-helpers';

interface Task {
  id: string;
  name: string;
}

interface TicketDialogProps {
  client: any;
  taskId: string;
  ticket?: Ticket;
  tasks?: Task[]; // Optional: available tasks for selection
  productId?: string; // Optional: product ID for product-level tickets
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

const DEFAULT_VALUES: TicketFormValues = {
  name: '',
  description: '',
  ticketType: 'task',
  status: 'pending',
  priority: 'Medium',
  assignees: [],
  dueDate: '',
  estimatedHours: '',
};

export function TicketDialog({ client, taskId, ticket, tasks, productId, onClose, onSuccess }: TicketDialogProps) {
  const isEditMode = Boolean(ticket);
  const [values, setValues] = useState<TicketFormValues>(DEFAULT_VALUES);
  const [selectedParentId, setSelectedParentId] = useState<string>(taskId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showTaskSelector = !isEditMode && tasks && tasks.length > 0 && productId;

  useEffect(() => {
    if (!ticket) {
      setValues(DEFAULT_VALUES);
      return;
    }

    // Load assignedUserRefs for this ticket
    client.getAssignedUsers(ticket.id).then((refs: any[]) => {
      setValues((prev) => ({
        ...prev,
        assignees: (refs || []).map((r: any) => ({ userId: r.toNodeId, userName: r.displayName || '' })),
      }));
    }).catch(() => {});

    setValues({
      name: ticket.name || '',
      description: ticket.settings?.description || '',
      ticketType: ticket.settings?.ticketType || 'task',
      status: normalizeTicketStatus(ticket.settings?.status) as TicketFormValues['status'],
      priority: ticket.settings?.priority || 'Medium',
      assignees: [],
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
        dueDate: values.dueDate || undefined,
        estimatedHours: values.estimatedHours ? Number(values.estimatedHours) : 0,
      };

      let nodeId: string;

      if (isEditMode && ticket) {
        nodeId = ticket.id;
        if (values.name.trim() !== ticket.name) {
          await client.updateNode(ticket.id, { name: values.name.trim() });
        }
        await client.updateNodeSettings(ticket.id, payload);
      } else {
        const created = await client.createNode(selectedParentId, {
          type: 'plm.ticket',
          name: values.name.trim(),
          identity,
          settings: payload,
        });
        nodeId = created.id;
      }

      // Set assignedUserRefs
      console.log('[TicketDialog] Setting assignees on node:', nodeId, 'assignees:', JSON.stringify(values.assignees));
      await client.replaceAssignedUsers(nodeId, values.assignees);
      console.log('[TicketDialog] Assignees set successfully');

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
          {showTaskSelector && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Parent Task <span className="text-muted-foreground">(optional)</span>
              </label>
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                disabled={isSubmitting}
              >
                <option value={productId}>Product-level (Support, RMA, etc.)</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Choose a task for work items (e.g., "buy cheese" for task "make pizza"),
                or select Product-level for general tickets (Support, RMA, etc.)
              </p>
            </div>
          )}

          <TicketForm values={values} onChange={setValues} client={client} disabled={isSubmitting} />

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
