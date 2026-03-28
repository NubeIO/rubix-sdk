/**
 * Refs API helpers for plugin client
 * Includes general ref management + access control convenience methods
 */

import type { PluginClient, NodeRef } from './index';

export interface Ref {
  refName: string;
  toNodeId: string;
  displayName?: string;
  order?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateRefInput {
  refName: string;
  toNodeId: string;
  displayName?: string;
  order?: number;
  metadata?: Record<string, unknown>;
}

/**
 * List all refs for a node
 */
export async function listRefs(client: PluginClient, nodeId: string): Promise<Ref[]> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  const result = await rasClient.refs.list({
    orgId: config.orgId,
    deviceId: config.deviceId,
    nodeId,
  });

  return (result?.data || []) as Ref[];
}

/**
 * Create a new ref on a node
 */
export async function createRef(
  client: PluginClient,
  nodeId: string,
  input: CreateRefInput
): Promise<Ref> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  const result = await rasClient.refs.create({
    orgId: config.orgId,
    deviceId: config.deviceId,
    nodeId,
    body: {
      refName: input.refName,
      toNodeId: input.toNodeId,
      displayName: input.displayName,
      order: input.order,
      metadata: input.metadata,
    },
  });

  return result.data as Ref;
}

/**
 * Delete all refs of a specific type from a node
 *
 * Note: The delete endpoint removes ALL refs with the given refName,
 * not a specific target. To remove a specific team/user, you need to:
 * 1. List all refs
 * 2. Delete the refName (removes all)
 * 3. Re-create the refs you want to keep
 */
export async function deleteRef(
  client: PluginClient,
  nodeId: string,
  refName: string
): Promise<void> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  await rasClient.refs.delete({
    orgId: config.orgId,
    deviceId: config.deviceId,
    nodeId,
    refName,
  });
}

// ============================================================================
// Access Control Helpers (teamRef / userRef convenience methods)
// ============================================================================

/**
 * Assign a team to a node (creates teamRef)
 *
 * @example
 * ```ts
 * await client.assignTeamToNode(taskId, teamId, 'Engineering Team');
 * ```
 */
export async function assignTeamToNode(
  client: PluginClient,
  nodeId: string,
  teamId: string,
  teamName?: string
): Promise<Ref> {
  return createRef(client, nodeId, {
    refName: 'teamRef',
    toNodeId: teamId,
    displayName: teamName,
  });
}

/**
 * Assign a user to a node (creates userRef)
 *
 * @example
 * ```ts
 * // Assign task to specific user
 * await client.assignUserToNode(taskId, userId, 'Alice');
 * ```
 */
export async function assignUserToNode(
  client: PluginClient,
  nodeId: string,
  userId: string,
  userName?: string
): Promise<Ref> {
  return createRef(client, nodeId, {
    refName: 'userRef',
    toNodeId: userId,
    displayName: userName,
  });
}

/**
 * Remove all team assignments from a node (deletes all teamRefs)
 *
 * WARNING: This removes ALL teamRefs from the node.
 * To remove a specific team while keeping others, use:
 * 1. listRefs() to get all refs
 * 2. deleteRef('teamRef') to remove all
 * 3. Re-create the teamRefs you want to keep
 */
export async function removeTeamsFromNode(client: PluginClient, nodeId: string): Promise<void> {
  await deleteRef(client, nodeId, 'teamRef');
}

/**
 * Remove all user assignments from a node (deletes all userRefs)
 *
 * WARNING: This removes ALL userRefs from the node.
 * To remove a specific user while keeping others, use:
 * 1. listRefs() to get all refs
 * 2. deleteRef('userRef') to remove all
 * 3. Re-create the userRefs you want to keep
 */
export async function removeUsersFromNode(client: PluginClient, nodeId: string): Promise<void> {
  await deleteRef(client, nodeId, 'userRef');
}

/**
 * Get all teams assigned to a node
 *
 * @example
 * ```ts
 * const teams = await client.getNodeTeams(taskId);
 * console.log(teams.map(t => t.displayName)); // ["Engineering", "QA"]
 * ```
 */
export async function getNodeTeams(client: PluginClient, nodeId: string): Promise<Ref[]> {
  const refs = await listRefs(client, nodeId);
  return refs.filter((ref) => ref.refName === 'teamRef');
}

/**
 * Get all users assigned to a node
 *
 * @example
 * ```ts
 * const users = await client.getNodeUsers(taskId);
 * console.log(users.map(u => u.displayName)); // ["Alice", "Bob"]
 * ```
 */
export async function getNodeUsers(client: PluginClient, nodeId: string): Promise<Ref[]> {
  const refs = await listRefs(client, nodeId);
  return refs.filter((ref) => ref.refName === 'userRef');
}

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
export async function isNodePublic(client: PluginClient, nodeId: string): Promise<boolean> {
  const refs = await listRefs(client, nodeId);
  const hasTeamRef = refs.some((ref) => ref.refName === 'teamRef');
  const hasUserRef = refs.some((ref) => ref.refName === 'userRef');
  return !hasTeamRef && !hasUserRef;
}

/**
 * Replace a node's team assignments
 *
 * Efficiently replaces all teamRefs with a new set of teams.
 * More efficient than removing and adding individually.
 *
 * @example
 * ```ts
 * // Replace all teams with a new list
 * await client.replaceNodeTeams(taskId, [
 *   { teamId: 'team_001', teamName: 'Engineering' },
 *   { teamId: 'team_002', teamName: 'QA' },
 * ]);
 * ```
 */
export async function replaceNodeTeams(
  client: PluginClient,
  nodeId: string,
  teams: Array<{ teamId: string; teamName?: string }>
): Promise<void> {
  // Delete all existing teamRefs
  try {
    await deleteRef(client, nodeId, 'teamRef');
  } catch (err) {
    // If no teamRefs exist, delete will fail - that's okay
    console.log('[replaceNodeTeams] No existing teamRefs to delete');
  }

  // Create new teamRefs
  for (const team of teams) {
    await assignTeamToNode(client, nodeId, team.teamId, team.teamName);
  }
}

/**
 * Replace a node's user assignments
 *
 * Efficiently replaces all userRefs with a new set of users.
 * More efficient than removing and adding individually.
 *
 * @example
 * ```ts
 * // Assign task to Alice only
 * await client.replaceNodeUsers(taskId, [
 *   { userId: 'user_alice_123', userName: 'Alice' }
 * ]);
 * ```
 */
export async function replaceNodeUsers(
  client: PluginClient,
  nodeId: string,
  users: Array<{ userId: string; userName?: string }>
): Promise<void> {
  // Delete all existing userRefs
  try {
    await deleteRef(client, nodeId, 'userRef');
  } catch (err) {
    // If no userRefs exist, delete will fail - that's okay
    console.log('[replaceNodeUsers] No existing userRefs to delete');
  }

  // Create new userRefs
  for (const user of users) {
    await assignUserToNode(client, nodeId, user.userId, user.userName);
  }
}
