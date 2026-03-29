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
export declare function listNodeSchemas(client: PluginClient, nodeId: string): Promise<NodeSchemasListResponse>;
export declare function getNodeSchema(client: PluginClient, nodeId: string, schemaName: string): Promise<Record<string, unknown> | null>;
export declare function listNodeTypeSchemas(client: PluginClient, nodeType: string): Promise<NodeSchemasListResponse>;
export declare function getNodeTypeSchema(client: PluginClient, nodeType: string, schemaName?: string): Promise<Record<string, unknown> | null>;
