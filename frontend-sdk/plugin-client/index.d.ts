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
 *   const newProduct = await client.createNode(undefined, {
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
import { RASClient } from '../ras/client';
import type { Node } from '../ras/types';
import { type NodeSchemasListResponse } from './schema';
import { type CommandDefinition, type CommandJob, type CommandExecuteResult, type ExecuteCommandOptions } from './commands';
import { type Team, type CreateTeamInput, type UpdateTeamInput } from './teams';
import { type User, type InviteUserInput, type UpdateUserInput } from './users';
import { type Ref, type CreateRefInput } from './refs';
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
    profile?: string;
    identity?: string[];
    settings?: Record<string, unknown>;
    data?: Record<string, unknown>;
    ui?: Record<string, unknown>;
    position?: {
        x: number;
        y: number;
    };
    refs?: NodeRef[];
}
export interface UpdateNodeInput {
    name?: string;
    parentId?: string;
    settings?: Record<string, unknown>;
    data?: Record<string, unknown>;
    ui?: Record<string, unknown>;
    position?: {
        x: number;
        y: number;
    };
}
export interface PalletDetailsResponse {
    nodeType: string;
    inputs: any[];
    outputs: any[];
    settings?: Record<string, any>;
    commands?: any[];
    uiCapabilities?: any;
    help?: any;
}
export declare class PluginClientError extends Error {
    status?: number | undefined;
    details?: unknown | undefined;
    constructor(message: string, status?: number | undefined, details?: unknown | undefined);
}
export declare class PluginClient {
    private client;
    private config;
    constructor(config: PluginClientConfig);
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
    queryNodes(options?: QueryNodesOptions): Promise<Node[]>;
    /**
     * Get a single node by ID
     *
     * @example
     * ```ts
     * const product = await client.getNode('node_abc123');
     * console.log(product.name, product.settings);
     * ```
     */
    getNode(nodeId: string): Promise<Node>;
    /**
     * Create a new node
     *
     * @example
     * ```ts
     * const product = await client.createNode(undefined, {
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
    createNode(parentId: string | undefined, input: Omit<CreateNodeInput, 'parentId' | 'refs'> & {
        refs?: NodeRef[];
    }): Promise<Node>;
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
    updateNode(nodeId: string, input: UpdateNodeInput): Promise<Node>;
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
    updateNodeSettings(nodeId: string, settings: Record<string, unknown>): Promise<Node>;
    /**
     * Delete a node
     *
     * @example
     * ```ts
     * await client.deleteNode('node_abc123');
     * ```
     */
    deleteNode(nodeId: string): Promise<void>;
    /**
     * List all nodes (with optional filtering via query params)
     *
     * @example
     * ```ts
     * const allNodes = await client.listNodes();
     * ```
     */
    listNodes(): Promise<Node[]>;
    listNodeSchemas(nodeId: string): Promise<NodeSchemasListResponse>;
    getNodeSchema(nodeId: string, schemaName: string): Promise<Record<string, unknown> | null>;
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
    listNodeTypeSchemas(nodeType: string): Promise<NodeSchemasListResponse>;
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
    getNodeTypeSchema(nodeType: string, schemaName?: string): Promise<Record<string, any> | null>;
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
    getPalletDetails(nodeType: string): Promise<PalletDetailsResponse>;
    /**
     * List all commands available for a node
     *
     * @example
     * ```ts
     * const commands = await client.listCommands(nodeId);
     * console.log(commands.map(c => c.name)); // ["ping", "discover", "reset"]
     * ```
     */
    listCommands(nodeId: string): Promise<CommandDefinition[]>;
    /**
     * Get a specific command definition including its parameter schema
     *
     * @example
     * ```ts
     * const cmd = await client.getCommand(nodeId, 'ping');
     * console.log(cmd.schema); // Parameter schema
     * ```
     */
    getCommand(nodeId: string, commandName: string): Promise<CommandDefinition>;
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
    executeCommand<TResult = any, TParams = any>(nodeId: string, commandName: string, parameters?: TParams, options?: ExecuteCommandOptions): Promise<CommandExecuteResult<TResult>>;
    /**
     * Execute a GET command (query/read operation)
     *
     * @example
     * ```ts
     * const status = await client.executeGetCommand(nodeId, 'status', { verbose: true });
     * ```
     */
    executeGetCommand<TResult = any>(nodeId: string, commandName: string, query?: Record<string, string | number | boolean>): Promise<TResult>;
    /**
     * Execute a POST command (create/mutation operation)
     *
     * @example
     * ```ts
     * const result = await client.executePostCommand(nodeId, 'reset', { force: true });
     * ```
     */
    executePostCommand<TResult = any, TParams = any>(nodeId: string, commandName: string, parameters?: TParams, options?: ExecuteCommandOptions): Promise<CommandExecuteResult<TResult>>;
    /**
     * Execute a PATCH command (update operation)
     *
     * @example
     * ```ts
     * const result = await client.executePatchCommand(nodeId, 'updateConfig', { timeout: 30 });
     * ```
     */
    executePatchCommand<TResult = any, TParams = any>(nodeId: string, commandName: string, parameters?: TParams, options?: ExecuteCommandOptions): Promise<CommandExecuteResult<TResult>>;
    /**
     * Execute a DELETE command (delete/clear operation)
     *
     * @example
     * ```ts
     * const result = await client.executeDeleteCommand(nodeId, 'clearCache');
     * ```
     */
    executeDeleteCommand<TResult = any, TParams = any>(nodeId: string, commandName: string, parameters?: TParams, options?: ExecuteCommandOptions): Promise<CommandExecuteResult<TResult>>;
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
    getCommandJob<TResult = any, TParams = any>(nodeId: string, jobId: string): Promise<CommandJob<TResult, TParams>>;
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
    listCommandJobs<TResult = any, TParams = any>(nodeId: string, status?: 'pending' | 'running' | 'success' | 'failed'): Promise<CommandJob<TResult, TParams>[]>;
    /**
     * Cancel or delete a command job
     *
     * @example
     * ```ts
     * await client.cancelCommandJob(nodeId, 'job_abc123');
     * ```
     */
    cancelCommandJob(nodeId: string, jobId: string): Promise<{
        success: boolean;
        message: string;
    }>;
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
    pollCommandJob<TResult = any, TParams = any>(nodeId: string, jobId: string, pollInterval?: number, maxAttempts?: number): Promise<CommandJob<TResult, TParams>>;
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
    executeAndWait<TResult = any, TParams = any>(nodeId: string, commandName: string, parameters?: TParams, options?: ExecuteCommandOptions & {
        pollInterval?: number;
        maxAttempts?: number;
    }): Promise<TResult>;
    /**
     * List all teams in the organization
     *
     * @example
     * ```ts
     * const teams = await client.listTeams();
     * console.log(teams.map(t => t.name)); // ["Engineering", "Sales", "QA"]
     * ```
     */
    listTeams(): Promise<Team[]>;
    /**
     * Get a specific team by ID
     *
     * @example
     * ```ts
     * const team = await client.getTeam('team_001');
     * console.log(team.name, team.settings);
     * ```
     */
    getTeam(teamId: string): Promise<Team>;
    /**
     * Create a new team
     *
     * @example
     * ```ts
     * const team = await client.createTeam({
     *   name: 'Engineering',
     *   settings: { description: 'Core engineering team' }
     * });
     * ```
     */
    createTeam(input: CreateTeamInput): Promise<Team>;
    /**
     * Update a team
     *
     * @example
     * ```ts
     * await client.updateTeam('team_001', {
     *   name: 'Engineering Team',
     *   settings: { description: 'Updated description' }
     * });
     * ```
     */
    updateTeam(teamId: string, input: UpdateTeamInput): Promise<Team>;
    /**
     * Delete a team
     *
     * @example
     * ```ts
     * await client.deleteTeam('team_001');
     * ```
     */
    deleteTeam(teamId: string): Promise<void>;
    /**
     * Add a user to a team
     *
     * @example
     * ```ts
     * await client.addUserToTeam('team_001', 'user_alice_123');
     * ```
     */
    addUserToTeam(teamId: string, userId: string): Promise<void>;
    /**
     * Remove a user from a team
     *
     * @example
     * ```ts
     * await client.removeUserFromTeam('team_001', 'user_alice_123');
     * ```
     */
    removeUserFromTeam(teamId: string, userId: string): Promise<void>;
    /**
     * List all users in a team
     *
     * @example
     * ```ts
     * const users = await client.listTeamUsers('team_001');
     * console.log(users.map(u => u.name)); // ["Alice", "Bob", "Charlie"]
     * ```
     */
    listTeamUsers(teamId: string): Promise<User[]>;
    /**
     * List all users in the organization
     *
     * @example
     * ```ts
     * const users = await client.listUsers({ includeSettings: true });
     * console.log(users.map(u => u.name)); // ["Alice", "Bob", "Charlie"]
     * ```
     */
    listUsers(options?: {
        includeSettings?: boolean;
    }): Promise<User[]>;
    /**
     * Get a specific user by ID
     *
     * @example
     * ```ts
     * const user = await client.getUser('user_alice_123', { includeSettings: true });
     * console.log(user.name, user.settings);
     * ```
     */
    getUser(userId: string, options?: {
        includeSettings?: boolean;
    }): Promise<User>;
    /**
     * Invite a new user to the organization
     *
     * @example
     * ```ts
     * const user = await client.inviteUser({
     *   email: 'alice@example.com',
     *   name: 'Alice',
     *   role: 'member'
     * });
     * ```
     */
    inviteUser(input: InviteUserInput): Promise<User>;
    /**
     * Update a user
     *
     * @example
     * ```ts
     * await client.updateUser('user_alice_123', {
     *   name: 'Alice Smith',
     *   settings: { role: 'admin' }
     * });
     * ```
     */
    updateUser(userId: string, input: UpdateUserInput): Promise<User>;
    /**
     * Delete a user
     *
     * @example
     * ```ts
     * await client.deleteUser('user_alice_123');
     * ```
     */
    deleteUser(userId: string): Promise<void>;
    /**
     * List all refs for a node
     *
     * @example
     * ```ts
     * const refs = await client.listRefs(taskId);
     * console.log(refs); // [{ refName: 'userRef', toNodeId: 'user_alice_123', ... }]
     * ```
     */
    listRefs(nodeId: string): Promise<Ref[]>;
    /**
     * Create a new ref on a node
     *
     * @example
     * ```ts
     * await client.createRef(taskId, {
     *   refName: 'userRef',
     *   toNodeId: 'user_alice_123',
     *   displayName: 'Alice'
     * });
     * ```
     */
    createRef(nodeId: string, input: CreateRefInput): Promise<Ref>;
    /**
     * Delete all refs of a specific type from a node
     *
     * WARNING: This removes ALL refs with the given refName, not a specific target.
     *
     * @example
     * ```ts
     * await client.deleteRef(taskId, 'userRef'); // Removes ALL userRefs
     * ```
     */
    deleteRef(nodeId: string, refName: string): Promise<void>;
    /**
     * Assign a team to a node (creates teamRef)
     *
     * @example
     * ```ts
     * await client.assignTeamToNode(taskId, 'team_001', 'Engineering');
     * ```
     */
    assignTeamToNode(nodeId: string, teamId: string, teamName?: string): Promise<Ref>;
    /**
     * Assign a user to a node (creates userRef)
     *
     * @example
     * ```ts
     * await client.assignUserToNode(taskId, 'user_alice_123', 'Alice');
     * ```
     */
    assignUserToNode(nodeId: string, userId: string, userName?: string): Promise<Ref>;
    /**
     * Remove all team assignments from a node
     *
     * WARNING: This removes ALL teamRefs from the node.
     *
     * @example
     * ```ts
     * await client.removeTeamsFromNode(taskId);
     * ```
     */
    removeTeamsFromNode(nodeId: string): Promise<void>;
    /**
     * Remove all user assignments from a node
     *
     * WARNING: This removes ALL userRefs from the node.
     *
     * @example
     * ```ts
     * await client.removeUsersFromNode(taskId);
     * ```
     */
    removeUsersFromNode(nodeId: string): Promise<void>;
    /**
     * Get all teams assigned to a node
     *
     * @example
     * ```ts
     * const teams = await client.getNodeTeams(taskId);
     * console.log(teams.map(t => t.displayName)); // ["Engineering", "QA"]
     * ```
     */
    getNodeTeams(nodeId: string): Promise<Ref[]>;
    /**
     * Get all users assigned to a node
     *
     * @example
     * ```ts
     * const users = await client.getNodeUsers(taskId);
     * console.log(users.map(u => u.displayName)); // ["Alice", "Bob"]
     * ```
     */
    getNodeUsers(nodeId: string): Promise<Ref[]>;
    /**
     * Check if a node is public (has no teamRef or userRef)
     *
     * @example
     * ```ts
     * const isPublic = await client.isNodePublic(taskId);
     * if (isPublic) {
     *   console.log('Task is visible to everyone');
     * }
     * ```
     */
    isNodePublic(nodeId: string): Promise<boolean>;
    /**
     * Replace all team assignments on a node
     *
     * Efficiently replaces all teamRefs with a new set of teams.
     *
     * @example
     * ```ts
     * await client.replaceNodeTeams(taskId, [
     *   { teamId: 'team_001', teamName: 'Engineering' },
     *   { teamId: 'team_002', teamName: 'QA' }
     * ]);
     * ```
     */
    replaceNodeTeams(nodeId: string, teams: Array<{
        teamId: string;
        teamName?: string;
    }>): Promise<void>;
    /**
     * Replace all user assignments on a node
     *
     * Efficiently replaces all userRefs with a new set of users.
     *
     * @example
     * ```ts
     * // Assign task to Alice only
     * await client.replaceNodeUsers(taskId, [
     *   { userId: 'user_alice_123', userName: 'Alice' }
     * ]);
     * ```
     */
    replaceNodeUsers(nodeId: string, users: Array<{
        userId: string;
        userName?: string;
    }>): Promise<void>;
    /**
     * Make a custom API request
     *
     * @example
     * ```ts
     * const result = await client.request('/nodes/template/settings-schemas-list');
     * ```
     */
    request<T = any>(path: string, options?: {
        method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        body?: any;
    }): Promise<T>;
    /**
     * Get the underlying RAS client for advanced usage
     *
     * @example
     * ```ts
     * const client = pluginClient.getRASClient();
     * await client.edges.create({ ... });
     * ```
     */
    getRASClient(): RASClient;
    /**
     * Get the current configuration
     */
    getConfig(): Readonly<Required<PluginClientConfig>>;
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
export declare function createPluginClient(config: PluginClientConfig): PluginClient;
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
export declare function usePluginClient(config: PluginClientConfig): PluginClient;
export * from './schema';
export * from './pallet';
export * from './query';
export * from './node';
export * from './url-builder';
export * from './commands';
export * from './teams';
export * from './users';
export * from './refs';
