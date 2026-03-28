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
export async function listTeams(client: PluginClient): Promise<Team[]> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  const result = await rasClient.teams.list({
    orgId: config.orgId,
    deviceId: config.deviceId,
  });

  return (result?.data || []) as Team[];
}

/**
 * Get a specific team by ID
 */
export async function getTeam(client: PluginClient, teamId: string): Promise<Team> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  const result = await rasClient.teams.get({
    orgId: config.orgId,
    deviceId: config.deviceId,
    teamId,
  });

  return result.data as Team;
}

/**
 * Create a new team
 */
export async function createTeam(client: PluginClient, input: CreateTeamInput): Promise<Team> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  const result = await rasClient.teams.create({
    orgId: config.orgId,
    deviceId: config.deviceId,
    body: {
      name: input.name,
      settings: input.settings,
    },
  });

  return result.data as Team;
}

/**
 * Update a team
 */
export async function updateTeam(
  client: PluginClient,
  teamId: string,
  input: UpdateTeamInput
): Promise<Team> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  const result = await rasClient.teams.update({
    orgId: config.orgId,
    deviceId: config.deviceId,
    teamId,
    body: {
      name: input.name,
      settings: input.settings,
    },
  });

  return result.data as Team;
}

/**
 * Delete a team
 */
export async function deleteTeam(client: PluginClient, teamId: string): Promise<void> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  await rasClient.teams.delete({
    orgId: config.orgId,
    deviceId: config.deviceId,
    teamId,
  });
}

/**
 * Add a user to a team
 */
export async function addUserToTeam(
  client: PluginClient,
  teamId: string,
  userId: string
): Promise<void> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  await rasClient.teams['add-user']({
    orgId: config.orgId,
    deviceId: config.deviceId,
    teamId,
    userId,
  });
}

/**
 * Remove a user from a team
 */
export async function removeUserFromTeam(
  client: PluginClient,
  teamId: string,
  userId: string
): Promise<void> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  await rasClient.teams['remove-user']({
    orgId: config.orgId,
    deviceId: config.deviceId,
    teamId,
    userId,
  });
}

/**
 * List all users in a team
 */
export async function listTeamUsers(client: PluginClient, teamId: string): Promise<User[]> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  const result = await rasClient.teams['list-users']({
    orgId: config.orgId,
    deviceId: config.deviceId,
    teamId,
  });

  return (result?.data || []) as User[];
}
