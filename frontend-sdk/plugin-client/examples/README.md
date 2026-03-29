# Plugin Client Examples

This directory contains real-world examples of using the Plugin Client SDK.

## Available Examples

### [settings-usage.ts](./settings-usage.ts)

Complete examples for working with node settings using URL builders:

- **Example 1**: Fetch settings schema for a single-schema node
- **Example 2**: Check for multiple schemas and list them
- **Example 3**: Get a specific schema by name
- **Example 4**: Update settings using PATCH (deep merge)
- **Example 5**: Complete multi-schema workflow
- **Example 6**: Query nodes and bulk update settings
- **Example 7**: Set port value
- **Example 8**: Execute node command
- **Example 9**: List nodes with query parameters

### [access-control-usage.ts](./access-control-usage.ts)

Complete examples for access control, teams, users, and refs:

- **Example 1**: Assign task to specific user (user-only access)
- **Example 2**: Assign task to multiple users
- **Example 3**: Assign task to team (team-only access)
- **Example 4**: Reassign task (replace user assignments)
- **Example 5**: Make task public (remove all access control)
- **Example 6**: Query tasks for current user (filtered by assignment)
- **Example 7**: Create task with initial assignment (one API call)
- **Example 8**: Hybrid access (team + specific users)
- **Example 9**: List all teams and users (for UI pickers)
- **Example 10**: Complex workflow (task assignment with notification)

## Quick Start

```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client';
import { updateSettings, fetchSettingsSchema } from './examples/settings-usage';

const config = {
  orgId: 'my-org',
  deviceId: 'my-device',
  baseUrl: '/api/v1',
  token: 'your-token',
};

// Fetch schema and settings
const { schema, settings } = await fetchSettingsSchema(config, 'node_123');

// Update settings
await updateSettings(config, 'node_123', {
  field1: 'new value',
  field2: 123,
});
```

## Key Patterns

### Always Use URL Builders

✅ **DO:**
```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client';

const urlConfig = { orgId, deviceId, baseUrl: '/api/v1' };
const url = urls.node.settingsPatch(urlConfig, nodeId);
```

❌ **DON'T:**
```typescript
const url = `/api/v1/orgs/${orgId}/devices/${deviceId}/nodes/${nodeId}/settings`;
```

### Always Use Settings PATCH for Updates

✅ **DO:**
```typescript
await fetch(urls.node.settingsPatch(urlConfig, nodeId), {
  method: 'PATCH',
  body: JSON.stringify({ field: 'value' })
});
```

❌ **DON'T:**
```typescript
await client.updateNode(nodeId, {
  settings: { field: 'value' }
});
```

### Always Fetch Schema + Values Together

✅ **DO:**
```typescript
const response = await fetch(urls.node.settingsSchema(urlConfig, nodeId));
const { schema, settings } = await response.json();
```

❌ **DON'T:**
```typescript
const schema = await getSchemaOnly(nodeId);
const settings = await getSettingsOnly(nodeId);
```

## See Also

- [Plugin Client README](../README.md) - Full documentation
- [URL Builder Reference](../url-builder.ts) - Complete URL builder API
