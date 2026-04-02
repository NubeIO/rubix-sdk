/**
 * Refs API helpers for plugin client
 * Includes general ref management + access control convenience methods
 */
import type { PluginClient } from './index';
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
export declare function listRefs(client: PluginClient, nodeId: string): Promise<Ref[]>;
/**
 * Create a new ref on a node
 */
export declare function createRef(client: PluginClient, nodeId: string, input: CreateRefInput): Promise<Ref>;
/**
 * Delete all refs of a specific type from a node
 *
 * Note: The delete endpoint removes ALL refs with the given refName,
 * not a specific target. To remove a specific team/user, you need to:
 * 1. List all refs
 * 2. Delete the refName (removes all)
 * 3. Re-create the refs you want to keep
 */
export declare function deleteRef(client: PluginClient, nodeId: string, refName: string): Promise<void>;
/**
 * Assign a team to a node (creates teamRef)
 *
 * @example
 * ```ts
 * await client.assignTeamToNode(taskId, teamId, 'Engineering Team');
 * ```
 */
export declare function assignTeamToNode(client: PluginClient, nodeId: string, teamId: string, teamName?: string): Promise<Ref>;
/**
 * Assign a user to a node (creates userRef)
 *
 * @example
 * ```ts
 * // Assign task to specific user
 * await client.assignUserToNode(taskId, userId, 'Alice');
 * ```
 */
export declare function assignUserToNode(client: PluginClient, nodeId: string, userId: string, userName?: string): Promise<Ref>;
/**
 * Remove all team assignments from a node (deletes all teamRefs)
 *
 * WARNING: This removes ALL teamRefs from the node.
 * To remove a specific team while keeping others, use:
 * 1. listRefs() to get all refs
 * 2. deleteRef('teamRef') to remove all
 * 3. Re-create the teamRefs you want to keep
 */
export declare function removeTeamsFromNode(client: PluginClient, nodeId: string): Promise<void>;
/**
 * Remove all user assignments from a node (deletes all userRefs)
 *
 * WARNING: This removes ALL userRefs from the node.
 * To remove a specific user while keeping others, use:
 * 1. listRefs() to get all refs
 * 2. deleteRef('userRef') to remove all
 * 3. Re-create the userRefs you want to keep
 */
export declare function removeUsersFromNode(client: PluginClient, nodeId: string): Promise<void>;
/**
 * Get all teams assigned to a node
 *
 * @example
 * ```ts
 * const teams = await client.getNodeTeams(taskId);
 * console.log(teams.map(t => t.displayName)); // ["Engineering", "QA"]
 * ```
 */
export declare function getNodeTeams(client: PluginClient, nodeId: string): Promise<Ref[]>;
/**
 * Get all users assigned to a node
 *
 * @example
 * ```ts
 * const users = await client.getNodeUsers(taskId);
 * console.log(users.map(u => u.displayName)); // ["Alice", "Bob"]
 * ```
 */
export declare function getNodeUsers(client: PluginClient, nodeId: string): Promise<Ref[]>;
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
export declare function isNodePublic(client: PluginClient, nodeId: string): Promise<boolean>;
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
export declare function replaceNodeTeams(client: PluginClient, nodeId: string, teams: Array<{
    teamId: string;
    teamName?: string;
}>): Promise<void>;
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
export declare function replaceNodeUsers(client: PluginClient, nodeId: string, users: Array<{
    userId: string;
    userName?: string;
}>): Promise<void>;
/**
 * Add an assigned user to a node (creates assignedUserRef).
 */
export declare function setAssignedUser(client: PluginClient, nodeId: string, userId: string, userName?: string): Promise<Ref>;
/**
 * Remove all assigned users from a node
 */
export declare function removeAssignedUser(client: PluginClient, nodeId: string): Promise<void>;
/**
 * Get all assigned users for a node
 */
export declare function getAssignedUsers(client: PluginClient, nodeId: string): Promise<Ref[]>;
/**
 * Get the first assigned user for a node (convenience)
 */
export declare function getAssignedUser(client: PluginClient, nodeId: string): Promise<Ref | null>;
/**
 * Replace all assigned users on a node.
 * Pass empty array to unassign all.
 */
export declare function replaceAssignedUsers(client: PluginClient, nodeId: string, users: Array<{
    userId: string;
    userName?: string;
}>): Promise<void>;
