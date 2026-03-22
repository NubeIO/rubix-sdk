/**
 * Multi-Settings Dialog
 *
 * Generic dialog for editing settings with multiple schemas (e.g., hardware vs software products).
 * Features:
 * - Schema selection dropdown
 * - Dynamic form rendering based on JSON Schema
 * - Runtime validation with Zod
 * - Loading states
 * - Works in both host and plugins (mount/unmount pattern)
 *
 * @example
 * ```tsx
 * <MultiSettingsDialog
 *   open={true}
 *   onOpenChange={setOpen}
 *   title="Edit Product"
 *   schemas={[
 *     { name: 'hardware', displayName: 'Hardware Product', schema: {...} },
 *     { name: 'software', displayName: 'Software Product', schema: {...} }
 *   ]}
 *   currentSettings={{ productType: 'hardware', sku: 'HW-001' }}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../../common/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../common/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../common/ui/select';
import { Label } from '../../common/ui/label';
import { SchemaFormRenderer } from './schema-form-renderer';
import { validateSchema, type JSONSchema } from './schema-to-zod';

export interface SchemaInfo {
  /** Schema identifier (e.g., 'hardware', 'software') */
  name: string;
  /** Display name shown in UI */
  displayName: string;
  /** Description of this schema */
  description?: string;
  /** Whether this is the default schema */
  isDefault?: boolean;
  /** The JSON Schema definition */
  schema: JSONSchema;
}

export interface MultiSettingsDialogProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback when dialog visibility changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Optional description */
  description?: string;
  /** Available schemas to choose from */
  schemas: SchemaInfo[];
  /** Default schema to select (if not in currentSettings) */
  defaultSchema?: string;
  /** Current settings values */
  currentSettings?: Record<string, any>;
  /** Callback when form is submitted */
  onSubmit: (settings: Record<string, any>, schemaName: string) => Promise<void>;
  /** Optional cancel callback */
  onCancel?: () => void;
  /** Loading state */
  isSubmitting?: boolean;
}

export function MultiSettingsDialog({
  open,
  onOpenChange,
  title,
  description,
  schemas,
  defaultSchema,
  currentSettings = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}: MultiSettingsDialogProps) {
  // Determine initial schema
  const initialSchemaName =
    currentSettings.productType ||
    defaultSchema ||
    schemas.find((s) => s.isDefault)?.name ||
    schemas[0]?.name;

  const [selectedSchemaName, setSelectedSchemaName] = React.useState(initialSchemaName);
  const [formValues, setFormValues] = React.useState<Record<string, any>>(currentSettings);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Get current schema
  const selectedSchema = schemas.find((s) => s.name === selectedSchemaName);

  // Reset form when schema changes
  React.useEffect(() => {
    if (selectedSchemaName !== currentSettings.productType) {
      // Keep common fields, clear schema-specific fields
      const commonFields = ['productCode', 'description', 'status', 'price'];
      const newValues: Record<string, any> = {};

      commonFields.forEach((field) => {
        if (currentSettings[field] !== undefined) {
          newValues[field] = currentSettings[field];
        }
      });

      setFormValues(newValues);
      setErrors({});
    }
  }, [selectedSchemaName, currentSettings]);

  const handleFieldChange = (field: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedSchema) return;

    // Validate
    const result = validateSchema(formValues, selectedSchema.schema);

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    // Submit with schema name
    try {
      await onSubmit(result.data, selectedSchemaName);
      onOpenChange(false);
    } catch (error) {
      console.error('Submit failed:', error);
      // Parent should handle errors via toast
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  if (!selectedSchema) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Schema Selector */}
          {schemas.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="schema-select">Type</Label>
              <Select
                value={selectedSchemaName}
                onValueChange={setSelectedSchemaName}
                disabled={isSubmitting}
              >
                <SelectTrigger id="schema-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {schemas.map((schema) => (
                    <SelectItem key={schema.name} value={schema.name}>
                      <div className="flex flex-col">
                        <span>{schema.displayName}</span>
                        {schema.description && (
                          <span className="text-xs text-muted-foreground">
                            {schema.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dynamic Form */}
          <SchemaFormRenderer
            schema={selectedSchema.schema}
            values={formValues}
            onChange={handleFieldChange}
            errors={errors}
            disabled={isSubmitting}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
