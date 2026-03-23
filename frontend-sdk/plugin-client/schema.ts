import type { PluginClient } from './index';

export interface SchemaInfo {
  name: string;
  displayName: string;
  description: string;
  isDefault: boolean;
}

export interface NodeSchemasListResponse {
  schemas: SchemaInfo[];
  supportsMultiple: boolean;
}

export interface NodeSchemaResponse {
  schema: Record<string, unknown>;
}

export interface NodeTypeSchemaResponse {
  nodeType: string;
  schema: Record<string, unknown>;
}

export async function listNodeSchemas(
  client: PluginClient,
  nodeId: string
): Promise<NodeSchemasListResponse> {
  const response = await client.request<{ data: NodeSchemasListResponse }>(
    `/nodes/${nodeId}/settings-schema/list`
  );
  return response.data;
}

export async function getNodeSchema(
  client: PluginClient,
  nodeId: string,
  schemaName: string
): Promise<Record<string, unknown> | null> {
  const response = await client.request<{ data: NodeSchemaResponse }>(
    `/nodes/${nodeId}/settings-schema/${schemaName}`
  );
  return response.data.schema || null;
}

export async function listNodeTypeSchemas(
  client: PluginClient,
  nodeType: string
): Promise<NodeSchemasListResponse> {
  const response = await client.request<{ data: NodeSchemasListResponse }>(
    `/node-types/${nodeType}/settings-schemas/list`
  );
  return response.data;
}

export async function getNodeTypeSchema(
  client: PluginClient,
  nodeType: string,
  schemaName?: string
): Promise<Record<string, unknown> | null> {
  const endpoint = schemaName
    ? `/node-types/${nodeType}/settings-schemas/${schemaName}`
    : `/node-types/${nodeType}/settings-schemas/default`;

  const response = await client.request<{ data: NodeTypeSchemaResponse }>(endpoint);
  return response.data.schema || null;
}
