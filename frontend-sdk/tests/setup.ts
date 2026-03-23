/**
 * Test Setup & Utilities
 *
 * Provides authentication and client setup for integration tests
 */

import { createPluginClient, type PluginClient } from '../plugin-client/index.js';

export interface TestConfig {
  baseUrl: string;
  email: string;
  password: string;
  orgId: string;
  token?: string;
  deviceId?: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  orgId: string;
  deviceId: string;
  teamId: string;
  role: string;
}

let cachedAuth: AuthResponse | null = null;

/**
 * Login and get JWT token + deviceId
 */
export async function login(config: TestConfig): Promise<AuthResponse> {
  if (cachedAuth) {
    return cachedAuth;
  }

  // Extract base URL (e.g., http://localhost:9000 from http://localhost:9000/api/v1)
  const baseUrlParts = config.baseUrl.split('/api/v1');
  const serverUrl = baseUrlParts[0] || 'http://localhost:9000';
  const loginUrl = `${serverUrl}/api/v1/auth/login`;

  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: config.email,
      password: config.password,
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  cachedAuth = result.data;

  console.log('✅ Logged in:', {
    orgId: cachedAuth!.orgId,
    deviceId: cachedAuth!.deviceId,
    role: cachedAuth!.role,
  });

  return cachedAuth!;
}

/**
 * Create authenticated plugin client
 */
export async function createTestClient(config: TestConfig): Promise<PluginClient> {
  const auth = await login(config);

  return createPluginClient({
    orgId: auth.orgId,
    deviceId: auth.deviceId,
    baseUrl: config.baseUrl,
    token: auth.token,
  });
}

/**
 * Get test configuration
 *
 * Override with environment variables if needed:
 * - BASE_URL: Full API URL (default: http://localhost:9000/api/v1)
 * - EMAIL: Login email (default: admin@rubix.io)
 * - PASSWORD: Login password (default: admin@rubix.io)
 * - ORG_ID: Organization ID (default: test)
 */
export function getTestConfig(): TestConfig {
  const config = {
    baseUrl: 'http://localhost:9000/api/v1',
    email: 'admin@rubix.io',
    password: 'admin@rubix.io',
    orgId: 'test',
  };

  return config;
}

/**
 * Generate unique test name
 */
export function testName(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Cleanup helper - delete nodes created during tests
 */
export async function cleanup(client: PluginClient, nodeIds: string[]): Promise<void> {
  for (const nodeId of nodeIds) {
    try {
      await client.deleteNode(nodeId);
      console.log(`  🗑️  Deleted test node: ${nodeId}`);
    } catch (err: any) {
      // Ignore 404s (already deleted)
      if (err?.status !== 404) {
        console.warn(`  ⚠️  Failed to delete ${nodeId}:`, err.message);
      }
    }
  }
}
