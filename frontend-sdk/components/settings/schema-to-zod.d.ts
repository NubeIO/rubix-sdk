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
export declare function jsonSchemaToZod(jsonSchema: JSONSchema): z.ZodObject<any>;
/**
 * Validate data against JSON Schema
 */
export declare function validateSchema(data: Record<string, any>, schema: JSONSchema): {
    success: true;
    data: any;
} | {
    success: false;
    errors: Record<string, string>;
};
