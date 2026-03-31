/**
 * Hook to fetch project settings schemas from node profiles API
 *
 * Fetches the plm.project profile and generates variant schemas for hardware/software
 */

import { useState, useEffect, useCallback } from 'react';

export interface SchemaInfo {
  name: string;
  displayName: string;
  description: string;
  isDefault: boolean;
}

export interface SchemasListResponse {
  schemas: SchemaInfo[];
  supportsMultiple: boolean;
}

export interface ProjectSchemas {
  [schemaName: string]: any; // JSON Schema object
}

export interface SchemaInfoWithSchema extends SchemaInfo {
  schema: any; // JSON Schema object
}

export interface UseProjectSchemasResult {
  schemas: SchemaInfoWithSchema[]; // Combined array with metadata + schema
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseProjectSchemasOptions {
  orgId: string;
  deviceId: string;
  nodeId?: string; // Optional - can use any project node ID to fetch schemas (all projects share same schemas)
  baseUrl?: string;
  token?: string;
  enabled?: boolean;
}

interface NodeProfile {
  type: string;
  baseType: string;
  displayName: string;
  description: string;
  defaults?: Record<string, any>;
  validation?: {
    required?: string[];
    rules?: Record<string, ValidationRule>;
  };
}

interface ValidationRule {
  pattern?: string;
  message?: string;
  example?: string;
  min?: number;
  max?: number;
  enum?: string[];
}

/**
 * Convert node profile validation rules to JSON Schema
 */
function convertProfileToJsonSchema(profile: NodeProfile): Record<string, unknown> {
  const properties: Record<string, any> = {};
  const required: string[] = profile.validation?.required || [];

  // Convert each validation rule to JSON Schema property
  if (profile.validation?.rules) {
    Object.entries(profile.validation.rules).forEach(([fieldName, rule]) => {
      const property: Record<string, any> = {
        type: inferType(rule),
        title: toTitleCase(fieldName),
        description: rule.message || rule.example || '',
      };

      if (rule.pattern) {
        property.pattern = rule.pattern;
      }

      if (rule.enum) {
        property.enum = rule.enum;
      }

      if (rule.min !== undefined) {
        property.minimum = rule.min;
      }

      if (rule.max !== undefined) {
        property.maximum = rule.max;
      }

      // Add default from profile defaults
      if (profile.defaults && profile.defaults[fieldName] !== undefined) {
        property.default = profile.defaults[fieldName];
      }

      properties[fieldName] = property;
    });
  }

  return {
    type: 'object',
    properties,
    required,
  };
}

/**
 * Infer JSON Schema type from validation rule
 */
function inferType(rule: ValidationRule): string {
  if (rule.enum) {
    return 'string';
  }
  if (rule.min !== undefined || rule.max !== undefined) {
    return 'number';
  }
  return 'string';
}

/**
 * Convert camelCase to Title Case
 */
function toTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/**
 * Generate schema variants for hardware and software projects
 */
function generateSchemaVariants(profile: NodeProfile): SchemaInfoWithSchema[] {
  const baseSchema = convertProfileToJsonSchema(profile);
  const baseProperties = (baseSchema.properties as Record<string, any>) || {};
  const categoryProp = baseProperties.category || {};

  // Hardware variant (default category)
  const hardwareSchema = {
    ...baseSchema,
    properties: {
      ...baseProperties,
      category: {
        ...categoryProp,
        default: 'hardware',
      },
    },
  };

  // Software variant with additional license field
  const softwareSchema = {
    ...baseSchema,
    properties: {
      ...baseProperties,
      category: {
        ...categoryProp,
        default: 'software',
      },
      licenseType: {
        type: 'string',
        title: 'License Type',
        description: 'Software licensing model',
        enum: ['perpetual', 'subscription', 'saas', 'open-source', 'trial'],
      },
    },
  };

  // Project variant - no product-specific fields (no SKU, BOM, manufacturing, pricing)
  // Just projectCode, description, status, and project-specific statuses
  const projectSchema = {
    type: 'object',
    properties: {
      projectCode: baseProperties.projectCode || {
        type: 'string',
        title: 'Project Code',
        description: 'Unique project identifier',
      },
      category: {
        ...categoryProp,
        default: 'project',
      },
      status: {
        type: 'string',
        title: 'Status',
        description: 'Project status',
        enum: ['planned', 'active', 'on_hold', 'completed', 'cancelled'],
        default: 'planned',
      },
    },
    required: baseSchema.required || [],
  };

  return [
    {
      name: 'hardware',
      displayName: 'Hardware Project',
      description: 'Physical projects (controllers, sensors, equipment)',
      isDefault: true,
      schema: hardwareSchema,
    },
    {
      name: 'software',
      displayName: 'Software Project',
      description: 'Digital projects (applications, licenses, SaaS)',
      isDefault: false,
      schema: softwareSchema,
    },
    {
      name: 'project',
      displayName: 'Project',
      description: 'General project (tasks, time entries, docs — no product lifecycle)',
      isDefault: false,
      schema: projectSchema,
    },
  ];
}

/**
 * Fetches project settings schemas from node profiles API
 */
export function useProjectSchemas(options: UseProjectSchemasOptions): UseProjectSchemasResult {
  const { orgId, deviceId, baseUrl = '', token, enabled = true } = options;

  const [schemas, setSchemas] = useState<SchemaInfoWithSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${baseUrl}/orgs/${orgId}/devices/${deviceId}/node-profiles/plm.project`;

      console.log('[useProjectSchemas] Fetching profile from:', url);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
      }

      const profile: NodeProfile = await response.json();

      console.log('[useProjectSchemas] Profile loaded:', profile);

      // Generate hardware and software variants from the profile
      const schemaVariants = generateSchemaVariants(profile);

      console.log('[useProjectSchemas] Generated schema variants:', {
        count: schemaVariants.length,
        schemas: schemaVariants.map(s => s.name),
      });

      setSchemas(schemaVariants);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load schemas';
      console.error('[useProjectSchemas] Error:', err);
      setError(errorMessage);
      setLoading(false);
    }
  }, [orgId, deviceId, baseUrl, token]); // Memoize with dependencies

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (enabled && orgId && deviceId) {
      fetchSchemas();
    }
  }, [enabled, orgId, deviceId, fetchSchemas]); // Include fetchSchemas

  return {
    schemas,
    loading,
    error,
    refetch: fetchSchemas,
  };
}
