/**
 * Task Create Dialog - Create new tasks for products
 */

import { useState, useMemo } from 'react';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDefaultTaskDueDate } from '@features/task/utils/task-date';

interface TaskCreateDialogProps {
  productId: string;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
}

export function TaskCreateDialog({
  productId,
  orgId,
  deviceId,
  baseUrl = '/api/v1',
  token,
  open,
  onOpenChange,
  onTaskCreated,
}: TaskCreateDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'pending',
    priority: 'Medium',
    assignee: '',
    dueDate: getDefaultTaskDueDate(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(
    () => createPluginClient({ orgId, deviceId, baseUrl, token }),
    [orgId, deviceId, baseUrl, token]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Task name is required');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create task using SDK
      await client.createNode({
        type: 'plm.task',
        profile: 'plm-task',
        name: formData.name,
        parentId: productId,
        refs: [
          {
            refName: 'parentRef',
            toNodeId: productId,
          },
        ],
        settings: {
          // Settings are flat, no wrapping
          status: formData.status,
          priority: formData.priority,
          assignee: formData.assignee || 'Unassigned',
          description: formData.description,
          dueDate: formData.dueDate || undefined,
        },
      });

      onTaskCreated();
      onOpenChange(false);
      // Reset form
      setFormData({
        name: '',
        description: '',
        status: 'pending',
        priority: 'Medium',
        assignee: '',
        dueDate: getDefaultTaskDueDate(),
      });
    } catch (err) {
      console.error('[TaskCreateDialog] Failed to create task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Task Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter task name"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description (optional)"
              rows={3}
            />
          </div>

          {/* Status and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: string) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: string) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee and Due Date Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Assignee */}
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Input
                id="assignee"
                value={formData.assignee}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, assignee: e.target.value })}
                placeholder="Unassigned"
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
