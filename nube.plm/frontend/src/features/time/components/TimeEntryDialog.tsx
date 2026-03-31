import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import { createTimeEntryWithRecalc } from '../utils/time-entry-helpers';

interface TimeEntryDialogProps {
  client: PluginClient;
  ticketId: string;
  ticketName: string;
  userId: string;
  userName: string;
  userNodeId?: string;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

export function TimeEntryDialog({
  client,
  ticketId,
  ticketName,
  userId,
  userName,
  userNodeId,
  onClose,
  onSuccess,
}: TimeEntryDialogProps) {
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('dev');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const parsedHours = parseFloat(hours);
    if (!parsedHours || parsedHours <= 0) {
      setError('Hours must be greater than 0');
      return;
    }

    if (!date) {
      setError('Date is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await createTimeEntryWithRecalc(client, {
        name: `${userName} - ${parsedHours}h - ${date}`,
        parentId: ticketId,
        date,
        hours: parsedHours,
        userId,
        userName,
        description: description || undefined,
        category,
        userNodeId,
      });

      await onSuccess();
      onClose();
    } catch (err) {
      console.error('[TimeEntryDialog] Failed to create time entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to log time');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Time</DialogTitle>
          <DialogDescription>
            Add a time entry for <span className="font-medium">{ticketName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0.25"
                step="0.25"
                placeholder="1.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dev">Development</SelectItem>
                <SelectItem value="review">Code Review</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="docs">Documentation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What did you work on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !hours}>
            {isSubmitting ? 'Logging...' : 'Log Time'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
