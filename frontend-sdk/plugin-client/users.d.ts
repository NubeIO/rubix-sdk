/**
 * Users API helpers for plugin client
 */
import type { PluginClient } from './index';
export interface User {
    id: string;
    name: string;
    type: string;
    settings?: {
        email?: string;
        role?: string;
        status?: string;
        [key: string]: any;
    };
    createdAt?: string;
    updatedAt?: string;
}
export interface InviteUserInput {
    email: string;
    name?: string;
    role?: string;
    settings?: Record<string, any>;
}
export interface UpdateUserInput {
    name?: string;
    settings?: {
        email?: string;
        role?: string;
        status?: string;
        [key: string]: any;
    };
}
/**
 * List all users in the organization
 */
export declare function listUsers(client: PluginClient, options?: {
    includeSettings?: boolean;
}): Promise<User[]>;
/**
 * Get a specific user by ID
 */
export declare function getUser(client: PluginClient, userId: string, options?: {
    includeSettings?: boolean;
}): Promise<User>;
/**
 * Invite a new user to the organization
 */
export declare function inviteUser(client: PluginClient, input: InviteUserInput): Promise<User>;
/**
 * Update a user
 */
export declare function updateUser(client: PluginClient, userId: string, input: UpdateUserInput): Promise<User>;
/**
 * Delete a user
 */
export declare function deleteUser(client: PluginClient, userId: string): Promise<void>;
