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
export declare const nodeUrls: {
    /**
     * List all nodes
     * GET /orgs/{orgId}/devices/{deviceId}/nodes
     */
    list(config: URLConfig): string;
    /**
     * Get single node
     * GET /orgs/{orgId}/devices/{deviceId}/nodes/{id}
     */
    get(config: URLConfig, nodeId: string): string;
    /**
     * Create node
     * POST /orgs/{orgId}/devices/{deviceId}/nodes
     */
    create(config: URLConfig): string;
    /**
     * Update node (metadata only - name, position, etc.)
     * PUT /orgs/{orgId}/devices/{deviceId}/nodes/{id}
     */
    update(config: URLConfig, nodeId: string): string;
    /**
     * Delete node
     * DELETE /orgs/{orgId}/devices/{deviceId}/nodes/{id}
     */
    delete(config: URLConfig, nodeId: string): string;
    /**
     * Get node settings (values only, no schema)
     * GET /orgs/{orgId}/devices/{deviceId}/nodes/{id}/settings
     */
    settings(config: URLConfig, nodeId: string): string;
    /**
     * Update node settings (PATCH - deep merge)
     * PATCH /orgs/{orgId}/devices/{deviceId}/nodes/{id}/settings
     *
     * This is the RECOMMENDED way to update settings.
     */
    settingsPatch(config: URLConfig, nodeId: string): string;
    /**
     * Get settings schema + current values (single schema or default)
     * GET /orgs/{orgId}/devices/{deviceId}/nodes/{id}/settings-schema
     */
    settingsSchema(config: URLConfig, nodeId: string): string;
    /**
     * List available settings schemas (for multi-schema nodes)
     * GET /orgs/{orgId}/devices/{deviceId}/nodes/{id}/settings-schema/list
     */
    settingsSchemaList(config: URLConfig, nodeId: string): string;
    /**
     * Get specific settings schema by name + current values
     * GET /orgs/{orgId}/devices/{deviceId}/nodes/{id}/settings-schema/{schemaName}
     */
    settingsSchemaByName(config: URLConfig, nodeId: string, schemaName: string): string;
    /**
     * List node ports
     * GET /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/ports
     */
    ports(config: URLConfig, nodeId: string): string;
    /**
     * Get port value
     * GET /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/ports/{portHandle}/value
     */
    portValue(config: URLConfig, nodeId: string, portHandle: string): string;
    /**
     * Set port value
     * PATCH /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/ports/{portHandle}/value
     */
    setPortValue(config: URLConfig, nodeId: string, portHandle: string): string;
    /**
     * List available commands for a node
     * GET /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/commands
     */
    commandsList(config: URLConfig, nodeId: string): string;
    /**
     * Get specific command definition
     * GET /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/commands/{commandName}
     */
    commandGet(config: URLConfig, nodeId: string, commandName: string): string;
    /**
     * Execute node command
     * POST /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/commands/{commandName}/execute
     */
    commandExecute(config: URLConfig, nodeId: string, commandName: string): string;
    /**
     * Execute node command (legacy - kept for backwards compatibility)
     * POST /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/commands/{commandName}
     * @deprecated Use commandExecute instead
     */
    command(config: URLConfig, nodeId: string, commandName: string): string;
    /**
     * Get command job status
     * GET /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/jobs/{jobId}
     */
    commandJob(config: URLConfig, nodeId: string, jobId: string): string;
    /**
     * List command jobs for a node
     * GET /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/jobs
     */
    commandJobsList(config: URLConfig, nodeId: string): string;
    /**
     * Cancel or delete a command job
     * DELETE /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/jobs/{jobId}
     */
    commandJobCancel(config: URLConfig, nodeId: string, jobId: string): string;
    /**
     * Query nodes using filter syntax
     * POST /orgs/{orgId}/devices/{deviceId}/nodes/query
     */
    query(config: URLConfig): string;
};
/**
 * Node type (schema) related URLs
 */
export declare const nodeTypeUrls: {
    /**
     * List available schemas for a node type
     * GET /orgs/{orgId}/devices/{deviceId}/node-types/{nodeType}/settings-schemas/list
     */
    settingsSchemasList(config: URLConfig, nodeType: string): string;
    /**
     * Get specific schema for a node type
     * GET /orgs/{orgId}/devices/{deviceId}/node-types/{nodeType}/settings-schemas/{schemaName}
     */
    settingsSchema(config: URLConfig, nodeType: string, schemaName: string): string;
    /**
     * Get pallet details for a node type
     * GET /orgs/{orgId}/devices/{deviceId}/pallet/{nodeType}
     */
    pallet(config: URLConfig, nodeType: string): string;
};
/**
 * Device-related URL builders
 */
export declare const deviceUrls: {
    /**
     * Get device details
     * GET /orgs/{orgId}/devices/{deviceId}
     */
    get(config: URLConfig): string;
    /**
     * List all devices in org
     * GET /orgs/{orgId}/devices
     */
    list(config: Pick<URLConfig, "orgId" | "baseUrl">): string;
};
/**
 * Edge-related URL builders
 */
export declare const edgeUrls: {
    /**
     * List edges
     * GET /orgs/{orgId}/devices/{deviceId}/edges
     */
    list(config: URLConfig): string;
    /**
     * Create edge
     * POST /orgs/{orgId}/devices/{deviceId}/edges
     */
    create(config: URLConfig): string;
    /**
     * Delete edge
     * DELETE /orgs/{orgId}/devices/{deviceId}/edges/{id}
     */
    delete(config: URLConfig, edgeId: string): string;
};
/**
 * Flow-related URL builders
 */
export declare const flowUrls: {
    /**
     * Get flow metadata
     * GET /orgs/{orgId}/devices/{deviceId}/flows/{flowId}
     */
    get(config: URLConfig, flowId: string): string;
    /**
     * Get flow snapshot (nodes + edges)
     * GET /orgs/{orgId}/devices/{deviceId}/flows/{flowId}/snapshot
     */
    snapshot(config: URLConfig, flowId: string): string;
};
/**
 * Combined URL utilities export
 */
export declare const urls: {
    node: {
        /**
         * List all nodes
         * GET /orgs/{orgId}/devices/{deviceId}/nodes
         */
        list(config: URLConfig): string;
        /**
         * Get single node
         * GET /orgs/{orgId}/devices/{deviceId}/nodes/{id}
         */
        get(config: URLConfig, nodeId: string): string;
        /**
         * Create node
         * POST /orgs/{orgId}/devices/{deviceId}/nodes
         */
        create(config: URLConfig): string;
        /**
         * Update node (metadata only - name, position, etc.)
         * PUT /orgs/{orgId}/devices/{deviceId}/nodes/{id}
         */
        update(config: URLConfig, nodeId: string): string;
        /**
         * Delete node
         * DELETE /orgs/{orgId}/devices/{deviceId}/nodes/{id}
         */
        delete(config: URLConfig, nodeId: string): string;
        /**
         * Get node settings (values only, no schema)
         * GET /orgs/{orgId}/devices/{deviceId}/nodes/{id}/settings
         */
        settings(config: URLConfig, nodeId: string): string;
        /**
         * Update node settings (PATCH - deep merge)
         * PATCH /orgs/{orgId}/devices/{deviceId}/nodes/{id}/settings
         *
         * This is the RECOMMENDED way to update settings.
         */
        settingsPatch(config: URLConfig, nodeId: string): string;
        /**
         * Get settings schema + current values (single schema or default)
         * GET /orgs/{orgId}/devices/{deviceId}/nodes/{id}/settings-schema
         */
        settingsSchema(config: URLConfig, nodeId: string): string;
        /**
         * List available settings schemas (for multi-schema nodes)
         * GET /orgs/{orgId}/devices/{deviceId}/nodes/{id}/settings-schema/list
         */
        settingsSchemaList(config: URLConfig, nodeId: string): string;
        /**
         * Get specific settings schema by name + current values
         * GET /orgs/{orgId}/devices/{deviceId}/nodes/{id}/settings-schema/{schemaName}
         */
        settingsSchemaByName(config: URLConfig, nodeId: string, schemaName: string): string;
        /**
         * List node ports
         * GET /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/ports
         */
        ports(config: URLConfig, nodeId: string): string;
        /**
         * Get port value
         * GET /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/ports/{portHandle}/value
         */
        portValue(config: URLConfig, nodeId: string, portHandle: string): string;
        /**
         * Set port value
         * PATCH /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/ports/{portHandle}/value
         */
        setPortValue(config: URLConfig, nodeId: string, portHandle: string): string;
        /**
         * List available commands for a node
         * GET /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/commands
         */
        commandsList(config: URLConfig, nodeId: string): string;
        /**
         * Get specific command definition
         * GET /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/commands/{commandName}
         */
        commandGet(config: URLConfig, nodeId: string, commandName: string): string;
        /**
         * Execute node command
         * POST /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/commands/{commandName}/execute
         */
        commandExecute(config: URLConfig, nodeId: string, commandName: string): string;
        /**
         * Execute node command (legacy - kept for backwards compatibility)
         * POST /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/commands/{commandName}
         * @deprecated Use commandExecute instead
         */
        command(config: URLConfig, nodeId: string, commandName: string): string;
        /**
         * Get command job status
         * GET /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/jobs/{jobId}
         */
        commandJob(config: URLConfig, nodeId: string, jobId: string): string;
        /**
         * List command jobs for a node
         * GET /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/jobs
         */
        commandJobsList(config: URLConfig, nodeId: string): string;
        /**
         * Cancel or delete a command job
         * DELETE /orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/jobs/{jobId}
         */
        commandJobCancel(config: URLConfig, nodeId: string, jobId: string): string;
        /**
         * Query nodes using filter syntax
         * POST /orgs/{orgId}/devices/{deviceId}/nodes/query
         */
        query(config: URLConfig): string;
    };
    nodeType: {
        /**
         * List available schemas for a node type
         * GET /orgs/{orgId}/devices/{deviceId}/node-types/{nodeType}/settings-schemas/list
         */
        settingsSchemasList(config: URLConfig, nodeType: string): string;
        /**
         * Get specific schema for a node type
         * GET /orgs/{orgId}/devices/{deviceId}/node-types/{nodeType}/settings-schemas/{schemaName}
         */
        settingsSchema(config: URLConfig, nodeType: string, schemaName: string): string;
        /**
         * Get pallet details for a node type
         * GET /orgs/{orgId}/devices/{deviceId}/pallet/{nodeType}
         */
        pallet(config: URLConfig, nodeType: string): string;
    };
    device: {
        /**
         * Get device details
         * GET /orgs/{orgId}/devices/{deviceId}
         */
        get(config: URLConfig): string;
        /**
         * List all devices in org
         * GET /orgs/{orgId}/devices
         */
        list(config: Pick<URLConfig, "orgId" | "baseUrl">): string;
    };
    edge: {
        /**
         * List edges
         * GET /orgs/{orgId}/devices/{deviceId}/edges
         */
        list(config: URLConfig): string;
        /**
         * Create edge
         * POST /orgs/{orgId}/devices/{deviceId}/edges
         */
        create(config: URLConfig): string;
        /**
         * Delete edge
         * DELETE /orgs/{orgId}/devices/{deviceId}/edges/{id}
         */
        delete(config: URLConfig, edgeId: string): string;
    };
    flow: {
        /**
         * Get flow metadata
         * GET /orgs/{orgId}/devices/{deviceId}/flows/{flowId}
         */
        get(config: URLConfig, flowId: string): string;
        /**
         * Get flow snapshot (nodes + edges)
         * GET /orgs/{orgId}/devices/{deviceId}/flows/{flowId}/snapshot
         */
        snapshot(config: URLConfig, flowId: string): string;
    };
};
/**
 * Helper function to add query parameters to a URL
 */
export declare function addQueryParams(url: string, params: Record<string, string | number | boolean | undefined>): string;
/**
 * Example usage and common patterns
 */
export declare const examples: {
    /**
     * Fetch settings with schema
     */
    fetchSettingsWithSchema(config: URLConfig, nodeId: string, token?: string): Promise<any>;
    /**
     * Update settings (recommended pattern)
     */
    updateSettings(config: URLConfig, nodeId: string, settings: Record<string, unknown>, token?: string): Promise<any>;
    /**
     * List available schemas for multi-schema nodes
     */
    listSchemas(config: URLConfig, nodeId: string, token?: string): Promise<any>;
    /**
     * Get specific schema by name
     */
    getSchemaByName(config: URLConfig, nodeId: string, schemaName: string, token?: string): Promise<any>;
};
