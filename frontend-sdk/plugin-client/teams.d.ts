/**
 * Teams API helpers for plugin client
 */
import type { PluginClient } from './index';
export interface Team {
    id: string;
    name: string;
    type: string;
    settings?: {
        description?: string;
        [key: string]: any;
    };
    createdAt?: string;
    updatedAt?: string;
}
export interface CreateTeamInput {
    name: string;
    settings?: {
        description?: string;
        [key: string]: any;
    };
}
export interface UpdateTeamInput {
    name?: string;
    settings?: {
        description?: string;
        [key: string]: any;
    };
}
export interface User {
    id: string;
    name: string;
    type: string;
    settings?: {
        email?: string;
        role?: string;
        [key: string]: any;
    };
    createdAt?: string;
    updatedAt?: string;
}
/**
 * List all teams in the organization
 */
export declare function listTeams(client: PluginClient): Promise<Team[]>;
/**
 * Get a specific team by ID
 */
export declare function getTeam(client: PluginClient, teamId: string): Promise<Team>;
/**
 * Create a new team
 */
export declare function createTeam(client: PluginClient, input: CreateTeamInput): Promise<Team>;
/**
 * Update a team
 */
export declare function updateTeam(client: PluginClient, teamId: string, input: UpdateTeamInput): Promise<Team>;
/**
 * Delete a team
 */
export declare function deleteTeam(client: PluginClient, teamId: string): Promise<void>;
/**
 * Add a user to a team
 */
export declare function addUserToTeam(client: PluginClient, teamId: string, userId: string): Promise<void>;
/**
 * Remove a user from a team
 */
export declare function removeUserFromTeam(client: PluginClient, teamId: string, userId: string): Promise<void>;
/**
 * List all users in a team
 */
export declare function listTeamUsers(client: PluginClient, teamId: string): Promise<User[]>;
