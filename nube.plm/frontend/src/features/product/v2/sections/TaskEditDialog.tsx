/**
 * Task Edit Dialog - Edit and delete tasks
 */

import { useState, useMemo, useEffect } from 'react';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { urls } from '@rubix-sdk/frontend/plugin-client/url-builder';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority?: string;
  assignee?: string;
  dueDate?: string;
  settings?: Record<string, any>;
}

interface TaskEditDialogProps {
  task: Task;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}

export function TaskEditDialog({
  task,
  orgId,
  deviceId,
  baseUrl = '/api/v1',
  token,
  open,
  onOpenChange,
  onTaskUpdated,
  onTaskDeleted,
}: TaskEditDialogProps) {
  const [formData, setFormData] = useState({
    name: task.name,
    description: task.settings?.description || '',
    status: task.status || 'pending',
    priority: task.priority || 'Medium',
    assignee: task.assignee || '',
    dueDate: task.settings?.dueDate || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(
    () => createPluginClient({ orgId, deviceId, baseUrl, token }),
    [orgId, deviceId, baseUrl, token]
  );

  // Update form data when task changes
  useEffect(() => {
    setFormData({
      name: task.name,
      description: task.settings?.description || '',
      status: task.status || 'pending',
      priority: task.priority || 'Medium',
      assignee: task.assignee || '',
      dueDate: task.settings?.dueDate || '',
    });
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Task name is required');
      return;
    }

    try {
      setIsSubmitting(true);

      // Update name separately (if changed)
      if (formData.name !== task.name) {
        await client.updateNode(task.id, {
          name: formData.name,
        });
      }

      // Update settings via PATCH endpoint (NOT updateNode)
      const config = { orgId, deviceId, baseUrl, token };
      const url = urls.node.settingsPatch(config, task.id);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          status: formData.status,
          priority: formData.priority,
          assignee: formData.assignee || 'Unassigned',
          description: formData.description,
          dueDate: formData.dueDate || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      onTaskUpdated();
      onOpenChange(false);
    } catch (err) {
      console.error('[TaskEditDialog] Failed to update task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await client.deleteNode(task.id);
      onTaskDeleted();
      onOpenChange(false);
    } catch (err) {
      console.error('[TaskEditDialog] Failed to delete task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
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
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting || isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete Task'}
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || isDeleting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isDeleting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
