/**
 * Plugin Client - Reusable RAS client wrapper for all plugins
 *
 * This wrapper provides a simple, type-safe API for plugin widgets to
 * interact with the Rubix core API without having to manage authentication,
 * URL construction, or error handling manually.
 *
 * @example
 * ```tsx
 * import { createPluginClient } from '@rubix/sdk/plugin-client';
 *
 * function MyWidget({ orgId, deviceId, baseUrl, token }) {
 *   const client = createPluginClient({ orgId, deviceId, baseUrl, token });
 *
 *   // Query nodes
 *   const products = await client.queryNodes({ filter: 'type is "plm.product"' });
 *
 *   // Create node
 *   const newProduct = await client.createNode({
 *     type: 'plm.product',
 *     name: 'Widget Pro',
 *     settings: { productCode: 'WGT-001', price: 99.99 }
 *   });
 *
 *   // Update node
 *   await client.updateNode(nodeId, {
 *     name: 'Widget Pro v2',
 *     settings: { price: 149.99 }
 *   });
 *
 *   // Delete node
 *   await client.deleteNode(nodeId);
 * }
 * ```
 */

import { RASClient, fetchAdapter } from '../ras/client';
import type { Node } from '../ras/types';
import {
  createNode as createNodeHelper,
  deleteNode as deleteNodeHelper,
  getNode as getNodeHelper,
  listNodes as listNodesHelper,
  updateNode as updateNodeHelper,
  updateNodeSettings as updateNodeSettingsHelper,
} from './node';
import { queryNodes as queryNodesHelper } from './query';
import {
  getNodeSchema as getNodeSchemaHelper,
  getNodeTypeSchema as getNodeTypeSchemaHelper,
  listNodeSchemas as listNodeSchemasHelper,
  listNodeTypeSchemas as listNodeTypeSchemasHelper,
  type NodeSchemasListResponse,
} from './schema';
import { getPalletDetails as getPalletDetailsHelper } from './pallet';
import {
  listCommands as listCommandsHelper,
  getCommand as getCommandHelper,
  executeCommand as executeCommandHelper,
  executeGetCommand as executeGetCommandHelper,
  executePostCommand as executePostCommandHelper,
  executePatchCommand as executePatchCommandHelper,
  executeDeleteCommand as executeDeleteCommandHelper,
  getCommandJob as getCommandJobHelper,
  listCommandJobs as listCommandJobsHelper,
  cancelCommandJob as cancelCommandJobHelper,
  pollCommandJob as pollCommandJobHelper,
  executeAndWait as executeAndWaitHelper,
  type CommandDefinition,
  type CommandJob,
  type CommandExecuteResult,
  type ExecuteCommandOptions,
} from './commands';

export interface PluginClientConfig {
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
}

export interface QueryNodesOptions {
  filter?: string;
  limit?: number;
  offset?: number;
  ports?: string[];
  runtime?: boolean;
}

export interface NodeRef {
  refName: string;
  toNodeId: string;
  toNodeName?: string;
  order?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateNodeInput {
  type: string;
  name: string;
  parentId?: string;
  settings?: Record<string, unknown>;
  data?: Record<string, unknown>;
  ui?: Record<string, unknown>;
  position?: { x: number; y: number };
  refs?: NodeRef[];
}

export interface UpdateNodeInput {
  name?: string;
  parentId?: string;
  settings?: Record<string, unknown>;
  data?: Record<string, unknown>;
  ui?: Record<string, unknown>;
  position?: { x: number; y: number };
}

export interface PalletDetailsResponse {
  nodeType: string;
  inputs: any[]; // NodePort[]
  outputs: any[]; // NodePort[]
  settings?: Record<string, any>; // JSON schema
  commands?: any[]; // CommandDefinition[]
  uiCapabilities?: any; // UICapabilities
  help?: any; // NodeHelp
}

export class PluginClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'PluginClientError';
  }
}

export class PluginClient {
  private client: RASClient;
  private config: Required<PluginClientConfig>;

  constructor(config: PluginClientConfig) {
    this.config = {
      orgId: config.orgId,
      deviceId: config.deviceId,
      baseUrl: config.baseUrl || '/api/v1',
      token: config.token || '',
    };

    // Create RAS client with auth interceptor
    const base = fetchAdapter();
    this.client = new RASClient(this.config.baseUrl, async (req) => {
      if (this.config.token) {
        req.headers = { ...req.headers, Authorization: `Bearer ${this.config.token}` };
      }
      return base(req);
    });
  }

  /**
   * Query nodes using Haystack filter syntax
   *
   * @example
   * ```ts
   * // Get all products
   * const products = await client.queryNodes({
   *   filter: 'type is "plm.product"'
   * });
   *
   * // Get products with pagination
   * const page1 = await client.queryNodes({
   *   filter: 'type is "plm.product"',
   *   limit: 10,
   *   offset: 0
   * });
   * ```
   */
  async queryNodes(options: QueryNodesOptions = {}): Promise<Node[]> {
    try {
      return await queryNodesHelper(this, options);
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || 'Failed to query nodes',
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Get a single node by ID
   *
   * @example
   * ```ts
   * const product = await client.getNode('node_abc123');
   * console.log(product.name, product.settings);
   * ```
   */
  async getNode(nodeId: string): Promise<Node> {
    try {
      return await getNodeHelper(this, nodeId);
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || 'Failed to get node',
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Create a new node
   *
   * @example
   * ```ts
   * const product = await client.createNode({
   *   type: 'plm.product',
   *   name: 'Widget Pro',
   *   settings: {
   *     productCode: 'WGT-001',
   *     description: 'Premium widget',
   *     status: 'Production',
   *     price: 99.99
   *   }
   * });
   * ```
   */
  async createNode(input: CreateNodeInput): Promise<Node> {
    try {
      return await createNodeHelper(this, input);
    } catch (err: any) {
      console.error('[PluginClient] createNode failed:', err);
      throw new PluginClientError(
        err?.details?.message || err?.message || 'Failed to create node',
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Update an existing node
   *
   * @example
   * ```ts
   * await client.updateNode('node_abc123', {
   *   name: 'Widget Pro v2',
   *   settings: { price: 149.99 }
   * });
   * ```
   */
  async updateNode(nodeId: string, input: UpdateNodeInput): Promise<Node> {
    try {
      return await updateNodeHelper(this, nodeId, input);
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || 'Failed to update node',
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Update only the settings of an existing node (more efficient than updateNode)
   *
   * Uses PATCH endpoint that merges settings instead of replacing the entire node.
   * Recommended for product edits where only settings change.
   *
   * @example
   * ```ts
   * await client.updateNodeSettings('node_abc123', {
   *   productCode: 'WGT-002',
   *   price: 149.99,
   *   status: 'Active'
   * });
   * ```
   */
  async updateNodeSettings(nodeId: string, settings: Record<string, unknown>): Promise<Node> {
    try {
      return await updateNodeSettingsHelper(this, nodeId, settings);
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || 'Failed to update node settings',
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Delete a node
   *
   * @example
   * ```ts
   * await client.deleteNode('node_abc123');
   * ```
   */
  async deleteNode(nodeId: string): Promise<void> {
    try {
      await deleteNodeHelper(this, nodeId);
    } catch (err: any) {
      console.error('[PluginClient] Delete failed:', err);
      throw new PluginClientError(
        err?.details?.message || err?.message || 'Failed to delete node',
        err?.status,
        err?.details
      );
    }
  }

  /**
   * List all nodes (with optional filtering via query params)
   *
   * @example
   * ```ts
   * const allNodes = await client.listNodes();
   * ```
   */
  async listNodes(): Promise<Node[]> {
    try {
      return await listNodesHelper(this);
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || 'Failed to list nodes',
        err?.status,
        err?.details
      );
    }
  }

  async listNodeSchemas(nodeId: string): Promise<NodeSchemasListResponse> {
    try {
      return await listNodeSchemasHelper(this, nodeId);
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to list schemas for node ${nodeId}`,
        err?.status,
        err?.details
      );
    }
  }

  async getNodeSchema(nodeId: string, schemaName: string): Promise<Record<string, unknown> | null> {
    try {
      return await getNodeSchemaHelper(this, nodeId, schemaName);
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to get schema '${schemaName}' for node ${nodeId}`,
        err?.status,
        err?.details
      );
    }
  }

  /**
   * List all available settings schemas for a node type
   *
   * This endpoint supports nodes with multiple schemas (e.g., hardware vs software products).
   * Works with node TYPES (not instances), so it can be used before any nodes exist.
   *
   * @example
   * ```ts
   * const schemas = await client.listNodeTypeSchemas('plm.product');
   * console.log(schemas.schemas); // [{ name: 'hardware', displayName: 'Hardware Product', ... }]
   * console.log(schemas.supportsMultiple); // true if multiple schemas available
   * ```
   */
  async listNodeTypeSchemas(nodeType: string): Promise<NodeSchemasListResponse> {
    try {
      return await listNodeTypeSchemasHelper(this, nodeType);
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to list schemas for ${nodeType}`,
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Get a specific settings schema by name for a node type
   *
   * Works with node TYPES (not instances), useful for creating first nodes.
   *
   * @example
   * ```ts
   * const schema = await client.getNodeTypeSchema('plm.product', 'hardware');
   * console.log(schema.properties); // Schema definition
   * ```
   */
  async getNodeTypeSchema(nodeType: string, schemaName?: string): Promise<Record<string, any> | null> {
    try {
      return await getNodeTypeSchemaHelper(this, nodeType, schemaName);
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to get schema for ${nodeType}`,
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Get pallet details for a node type (includes schema, ports, commands, etc.)
   *
   * This endpoint works with node TYPES, not node instances, so it can be used
   * to get schemas even when no nodes of that type exist yet.
   *
   * @example
   * ```ts
   * const details = await client.getPalletDetails('plm.product');
   * console.log(details.settings); // JSON schema
   * console.log(details.inputs); // Input port definitions
   * ```
   */
  async getPalletDetails(nodeType: string): Promise<PalletDetailsResponse> {
    try {
      return await getPalletDetailsHelper(this, nodeType);
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to get pallet details for ${nodeType}`,
        err?.status,
        err?.details
      );
    }
  }

  // ========================================================================
  // Commands
  // ========================================================================

  /**
   * List all commands available for a node
   *
   * @example
   * ```ts
   * const commands = await client.listCommands(nodeId);
   * console.log(commands.map(c => c.name)); // ["ping", "discover", "reset"]
   * ```
   */
  async listCommands(nodeId: string): Promise<CommandDefinition[]> {
    try {
      return await listCommandsHelper(this, nodeId);
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to list commands for node ${nodeId}`,
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Get a specific command definition including its parameter schema
   *
   * @example
   * ```ts
   * const cmd = await client.getCommand(nodeId, 'ping');
   * console.log(cmd.schema); // Parameter schema
   * ```
   */
  async getCommand(nodeId: string, commandName: string): Promise<CommandDefinition> {
    try {
      return await getCommandHelper(this, nodeId, commandName);
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to get command ${commandName}`,
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Execute a command on a node
   *
   * Handles both sync and async execution automatically. For async commands,
   * returns a jobId that can be polled for status.
   *
   * @example
   * ```ts
   * // Sync command
   * const result = await client.executeCommand(nodeId, 'ping', { count: 5 });
   * console.log(result.result); // { success: true, latency: 12.5 }
   *
   * // Async command
   * const job = await client.executeCommand(nodeId, 'discover', { subnet: '192.168.1.0/24' });
   * console.log(job.jobId); // "job_abc123"
   * ```
   */
  async executeCommand<TResult = any, TParams = any>(
    nodeId: string,
    commandName: string,
    parameters?: TParams,
    options?: ExecuteCommandOptions
  ): Promise<CommandExecuteResult<TResult>> {
    try {
      return await executeCommandHelper<TResult, TParams>(
        this,
        nodeId,
        commandName,
        parameters,
        options
      );
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to execute command ${commandName}`,
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Execute a GET command (query/read operation)
   *
   * @example
   * ```ts
   * const status = await client.executeGetCommand(nodeId, 'status', { verbose: true });
   * ```
   */
  async executeGetCommand<TResult = any>(
    nodeId: string,
    commandName: string,
    query?: Record<string, string | number | boolean>
  ): Promise<TResult> {
    try {
      return await executeGetCommandHelper<TResult>(this, nodeId, commandName, query);
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to execute GET command ${commandName}`,
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Execute a POST command (create/mutation operation)
   *
   * @example
   * ```ts
   * const result = await client.executePostCommand(nodeId, 'reset', { force: true });
   * ```
   */
  async executePostCommand<TResult = any, TParams = any>(
    nodeId: string,
    commandName: string,
    parameters?: TParams,
    options?: ExecuteCommandOptions
  ): Promise<CommandExecuteResult<TResult>> {
    try {
      return await executePostCommandHelper<TResult, TParams>(
        this,
        nodeId,
        commandName,
        parameters,
        options
      );
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to execute POST command ${commandName}`,
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Execute a PATCH command (update operation)
   *
   * @example
   * ```ts
   * const result = await client.executePatchCommand(nodeId, 'updateConfig', { timeout: 30 });
   * ```
   */
  async executePatchCommand<TResult = any, TParams = any>(
    nodeId: string,
    commandName: string,
    parameters?: TParams,
    options?: ExecuteCommandOptions
  ): Promise<CommandExecuteResult<TResult>> {
    try {
      return await executePatchCommandHelper<TResult, TParams>(
        this,
        nodeId,
        commandName,
        parameters,
        options
      );
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to execute PATCH command ${commandName}`,
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Execute a DELETE command (delete/clear operation)
   *
   * @example
   * ```ts
   * const result = await client.executeDeleteCommand(nodeId, 'clearCache');
   * ```
   */
  async executeDeleteCommand<TResult = any, TParams = any>(
    nodeId: string,
    commandName: string,
    parameters?: TParams,
    options?: ExecuteCommandOptions
  ): Promise<CommandExecuteResult<TResult>> {
    try {
      return await executeDeleteCommandHelper<TResult, TParams>(
        this,
        nodeId,
        commandName,
        parameters,
        options
      );
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to execute DELETE command ${commandName}`,
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Get command job status and result
   *
   * @example
   * ```ts
   * const job = await client.getCommandJob(nodeId, 'job_abc123');
   * console.log(job.status); // "running" | "success" | "failed"
   * if (job.status === 'success') {
   *   console.log(job.result); // Command result
   * }
   * ```
   */
  async getCommandJob<TResult = any, TParams = any>(
    nodeId: string,
    jobId: string
  ): Promise<CommandJob<TResult, TParams>> {
    try {
      return await getCommandJobHelper<TResult, TParams>(this, nodeId, jobId);
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to get command job ${jobId}`,
        err?.status,
        err?.details
      );
    }
  }

  /**
   * List all command jobs for a node, optionally filtered by status
   *
   * @example
   * ```ts
   * // Get all jobs
   * const allJobs = await client.listCommandJobs(nodeId);
   *
   * // Get only running jobs
   * const runningJobs = await client.listCommandJobs(nodeId, 'running');
   * ```
   */
  async listCommandJobs<TResult = any, TParams = any>(
    nodeId: string,
    status?: 'pending' | 'running' | 'success' | 'failed'
  ): Promise<CommandJob<TResult, TParams>[]> {
    try {
      return await listCommandJobsHelper<TResult, TParams>(this, nodeId, status);
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to list command jobs for node ${nodeId}`,
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Cancel or delete a command job
   *
   * @example
   * ```ts
   * await client.cancelCommandJob(nodeId, 'job_abc123');
   * ```
   */
  async cancelCommandJob(
    nodeId: string,
    jobId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await cancelCommandJobHelper(this, nodeId, jobId);
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to cancel command job ${jobId}`,
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Poll a command job until completion
   *
   * @example
   * ```ts
   * const result = await client.executeCommand(nodeId, 'discover', { subnet: '192.168.1.0/24' });
   * if (result.jobId) {
   *   const job = await client.pollCommandJob(nodeId, result.jobId);
   *   if (job.status === 'success') {
   *     console.log('Discovery complete:', job.result);
   *   }
   * }
   * ```
   */
  async pollCommandJob<TResult = any, TParams = any>(
    nodeId: string,
    jobId: string,
    pollInterval?: number,
    maxAttempts?: number
  ): Promise<CommandJob<TResult, TParams>> {
    try {
      return await pollCommandJobHelper<TResult, TParams>(
        this,
        nodeId,
        jobId,
        pollInterval,
        maxAttempts
      );
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to poll command job ${jobId}`,
        err?.status,
        err?.details
      );
    }
  }

  /**
   * Execute a command and wait for completion
   *
   * Convenience function that executes a command and automatically polls
   * for completion if it returns a jobId.
   *
   * @example
   * ```ts
   * const result = await client.executeAndWait(nodeId, 'discover', {
   *   subnet: '192.168.1.0/24'
   * });
   * console.log('Discovery complete:', result);
   * ```
   */
  async executeAndWait<TResult = any, TParams = any>(
    nodeId: string,
    commandName: string,
    parameters?: TParams,
    options?: ExecuteCommandOptions & {
      pollInterval?: number;
      maxAttempts?: number;
    }
  ): Promise<TResult> {
    try {
      return await executeAndWaitHelper<TResult, TParams>(
        this,
        nodeId,
        commandName,
        parameters,
        options
      );
    } catch (err: any) {
      throw new PluginClientError(
        err?.details?.message || err?.message || `Failed to execute and wait for command ${commandName}`,
        err?.status,
        err?.details
      );
    }
  }

  // ========================================================================
  // Low-level API
  // ========================================================================

  /**
   * Make a custom API request
   *
   * @example
   * ```ts
   * const result = await client.request('/nodes/template/settings-schemas-list');
   * ```
   */
  async request<T = any>(path: string, options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: any;
  }): Promise<T> {
    const method = options?.method || 'GET';
    const url = `${this.config.baseUrl}/orgs/${this.config.orgId}/devices/${this.config.deviceId}${path}`;

    console.log(`[PluginClient] ${method} ${url}`);

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    console.log(`[PluginClient] Response: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[PluginClient] Error response:`, errorText);
      throw new PluginClientError(
        `Request failed: ${res.statusText}`,
        res.status,
        errorText
      );
    }

    const data = await res.json();
    console.log(`[PluginClient] Response data:`, data);
    return data;
  }

  /**
   * Get the underlying RAS client for advanced usage
   *
   * @example
   * ```ts
   * const client = pluginClient.getRASClient();
   * await client.edges.create({ ... });
   * ```
   */
  getRASClient(): RASClient {
    return this.client;
  }

  /**
   * Get the current configuration
   */
  getConfig(): Readonly<Required<PluginClientConfig>> {
    return { ...this.config };
  }
}

/**
 * Factory function to create a plugin client
 *
 * @example
 * ```tsx
 * function MyWidget({ orgId, deviceId, baseUrl, token }) {
 *   const client = createPluginClient({ orgId, deviceId, baseUrl, token });
 *   // ... use client
 * }
 * ```
 */
export function createPluginClient(config: PluginClientConfig): PluginClient {
  return new PluginClient(config);
}

/**
 * React hook for using the plugin client
 *
 * @example
 * ```tsx
 * function MyWidget({ orgId, deviceId, baseUrl, token }) {
 *   const client = usePluginClient({ orgId, deviceId, baseUrl, token });
 *
 *   useEffect(() => {
 *     client.queryNodes({ filter: 'type is "plm.product"' })
 *       .then(setProducts)
 *       .catch(setError);
 *   }, []);
 * }
 * ```
 */
export function usePluginClient(config: PluginClientConfig): PluginClient {
  // Simple memoization - in real React, you'd use useMemo
  // For now, just create a new instance each time
  // Plugins can optimize with useMemo if needed
  return new PluginClient(config);
}

export * from './schema';
export * from './pallet';
export * from './query';
export * from './node';
export * from './url-builder';
export * from './commands';
