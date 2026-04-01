/**
 * Ticket Form - Shared fields for create and edit flows
 */

import type { ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
// @ts-ignore - SDK types
import { UserPicker, type SelectedUser } from '@rubix-sdk/frontend/common/ui/user-picker';
import type { TicketSettings } from '../types/ticket.types';

export interface TicketFormValues {
  name: string;
  description: string;
  ticketType: NonNullable<TicketSettings['ticketType']>;
  status: NonNullable<TicketSettings['status']>;
  priority: NonNullable<TicketSettings['priority']>;
  assignees: SelectedUser[];
  dueDate: string;
  estimatedHours: string;
}

interface TicketFormProps {
  values: TicketFormValues;
  onChange: (values: TicketFormValues) => void;
  client: any;
  disabled?: boolean;
}

const TICKET_TYPES: TicketFormValues['ticketType'][] = ['task', 'bug', 'feature', 'chore'];
const TICKET_STATUSES: TicketFormValues['status'][] = ['pending', 'in-progress', 'blocked', 'review', 'completed', 'cancelled'];
const PRIORITIES: TicketFormValues['priority'][] = ['Low', 'Medium', 'High', 'Critical'];

export function TicketForm({ values, onChange, client, disabled }: TicketFormProps) {
  const update = <K extends keyof TicketFormValues>(key: K, value: TicketFormValues[K]) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ticket-name">
          Ticket Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="ticket-name"
          value={values.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => update('name', e.target.value)}
          placeholder="Fix checkout validation bug"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticket-description">Description</Label>
        <Textarea
          id="ticket-description"
          rows={4}
          value={values.description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => update('description', e.target.value)}
          placeholder="Describe the expected outcome, reproduction steps, or scope"
          disabled={disabled}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={values.ticketType} onValueChange={(value: string) => update('ticketType', value as TicketFormValues['ticketType'])} disabled={disabled}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TICKET_TYPES.map((ticketType) => (
                <SelectItem key={ticketType} value={ticketType}>
                  {ticketType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={values.status} onValueChange={(value: string) => update('status', value as TicketFormValues['status'])} disabled={disabled}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TICKET_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={values.priority} onValueChange={(value: string) => update('priority', value as TicketFormValues['priority'])} disabled={disabled}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-1">
          <Label>Assignee(s)</Label>
          <UserPicker
            client={client}
            value={values.assignees}
            onChange={(users: SelectedUser[]) => update('assignees', users)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="ticket-due-date">Due Date</Label>
          <Input
            id="ticket-due-date"
            type="date"
            value={values.dueDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => update('dueDate', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="ticket-estimated-hours">Estimated Hours</Label>
          <Input
            id="ticket-estimated-hours"
            type="number"
            min="0"
            step="0.5"
            value={values.estimatedHours}
            onChange={(e: ChangeEvent<HTMLInputElement>) => update('estimatedHours', e.target.value)}
            placeholder="0"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
