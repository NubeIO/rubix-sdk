/**
 * Schema Form Renderer
 *
 * Dynamically renders form fields based on JSON Schema.
 * Supports: string, number, boolean, enum (select), array.
 */

import * as React from 'react';
import { Input } from '../../common/ui/input';
import { Textarea } from '../../common/ui/textarea';
import { Checkbox } from '../../common/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../common/ui/select';
import { Label } from '../../common/ui/label';
import type { JSONSchema, JSONSchemaProperty } from './schema-to-zod';

export interface SchemaFormRendererProps {
  /** JSON Schema defining the form */
  schema: JSONSchema;
  /** Current form values */
  values: Record<string, any>;
  /** Callback when a field changes */
  onChange: (field: string, value: any) => void;
  /** Field-level errors */
  errors?: Record<string, string>;
  /** Disabled state */
  disabled?: boolean;
}

export function SchemaFormRenderer({
  schema,
  values,
  onChange,
  errors = {},
  disabled = false,
}: SchemaFormRendererProps) {
  return (
    <div className="space-y-4">
      {Object.entries(schema.properties).map(([field, fieldSchema]) => (
        <FormField
          key={field}
          field={field}
          fieldSchema={fieldSchema}
          value={values[field]}
          onChange={(value) => onChange(field, value)}
          error={errors[field]}
          required={schema.required?.includes(field)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

interface FormFieldProps {
  field: string;
  fieldSchema: JSONSchemaProperty;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

function FormField({
  field,
  fieldSchema,
  value,
  onChange,
  error,
  required,
  disabled,
}: FormFieldProps) {
  const label = fieldSchema.title || formatFieldName(field);
  const description = fieldSchema.description;

  return (
    <div className="space-y-2">
      <Label htmlFor={field}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {renderInput(field, fieldSchema, value, onChange, disabled)}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

function renderInput(
  field: string,
  fieldSchema: JSONSchemaProperty,
  value: any,
  onChange: (value: any) => void,
  disabled?: boolean
) {
  // Enum (select dropdown)
  if (fieldSchema.enum) {
    return (
      <Select
        value={value?.toString() || ''}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id={field}>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {fieldSchema.enum.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  switch (fieldSchema.type) {
    case 'string':
      // Long text → textarea
      if (fieldSchema.maxLength && fieldSchema.maxLength > 100) {
        return (
          <Textarea
            id={field}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={3}
          />
        );
      }
      // Short text → input
      return (
        <Input
          id={field}
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );

    case 'number':
      return (
        <Input
          id={field}
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const num = parseFloat(e.target.value);
            onChange(isNaN(num) ? undefined : num);
          }}
          disabled={disabled}
          min={fieldSchema.minimum}
          max={fieldSchema.maximum}
        />
      );

    case 'boolean':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={field}
            checked={value || false}
            onCheckedChange={onChange}
            disabled={disabled}
          />
          <Label htmlFor={field} className="font-normal cursor-pointer">
            {fieldSchema.title || formatFieldName(field)}
          </Label>
        </div>
      );

    case 'array':
      // Simple array of strings
      return (
        <Textarea
          id={field}
          value={(value || []).join('\n')}
          onChange={(e) => {
            const lines = e.target.value.split('\n').filter(Boolean);
            onChange(lines);
          }}
          disabled={disabled}
          placeholder="One item per line"
          rows={3}
        />
      );

    default:
      return (
        <Input
          id={field}
          type="text"
          value={value?.toString() || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
  }
}

/**
 * Format field name for display
 * productCode → Product Code
 */
function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1') // Add space before caps
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
}
