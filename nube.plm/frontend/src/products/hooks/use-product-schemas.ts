/**
 * Hook to fetch product settings schemas from backend
 *
 * Used by create/edit dialogs to get hardware and software schemas
 */

import { useState, useEffect } from 'react';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';

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
}

/**
 * Fetches product settings schemas from backend
 *
 * Uses the multi-settings API to fetch both hardware and software schemas
 */
export function useProductSchemas(options: UseProductSchemasOptions): UseProductSchemasResult {
  const { orgId, deviceId, nodeId, baseUrl, token } = options;

  const [schemas, setSchemas] = useState<SchemaInfoWithSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemas = async () => {
    setLoading(true);
    setError(null);

    try {
      const client = createPluginClient({ orgId, deviceId, baseUrl, token });

      // If no nodeId provided, use a placeholder node ID
      // (schema fetching doesn't require a specific node, just the type)
      const targetNodeId = nodeId || 'template';

      // Step 1: Get list of available schemas
      const listResponse = await client.request<SchemasListResponse>(
        `/nodes/${targetNodeId}/settings-schemas-list`
      );

      console.log('[useProductSchemas] Schema list:', listResponse);

      if (!listResponse.schemas || listResponse.schemas.length === 0) {
        throw new Error('No schemas available for this node type');
      }

      // Step 2: Fetch each schema definition and combine with metadata
      const schemasWithData: SchemaInfoWithSchema[] = [];

      for (const schemaInfo of listResponse.schemas) {
        try {
          const schemaResponse = await client.request<any>(
            `/nodes/${targetNodeId}/settings-schema/${schemaInfo.name}`
          );

          // The response might be wrapped in a "schema" field or be the schema directly
          const schemaData = schemaResponse.schema || schemaResponse;

          schemasWithData.push({
            name: schemaInfo.name,
            displayName: schemaInfo.displayName,
            description: schemaInfo.description,
            isDefault: schemaInfo.isDefault,
            schema: schemaData,
          });
        } catch (err) {
          console.error(`[useProductSchemas] Failed to fetch schema '${schemaInfo.name}':`, err);
          // Continue fetching other schemas even if one fails
        }
      }

      if (schemasWithData.length === 0) {
        throw new Error('Failed to fetch any schema definitions');
      }

      setSchemas(schemasWithData);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch schemas';
      console.error('[useProductSchemas] Error:', err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (orgId && deviceId) {
      fetchSchemas();
    }
  }, [orgId, deviceId, nodeId, baseUrl, token]);

  return {
    schemas,
    loading,
    error,
    refetch: fetchSchemas,
  };
}
