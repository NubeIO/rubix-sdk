/**
 * Hook to fetch product settings schemas
 *
 * Uses local schemas defined in the plugin (no backend query needed)
 * This avoids the issue of querying node profile schemas before nodes exist.
 */

import { useState, useEffect } from 'react';
import { PLM_PRODUCT_SCHEMAS } from '../schemas/plm-product-schemas';

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

export interface ProductSchemas {
  [schemaName: string]: any; // JSON Schema object
}

export interface SchemaInfoWithSchema extends SchemaInfo {
  schema: any; // JSON Schema object
}

export interface UseProductSchemasResult {
  schemas: SchemaInfoWithSchema[]; // Combined array with metadata + schema
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseProductSchemasOptions {
  orgId: string;
  deviceId: string;
  nodeId?: string; // Optional - can use any product node ID to fetch schemas (all products share same schemas)
  baseUrl?: string;
  token?: string;
  enabled?: boolean;
}

/**
 * Fetches product settings schemas from backend
 *
 * Uses the multi-settings API to fetch both hardware and software schemas
 */
export function useProductSchemas(options: UseProductSchemasOptions): UseProductSchemasResult {
  const { orgId, deviceId, nodeId, baseUrl, token, enabled = true } = options;

  const [schemas, setSchemas] = useState<SchemaInfoWithSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemas = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useProductSchemas] Using local schemas (no backend query)');

      // Use local schemas defined in the plugin
      // This avoids the backend issue with node profile schemas
      const schemasWithData: SchemaInfoWithSchema[] = PLM_PRODUCT_SCHEMAS.map(s => ({
        name: s.name,
        displayName: s.displayName,
        description: s.description,
        isDefault: s.isDefault,
        schema: s.schema,
      }));

      console.log('[useProductSchemas] Loaded local schemas:', {
        count: schemasWithData.length,
        schemas: schemasWithData.map(s => s.name),
      });

      setSchemas(schemasWithData);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load schemas';
      console.error('[useProductSchemas] Error:', err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (enabled && orgId && deviceId) {
      fetchSchemas();
    }
  }, [enabled, orgId, deviceId, nodeId, baseUrl, token]);

  return {
    schemas,
    loading,
    error,
    refetch: fetchSchemas,
  };
}
