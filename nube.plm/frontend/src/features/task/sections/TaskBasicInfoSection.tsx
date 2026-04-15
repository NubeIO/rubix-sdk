/**
 * Task Basic Info Section - Editable task metadata
 */

import { useEffect, useState, type ChangeEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
// @ts-ignore - SDK user picker
import { UserPicker, type SelectedUser } from '@rubix-sdk/frontend/common/ui/user-picker';
import type { Task } from '../types/task.types';
import { TASK_STATUS_VALUES, type TaskStatusValue } from '@shared/utils/task-status';

interface TaskBasicInfoSectionProps {
  task: Task;
  client: any;
  onTaskUpdate: (updates: { name?: string; settings?: Record<string, unknown> }) => Promise<void>;
}

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'] as const;

export function TaskBasicInfoSection({ task, client, onTaskUpdate }: TaskBasicInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: task.name,
    description: task.settings?.description || '',
    status: (task.settings?.status as TaskStatusValue) || 'pending',
    priority: task.settings?.priority || 'Medium',
    assignees: [] as SelectedUser[],
    reporter: task.settings?.reporter || '',
    category: task.settings?.category || '',
    dueDate: task.settings?.dueDate || '',
    estimatedHours: String(task.settings?.estimatedHours || ''),
    storyPoints: String(task.settings?.storyPoints || ''),
    notes: task.settings?.notes || '',
  });

  // Load assignedUserRefs on mount
  useEffect(() => {
    client.getAssignedUsers(task.id).then((refs: any[]) => {
      if (refs?.length) {
        setFormData((prev) => ({
          ...prev,
          assignees: refs.map((r: any) => ({ userId: r.toNodeId, userName: r.displayName || '' })),
        }));
      }
    }).catch(() => {});
  }, [task.id, client]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: task.name,
      description: task.settings?.description || '',
      status: (task.settings?.status as TaskStatusValue) || 'pending',
      priority: task.settings?.priority || 'Medium',
      reporter: task.settings?.reporter || '',
      category: task.settings?.category || '',
      dueDate: task.settings?.dueDate || '',
      estimatedHours: String(task.settings?.estimatedHours || ''),
      storyPoints: String(task.settings?.storyPoints || ''),
      notes: task.settings?.notes || '',
    }));
  }, [task]);

  const handleCancel = () => {
    setIsEditing(false);
    // Reload assignee refs
    client.getAssignedUsers(task.id).then((refs: any[]) => {
      setFormData((prev) => ({
        ...prev,
        assignees: (refs || []).map((r: any) => ({ userId: r.toNodeId, userName: r.displayName || '' })),
      }));
    }).catch(() => {});
    setFormData((prev) => ({
      ...prev,
      name: task.name,
      description: task.settings?.description || '',
      status: (task.settings?.status as TaskStatusValue) || 'pending',
      priority: task.settings?.priority || 'Medium',
      reporter: task.settings?.reporter || '',
      category: task.settings?.category || '',
      dueDate: task.settings?.dueDate || '',
      estimatedHours: String(task.settings?.estimatedHours || ''),
      storyPoints: String(task.settings?.storyPoints || ''),
      notes: task.settings?.notes || '',
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onTaskUpdate({
        name: formData.name.trim(),
        settings: {
          ...task.settings,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          reporter: formData.reporter || undefined,
          category: formData.category || undefined,
          dueDate: formData.dueDate || undefined,
          estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : 0,
          storyPoints: formData.storyPoints ? Number(formData.storyPoints) : 0,
          notes: formData.notes || undefined,
        },
      });
      // Set assignedUserRefs
      await client.replaceAssignedUsers(task.id, formData.assignees);
      setIsEditing(false);
    } catch (error) {
      console.error('[TaskBasicInfoSection] Failed to update task:', error);
      alert(error instanceof Error ? error.message : 'Failed to save task changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Basic Information</h2>
          <p className="text-sm text-muted-foreground">
            Core task details, ownership, and scheduling metadata
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="task-name">Task Name</Label>
            {isEditing ? (
              <Input
                id="task-name"
                value={formData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter task name"
              />
            ) : (
              <div className="text-base font-medium">{task.name}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            {isEditing ? (
              <Textarea
                id="task-description"
                rows={4}
                value={formData.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the task outcome and scope"
              />
            ) : (
              <div className="text-base text-muted-foreground">
                {task.settings?.description || 'No description provided'}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              {isEditing ? (
                <Select
                  value={formData.status}
                  onValueChange={(value: string) => setFormData((prev) => ({ ...prev, status: value as TaskStatusValue }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUS_VALUES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge>{task.settings?.status || 'pending'}</Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              {isEditing ? (
                <Select
                  value={formData.priority}
                  onValueChange={(value: string) => setFormData((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline">{task.settings?.priority || 'Medium'}</Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label>Assignee(s)</Label>
              {isEditing ? (
                <UserPicker
                  client={client}
                  value={formData.assignees}
                  onChange={(users: SelectedUser[]) =>
                    setFormData((prev) => ({ ...prev, assignees: users }))
                  }
                />
              ) : (
                <div>{formData.assignees.length > 0 ? formData.assignees.map(a => a.userName).join(', ') : 'Unassigned'}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-reporter">Reporter</Label>
              {isEditing ? (
                <Input
                  id="task-reporter"
                  value={formData.reporter}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, reporter: e.target.value }))}
                  placeholder="Who requested this work?"
                />
              ) : (
                <div>{task.settings?.reporter || '—'}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-category">Category</Label>
              {isEditing ? (
                <Input
                  id="task-category"
                  value={formData.category}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="Implementation, QA, Release..."
                />
              ) : (
                <div>{task.settings?.category || '—'}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due Date</Label>
              {isEditing ? (
                <Input
                  id="task-due-date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
              ) : (
                <div>{task.settings?.dueDate || '—'}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-estimated-hours">Estimated Hours</Label>
              {isEditing ? (
                <Input
                  id="task-estimated-hours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, estimatedHours: e.target.value }))}
                />
              ) : (
                <div>{task.settings?.estimatedHours || 0}h</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-story-points">Story Points</Label>
              {isEditing ? (
                <Input
                  id="task-story-points"
                  type="number"
                  min="0"
                  value={formData.storyPoints}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, storyPoints: e.target.value }))}
                />
              ) : (
                <div>{task.settings?.storyPoints || 0}</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-notes">Internal Notes</Label>
            {isEditing ? (
              <Textarea
                id="task-notes"
                rows={4}
                value={formData.notes}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Implementation notes, blockers, or handoff details"
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                {task.settings?.notes || 'No internal notes recorded'}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
