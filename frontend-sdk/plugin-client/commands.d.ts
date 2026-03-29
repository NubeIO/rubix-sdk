/**
 * Node Commands - Execute actions on nodes
 *
 * Commands are actions that nodes can execute, like "discover devices",
 * "ping connection", or "reset configuration". Each node type can register
 * its own commands with custom parameters and response schemas.
 */
import type { PluginClient } from './index';
/**
 * Command definition with schema and metadata
 */
export interface CommandDefinition {
    name: string;
    description?: string;
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    executionMode?: 'sync' | 'async' | 'auto';
    timeout?: number;
    schema?: Record<string, unknown>;
    responseSchema?: Record<string, unknown>;
    ui?: CommandUI;
}
/**
 * UI customization for commands
 */
export interface CommandUI {
    label?: string;
    icon?: string;
    category?: string;
    variant?: 'primary' | 'secondary' | 'danger';
    confirmMessage?: string;
    successMessage?: string;
}
/**
 * Command execution result (sync or async)
 */
export interface CommandExecuteResult<T = any> {
    /** Result data (for sync commands) */
    result?: T;
    /** Job ID (for async commands) */
    jobId?: string;
    /** Whether this was executed asynchronously */
    isAsync?: boolean;
}
/**
 * Command job status
 */
export interface CommandJob<TResult = any, TParams = any> {
    id: string;
    nodeId: string;
    orgId: string;
    deviceId: string;
    commandName: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    parameters: TParams;
    result?: TResult;
    error?: string;
    progress?: number;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    createdBy?: string;
}
/**
 * Options for executing commands
 */
export interface ExecuteCommandOptions {
    /** Force async execution (returns jobId instead of result) */
    async?: boolean;
    /** Query parameters (for GET commands) */
    query?: Record<string, string | number | boolean>;
}
/**
 * List all commands available for a node
 *
 * @example
 * ```ts
 * const commands = await listCommands(client, nodeId);
 * console.log(commands.map(c => c.name)); // ["ping", "discover", "reset"]
 * ```
 */
export declare function listCommands(client: PluginClient, nodeId: string): Promise<CommandDefinition[]>;
/**
 * Get a specific command definition including its parameter schema
 *
 * @example
 * ```ts
 * const cmd = await getCommand(client, nodeId, 'ping');
 * console.log(cmd.schema); // Parameter schema
 * console.log(cmd.responseSchema); // Response schema
 * ```
 */
export declare function getCommand(client: PluginClient, nodeId: string, commandName: string): Promise<CommandDefinition>;
/**
 * Execute a command on a node
 *
 * Handles both sync and async execution automatically. For async commands,
 * returns a jobId that can be polled for status.
 *
 * @example
 * ```ts
 * // Sync command
 * const result = await executeCommand(client, nodeId, 'ping', { count: 5 });
 * console.log(result.result); // { success: true, latency: 12.5 }
 *
 * // Async command
 * const job = await executeCommand(client, nodeId, 'discover', { subnet: '192.168.1.0/24' });
 * console.log(job.jobId); // "job_abc123"
 * ```
 */
export declare function executeCommand<TResult = any, TParams = any>(client: PluginClient, nodeId: string, commandName: string, parameters?: TParams, options?: ExecuteCommandOptions): Promise<CommandExecuteResult<TResult>>;
/**
 * Execute a GET command (query/read operation)
 *
 * @example
 * ```ts
 * const status = await executeGetCommand(client, nodeId, 'status', { verbose: true });
 * ```
 */
export declare function executeGetCommand<TResult = any>(client: PluginClient, nodeId: string, commandName: string, query?: Record<string, string | number | boolean>): Promise<TResult>;
/**
 * Execute a POST command (create/mutation operation)
 *
 * @example
 * ```ts
 * const result = await executePostCommand(client, nodeId, 'reset', { force: true });
 * ```
 */
export declare function executePostCommand<TResult = any, TParams = any>(client: PluginClient, nodeId: string, commandName: string, parameters?: TParams, options?: ExecuteCommandOptions): Promise<CommandExecuteResult<TResult>>;
/**
 * Execute a PATCH command (update operation)
 *
 * @example
 * ```ts
 * const result = await executePatchCommand(client, nodeId, 'updateConfig', { timeout: 30 });
 * ```
 */
export declare function executePatchCommand<TResult = any, TParams = any>(client: PluginClient, nodeId: string, commandName: string, parameters?: TParams, options?: ExecuteCommandOptions): Promise<CommandExecuteResult<TResult>>;
/**
 * Execute a DELETE command (delete/clear operation)
 *
 * @example
 * ```ts
 * const result = await executeDeleteCommand(client, nodeId, 'clearCache');
 * ```
 */
export declare function executeDeleteCommand<TResult = any, TParams = any>(client: PluginClient, nodeId: string, commandName: string, parameters?: TParams, options?: ExecuteCommandOptions): Promise<CommandExecuteResult<TResult>>;
/**
 * Get command job status and result
 *
 * @example
 * ```ts
 * const job = await getCommandJob(client, nodeId, 'job_abc123');
 * console.log(job.status); // "running" | "success" | "failed"
 * if (job.status === 'success') {
 *   console.log(job.result); // Command result
 * }
 * ```
 */
export declare function getCommandJob<TResult = any, TParams = any>(client: PluginClient, nodeId: string, jobId: string): Promise<CommandJob<TResult, TParams>>;
/**
 * List all command jobs for a node, optionally filtered by status
 *
 * @example
 * ```ts
 * // Get all jobs
 * const allJobs = await listCommandJobs(client, nodeId);
 *
 * // Get only running jobs
 * const runningJobs = await listCommandJobs(client, nodeId, 'running');
 * ```
 */
export declare function listCommandJobs<TResult = any, TParams = any>(client: PluginClient, nodeId: string, status?: 'pending' | 'running' | 'success' | 'failed'): Promise<CommandJob<TResult, TParams>[]>;
/**
 * Cancel or delete a command job
 *
 * @example
 * ```ts
 * await cancelCommandJob(client, nodeId, 'job_abc123');
 * ```
 */
export declare function cancelCommandJob(client: PluginClient, nodeId: string, jobId: string): Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Poll a command job until completion
 *
 * Continuously polls the job status until it reaches a terminal state
 * (success or failed). Returns the final job state.
 *
 * @param client - Plugin client
 * @param nodeId - Node ID
 * @param jobId - Job ID to poll
 * @param pollInterval - Polling interval in milliseconds (default: 1000)
 * @param maxAttempts - Maximum number of polling attempts (default: 60)
 *
 * @example
 * ```ts
 * const result = await executeCommand(client, nodeId, 'discover', { subnet: '192.168.1.0/24' });
 * if (result.jobId) {
 *   const job = await pollCommandJob(client, nodeId, result.jobId);
 *   if (job.status === 'success') {
 *     console.log('Discovery complete:', job.result);
 *   } else {
 *     console.error('Discovery failed:', job.error);
 *   }
 * }
 * ```
 */
export declare function pollCommandJob<TResult = any, TParams = any>(client: PluginClient, nodeId: string, jobId: string, pollInterval?: number, maxAttempts?: number): Promise<CommandJob<TResult, TParams>>;
/**
 * Execute a command and wait for completion
 *
 * Convenience function that executes a command and automatically polls
 * for completion if it returns a jobId.
 *
 * @example
 * ```ts
 * const result = await executeAndWait(client, nodeId, 'discover', {
 *   subnet: '192.168.1.0/24'
 * });
 * console.log('Discovery complete:', result);
 * ```
 */
export declare function executeAndWait<TResult = any, TParams = any>(client: PluginClient, nodeId: string, commandName: string, parameters?: TParams, options?: ExecuteCommandOptions & {
    pollInterval?: number;
    maxAttempts?: number;
}): Promise<TResult>;
