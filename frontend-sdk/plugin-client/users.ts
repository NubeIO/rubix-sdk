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
export async function listUsers(
  client: PluginClient,
  options?: { includeSettings?: boolean }
): Promise<User[]> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  const result = await rasClient.users.list({
    orgId: config.orgId,
    deviceId: config.deviceId,
    includeSettings: options?.includeSettings,
  });

  return (result?.data || []) as User[];
}

/**
 * Get a specific user by ID
 */
export async function getUser(
  client: PluginClient,
  userId: string,
  options?: { includeSettings?: boolean }
): Promise<User> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  const result = await rasClient.users.get({
    orgId: config.orgId,
    deviceId: config.deviceId,
    userId,
    includeSettings: options?.includeSettings,
  });

  return result.data as User;
}

/**
 * Invite a new user to the organization
 */
export async function inviteUser(client: PluginClient, input: InviteUserInput): Promise<User> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  const result = await rasClient.users.invite({
    orgId: config.orgId,
    deviceId: config.deviceId,
    body: {
      email: input.email,
      name: input.name,
      role: input.role,
      settings: input.settings,
    },
  });

  return result.data as User;
}

/**
 * Update a user
 */
export async function updateUser(
  client: PluginClient,
  userId: string,
  input: UpdateUserInput
): Promise<User> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  const result = await rasClient.users.update({
    orgId: config.orgId,
    deviceId: config.deviceId,
    userId,
    body: {
      name: input.name,
      settings: input.settings,
    },
  });

  return result.data as User;
}

/**
 * Delete a user
 */
export async function deleteUser(client: PluginClient, userId: string): Promise<void> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  await rasClient.users.delete({
    orgId: config.orgId,
    deviceId: config.deviceId,
    userId,
  });
}
