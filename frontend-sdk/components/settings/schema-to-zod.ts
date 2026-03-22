/**
 * JSON Schema to Zod Converter
 *
 * Converts JSON Schema objects to Zod schemas for runtime validation.
 * Supports common field types used in rubix settings.
 */

import { z } from 'zod';

export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  title?: string;
  description?: string;
}

export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array';
  title?: string;
  description?: string;
  enum?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  items?: JSONSchemaProperty;
  default?: any;
}

/**
 * Convert JSON Schema to Zod schema
 */
export function jsonSchemaToZod(jsonSchema: JSONSchema): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, field] of Object.entries(jsonSchema.properties)) {
    let zodType = buildZodType(field);

    // Make optional if not in required array
    if (!jsonSchema.required?.includes(key)) {
      zodType = zodType.optional();
    }

    shape[key] = zodType;
  }

  return z.object(shape);
}

/**
 * Build Zod type for a single field
 */
function buildZodType(field: JSONSchemaProperty): z.ZodTypeAny {
  switch (field.type) {
    case 'string':
      return buildStringType(field);
    case 'number':
      return buildNumberType(field);
    case 'boolean':
      return z.boolean();
    case 'array':
      return buildArrayType(field);
    default:
      return z.any();
  }
}

/**
 * Build string type with constraints
 */
function buildStringType(field: JSONSchemaProperty): z.ZodTypeAny {
  // Enum (select dropdown)
  if (field.enum) {
    return z.enum(field.enum as [string, ...string[]]);
  }

  let zodString = z.string();

  // Length constraints
  if (field.minLength !== undefined) {
    zodString = zodString.min(field.minLength, {
      message: `Must be at least ${field.minLength} characters`,
    });
  }

  if (field.maxLength !== undefined) {
    zodString = zodString.max(field.maxLength, {
      message: `Must be at most ${field.maxLength} characters`,
    });
  }

  return zodString;
}

/**
 * Build number type with constraints
 */
function buildNumberType(field: JSONSchemaProperty): z.ZodNumber {
  let zodNumber = z.number();

  if (field.minimum !== undefined) {
    zodNumber = zodNumber.min(field.minimum, {
      message: `Must be at least ${field.minimum}`,
    });
  }

  if (field.maximum !== undefined) {
    zodNumber = zodNumber.max(field.maximum, {
      message: `Must be at most ${field.maximum}`,
    });
  }

  return zodNumber;
}

/**
 * Build array type
 */
function buildArrayType(field: JSONSchemaProperty): z.ZodArray<any> {
  if (!field.items) {
    return z.array(z.string());
  }

  const itemType = buildZodType(field.items);
  return z.array(itemType);
}

/**
 * Validate data against JSON Schema
 */
export function validateSchema(
  data: Record<string, any>,
  schema: JSONSchema
): { success: true; data: any } | { success: false; errors: Record<string, string> } {
  const zodSchema = jsonSchemaToZod(schema);
  const result = zodSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Convert Zod errors to field-level errors
  const errors: Record<string, string> = {};
  result.error.issues.forEach((err: any) => {
    const field = err.path.join('.');
    errors[field] = err.message;
  });

  return { success: false, errors };
}
