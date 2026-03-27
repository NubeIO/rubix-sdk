/**
 * Example: Using URL Builders for Settings Management
 *
 * This example shows how to use the URL builder utilities to work with
 * node settings schemas and updates without manual URL construction.
 */

import { urls, addQueryParams } from '../url-builder';

interface Config {
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
}

/**
 * Example 1: Fetch settings schema for a single-schema node
 */
export async function fetchSettingsSchema(config: Config, nodeId: string) {
  const urlConfig = { orgId: config.orgId, deviceId: config.deviceId, baseUrl: config.baseUrl };

  const response = await fetch(urls.node.settingsSchema(urlConfig, nodeId), {
    headers: {
      'Content-Type': 'application/json',
      ...(config.token && { Authorization: `Bearer ${config.token}` }),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch settings schema: ${response.statusText}`);
  }

  const { schema, settings } = await response.json();
  return { schema, settings };
}

/**
 * Example 2: Check for multiple schemas and list them
 */
export async function listAvailableSchemas(config: Config, nodeId: string) {
  const urlConfig = { orgId: config.orgId, deviceId: config.deviceId, baseUrl: config.baseUrl };

  const response = await fetch(urls.node.settingsSchemaList(urlConfig, nodeId), {
    headers: {
      'Content-Type': 'application/json',
      ...(config.token && { Authorization: `Bearer ${config.token}` }),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list schemas: ${response.statusText}`);
  }

  const { schemas, supportsMultiple } = await response.json();
  return { schemas, supportsMultiple };
}

/**
 * Example 3: Get a specific schema by name
 */
export async function getSchemaByName(config: Config, nodeId: string, schemaName: string) {
  const urlConfig = { orgId: config.orgId, deviceId: config.deviceId, baseUrl: config.baseUrl };

  const response = await fetch(urls.node.settingsSchemaByName(urlConfig, nodeId, schemaName), {
    headers: {
      'Content-Type': 'application/json',
      ...(config.token && { Authorization: `Bearer ${config.token}` }),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get schema '${schemaName}': ${response.statusText}`);
  }

  const { schema, settings } = await response.json();
  return { schema, settings };
}

/**
 * Example 4: Update settings using PATCH (deep merge)
 */
export async function updateSettings(
  config: Config,
  nodeId: string,
  updates: Record<string, unknown>
) {
  const urlConfig = { orgId: config.orgId, deviceId: config.deviceId, baseUrl: config.baseUrl };

  const response = await fetch(urls.node.settingsPatch(urlConfig, nodeId), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(config.token && { Authorization: `Bearer ${config.token}` }),
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update settings: ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

/**
 * Example 5: Complete multi-schema workflow
 */
export async function multiSchemaWorkflow(config: Config, nodeId: string) {
  const urlConfig = { orgId: config.orgId, deviceId: config.deviceId, baseUrl: config.baseUrl };

  // Step 1: Check if node supports multiple schemas
  const { schemas, supportsMultiple } = await listAvailableSchemas(config, nodeId);

  console.log('Supports multiple schemas:', supportsMultiple);
  console.log('Available schemas:', schemas);

  if (!supportsMultiple || schemas.length === 1) {
    // Single schema - get default
    const { schema, settings } = await fetchSettingsSchema(config, nodeId);
    console.log('Single schema:', schema);
    return { schema, settings };
  }

  // Multiple schemas - user needs to select one
  // For demo, we'll use the default schema
  const defaultSchema = schemas.find((s: any) => s.isDefault) || schemas[0];
  console.log('Using schema:', defaultSchema.name);

  // Step 2: Get the specific schema
  const { schema, settings } = await getSchemaByName(config, nodeId, defaultSchema.name);
  console.log('Schema:', schema);
  console.log('Current settings:', settings);

  // Step 3: Update settings
  const updates = {
    // Example updates based on schema
    name: 'Updated Monitor',
    interval: 60,
  };

  const result = await updateSettings(config, nodeId, updates);
  console.log('Updated settings:', result);

  return { schema, settings: result };
}

/**
 * Example 6: Query nodes and update their settings
 */
export async function bulkUpdateSettings(config: Config, filter: string, updates: Record<string, unknown>) {
  const urlConfig = { orgId: config.orgId, deviceId: config.deviceId, baseUrl: config.baseUrl };

  // Query nodes
  const queryResponse = await fetch(urls.node.query(urlConfig), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.token && { Authorization: `Bearer ${config.token}` }),
    },
    body: JSON.stringify({ filter }),
  });

  if (!queryResponse.ok) {
    throw new Error(`Failed to query nodes: ${queryResponse.statusText}`);
  }

  const nodes = await queryResponse.json();

  // Update each node's settings
  const results = await Promise.all(
    nodes.map((node: any) => updateSettings(config, node.id, updates))
  );

  return results;
}

/**
 * Example 7: Set port value
 */
export async function setPortValue(
  config: Config,
  nodeId: string,
  portHandle: string,
  value: unknown
) {
  const urlConfig = { orgId: config.orgId, deviceId: config.deviceId, baseUrl: config.baseUrl };

  const response = await fetch(urls.node.setPortValue(urlConfig, nodeId, portHandle), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(config.token && { Authorization: `Bearer ${config.token}` }),
    },
    body: JSON.stringify({ value }),
  });

  if (!response.ok) {
    throw new Error(`Failed to set port value: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Example 8: Execute node command
 */
export async function executeCommand(
  config: Config,
  nodeId: string,
  commandName: string,
  args?: Record<string, unknown>
) {
  const urlConfig = { orgId: config.orgId, deviceId: config.deviceId, baseUrl: config.baseUrl };

  const response = await fetch(urls.node.command(urlConfig, nodeId, commandName), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.token && { Authorization: `Bearer ${config.token}` }),
    },
    body: args ? JSON.stringify(args) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Failed to execute command '${commandName}': ${response.statusText}`);
  }

  return response.json();
}

/**
 * Example 9: List nodes with query parameters
 */
export async function listNodesWithFilters(
  config: Config,
  filters: { type?: string; limit?: number; offset?: number }
) {
  const urlConfig = { orgId: config.orgId, deviceId: config.deviceId, baseUrl: config.baseUrl };

  const url = addQueryParams(urls.node.list(urlConfig), filters);

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(config.token && { Authorization: `Bearer ${config.token}` }),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list nodes: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Example Usage:
 */
async function main() {
  const config: Config = {
    orgId: 'my-org',
    deviceId: 'my-device',
    baseUrl: '/api/v1',
    token: 'your-token',
  };

  const nodeId = 'node_abc123';

  try {
    // Fetch schema and settings
    const { schema, settings } = await fetchSettingsSchema(config, nodeId);
    console.log('Schema:', schema);
    console.log('Settings:', settings);

    // Update settings
    await updateSettings(config, nodeId, {
      name: 'Updated Name',
      interval: 30,
    });

    // Check for multiple schemas
    const { schemas, supportsMultiple } = await listAvailableSchemas(config, nodeId);
    if (supportsMultiple) {
      console.log('Available schemas:', schemas);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
