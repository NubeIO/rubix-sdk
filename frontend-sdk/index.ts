/**
 * Rubix Frontend SDK
 *
 * Shared UI components, utilities, and settings SDK for Rubix and plugins.
 *
 * @example Basic Usage (Common UI)
 * ```tsx
 * import { Button, Card, Input } from '@rubix-sdk/frontend/common/ui';
 * import { cn } from '@rubix-sdk/frontend/common/utils';
 * import '@rubix-sdk/frontend/globals.css';
 *
 * export default function MyComponent() {
 *   return (
 *     <Card>
 *       <CardContent>
 *         <Button>Click me</Button>
 *       </CardContent>
 *     </Card>
 *   );
 * }
 * ```
 *
 * @example Settings SDK (Plugins)
 * ```tsx
 * import { SchemaSelector, useMultiSchema } from '@rubix-sdk/frontend/settings';
 * import { Dialog, Button } from '@rubix-sdk/frontend/common/ui';
 *
 * export function ProductSettings() {
 *   const { schemas, selectedSchema, selectSchema } = useMultiSchema({
 *     schemas: [
 *       { name: 'hardware', displayName: 'Hardware Product', isDefault: true },
 *       { name: 'software', displayName: 'Software Product' }
 *     ]
 *   });
 *
 *   return (
 *     <Dialog>
 *       <SchemaSelector schemas={schemas} onSelect={selectSchema} />
 *       <Button>Save</Button>
 *     </Dialog>
 *   );
 * }
 * ```
 */

// Re-export everything from submodules
export * from './common';
export * from './settings';

// Plugin Client
export { createPluginClient } from './plugin-client';

// RAS Client
export { RASClient, fetchAdapter } from './ras/client';
export type { Node } from './ras/types';

// Common types (for backward compatibility)
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

export interface PluginWidgetProps {
  orgId?: string;
  deviceId?: string;
  baseUrl?: string;
  token?: string;
  settings?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

export interface PluginPageProps {
  orgId?: string;
  deviceId?: string;
  baseUrl?: string;
  token?: string;
}

export interface RubixApiResponse<T> {
  data: T;
  meta?: {
    timestamp?: string;
    total?: number;
    [key: string]: unknown;
  };
}

export interface RubixNode {
  id: string;
  name: string;
  type: string;
  parentId?: string;
  settings?: Record<string, unknown>;
  data?: Record<string, unknown>;
  ui?: Record<string, unknown>;
  position?: { x: number; y: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface QueryResult {
  nodes: RubixNode[];
  total: number;
}
