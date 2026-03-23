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
      const client = createPluginClient({ orgId, deviceId, baseUrl, token });

      // Use multi-settings API if no nodeId (works with node type, not instance)
      if (!nodeId) {
        console.log('[useProductSchemas] No nodeId - fetching schemas from multi-settings API');

        // Step 1: Get list of available schemas
        const schemaList = await client.listNodeTypeSchemas('plm.product');
        console.log('[useProductSchemas] Schema list:', schemaList);

        if (!schemaList.schemas || schemaList.schemas.length === 0) {
          throw new Error('No schemas available for plm.product node type');
        }

        // Step 2: Fetch each schema definition
        const schemasWithData: SchemaInfoWithSchema[] = [];

        for (const schemaInfo of schemaList.schemas) {
          try {
            const schema = await client.getNodeTypeSchema('plm.product', schemaInfo.name);

            if (schema) {
              schemasWithData.push({
                name: schemaInfo.name,
                displayName: schemaInfo.displayName,
                description: schemaInfo.description,
                isDefault: schemaInfo.isDefault,
                schema: schema,
              });
            }
          } catch (err) {
            console.error(`[useProductSchemas] Failed to fetch schema '${schemaInfo.name}':`, err);
            // Continue with other schemas
          }
        }

        if (schemasWithData.length === 0) {
          throw new Error('Failed to fetch any schema definitions');
        }

        setSchemas(schemasWithData);
        setLoading(false);
        return;
      }

      const targetNodeId = nodeId;

      // Step 1: Get list of available schemas
      const listResponse = await client.listNodeSchemas(targetNodeId);
      console.log('[useProductSchemas] Schema list:', listResponse);

      if (!listResponse.schemas || listResponse.schemas.length === 0) {
        throw new Error('No schemas available for this node type');
      }

      // Step 2: Fetch each schema definition and combine with metadata
      const schemasWithData: SchemaInfoWithSchema[] = [];

      for (const schemaInfo of listResponse.schemas) {
        try {
          const schemaData = await client.getNodeSchema(targetNodeId, schemaInfo.name);

          if (!schemaData) {
            continue;
          }

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
