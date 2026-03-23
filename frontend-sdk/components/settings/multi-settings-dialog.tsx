/**
 * Multi-Settings Dialog (RJSF Version)
 *
 * Generic dialog for editing settings with multiple schemas using React JSON Schema Form.
 * Features:
 * - Card-based schema selection (like frontend node settings)
 * - RJSF-powered form rendering with custom shadcn widgets
 * - Compact side-by-side layout with info popovers
 * - Full JSON Schema validation
 * - Works in both host and plugins (mount/unmount pattern)
 *
 * @example
 * ```tsx
 * <MultiSettingsDialog
 *   open={true}
 *   onOpenChange={setOpen}
 *   title="Create Product"
 *   schemas={[
 *     { name: 'hardware', displayName: 'Hardware Product', description: '...', schema: {...}, isDefault: true },
 *     { name: 'software', displayName: 'Software Product', description: '...', schema: {...} }
 *   ]}
 *   currentSettings={{}}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */

import * as React from 'react';
import Form from '@rjsf/core';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
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
import { Label } from '../../common/ui/label';
import {
  CompactFieldTemplate,
  CompactObjectFieldTemplate,
  CustomArrayFieldTemplate,
  CustomDescriptionField,
  customWidgets
} from './rjsf-theme';

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
  schema: any;
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

type ViewStep = 'selecting' | 'configuring';

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

  // Check if this is a new item (no existing settings besides maybe defaults)
  const hasExistingSettings = Object.keys(currentSettings).length > 1; // More than just 'productType'

  const [viewStep, setViewStep] = React.useState<ViewStep>(
    schemas.length > 1 && !hasExistingSettings ? 'selecting' : 'configuring'
  );
  const [selectedSchemaName, setSelectedSchemaName] = React.useState(initialSchemaName);
  const [formData, setFormData] = React.useState<Record<string, any>>(currentSettings);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Get current schema
  const selectedSchema = schemas.find((s) => s.name === selectedSchemaName);

  // Reset form when schema changes (but keep common fields)
  React.useEffect(() => {
    if (selectedSchemaName !== currentSettings.productType) {
      // Keep common fields across all product types
      const commonFields = ['productCode', 'description', 'status', 'price'];
      const newValues: Record<string, any> = {};

      commonFields.forEach((field) => {
        if (currentSettings[field] !== undefined) {
          newValues[field] = currentSettings[field];
        }
      });

      setFormData(newValues);
    }
  }, [selectedSchemaName, currentSettings]);

  const handleSchemaSelect = (schemaName: string) => {
    setSubmitError(null);
    setSelectedSchemaName(schemaName);
    setViewStep('configuring');
  };

  const handleFormSubmit = async (data: { formData?: Record<string, any> }) => {
    const settings = data.formData || {};
    setSubmitError(null);

    try {
      await onSubmit(settings, selectedSchemaName);
      onOpenChange(false);
    } catch (error) {
      console.error('[MultiSettingsDialog] Submit failed:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to save settings');
    }
  };

  const handleCancel = () => {
    setSubmitError(null);
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  if (!selectedSchema) {
    console.warn('[MultiSettingsDialog] No schema found for:', selectedSchemaName);
    return null;
  }

  React.useEffect(() => {
    if (!open) {
      setSubmitError(null);
    }
  }, [open]);

  // Step 1: Show schema selection cards (like frontend node settings)
  if (viewStep === 'selecting' && schemas.length > 1) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Configuration Type</DialogTitle>
            <DialogDescription>
              This supports different configuration types. Choose the one that matches your use case.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {schemas.map((schemaInfo) => (
              <button
                key={schemaInfo.name}
                onClick={() => handleSchemaSelect(schemaInfo.name)}
                className="hover:border-primary hover:bg-accent w-full rounded-lg border-2 border-border p-4 text-left transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{schemaInfo.displayName}</h4>
                    {schemaInfo.description && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {schemaInfo.description}
                      </p>
                    )}
                  </div>
                  {schemaInfo.isDefault && (
                    <span className="bg-primary/10 text-primary ml-2 rounded-full px-2 py-1 text-xs font-medium">
                      Default
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Step 2: Show RJSF form for selected schema
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {submitError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </div>
          )}

          {/* Schema indicator with Change Type button */}
          {schemas.length > 1 && (
            <div className="flex items-center justify-between gap-3 pb-3 border-b">
              <div className="flex-1">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Configuration Type
                </div>
                <div className="mt-0.5 font-semibold text-sm">
                  {selectedSchema.displayName}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewStep('selecting')}
                className="text-xs h-8"
              >
                Change Type
              </Button>
            </div>
          )}

          {/* RJSF Form */}
          <Form
            schema={selectedSchema.schema as RJSFSchema}
            formData={formData}
            validator={validator as any}
            onChange={(e) => setFormData(e.formData || {})}
            onSubmit={handleFormSubmit}
            liveValidate={false}
            showErrorList="top"
            noHtml5Validate={true}
            disabled={isSubmitting}
            widgets={customWidgets}
            templates={{
              FieldTemplate: CompactFieldTemplate,
              ObjectFieldTemplate: CompactObjectFieldTemplate,
              DescriptionFieldTemplate: CustomDescriptionField,
              ArrayFieldTemplate: CustomArrayFieldTemplate
            }}
            uiSchema={{
              'ui:submitButtonOptions': {
                norender: true // We render our own submit button in DialogFooter
              }
            }}
          >
            {/* Hidden submit - form submits via footer button */}
            <button type="submit" style={{ display: 'none' }} />
          </Form>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={() => {
              // Trigger RJSF form submit
              const form = document.querySelector('form') as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={isSubmitting}
          >
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
