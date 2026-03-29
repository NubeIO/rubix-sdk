# Plugin Client SDK

A clean, type-safe wrapper around the RAS (Routing API Specification) client for building Rubix plugins.

## Why Use This?

**Before** (manual fetch, duplicated code):
```typescript
const response = await fetch(`${baseUrl}/${orgId}/${deviceId}/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
  body: JSON.stringify({
    filter: 'type is "myplugin.sensor"',
  }),
});

if (!response.ok) throw new Error('Failed');
const result = await response.json();
const sensors = result.data || [];
```

**After** (clean, reusable):
```typescript
const client = createPluginClient({ orgId, deviceId, baseUrl, token });
const sensors = await client.queryNodes({
  filter: 'type is "myplugin.sensor"',
});
```

## Benefits

- ✅ **Correct URL patterns** - Uses `/orgs/{orgId}/devices/{deviceId}`
- ✅ **Automatic authentication** - Token injection handled automatically
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Error handling** - Consistent error messages
- ✅ **No duplication** - Reuse across all plugin widgets
- ✅ **Clean code** - Focus on your plugin logic, not API boilerplate

## Installation

Add to your plugin's `vite.config.ts`:

```typescript
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@rubix-sdk/frontend': path.resolve(__dirname, '../../frontend-sdk'),
    },
  },
});
```

## URL Builder - Clean API Calls

The SDK includes URL builders to prevent manual URL construction errors:

```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client';

const config = { orgId: 'my-org', deviceId: 'my-device', baseUrl: '/api/v1' };

// ✅ Clean and correct
const settingsUrl = urls.node.settingsPatch(config, nodeId);
const schemaUrl = urls.node.settingsSchema(config, nodeId);
const listUrl = urls.node.settingsSchemaList(config, nodeId);

// ❌ Error-prone manual construction
const manualUrl = `/api/v1/orgs/${orgId}/devices/${deviceId}/nodes/${nodeId}/settings`;
```

**Available URL builders:**
- `urls.node.*` - Node operations (CRUD, settings, schemas, ports, commands)
- `urls.nodeType.*` - Node type schemas and pallet
- `urls.device.*` - Device operations
- `urls.edge.*` - Edge operations
- `urls.flow.*` - Flow operations

See [URL Builder API](#url-builder-api) for complete reference.

**💡 Check out [examples/](./examples/) for real-world usage patterns!**

## Quick Start

```typescript
import { createPluginClient, urls } from '@rubix-sdk/frontend/plugin-client';

function MyWidget({ orgId, deviceId, baseUrl, token }) {
  const client = createPluginClient({ orgId, deviceId, baseUrl, token });
  const urlConfig = { orgId, deviceId, baseUrl };

  // Query nodes
  const items = await client.queryNodes({
    filter: 'type is "myplugin.item"',
  });

  // Create node
  const newItem = await client.createNode({
    type: 'myplugin.item',
    name: 'Item 1',
    "refs": [
      {
        "refName": "parentRef",
        "toNodeId": "container-1"
      },
    settings: {
      field1: 'value1',
      field2: 123,
    },
  });

  // Update node name/metadata (OK)
  await client.updateNode(newItem.id, {
    name: 'Item 1 Updated',
  });

  // Update settings (IMPORTANT: Use URL builder + PATCH endpoint)
  await fetch(urls.node.settingsPatch(urlConfig, newItem.id), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      field1: 'updated value',
    }),
  });

  // Delete node
  await client.deleteNode(newItem.id);
}
```

## ⚠️ Critical Patterns - READ THIS FIRST

### ✅ DO: Use Settings Schema API

**Always fetch schema + values together:**
```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client';

const config = { orgId, deviceId, baseUrl: '/api/v1' };

// For single schema or default
const response = await fetch(urls.node.settingsSchema(config, nodeId), {
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
});
const { schema, settings } = await response.json();

// For multiple schemas - first list them
const listResponse = await fetch(urls.node.settingsSchemaList(config, nodeId), {
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
});
const { schemas, supportsMultiple } = await listResponse.json();

// Then get specific schema
const schemaUrl = urls.node.settingsSchemaByName(config, nodeId, 'http');
const schemaResponse = await fetch(schemaUrl, {
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
});
const { schema, settings } = await schemaResponse.json();
```

### ✅ DO: Use Settings PATCH for Updates

**Use the dedicated settings endpoint:**
```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client';

const config = { orgId, deviceId, baseUrl: '/api/v1' };

await fetch(urls.node.settingsPatch(config, nodeId), {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
  body: JSON.stringify({
    field1: 'new value',
    field2: 123,
  }),
});
```

### ❌ DON'T: Use updateNode for Settings

**This is WRONG:**
```typescript
// ❌ DON'T DO THIS
await client.updateNode(nodeId, {
  settings: { field1: 'value' }
});
```

**Why?** The settings PATCH endpoint:
- Performs deep merge (preserves unchanged fields)
- Re-initializes the node properly
- Validates against schema
- Triggers correct lifecycle events

### ❌ DON'T: Confuse Tags with Settings

**Settings** = Configuration data (stored in `settings` field)
**Identity Tags** = Classification tags (stored in `identity` field)

These are completely separate! Don't include tags in settings.

## API Reference

### createPluginClient(config)

Creates a new plugin client instance.

```typescript
const client = createPluginClient({
  orgId: 'my-org',
  deviceId: 'dev_123',
  baseUrl: '/api/v1',  // optional, defaults to '/api/v1'
  token: 'eyJhbG...',   // optional
});
```

### client.queryNodes(options)

Query nodes using filter syntax.

```typescript
const items = await client.queryNodes({
  filter: 'type is "myplugin.item" and parent.id is "parent123"',
  limit: 10,
  offset: 0,
});
```

**Common query patterns:**
```typescript
// By type
filter: 'type is "myplugin.sensor"'

// By parent
filter: 'parent.id is "parent123" and type is "myplugin.item"'

// By settings field
filter: 'type is "myplugin.sensor" and settings.status is "active"'

// By identity tags
filter: 'i has "sensor" and i has "myplugin"'
```

### client.getNode(nodeId)

Get a single node by ID.

```typescript
const item = await client.getNode('node_abc123');
console.log(item.name, item.settings);
```

### client.createNode(input)

Create a new node with settings from your node profile.

```typescript
const newItem = await client.createNode({
  type: 'myplugin.item',
  name: 'My Item',
  parentRef: 'parent_node_id',  // IMPORTANT: Use parentRef, not parentId
  settings: {
    // Settings structure comes from config/nodes.yaml
    status: 'active',
    value: 100,
    metadata: {
      category: 'example',
    },
  },
});
```

**Important:**
- Use `parentRef`, not `parentId`
- Settings structure must match your node profile schema (see Node Profiles section below)

### client.updateNode(nodeId, input)

Update an existing node's metadata (name, position, etc.).

**⚠️ IMPORTANT: Do NOT use this for settings updates!**

```typescript
// OK - Update name and position
await client.updateNode('node_abc123', {
  name: 'Updated Name',
  position: { x: 100, y: 200 },
});
```

**For settings, use the settings PATCH endpoint instead:**
```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client';

const urlConfig = { orgId, deviceId, baseUrl: '/api/v1' };

// CORRECT - Update settings via PATCH endpoint with URL builder
await fetch(urls.node.settingsPatch(urlConfig, nodeId), {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
  body: JSON.stringify({
    status: 'inactive',
    value: 150,
  }),
});
```

### client.deleteNode(nodeId)

Delete a node.

```typescript
await client.deleteNode('node_abc123');
```

### client.listNodes()

List all nodes (prefer queryNodes for filtering).

```typescript
const allNodes = await client.listNodes();
```

## Teams, Users & Access Control

The plugin client provides full support for teams, users, and refs (references) including convenient helpers for access control patterns like task assignment.

### Teams API

#### client.listTeams()

List all teams in the organization.

```typescript
const teams = await client.listTeams();
console.log(teams.map(t => ({ id: t.id, name: t.name })));
// [{ id: 'team_001', name: 'Engineering' }, { id: 'team_002', name: 'QA' }]
```

#### client.getTeam(teamId)

Get a specific team by ID.

```typescript
const team = await client.getTeam('team_001');
console.log(team.name, team.settings?.description);
```

#### client.createTeam(input)

Create a new team.

```typescript
const team = await client.createTeam({
  name: 'Engineering',
  settings: {
    description: 'Core engineering team',
    department: 'R&D'
  }
});
```

#### client.updateTeam(teamId, input)

Update a team.

```typescript
await client.updateTeam('team_001', {
  name: 'Engineering Team',
  settings: { description: 'Updated description' }
});
```

#### client.deleteTeam(teamId)

Delete a team.

```typescript
await client.deleteTeam('team_001');
```

#### client.addUserToTeam(teamId, userId)

Add a user to a team.

```typescript
await client.addUserToTeam('team_001', 'user_alice_123');
```

#### client.removeUserFromTeam(teamId, userId)

Remove a user from a team.

```typescript
await client.removeUserFromTeam('team_001', 'user_alice_123');
```

#### client.listTeamUsers(teamId)

List all users in a team.

```typescript
const users = await client.listTeamUsers('team_001');
console.log(users.map(u => u.name)); // ["Alice", "Bob", "Charlie"]
```

### Users API

#### client.listUsers(options?)

List all users in the organization.

```typescript
const users = await client.listUsers({ includeSettings: true });
console.log(users.map(u => ({ id: u.id, name: u.name, email: u.settings?.email })));
```

#### client.getUser(userId, options?)

Get a specific user by ID.

```typescript
const user = await client.getUser('user_alice_123', { includeSettings: true });
console.log(user.name, user.settings?.email, user.settings?.role);
```

#### client.inviteUser(input)

Invite a new user to the organization.

```typescript
const user = await client.inviteUser({
  email: 'alice@example.com',
  name: 'Alice',
  role: 'member',
  settings: {
    department: 'Engineering'
  }
});
```

#### client.updateUser(userId, input)

Update a user.

```typescript
await client.updateUser('user_alice_123', {
  name: 'Alice Smith',
  settings: { role: 'admin', department: 'Engineering' }
});
```

#### client.deleteUser(userId)

Delete a user.

```typescript
await client.deleteUser('user_alice_123');
```

### Refs API (General)

Refs are references between nodes. The most common use cases are:
- **Access Control**: `teamRef`, `userRef` - Control who can see a node
- **Hierarchy**: `parentRef`, `siteRef`, `equipRef` - Organize nodes
- **Cross-references**: `driverRef`, `meterRef` - Link related nodes

#### client.listRefs(nodeId)

List all refs for a node.

```typescript
const refs = await client.listRefs(taskId);
console.log(refs);
// [
//   { refName: 'userRef', toNodeId: 'user_alice_123', displayName: 'Alice' },
//   { refName: 'teamRef', toNodeId: 'team_001', displayName: 'Engineering' }
// ]
```

#### client.createRef(nodeId, input)

Create a new ref on a node.

```typescript
await client.createRef(taskId, {
  refName: 'userRef',
  toNodeId: 'user_alice_123',
  displayName: 'Alice',
  order: 0,
  metadata: { assignedAt: new Date().toISOString() }
});
```

#### client.deleteRef(nodeId, refName)

Delete all refs of a specific type from a node.

**⚠️ WARNING:** This removes ALL refs with the given refName, not a specific target.

```typescript
// Remove ALL userRefs from the task
await client.deleteRef(taskId, 'userRef');
```

### Access Control Helpers

Convenient methods for common access control patterns (teamRef/userRef management).

#### client.assignUserToNode(nodeId, userId, userName?)

Assign a user to a node (creates userRef). Perfect for task assignment.

```typescript
// Assign task to Alice (only she can see it)
await client.assignUserToNode(taskId, 'user_alice_123', 'Alice');
```

#### client.assignTeamToNode(nodeId, teamId, teamName?)

Assign a team to a node (creates teamRef).

```typescript
// Assign task to Engineering team
await client.assignTeamToNode(taskId, 'team_001', 'Engineering');
```

#### client.getNodeUsers(nodeId)

Get all users assigned to a node.

```typescript
const users = await client.getNodeUsers(taskId);
console.log(users.map(u => u.displayName)); // ["Alice", "Bob"]
```

#### client.getNodeTeams(nodeId)

Get all teams assigned to a node.

```typescript
const teams = await client.getNodeTeams(taskId);
console.log(teams.map(t => t.displayName)); // ["Engineering", "QA"]
```

#### client.removeUsersFromNode(nodeId)

Remove all user assignments from a node.

**⚠️ WARNING:** This removes ALL userRefs from the node.

```typescript
await client.removeUsersFromNode(taskId);
```

#### client.removeTeamsFromNode(nodeId)

Remove all team assignments from a node.

**⚠️ WARNING:** This removes ALL teamRefs from the node.

```typescript
await client.removeTeamsFromNode(taskId);
```

#### client.isNodePublic(nodeId)

Check if a node is public (has no teamRef or userRef).

```typescript
const isPublic = await client.isNodePublic(taskId);
if (isPublic) {
  console.log('Task is visible to everyone in the organization');
}
```

#### client.replaceNodeUsers(nodeId, users)

Efficiently replace all user assignments with a new list.

```typescript
// Reassign task to Alice only (removes all other users)
await client.replaceNodeUsers(taskId, [
  { userId: 'user_alice_123', userName: 'Alice' }
]);
```

#### client.replaceNodeTeams(nodeId, teams)

Efficiently replace all team assignments with a new list.

```typescript
// Assign task to Engineering and QA teams only
await client.replaceNodeTeams(taskId, [
  { teamId: 'team_001', teamName: 'Engineering' },
  { teamId: 'team_002', teamName: 'QA' }
]);
```

### Access Control Patterns

**Pattern 1: User-Only Task Assignment**

```typescript
// Create task and assign to specific user
const task = await client.createNode({
  type: 'plm.task',
  name: 'Fix login bug',
  settings: { status: 'pending', priority: 'high' }
});

await client.assignUserToNode(task.id, 'user_alice_123', 'Alice');
// Now only Alice can see this task
```

**Pattern 2: Team-Only Access**

```typescript
// Create task visible to entire team
const task = await client.createNode({
  type: 'plm.task',
  name: 'Deploy to production',
  settings: { status: 'pending' }
});

await client.assignTeamToNode(task.id, 'team_ops', 'Operations');
// All Operations team members can see this task
```

**Pattern 3: Hybrid Access (Team + Specific Users)**

```typescript
// Create task visible to team + additional users
const task = await client.createNode({
  type: 'plm.task',
  name: 'Security audit',
  settings: { status: 'pending' }
});

// Assign to Security team
await client.assignTeamToNode(task.id, 'team_security', 'Security');

// Also give access to CTO (not on Security team)
await client.assignUserToNode(task.id, 'user_cto_999', 'CTO');
// Now visible to: Security team members + CTO
```

**Pattern 4: Public Task (Everyone Can See)**

```typescript
// Create task without any refs = public
const task = await client.createNode({
  type: 'plm.task',
  name: 'Company-wide announcement',
  settings: { status: 'pending' }
});

// Verify it's public
const isPublic = await client.isNodePublic(task.id);
console.log(isPublic); // true
```

**Pattern 5: Reassign Task**

```typescript
const taskId = 'task_001';

// Reassign from Alice to Bob
await client.replaceNodeUsers(taskId, [
  { userId: 'user_bob_456', userName: 'Bob' }
]);
```

**Pattern 6: Create Task with Initial Assignment**

```typescript
// Create task with userRef in one API call
const task = await client.createNode({
  type: 'plm.task',
  name: 'Review PR #123',
  settings: { status: 'pending' },
  refs: [
    {
      refName: 'userRef',
      toNodeId: 'user_alice_123',
      displayName: 'Alice'
    }
  ]
});
// Task is created and assigned to Alice in one call
```

**Pattern 7: Filter Tasks by Current User**

```typescript
const currentUserId = 'user_alice_123';

// Get all tasks
const allTasks = await client.queryNodes({
  filter: 'type is "plm.task"'
});

// Filter to tasks assigned to current user or public
const myTasks = [];
for (const task of allTasks) {
  const users = await client.getNodeUsers(task.id);
  const isAssignedToMe = users.some(u => u.toNodeId === currentUserId);
  const isPublic = await client.isNodePublic(task.id);

  if (isAssignedToMe || isPublic) {
    myTasks.push(task);
  }
}

console.log('My tasks:', myTasks.map(t => t.name));
```

**💡 See [examples/access-control-usage.ts](../frontend-sdk/plugin-client/examples/access-control-usage.ts) for complete working examples!**

## Working with Settings Schemas

### Why Use Settings Schemas?

The settings-schema API provides:
1. **Schema Definition** - JSON Schema for validation and UI rendering
2. **Current Values** - The node's current settings
3. **Multiple Schemas** - Different configurations for different use cases

### Multiple Settings Schemas Pattern

Some nodes support multiple configurations. For example, a `monitor.remote` node could be:
- **HTTP Monitor** - Monitor web endpoints (needs URL, SSL settings)
- **Ping Monitor** - Monitor network hosts (needs hostname, ICMP settings)
- **Device Monitor** - Monitor Rubix devices (needs device ID)

**Step 1: Check if node supports multiple schemas**

```typescript
const response = await fetch(
  `/api/v1/orgs/${orgId}/devices/${deviceId}/nodes/${nodeId}/settings-schema/list`,
  {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  }
);

const { schemas, supportsMultiple } = await response.json();

if (supportsMultiple && schemas.length > 1) {
  // Show schema selector UI
  schemas.forEach(s => {
    console.log(s.displayName, s.description);
  });
}
```

**Response format:**
```json
{
  "schemas": [
    {
      "name": "http",
      "displayName": "HTTP/HTTPS Monitor",
      "description": "Monitor web endpoints with SSL checking",
      "isDefault": true
    },
    {
      "name": "ping",
      "displayName": "Network Ping Monitor",
      "description": "Monitor host availability via ICMP",
      "isDefault": false
    }
  ],
  "supportsMultiple": true
}
```

**Step 2: Get specific schema with values**

```typescript
const schemaName = 'http'; // User selected schema

const response = await fetch(
  `/api/v1/orgs/${orgId}/devices/${deviceId}/nodes/${nodeId}/settings-schema/${schemaName}`,
  {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  }
);

const { nodeType, schema, settings } = await response.json();
```

**Response format:**
```json
{
  "nodeType": "monitor.remote",
  "schema": {
    "type": "object",
    "title": "HTTP Monitor Settings",
    "properties": {
      "name": {
        "type": "string",
        "title": "Name",
        "minLength": 1
      },
      "url": {
        "type": "string",
        "title": "URL",
        "format": "uri"
      },
      "interval": {
        "type": "integer",
        "title": "Check Interval (seconds)",
        "default": 60
      }
    },
    "required": ["name", "url"]
  },
  "settings": {
    "name": "",
    "url": "",
    "interval": 60
  }
}
```

**Step 3: Render form and update settings**

Use a JSON Schema form library (like react-jsonschema-form) to render the form, then save via PATCH:

```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client';

const urlConfig = { orgId, deviceId, baseUrl: '/api/v1' };

const handleSave = async (formData) => {
  await fetch(urls.node.settingsPatch(urlConfig, nodeId), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(formData),
  });
};
```

### Settings Helper Utilities

Create reusable helpers for settings operations using the URL builder:

```typescript
// settings-helpers.ts
import { urls } from '@rubix-sdk/frontend/plugin-client';

export interface SettingsSchemaAPI {
  orgId: string;
  deviceId: string;
  nodeId: string;
  baseUrl?: string;
  token?: string;
}

export const settingsHelpers = {
  /**
   * List available settings schemas for a node
   */
  async listSchemas(config: SettingsSchemaAPI) {
    const { orgId, deviceId, nodeId, baseUrl = '/api/v1', token } = config;
    const urlConfig = { orgId, deviceId, baseUrl };

    const response = await fetch(urls.node.settingsSchemaList(urlConfig, nodeId), {
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
   * Get a specific schema by name (with current values)
   */
  async getSchemaByName(config: SettingsSchemaAPI, schemaName: string) {
    const { orgId, deviceId, nodeId, baseUrl = '/api/v1', token } = config;
    const urlConfig = { orgId, deviceId, baseUrl };

    const response = await fetch(urls.node.settingsSchemaByName(urlConfig, nodeId, schemaName), {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get schema: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get default schema (for single schema nodes or default in multi-schema)
   */
  async getDefaultSchema(config: SettingsSchemaAPI) {
    const { orgId, deviceId, nodeId, baseUrl = '/api/v1', token } = config;
    const urlConfig = { orgId, deviceId, baseUrl };

    const response = await fetch(urls.node.settingsSchema(urlConfig, nodeId), {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get schema: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Update settings (PATCH - deep merge)
   */
  async updateSettings(config: SettingsSchemaAPI, settings: Record<string, unknown>) {
    const { orgId, deviceId, nodeId, baseUrl = '/api/v1', token } = config;
    const urlConfig = { orgId, deviceId, baseUrl };

    const response = await fetch(urls.node.settingsPatch(urlConfig, nodeId), {
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
};
```

**Usage:**

```typescript
import { settingsHelpers } from './settings-helpers';

const config = {
  orgId: 'my-org',
  deviceId: 'my-device',
  nodeId: 'node_123',
  token: 'your-token',
};

// List available schemas
const { schemas, supportsMultiple } = await settingsHelpers.listSchemas(config);

// Get specific schema
const { schema, settings } = await settingsHelpers.getSchemaByName(config, 'http');

// Update settings
await settingsHelpers.updateSettings(config, {
  url: 'https://example.com',
  interval: 30,
});
```

## Plugin Configuration

### plugin.json Overview

Your `plugin.json` defines the plugin metadata and node types:

```json
{
  "id": "myplugin",
  "name": "My Plugin",
  "version": "1.0.0",

  "nodeTypes": [
    "myplugin.sensor",
    "myplugin.controller"
  ],

  "coreNodeTypes": [
    "core.asset",
    "core.document"
  ],

  "nodes": [
    {
      "type": "myplugin.sensor",
      "displayName": "Sensor",
      "icon": "thermometer",
      "color": "#3b82f6"
    }
  ],

  "pages": [
    {
      "pageId": "sensor-list",
      "title": "Sensors",
      "nodeTypes": ["myplugin.sensor"],
      "enabled": true
    }
  ]
}
```

**Key fields:**
- `nodeTypes`: Custom types owned by your plugin (e.g., `myplugin.sensor`)
- `coreNodeTypes`: Core types you use (e.g., `core.document`, `core.task`)
- `nodes`: UI configuration for each type (icon, color, display name)
- `pages`: Plugin pages/UIs that display when viewing these nodes

### Node Profiles (config/nodes.yaml)

Node profiles define the structure and validation for your node's settings field.

**File:** `config/nodes.yaml`

```yaml
version: 1

nodeTypes:
  - type: myplugin.sensor
    baseType: core.asset
    displayName: Temperature Sensor
    autoPluginId: true
    autoIdentity: [sensor, temperature, myplugin]

    # Default values for settings
    defaults:
      status: active
      unit: celsius
      precision: 1

    # Validation rules
    validation:
      required: [serialNumber, location]
      rules:
        serialNumber:
          pattern: "^SN-[0-9]{6}$"
          message: "Format: SN-123456"
        temperature:
          min: -40
          max: 125
        status:
          enum: [active, inactive, maintenance]
```

**How it works:**
1. When you call `createNode()`, settings are validated against the profile
2. Default values are merged with your provided settings
3. Required fields are checked
4. Pattern/range validation is enforced

**Example:**
```typescript
// Your node profile has defaults: { status: 'active', unit: 'celsius' }
await client.createNode({
  type: 'myplugin.sensor',
  name: 'Sensor 1',
  settings: {
    serialNumber: 'SN-123456',  // required
    location: 'Room A',          // required
    temperature: 22.5,           // validated (min/max range)
    // status: 'active' <- applied from defaults
    // unit: 'celsius' <- applied from defaults
  },
});
```

For full details on node profiles, see:
- [Node Profiles Documentation](/home/user/code/go/nube/rubix/docs/system/v1/plugins/NODE-PROFILES.md)
- [Port Profiles Documentation](/home/user/code/go/nube/rubix/docs/system/v1/plugins/PORT-PROFILES.md)

## Settings Structure

Settings are stored as JSON and validated against JSON schemas. Rubix supports **multiple settings schemas** per node type, allowing different configurations for different use cases.

### Understanding Settings Schemas

**What are settings schemas?**
- JSON Schema definitions that validate and structure your node's settings
- Can have multiple schemas per node type (e.g., "http", "ping", "device" for a monitor node)
- Include both the schema definition AND current values
- Must be fetched via the settings-schema API

**Key concept:** Always use the **settings-schema API** to get both the schema and current values together.

### Getting Settings Schema + Values

**For single schema nodes:**
```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client';

const urlConfig = { orgId, deviceId, baseUrl: '/api/v1' };

// Get schema + current values in one call
const response = await fetch(urls.node.settingsSchema(urlConfig, nodeId), {
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
});

const { schema, settings } = await response.json();
```

**For multiple schema nodes (recommended pattern):**
```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client';

const urlConfig = { orgId, deviceId, baseUrl: '/api/v1' };

// Step 1: List available schemas
const listResponse = await fetch(urls.node.settingsSchemaList(urlConfig, nodeId), {
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
});

const { schemas, supportsMultiple } = await listResponse.json();
// schemas: [{ name: "http", displayName: "HTTP Monitor", ... }, ...]

// Step 2: Get specific schema by name
const schemaResponse = await fetch(
  urls.node.settingsSchemaByName(urlConfig, nodeId, 'http'),
  {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  }
);

const { schema, settings } = await schemaResponse.json();
```

### Creating Nodes with Settings

```typescript
const client = createPluginClient({ orgId, deviceId, baseUrl, token });

// Settings structure matches your node profile schema
const item = await client.createNode({
  type: 'myplugin.item',
  name: 'Item 1',
  parentRef: collectionId,
  settings: {
    // Field names come from the JSON schema
    status: 'active',
    category: 'electronics',
    quantity: 10,
    metadata: {
      supplier: 'ACME Corp',
      sku: 'PART-001',
    },
  },
});
```

### Reading Settings

```typescript
const item = await client.getNode(itemId);

console.log(item.name);                  // "Item 1"
console.log(item.settings?.status);      // "active"
console.log(item.settings?.quantity);    // 10
console.log(item.settings?.metadata);    // { supplier: 'ACME Corp', ... }
```

### Updating Settings (IMPORTANT: Use PATCH, not updateNode)

**❌ DON'T use `updateNode()` for settings:**
```typescript
// WRONG - Don't do this for settings updates
await client.updateNode(itemId, {
  settings: { quantity: 15 }
});
```

**✅ DO use the settings PATCH endpoint:**
```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client';

const urlConfig = { orgId, deviceId, baseUrl: '/api/v1' };

// CORRECT - Use settings-patch endpoint with URL builder
await fetch(urls.node.settingsPatch(urlConfig, nodeId), {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
  body: JSON.stringify({
    quantity: 15,  // Only changed fields (deep merge)
  }),
});
```

**Why use PATCH?**
- Settings PATCH does a **deep merge** - preserves unchanged fields
- Re-initializes the node with new settings
- Validates against the schema
- Triggers proper node lifecycle events

**Important:**
- Settings updates are **partial** - only send changed fields
- Deep merge preserves nested structures
- Use settings PATCH, NOT node update

## Query Patterns

### Query by Parent

Find all child nodes of a specific parent:

```typescript
// Find all items under a collection
const items = await client.queryNodes({
  filter: `parent.id is "${collectionId}" and type is "myplugin.item"`,
});

// Find all sensors under a device
const sensors = await client.queryNodes({
  filter: `parent.id is "${deviceId}" and type is "myplugin.sensor"`,
});
```

### Common Patterns

```typescript
// By type only
const sensors = await client.queryNodes({
  filter: 'type is "myplugin.sensor"',
});

// By type and parent
const children = await client.queryNodes({
  filter: `parent.id is "${parentId}" and type is "myplugin.item"`,
});

// By settings field
const activeItems = await client.queryNodes({
  filter: 'type is "myplugin.item" and settings.status is "active"',
});

// Complex queries
const results = await client.queryNodes({
  filter: 'type is "myplugin.sensor" and settings.temperature > 25 | sort settings.temperature desc | limit 10',
});
```

## Complete CRUD Example

```typescript
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';

async function exampleCRUD() {
  const client = createPluginClient({
    orgId: 'my-org',
    deviceId: 'my-device',
    baseUrl: '/api/v1',
    token: 'your-token',
  });

  // 1. CREATE
  const item = await client.createNode({
    type: 'myplugin.item',
    name: 'Widget Pro',
    parentRef: collectionId,
    settings: {
      category: 'electronics',
      quantity: 10,
      price: 99.99,
    },
  });

  console.log('Created:', item.id);

  // 2. READ - Single node
  const fetchedItem = await client.getNode(item.id);
  console.log('Item:', fetchedItem.name, fetchedItem.settings);

  // 3. READ - Query multiple
  const allItems = await client.queryNodes({
    filter: `parent.id is "${collectionId}" and type is "myplugin.item"`,
  });
  console.log(`Found ${allItems.length} items`);

  // 4. UPDATE - Change settings (IMPORTANT: Use PATCH, not updateNode)
  const { urls } = await import('@rubix-sdk/frontend/plugin-client');
  const urlConfig = { orgId: 'my-org', deviceId: 'my-device', baseUrl: '/api/v1' };
  const token = 'your-token';

  await fetch(urls.node.settingsPatch(urlConfig, item.id), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      quantity: 15,
      price: 89.99,
    }),
  });
  console.log('Updated settings');

  // 5. UPDATE - Change name (OK to use updateNode for metadata)
  await client.updateNode(item.id, {
    name: 'Widget Pro v2',
  });
  console.log('Renamed item');

  // 6. DELETE
  await client.deleteNode(item.id);
  console.log('Deleted item');
}
```

## Node Commands

Commands are actions that nodes can execute, like "discover devices", "ping connection", or "reset configuration". Each node type can register its own commands with custom parameters and response schemas.

### How Commands Work

Commands follow an async-by-default execution model:

1. **List** available commands for a node
2. **Execute** a command with parameters → returns result or job ID
3. **Poll** job status until completion (for async commands)
4. **Read** results from completed job

### Command Execution Modes

- **Sync**: Returns results immediately in response body (< 5 seconds)
- **Async**: Returns job ID for long-running operations (discovery, bulk ops)
- **Auto**: Runtime decides based on execution time

### List Commands

```typescript
const client = createPluginClient({ orgId, deviceId, baseUrl, token });

// Get all commands available for a node
const commands = await client.listCommands(nodeId);

console.log(commands.map(c => ({
  name: c.name,
  description: c.description,
  method: c.method,
  executionMode: c.executionMode
})));

// Example output:
// [
//   { name: "ping", description: "Test connectivity", method: "GET", executionMode: "sync" },
//   { name: "discover", description: "Discover devices", method: "POST", executionMode: "async" },
//   { name: "reset", description: "Reset configuration", method: "POST", executionMode: "sync" }
// ]
```

### Get Command Definition

```typescript
// Get detailed info about a specific command including parameter schema
const command = await client.getCommand(nodeId, 'ping');

console.log(command.schema);        // Parameter JSON Schema
console.log(command.responseSchema); // Response JSON Schema
console.log(command.ui);            // UI customization (label, icon, etc.)
```

### Execute Commands

#### Sync Command (Fast Operations)

```typescript
// Execute and get result immediately
const result = await client.executeCommand(nodeId, 'ping', {
  count: 5,
  timeout: 3000
});

if (!result.isAsync) {
  console.log('Ping result:', result.result);
  // { success: true, latency: 12.5, packetsLost: 0 }
}
```

#### Async Command (Long-Running Operations)

```typescript
// Execute command that returns job ID
const result = await client.executeCommand(nodeId, 'discover', {
  subnet: '192.168.1.0/24',
  timeout: 60
});

if (result.isAsync) {
  console.log('Job started:', result.jobId);

  // Poll for completion
  const job = await client.pollCommandJob(nodeId, result.jobId);

  if (job.status === 'success') {
    console.log('Discovery complete:', job.result);
    // { devicesFound: 12, devices: [...] }
  } else {
    console.error('Discovery failed:', job.error);
  }
}
```

#### Execute and Wait (Convenience Method)

```typescript
// Automatically handles both sync and async commands
const result = await client.executeAndWait(nodeId, 'discover', {
  subnet: '192.168.1.0/24'
}, {
  pollInterval: 1000,  // Poll every 1 second
  maxAttempts: 60      // Max 60 attempts (60 seconds)
});

console.log('Discovery complete:', result);
// { devicesFound: 12, devices: [...] }
```

### Command HTTP Methods

Commands can map to different HTTP methods for semantic operations:

#### GET Commands (Read-Only)

```typescript
// Query/read operations - no side effects
const status = await client.executeGetCommand(nodeId, 'status', {
  verbose: true
});

console.log('Device status:', status);
```

#### POST Commands (Create/Trigger)

```typescript
// Create/trigger operations
const result = await client.executePostCommand(nodeId, 'restart', {
  force: true
});
```

#### PATCH Commands (Update)

```typescript
// Update operations
const result = await client.executePatchCommand(nodeId, 'updateConfig', {
  timeout: 30,
  retries: 3
});
```

#### DELETE Commands (Delete/Clear)

```typescript
// Delete/clear operations
const result = await client.executeDeleteCommand(nodeId, 'clearCache', {
  includeHistory: false
});
```

### Managing Command Jobs

#### Get Job Status

```typescript
// Check status of a running job
const job = await client.getCommandJob(nodeId, 'job_abc123');

console.log('Status:', job.status);     // "pending" | "running" | "success" | "failed"
console.log('Progress:', job.progress); // 0-100
console.log('Created:', job.createdAt);
console.log('Started:', job.startedAt);

if (job.status === 'success') {
  console.log('Result:', job.result);
} else if (job.status === 'failed') {
  console.error('Error:', job.error);
}
```

#### List Jobs

```typescript
// Get all jobs for a node
const allJobs = await client.listCommandJobs(nodeId);

// Filter by status
const runningJobs = await client.listCommandJobs(nodeId, 'running');
const failedJobs = await client.listCommandJobs(nodeId, 'failed');

console.log(`Found ${runningJobs.length} running jobs`);
```

#### Cancel Job

```typescript
// Cancel a running job
await client.cancelCommandJob(nodeId, 'job_abc123');
```

### Complete Command Example

```typescript
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';

async function discoverDevices() {
  const client = createPluginClient({
    orgId: 'my-org',
    deviceId: 'my-device',
    baseUrl: '/api/v1',
    token: 'your-token',
  });

  // 1. List available commands
  const commands = await client.listCommands('bacnet_client_node_id');
  console.log('Available commands:', commands.map(c => c.name));

  // 2. Get command details
  const discoverCmd = await client.getCommand('bacnet_client_node_id', 'whoisAsync');
  console.log('Discovery parameters:', discoverCmd.schema);

  // 3. Execute discovery (async command)
  const result = await client.executeCommand('bacnet_client_node_id', 'whoisAsync', {
    subnet: '192.168.1.0/24',
    deviceRange: { low: 0, high: 4194303 }
  });

  if (result.isAsync) {
    console.log('Discovery started, job ID:', result.jobId);

    // 4. Poll for completion
    const job = await client.pollCommandJob(
      'bacnet_client_node_id',
      result.jobId,
      1000,  // Poll every 1 second
      120    // Max 2 minutes
    );

    // 5. Check result
    if (job.status === 'success') {
      console.log(`Found ${job.result.devicesFound} devices`);
      console.log('Devices:', job.result.devices);
    } else {
      console.error('Discovery failed:', job.error);
    }
  }
}

// Alternative: Use executeAndWait for simpler code
async function discoverDevicesSimple() {
  const client = createPluginClient({
    orgId: 'my-org',
    deviceId: 'my-device',
    baseUrl: '/api/v1',
    token: 'your-token',
  });

  try {
    const result = await client.executeAndWait(
      'bacnet_client_node_id',
      'whoisAsync',
      {
        subnet: '192.168.1.0/24',
        deviceRange: { low: 0, high: 4194303 }
      },
      {
        pollInterval: 1000,
        maxAttempts: 120
      }
    );

    console.log(`Found ${result.devicesFound} devices`);
    console.log('Devices:', result.devices);
  } catch (err) {
    console.error('Discovery failed:', err.message);
  }
}
```

### React Hook for Commands

```typescript
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { useState } from 'react';

function DeviceDiscovery({ orgId, deviceId, baseUrl, token, nodeId }) {
  const [discovering, setDiscovering] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const client = useMemo(
    () => createPluginClient({ orgId, deviceId, baseUrl, token }),
    [orgId, deviceId, baseUrl, token]
  );

  const startDiscovery = async () => {
    setDiscovering(true);
    setError(null);
    setResult(null);

    try {
      const result = await client.executeAndWait(nodeId, 'whoisAsync', {
        subnet: '192.168.1.0/24'
      });
      setResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setDiscovering(false);
    }
  };

  return (
    <div>
      <button onClick={startDiscovery} disabled={discovering}>
        {discovering ? 'Discovering...' : 'Start Discovery'}
      </button>

      {error && <div className="error">{error}</div>}

      {result && (
        <div>
          <h3>Discovery Complete</h3>
          <p>Found {result.devicesFound} devices</p>
          <ul>
            {result.devices.map(device => (
              <li key={device.id}>{device.name} - {device.address}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### Command Options

```typescript
// Force async execution (returns jobId instead of result)
const result = await client.executeCommand(nodeId, 'ping',
  { count: 5 },
  { async: true }
);

// Add query parameters (for GET commands)
const status = await client.executeGetCommand(nodeId, 'status', {
  verbose: true,
  format: 'json'
});
```

### TypeScript Types

```typescript
import type {
  CommandDefinition,
  CommandJob,
  CommandExecuteResult,
  ExecuteCommandOptions,
  CommandUI,
} from '@rubix-sdk/frontend/plugin-client';

// Command definition
const command: CommandDefinition = {
  name: 'ping',
  description: 'Test connectivity',
  method: 'GET',
  executionMode: 'sync',
  timeout: 5,
  schema: { /* JSON Schema */ },
  responseSchema: { /* JSON Schema */ },
  ui: {
    label: 'Ping Device',
    icon: 'wifi',
    variant: 'primary'
  }
};

// Command job with typed result
interface PingResult {
  success: boolean;
  latency: number;
  packetsLost: number;
}

interface PingParams {
  count: number;
  timeout: number;
}

const job: CommandJob<PingResult, PingParams> = {
  id: 'job_123',
  nodeId: 'node_abc',
  commandName: 'ping',
  status: 'success',
  parameters: { count: 5, timeout: 3000 },
  result: { success: true, latency: 12.5, packetsLost: 0 },
  // ... other fields
};
```

## Error Handling

```typescript
import { PluginClientError } from '@rubix-sdk/frontend/plugin-client';

try {
  await client.createNode({
    type: 'myplugin.item',
    name: 'Test',
    settings: { invalid: 'data' },
  });
} catch (err) {
  if (err instanceof PluginClientError) {
    console.error('Status:', err.status);        // HTTP status code
    console.error('Message:', err.message);      // User-friendly message
    console.error('Details:', err.details);      // Raw error details
  }
}
```

## React Hook Pattern

### Query Nodes Hook

```typescript
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { useState, useEffect, useMemo } from 'react';

function MyWidget({ orgId, deviceId, baseUrl, token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create client once (memoized)
  const client = useMemo(
    () => createPluginClient({ orgId, deviceId, baseUrl, token }),
    [orgId, deviceId, baseUrl, token]
  );

  // Fetch items
  useEffect(() => {
    client
      .queryNodes({ filter: 'type is "myplugin.item"' })
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [client]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### Settings Schema Hook

```typescript
import { useState, useEffect } from 'react';
import { settingsHelpers } from './settings-helpers';

function NodeSettingsForm({ orgId, deviceId, nodeId, token }) {
  const [schema, setSchema] = useState(null);
  const [settings, setSettings] = useState({});
  const [schemas, setSchemas] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [loading, setLoading] = useState(true);

  const config = { orgId, deviceId, nodeId, token };

  useEffect(() => {
    async function loadSchemas() {
      try {
        // Check for multiple schemas
        const { schemas, supportsMultiple } = await settingsHelpers.listSchemas(config);

        if (supportsMultiple && schemas.length > 1) {
          // Multiple schemas - show selector
          setSchemas(schemas);
          const defaultSchema = schemas.find(s => s.isDefault) || schemas[0];
          setSelectedSchema(defaultSchema.name);
        } else {
          // Single schema - load default
          const data = await settingsHelpers.getDefaultSchema(config);
          setSchema(data.schema);
          setSettings(data.settings);
        }
      } catch (err) {
        console.error('Failed to load schemas:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSchemas();
  }, [orgId, deviceId, nodeId]);

  // Load specific schema when selected
  useEffect(() => {
    if (!selectedSchema) return;

    async function loadSchema() {
      try {
        const data = await settingsHelpers.getSchemaByName(config, selectedSchema);
        setSchema(data.schema);
        setSettings(data.settings);
      } catch (err) {
        console.error('Failed to load schema:', err);
      }
    }

    loadSchema();
  }, [selectedSchema]);

  const handleSave = async (formData) => {
    try {
      await settingsHelpers.updateSettings(config, formData);
      alert('Settings saved!');
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (schemas.length > 1 && !schema) {
    // Show schema selector
    return (
      <div>
        <h3>Select Configuration Type</h3>
        {schemas.map(s => (
          <button key={s.name} onClick={() => setSelectedSchema(s.name)}>
            {s.displayName}
            <p>{s.description}</p>
          </button>
        ))}
      </div>
    );
  }

  // Render form with schema (use react-jsonschema-form or similar)
  return (
    <div>
      <h3>Settings</h3>
      {/* Render form based on schema */}
      <JSONSchemaForm
        schema={schema}
        formData={settings}
        onSubmit={handleSave}
      />
    </div>
  );
}
```

## TypeScript Types

```typescript
interface PluginClientConfig {
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
}

interface QueryNodesOptions {
  filter?: string;
  limit?: number;
  offset?: number;
}

interface CreateNodeInput {
  type: string;
  name: string;
  parentRef?: string;  // Use parentRef, not parentId
  settings?: Record<string, unknown>;
  data?: Record<string, unknown>;
  ui?: Record<string, unknown>;
  position?: { x: number; y: number };
}

interface UpdateNodeInput {
  name?: string;
  // ⚠️ DO NOT include settings here - use settings PATCH endpoint instead
  data?: Record<string, unknown>;
  ui?: Record<string, unknown>;
  position?: { x: number; y: number };
}

// Settings Schema Types
interface SettingsSchemaListResponse {
  schemas: SettingsSchemaInfo[];
  supportsMultiple: boolean;
}

interface SettingsSchemaInfo {
  name: string;
  displayName: string;
  description: string;
  isDefault: boolean;
}

interface SettingsSchemaResponse {
  nodeType: string;
  schema: JSONSchema;      // JSON Schema object
  settings: Record<string, unknown>;  // Current values
}

interface JSONSchema {
  type: string;
  title?: string;
  description?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  default?: unknown;
  // ... other JSON Schema fields
}

class PluginClientError extends Error {
  status?: number;
  details?: unknown;
}
```

## Advanced Usage

### Accessing Raw RAS Client

```typescript
const rasClient = client.getRASClient();

// Use advanced APIs
await rasClient.edges.create({ ... });
await rasClient.refs.create({ ... });
await rasClient.pages.resolve({ ... });
```

## FAQ

**Q: Should I use `parentId` or `parentRef` when creating nodes?**

A: **Always use `parentRef`** when creating nodes. The parent field naming differs based on context:

| Context | Field Name | Example |
|---------|-----------|---------|
| **Creating nodes** | `parentRef` | `createNode({ parentRef: 'xyz' })` |
| **Querying nodes** | `parent.id` or `p.id` | `filter: "parent.id is 'xyz'"` or `filter: "p.id is 'xyz'"` |
| **Reading responses** | `parentId` | `node.parentId` returns the parent ID |

**Examples:**

```typescript
// ✅ CORRECT - Creating with parentRef
await client.createNode({
  type: 'plm.ticket',
  parentRef: taskId,  // ← Use parentRef
  settings: { ... }
});

// ❌ WRONG - Using parentId creates orphaned node!
await client.createNode({
  type: 'plm.ticket',
  parentId: taskId,  // ← Don't use parentId here
  settings: { ... }
});

// ✅ CORRECT - Querying with parent.id
const tickets = await client.queryNodes({
  filter: `type is "plm.ticket" and parent.id is "${taskId}"`
});

// ✅ CORRECT - Querying with shorthand p.id
const tickets = await client.queryNodes({
  filter: `type is "plm.ticket" and p.id is "${taskId}"`
});

// ✅ CORRECT - Multi-level parent query
const tickets = await client.queryNodes({
  filter: `type is "plm.ticket" and parent.parent.id is "${productId}"`
});

// ✅ CORRECT - Reading response
const node = await client.getNode(nodeId);
console.log(node.parentId);  // Response contains parentId
```

**Key Points:**
- CREATE: Use `parentRef` (establishes parent relationship)
- QUERY: Use `parent.id` or `p.id` (filter syntax)
- RESPONSE: Contains `parentId` (read-only field)

**Q: How do I update node settings?**
A: Use the settings PATCH endpoint, NOT `updateNode()`:
```typescript
await fetch(`/api/v1/orgs/${orgId}/devices/${deviceId}/nodes/${nodeId}/settings`, {
  method: 'PATCH',
  body: JSON.stringify({ field: 'value' })
});
```

**Q: What's the difference between single and multiple settings schemas?**
A:
- **Single schema**: Node has one configuration (e.g., a timer node)
- **Multiple schemas**: Node supports different use cases (e.g., HTTP vs Ping monitor)
- Always check with `/settings-schema/list` first

**Q: How do I get settings with their schema?**
A: Use the settings-schema API, which returns both schema AND current values:
```typescript
// For single schema or default
GET /nodes/{id}/settings-schema

// For specific schema in multi-schema nodes
GET /nodes/{id}/settings-schema/{schemaName}
```

**Q: Are identity tags part of settings?**
A: No! Identity tags are separate from settings. Settings are configuration data; tags are for identification and filtering.

**Q: Can I still access the raw RAS client?**
A: Yes, use `client.getRASClient()` for advanced APIs.

**Q: How do I handle authentication?**
A: Pass the `token` parameter when creating the client. It's automatically injected into all requests.

**Q: What if I need an API not wrapped by this client?**
A: Use `client.getRASClient()` to access the full RAS client, or use fetch directly for settings operations.

**Q: Does this work with all plugins?**
A: Yes! It's completely generic and works with any plugin.

## URL Builder API

The SDK includes comprehensive URL builders to prevent manual URL construction errors. All builders follow the same pattern:

```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client';

const config = { orgId: 'my-org', deviceId: 'my-device', baseUrl: '/api/v1' };
```

### Node URLs

**CRUD Operations:**
```typescript
// List all nodes
urls.node.list(config)
// → /api/v1/orgs/my-org/devices/my-device/nodes

// Get single node
urls.node.get(config, nodeId)
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}

// Create node (POST to list URL)
urls.node.create(config)
// → /api/v1/orgs/my-org/devices/my-device/nodes

// Update node (PUT)
urls.node.update(config, nodeId)
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}

// Delete node
urls.node.delete(config, nodeId)
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}

// Query nodes
urls.node.query(config)
// → /api/v1/orgs/my-org/devices/my-device/nodes/query
```

**Settings URLs (IMPORTANT):**
```typescript
// Get settings (values only)
urls.node.settings(config, nodeId)
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}/settings

// Update settings (PATCH - recommended)
urls.node.settingsPatch(config, nodeId)
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}/settings

// Get default settings schema + values
urls.node.settingsSchema(config, nodeId)
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}/settings-schema

// List available schemas (multi-schema nodes)
urls.node.settingsSchemaList(config, nodeId)
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}/settings-schema/list

// Get specific schema by name + values
urls.node.settingsSchemaByName(config, nodeId, 'http')
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}/settings-schema/http
```

**Port URLs:**
```typescript
// List node ports
urls.node.ports(config, nodeId)
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}/ports

// Get port value
urls.node.portValue(config, nodeId, 'temperature')
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}/ports/temperature/value

// Set port value (PATCH)
urls.node.setPortValue(config, nodeId, 'temperature')
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}/ports/temperature/value
```

**Command URLs:**
```typescript
// List available commands for a node
urls.node.commandsList(config, nodeId)
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}/commands

// Get specific command definition
urls.node.commandGet(config, nodeId, 'ping')
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}/commands/ping

// Execute command
urls.node.commandExecute(config, nodeId, 'reset')
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}/commands/reset/execute

// Get command job status
urls.node.commandJob(config, nodeId, jobId)
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}/jobs/{jobId}

// List command jobs
urls.node.commandJobsList(config, nodeId)
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}/jobs

// Cancel command job
urls.node.commandJobCancel(config, nodeId, jobId)
// → /api/v1/orgs/my-org/devices/my-device/nodes/{nodeId}/jobs/{jobId}
```

### Node Type URLs

**Schema URLs (work with types, not instances):**
```typescript
// List schemas for a node type
urls.nodeType.settingsSchemasList(config, 'monitor.remote')
// → /api/v1/orgs/my-org/devices/my-device/node-types/monitor.remote/settings-schemas/list

// Get specific schema for a node type
urls.nodeType.settingsSchema(config, 'monitor.remote', 'http')
// → /api/v1/orgs/my-org/devices/my-device/node-types/monitor.remote/settings-schemas/http

// Get pallet details for a node type
urls.nodeType.pallet(config, 'monitor.remote')
// → /api/v1/orgs/my-org/devices/my-device/pallet/monitor.remote
```

### Device URLs

```typescript
// Get device details
urls.device.get(config)
// → /api/v1/orgs/my-org/devices/my-device

// List all devices in org
urls.device.list({ orgId: 'my-org', baseUrl: '/api/v1' })
// → /api/v1/orgs/my-org/devices
```

### Edge URLs

```typescript
// List edges
urls.edge.list(config)
// → /api/v1/orgs/my-org/devices/my-device/edges

// Create edge
urls.edge.create(config)
// → /api/v1/orgs/my-org/devices/my-device/edges

// Delete edge
urls.edge.delete(config, edgeId)
// → /api/v1/orgs/my-org/devices/my-device/edges/{edgeId}
```

### Flow URLs

```typescript
// Get flow metadata
urls.flow.get(config, flowId)
// → /api/v1/orgs/my-org/devices/my-device/flows/{flowId}

// Get flow snapshot (nodes + edges)
urls.flow.snapshot(config, flowId)
// → /api/v1/orgs/my-org/devices/my-device/flows/{flowId}/snapshot
```

### Query Parameters Helper

```typescript
import { addQueryParams } from '@rubix-sdk/frontend/plugin-client';

const url = urls.node.list(config);
const urlWithParams = addQueryParams(url, {
  type: 'myplugin.sensor',
  limit: 50,
  offset: 0,
});
// → /api/v1/orgs/my-org/devices/my-device/nodes?type=myplugin.sensor&limit=50&offset=0
```

### Example Usage Patterns

**Fetch settings with schema:**
```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client';

const config = { orgId, deviceId, baseUrl: '/api/v1' };

const response = await fetch(urls.node.settingsSchema(config, nodeId), {
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
});

const { schema, settings } = await response.json();
```

**Update settings:**
```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client';

const config = { orgId, deviceId, baseUrl: '/api/v1' };

await fetch(urls.node.settingsPatch(config, nodeId), {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
  body: JSON.stringify({
    field1: 'value1',
    field2: 123,
  }),
});
```

**Set port value:**
```typescript
import { urls } from '@rubix-sdk/frontend/plugin-client';

const config = { orgId, deviceId, baseUrl: '/api/v1' };

await fetch(urls.node.setPortValue(config, nodeId, 'temperature'), {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
  body: JSON.stringify({ value: 22.5 }),
});
```

## See Also

- [Multiple Settings Schemas (Backend)](/home/user/code/go/nube/rubix/docs/system/v1/settings/MULTIPLE-SETTINGS-SCHEMAS.md) - How multi-schema works on backend
- [Frontend Settings Documentation](/home/user/code/go/nube/rubix/docs/system/v1/settings/FRONTEND-SETTINGS.md) - Frontend settings UI implementation
- [Node Profiles Documentation](/home/user/code/go/nube/rubix/docs/system/v1/plugins/NODE-PROFILES.md) - Node type definitions
- [Port Profiles Documentation](/home/user/code/go/nube/rubix/docs/system/v1/plugins/PORT-PROFILES.md) - Port definitions
- [Query Language Reference](/home/user/code/go/nube/rubix/docs/system/v1/query/QUERY-TABLE.md) - Query syntax for filtering nodes
- [RAS Client Documentation](/home/user/code/go/nube/rubix-sdk/frontend-sdk/ras/) - Full RAS API client
