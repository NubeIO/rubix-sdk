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
  schema?: Record<string, unknown>; // JSON Schema for parameters
  responseSchema?: Record<string, unknown>; // JSON Schema for response
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
export async function listCommands(
  client: PluginClient,
  nodeId: string
): Promise<CommandDefinition[]> {
  const config = client.getConfig();
  const url = `/orgs/${config.orgId}/devices/${config.deviceId}/nodes/${nodeId}/commands`;

  return await client.request<CommandDefinition[]>(url, { method: 'GET' });
}

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
export async function getCommand(
  client: PluginClient,
  nodeId: string,
  commandName: string
): Promise<CommandDefinition> {
  const config = client.getConfig();
  const url = `/orgs/${config.orgId}/devices/${config.deviceId}/nodes/${nodeId}/commands/${commandName}`;

  return await client.request<CommandDefinition>(url, { method: 'GET' });
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
 * const result = await executeCommand(client, nodeId, 'ping', { count: 5 });
 * console.log(result.result); // { success: true, latency: 12.5 }
 *
 * // Async command
 * const job = await executeCommand(client, nodeId, 'discover', { subnet: '192.168.1.0/24' });
 * console.log(job.jobId); // "job_abc123"
 * ```
 */
export async function executeCommand<TResult = any, TParams = any>(
  client: PluginClient,
  nodeId: string,
  commandName: string,
  parameters?: TParams,
  options?: ExecuteCommandOptions
): Promise<CommandExecuteResult<TResult>> {
  const config = client.getConfig();
  const queryParams = new URLSearchParams();

  if (options?.async) {
    queryParams.set('async', 'true');
  }

  if (options?.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      queryParams.set(key, String(value));
    });
  }

  const queryString = queryParams.toString();
  const url = `/orgs/${config.orgId}/devices/${config.deviceId}/nodes/${nodeId}/commands/${commandName}/execute${queryString ? `?${queryString}` : ''}`;

  const response = await client.request<any>(url, {
    method: 'POST',
    body: parameters || {},
  });

  // Check if response contains jobId (async execution)
  if (response.jobId) {
    return {
      jobId: response.jobId,
      isAsync: true,
    };
  }

  // Sync execution - return result
  return {
    result: response,
    isAsync: false,
  };
}

/**
 * Execute a GET command (query/read operation)
 *
 * @example
 * ```ts
 * const status = await executeGetCommand(client, nodeId, 'status', { verbose: true });
 * ```
 */
export async function executeGetCommand<TResult = any>(
  client: PluginClient,
  nodeId: string,
  commandName: string,
  query?: Record<string, string | number | boolean>
): Promise<TResult> {
  const config = client.getConfig();
  const queryParams = new URLSearchParams();

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      queryParams.set(key, String(value));
    });
  }

  const queryString = queryParams.toString();
  const url = `/orgs/${config.orgId}/devices/${config.deviceId}/nodes/${nodeId}/commands/${commandName}/execute${queryString ? `?${queryString}` : ''}`;

  return await client.request<TResult>(url, { method: 'GET' });
}

/**
 * Execute a POST command (create/mutation operation)
 *
 * @example
 * ```ts
 * const result = await executePostCommand(client, nodeId, 'reset', { force: true });
 * ```
 */
export async function executePostCommand<TResult = any, TParams = any>(
  client: PluginClient,
  nodeId: string,
  commandName: string,
  parameters?: TParams,
  options?: ExecuteCommandOptions
): Promise<CommandExecuteResult<TResult>> {
  return executeCommand<TResult, TParams>(client, nodeId, commandName, parameters, options);
}

/**
 * Execute a PATCH command (update operation)
 *
 * @example
 * ```ts
 * const result = await executePatchCommand(client, nodeId, 'updateConfig', { timeout: 30 });
 * ```
 */
export async function executePatchCommand<TResult = any, TParams = any>(
  client: PluginClient,
  nodeId: string,
  commandName: string,
  parameters?: TParams,
  options?: ExecuteCommandOptions
): Promise<CommandExecuteResult<TResult>> {
  const config = client.getConfig();
  const queryParams = new URLSearchParams();

  if (options?.async) {
    queryParams.set('async', 'true');
  }

  const queryString = queryParams.toString();
  const url = `/orgs/${config.orgId}/devices/${config.deviceId}/nodes/${nodeId}/commands/${commandName}/execute${queryString ? `?${queryString}` : ''}`;

  const response = await client.request<any>(url, {
    method: 'PATCH',
    body: parameters || {},
  });

  if (response.jobId) {
    return { jobId: response.jobId, isAsync: true };
  }

  return { result: response, isAsync: false };
}

/**
 * Execute a DELETE command (delete/clear operation)
 *
 * @example
 * ```ts
 * const result = await executeDeleteCommand(client, nodeId, 'clearCache');
 * ```
 */
export async function executeDeleteCommand<TResult = any, TParams = any>(
  client: PluginClient,
  nodeId: string,
  commandName: string,
  parameters?: TParams,
  options?: ExecuteCommandOptions
): Promise<CommandExecuteResult<TResult>> {
  const config = client.getConfig();
  const queryParams = new URLSearchParams();

  if (options?.async) {
    queryParams.set('async', 'true');
  }

  const queryString = queryParams.toString();
  const url = `/orgs/${config.orgId}/devices/${config.deviceId}/nodes/${nodeId}/commands/${commandName}/execute${queryString ? `?${queryString}` : ''}`;

  const response = await client.request<any>(url, {
    method: 'DELETE',
    body: parameters || {},
  });

  if (response.jobId) {
    return { jobId: response.jobId, isAsync: true };
  }

  return { result: response, isAsync: false };
}

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
export async function getCommandJob<TResult = any, TParams = any>(
  client: PluginClient,
  nodeId: string,
  jobId: string
): Promise<CommandJob<TResult, TParams>> {
  const config = client.getConfig();
  const url = `/orgs/${config.orgId}/devices/${config.deviceId}/nodes/${nodeId}/jobs/${jobId}`;

  return await client.request<CommandJob<TResult, TParams>>(url, { method: 'GET' });
}

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
export async function listCommandJobs<TResult = any, TParams = any>(
  client: PluginClient,
  nodeId: string,
  status?: 'pending' | 'running' | 'success' | 'failed'
): Promise<CommandJob<TResult, TParams>[]> {
  const config = client.getConfig();
  const queryParams = status ? `?status=${status}` : '';
  const url = `/orgs/${config.orgId}/devices/${config.deviceId}/nodes/${nodeId}/jobs${queryParams}`;

  return await client.request<CommandJob<TResult, TParams>[]>(url, { method: 'GET' });
}

/**
 * Cancel or delete a command job
 *
 * @example
 * ```ts
 * await cancelCommandJob(client, nodeId, 'job_abc123');
 * ```
 */
export async function cancelCommandJob(
  client: PluginClient,
  nodeId: string,
  jobId: string
): Promise<{ success: boolean; message: string }> {
  const config = client.getConfig();
  const url = `/orgs/${config.orgId}/devices/${config.deviceId}/nodes/${nodeId}/jobs/${jobId}`;

  return await client.request<{ success: boolean; message: string }>(url, { method: 'DELETE' });
}

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
export async function pollCommandJob<TResult = any, TParams = any>(
  client: PluginClient,
  nodeId: string,
  jobId: string,
  pollInterval: number = 1000,
  maxAttempts: number = 60
): Promise<CommandJob<TResult, TParams>> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const job = await getCommandJob<TResult, TParams>(client, nodeId, jobId);

    if (job.status === 'success' || job.status === 'failed') {
      return job;
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
    attempts++;
  }

  throw new Error(`Command job ${jobId} polling timed out after ${maxAttempts} attempts`);
}

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
export async function executeAndWait<TResult = any, TParams = any>(
  client: PluginClient,
  nodeId: string,
  commandName: string,
  parameters?: TParams,
  options?: ExecuteCommandOptions & {
    pollInterval?: number;
    maxAttempts?: number;
  }
): Promise<TResult> {
  const result = await executeCommand<TResult, TParams>(
    client,
    nodeId,
    commandName,
    parameters,
    options
  );

  // Sync execution - return result immediately
  if (!result.isAsync) {
    return result.result!;
  }

  // Async execution - poll for completion
  const job = await pollCommandJob<TResult, TParams>(
    client,
    nodeId,
    result.jobId!,
    options?.pollInterval,
    options?.maxAttempts
  );

  if (job.status === 'failed') {
    throw new Error(job.error || 'Command execution failed');
  }

  return job.result!;
}
