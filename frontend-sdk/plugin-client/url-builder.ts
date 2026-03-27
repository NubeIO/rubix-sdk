/**
 * URL Builder Utilities for Rubix API
 *
 * Clean, type-safe URL construction for all common API endpoints.
 * Prevents manual URL construction errors and provides a central place for URL patterns.
 *
 * @example
 * ```ts
 * import { urls } from '@rubix-sdk/frontend/plugin-client';
 *
 * const config = { orgId: 'my-org', deviceId: 'my-device', baseUrl: '/api/v1' };
 *
 * // Settings URLs
 * const settingsUrl = urls.node.settings(config, nodeId);
 * const schemaUrl = urls.node.settingsSchema(config, nodeId);
 * const schemaListUrl = urls.node.settingsSchemaList(config, nodeId);
 *
 * // Fetch with clean URLs
 * const response = await fetch(settingsUrl, {
 *   method: 'PATCH',
 *   body: JSON.stringify({ field: 'value' })
 * });
 * ```
 */

export interface URLConfig {
  orgId: string;
  deviceId: string;
  baseUrl?: string;
}

/**
 * Node-related URL builders
 */
export const nodeUrls = {
  /**
   * List all nodes
   * GET /orgs/{orgId}/devices/{deviceId}/nodes
   */
  list(config: URLConfig): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes`;
  },

  /**
   * Get single node
   * GET /orgs/{orgId}/devices/{deviceId}/nodes/{id}
   */
  get(config: URLConfig, nodeId: string): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes/${nodeId}`;
  },

  /**
   * Create node
   * POST /orgs/{orgId}/devices/{deviceId}/nodes
   */
  create(config: URLConfig): string {
    return nodeUrls.list(config);
  },

  /**
   * Update node (metadata only - name, position, etc.)
   * PUT /orgs/{orgId}/devices/{deviceId}/nodes/{id}
   */
  update(config: URLConfig, nodeId: string): string {
    return nodeUrls.get(config, nodeId);
  },

  /**
   * Delete node
   * DELETE /orgs/{orgId}/devices/{deviceId}/nodes/{id}
   */
  delete(config: URLConfig, nodeId: string): string {
    return nodeUrls.get(config, nodeId);
  },

  /**
   * Get node settings (values only, no schema)
   * GET /orgs/{orgId}/devices/{deviceId}/nodes/{id}/settings
   */
  settings(config: URLConfig, nodeId: string): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes/${nodeId}/settings`;
  },

  /**
   * Update node settings (PATCH - deep merge)
   * PATCH /orgs/{orgId}/devices/{deviceId}/nodes/{id}/settings
   *
   * This is the RECOMMENDED way to update settings.
   */
  settingsPatch(config: URLConfig, nodeId: string): string {
    return nodeUrls.settings(config, nodeId);
  },

  /**
   * Get settings schema + current values (single schema or default)
   * GET /orgs/{orgId}/devices/{deviceId}/nodes/{id}/settings-schema
   */
  settingsSchema(config: URLConfig, nodeId: string): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes/${nodeId}/settings-schema`;
  },

  /**
   * List available settings schemas (for multi-schema nodes)
   * GET /orgs/{orgId}/devices/{deviceId}/nodes/{id}/settings-schema/list
   */
  settingsSchemaList(config: URLConfig, nodeId: string): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes/${nodeId}/settings-schema/list`;
  },

  /**
   * Get specific settings schema by name + current values
   * GET /orgs/{orgId}/devices/{deviceId}/nodes/{id}/settings-schema/{schemaName}
   */
  settingsSchemaByName(config: URLConfig, nodeId: string, schemaName: string): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes/${nodeId}/settings-schema/${schemaName}`;
  },

  /**
   * List node ports
   * GET /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/ports
   */
  ports(config: URLConfig, nodeId: string): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes/${nodeId}/ports`;
  },

  /**
   * Get port value
   * GET /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/ports/{portHandle}/value
   */
  portValue(config: URLConfig, nodeId: string, portHandle: string): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes/${nodeId}/ports/${portHandle}/value`;
  },

  /**
   * Set port value
   * PATCH /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/ports/{portHandle}/value
   */
  setPortValue(config: URLConfig, nodeId: string, portHandle: string): string {
    return nodeUrls.portValue(config, nodeId, portHandle);
  },

  /**
   * Execute node command
   * POST /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/commands/{commandName}
   */
  command(config: URLConfig, nodeId: string, commandName: string): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes/${nodeId}/commands/${commandName}`;
  },

  /**
   * Query nodes using filter syntax
   * POST /orgs/{orgId}/devices/{deviceId}/nodes/query
   */
  query(config: URLConfig): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes/query`;
  },
};

/**
 * Node type (schema) related URLs
 */
export const nodeTypeUrls = {
  /**
   * List available schemas for a node type
   * GET /orgs/{orgId}/devices/{deviceId}/node-types/{nodeType}/settings-schemas/list
   */
  settingsSchemasList(config: URLConfig, nodeType: string): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/node-types/${nodeType}/settings-schemas/list`;
  },

  /**
   * Get specific schema for a node type
   * GET /orgs/{orgId}/devices/{deviceId}/node-types/{nodeType}/settings-schemas/{schemaName}
   */
  settingsSchema(config: URLConfig, nodeType: string, schemaName: string): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/node-types/${nodeType}/settings-schemas/${schemaName}`;
  },

  /**
   * Get pallet details for a node type
   * GET /orgs/{orgId}/devices/{deviceId}/pallet/{nodeType}
   */
  pallet(config: URLConfig, nodeType: string): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/pallet/${nodeType}`;
  },
};

/**
 * Device-related URL builders
 */
export const deviceUrls = {
  /**
   * Get device details
   * GET /orgs/{orgId}/devices/{deviceId}
   */
  get(config: URLConfig): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}`;
  },

  /**
   * List all devices in org
   * GET /orgs/{orgId}/devices
   */
  list(config: Pick<URLConfig, 'orgId' | 'baseUrl'>): string {
    const { orgId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices`;
  },
};

/**
 * Edge-related URL builders
 */
export const edgeUrls = {
  /**
   * List edges
   * GET /orgs/{orgId}/devices/{deviceId}/edges
   */
  list(config: URLConfig): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/edges`;
  },

  /**
   * Create edge
   * POST /orgs/{orgId}/devices/{deviceId}/edges
   */
  create(config: URLConfig): string {
    return edgeUrls.list(config);
  },

  /**
   * Delete edge
   * DELETE /orgs/{orgId}/devices/{deviceId}/edges/{id}
   */
  delete(config: URLConfig, edgeId: string): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/edges/${edgeId}`;
  },
};

/**
 * Flow-related URL builders
 */
export const flowUrls = {
  /**
   * Get flow metadata
   * GET /orgs/{orgId}/devices/{deviceId}/flows/{flowId}
   */
  get(config: URLConfig, flowId: string): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/flows/${flowId}`;
  },

  /**
   * Get flow snapshot (nodes + edges)
   * GET /orgs/{orgId}/devices/{deviceId}/flows/{flowId}/snapshot
   */
  snapshot(config: URLConfig, flowId: string): string {
    const { orgId, deviceId, baseUrl = '/api/v1' } = config;
    return `${baseUrl}/orgs/${orgId}/devices/${deviceId}/flows/${flowId}/snapshot`;
  },
};

/**
 * Combined URL utilities export
 */
export const urls = {
  node: nodeUrls,
  nodeType: nodeTypeUrls,
  device: deviceUrls,
  edge: edgeUrls,
  flow: flowUrls,
};

/**
 * Helper function to add query parameters to a URL
 */
export function addQueryParams(url: string, params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Example usage and common patterns
 */
export const examples = {
  /**
   * Fetch settings with schema
   */
  async fetchSettingsWithSchema(config: URLConfig, nodeId: string, token?: string) {
    const url = urls.node.settingsSchema(config, nodeId);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch settings schema: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Update settings (recommended pattern)
   */
  async updateSettings(config: URLConfig, nodeId: string, settings: Record<string, unknown>, token?: string) {
    const url = urls.node.settingsPatch(config, nodeId);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Failed to update settings: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * List available schemas for multi-schema nodes
   */
  async listSchemas(config: URLConfig, nodeId: string, token?: string) {
    const url = urls.node.settingsSchemaList(config, nodeId);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list schemas: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get specific schema by name
   */
  async getSchemaByName(config: URLConfig, nodeId: string, schemaName: string, token?: string) {
    const url = urls.node.settingsSchemaByName(config, nodeId, schemaName);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get schema '${schemaName}': ${response.statusText}`);
    }

    return response.json();
  },
};
