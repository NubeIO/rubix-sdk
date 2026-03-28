/**
 * Schema-Based Task Dialog - Create & Edit tasks using dynamic schema
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { X, Loader2, AlertCircle } from 'lucide-react';
import {
  getNodeTypeSchema,
  getNodeSchema,
  listNodeTypeSchemas,
  listNodeSchemas
} from '@rubix-sdk/frontend/plugin-client/schema';
import { getDefaultTaskDueDate } from '@features/task/utils/task-date';
import { createCommentsNode } from '@features/comments/utils/comment-helpers';

interface TaskDialogProps {
  client: any;
  productId: string;
  task?: any; // Existing task for edit mode
  onClose: () => void;
  onSuccess: () => void;
}

export function TaskDialog({ client, productId, task, onClose, onSuccess }: TaskDialogProps) {
  const [schema, setSchema] = useState<Record<string, any> | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!task;

  useEffect(() => {
    loadSchema();
  }, [task]);

  const loadSchema = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let fetchedSchema: Record<string, any> | null = null;

      if (isEditMode && task?.id) {
        // Edit mode: List schemas for existing node, then get the default/first one
        const schemasList = await listNodeSchemas(client, task.id);
        const defaultSchema = schemasList.schemas.find(s => s.isDefault) || schemasList.schemas[0];

        if (!defaultSchema) {
          throw new Error('No schema found for task');
        }

        fetchedSchema = await getNodeSchema(client, task.id, defaultSchema.name);
      } else {
        // Create mode: List schemas for node type, then get the default/first one
        const schemasList = await listNodeTypeSchemas(client, 'plm.task');
        const defaultSchema = schemasList.schemas.find(s => s.isDefault) || schemasList.schemas[0];

        if (!defaultSchema) {
          throw new Error('No schema found for plm.task');
        }

        fetchedSchema = await getNodeTypeSchema(client, 'plm.task', defaultSchema.name);
      }

      if (!fetchedSchema) {
        throw new Error('Failed to load task schema');
      }

      setSchema(fetchedSchema);

      // Initialize form data
      if (isEditMode && task) {
        setFormData({
          name: task.name || '',
          ...task.settings,
        });
      } else {
        // Set defaults from schema
        const defaults: Record<string, any> = { name: '' };
        if (fetchedSchema.properties) {
          Object.entries(fetchedSchema.properties).forEach(([key, prop]: [string, any]) => {
            if (prop.default !== undefined) {
              defaults[key] = prop.default;
            }
          });
        }
        if (fetchedSchema.properties?.dueDate && !defaults.dueDate) {
          defaults.dueDate = getDefaultTaskDueDate();
        }
        setFormData(defaults);
      }
    } catch (err) {
      console.error('[TaskDialog] Failed to load schema:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schema');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      setError('Task name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { name, ...settings } = formData;

      if (isEditMode && task) {
        // Update existing task
        await client.updateNode(task.id, {
          name: name.trim(),
          settings,
        });
      } else {
        // Create new task
        const task = await client.createNode({
          type: 'plm.task',
          name: name.trim(),
          parentId: productId,
          settings,
        });
        // Create the bound comments node immediately
        await createCommentsNode(client, task.id);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('[TaskDialog] Failed to save task:', err);
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const renderField = (fieldName: string, fieldSchema: any) => {
    const value = formData[fieldName] ?? '';
    const isRequired = schema?.required?.includes(fieldName);
    const label = fieldSchema.title || fieldName;

    // Handle different field types
    if (fieldSchema.enum) {
      // Enum/Select field
      return (
        <div key={fieldName}>
          <label className="text-sm font-medium mb-1.5 block">
            {label}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </label>
          {fieldSchema.description && (
            <p className="text-xs text-muted-foreground mb-1.5">{fieldSchema.description}</p>
          )}
          <select
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm bg-background"
            required={isRequired}
          >
            {!isRequired && <option value="">-- Select --</option>}
            {fieldSchema.enum.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (fieldSchema.type === 'boolean') {
      // Checkbox field
      return (
        <div key={fieldName} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
            id={fieldName}
          />
          <label htmlFor={fieldName} className="text-sm font-medium">
            {label}
          </label>
          {fieldSchema.description && (
            <p className="text-xs text-muted-foreground ml-2">{fieldSchema.description}</p>
          )}
        </div>
      );
    }

    if (fieldSchema.type === 'number' || fieldSchema.type === 'integer') {
      // Number field
      return (
        <div key={fieldName}>
          <label className="text-sm font-medium mb-1.5 block">
            {label}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </label>
          {fieldSchema.description && (
            <p className="text-xs text-muted-foreground mb-1.5">{fieldSchema.description}</p>
          )}
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(fieldName, parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-md text-sm"
            required={isRequired}
            min={fieldSchema.minimum}
            max={fieldSchema.maximum}
            step={fieldSchema.type === 'integer' ? 1 : 'any'}
          />
        </div>
      );
    }

    if (fieldSchema.format === 'date' || fieldSchema.format === 'date-time') {
      // Date field
      return (
        <div key={fieldName}>
          <label className="text-sm font-medium mb-1.5 block">
            {label}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </label>
          {fieldSchema.description && (
            <p className="text-xs text-muted-foreground mb-1.5">{fieldSchema.description}</p>
          )}
          <input
            type={fieldSchema.format === 'date-time' ? 'datetime-local' : 'date'}
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
            required={isRequired}
          />
        </div>
      );
    }

    if (fieldSchema.type === 'string' && (fieldSchema.maxLength > 200 || fieldName === 'description')) {
      // Textarea for long text
      return (
        <div key={fieldName}>
          <label className="text-sm font-medium mb-1.5 block">
            {label}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </label>
          {fieldSchema.description && (
            <p className="text-xs text-muted-foreground mb-1.5">{fieldSchema.description}</p>
          )}
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm resize-none"
            required={isRequired}
            rows={3}
            maxLength={fieldSchema.maxLength}
          />
        </div>
      );
    }

    // Default: text input
    return (
      <div key={fieldName}>
        <label className="text-sm font-medium mb-1.5 block">
          {label}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </label>
        {fieldSchema.description && (
          <p className="text-xs text-muted-foreground mb-1.5">{fieldSchema.description}</p>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm"
          required={isRequired}
          maxLength={fieldSchema.maxLength}
          placeholder={fieldSchema.examples?.[0] || ''}
        />
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">
              {isEditMode ? 'Edit Task' : 'Create Task'}
            </h2>
            {isEditMode && task && (
              <p className="text-sm text-muted-foreground mt-1">
                Task ID: {task.id}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <CardContent className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error && !schema ? (
            <div className="rounded-md bg-destructive/10 border border-destructive/50 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Failed to load schema</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          ) : schema ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Task Name (always first) */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Task Name <span className="text-destructive ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  required
                  autoFocus
                  placeholder="Enter task name..."
                />
              </div>

              {/* Render schema fields */}
              {schema.properties &&
                Object.entries(schema.properties)
                  .filter(([key]) => key !== 'name') // Skip name, we rendered it separately
                  .map(([fieldName, fieldSchema]: [string, any]) =>
                    renderField(fieldName, fieldSchema)
                  )}

              {/* Error Message */}
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/50 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving || !formData.name?.trim()}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? 'Saving...' : 'Creating...'}
                    </>
                  ) : (
                    <>{isEditMode ? 'Save Changes' : 'Create Task'}</>
                  )}
                </Button>
              </div>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
