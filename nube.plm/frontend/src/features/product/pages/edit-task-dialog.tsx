/**
 * EditTaskDialog - Edit existing task
 */

import { useState, useEffect } from 'react';
// @ts-ignore - SDK types
import { Button } from '@rubix-sdk/frontend/common/ui';
// @ts-ignore - SDK user picker
import { UserPicker, type SelectedUser } from '@rubix-sdk/frontend/common/ui/user-picker';
import type { Product } from '@features/product/types/product.types';
import type { Task, UpdateTaskInput } from '@features/task/types/task.types';

interface EditTaskDialogProps {
  task: Task;
  products: Product[];
  client: any;
  onClose: () => void;
  onUpdate: (taskId: string, input: UpdateTaskInput, assignees: SelectedUser[]) => Promise<void>;
}

const TASK_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const TASK_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export function EditTaskDialog({ task, products, client, onClose, onUpdate }: EditTaskDialogProps) {
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.settings?.description || '');
  const [productId, setProductId] = useState(task.parentId || '');
  const [status, setStatus] = useState(task.settings?.status || 'pending');
  const [priority, setPriority] = useState(task.settings?.priority || 'medium');
  const [assignees, setAssignees] = useState<SelectedUser[]>([]);
  const [dueDate, setDueDate] = useState(task.settings?.dueDate || '');
  const [progress, setProgress] = useState(task.settings?.progress || 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load assignedUserRefs on mount
  useEffect(() => {
    client.getAssignedUsers(task.id).then((refs: any[]) => {
      if (refs?.length) {
        setAssignees(refs.map((r: any) => ({ userId: r.toNodeId, userName: r.displayName || '' })));
      }
    }).catch(() => {});
  }, [task.id, client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Task name is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onUpdate(task.id, {
        name: name.trim(),
        settings: {
          description: description.trim() || undefined,
          status,
          priority,
          dueDate: dueDate || undefined,
          progress,
        },
      }, assignees);
      onClose();
    } catch (err) {
      console.error('[EditTaskDialog] Failed to update task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-background rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Display (read-only) */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Product</label>
            <div className="w-full px-3 py-2 border rounded-md text-sm bg-muted">
              {products.find((p) => p.id === productId)?.name || 'Unknown Product'}
            </div>
          </div>

          {/* Task Name */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Task Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name..."
              className="w-full px-3 py-2 border rounded-md text-sm"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description..."
              rows={3}
              className="w-full px-3 py-2 border rounded-md text-sm resize-none"
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Assignee(s)</label>
              <UserPicker
                client={client}
                value={assignees}
                onChange={setAssignees}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>

          {/* Progress */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Progress: {progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/50 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? 'Updating...' : 'Update Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
