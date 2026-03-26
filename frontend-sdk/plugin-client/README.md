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

## Quick Start

```typescript
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';

function MyWidget({ orgId, deviceId, baseUrl, token }) {
  const client = createPluginClient({ orgId, deviceId, baseUrl, token });

  // Query nodes
  const items = await client.queryNodes({
    filter: 'type is "myplugin.item"',
  });

  // Create node
  const newItem = await client.createNode({
    type: 'myplugin.item',
    name: 'Item 1',
    parentRef: collectionId,
    settings: {
      field1: 'value1',
      field2: 123,
    },
  });

  // Update node
  await client.updateNode(newItem.id, {
    name: 'Item 1 Updated',
    settings: {
      field1: 'updated value',
    },
  });

  // Delete node
  await client.deleteNode(newItem.id);
}
```

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

Update an existing node.

```typescript
await client.updateNode('node_abc123', {
  name: 'Updated Name',   // optional
  settings: {             // optional - updates specific fields
    status: 'inactive',
    value: 150,
  },
});
```

**Settings updates:**
- Only send fields you want to change
- Partial updates supported - unmentioned fields remain unchanged
- Nested objects are replaced entirely (not deep-merged)

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

Settings are stored as JSON in the database. The structure comes from your `config/nodes.yaml` profile.

### Creating Nodes with Settings

```typescript
const client = createPluginClient({ orgId, deviceId, baseUrl, token });

// Settings structure matches your node profile
const item = await client.createNode({
  type: 'myplugin.item',
  name: 'Item 1',
  parentRef: collectionId,
  settings: {
    // Field names come from config/nodes.yaml
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

### Updating Settings (Partial Updates)

```typescript
// Only update specific fields
await client.updateNode(itemId, {
  settings: {
    quantity: 15,  // Only this field changes
  },
});

// Other fields (status, category, metadata) remain unchanged
```

**Important:**
- Settings updates are **partial** - only send changed fields
- Nested objects are **replaced entirely** (not deep-merged)
- To remove a field, set it to `null`

### Settings with Arrays

```typescript
await client.createNode({
  type: 'myplugin.item',
  name: 'Item 1',
  settings: {
    tags: ['electronics', 'popular', 'in-stock'],
    measurements: [
      { temp: 22.5, timestamp: '2026-03-27T10:00:00Z' },
      { temp: 23.1, timestamp: '2026-03-27T10:05:00Z' },
    ],
  },
});

// Update array (replaces entire array)
await client.updateNode(itemId, {
  settings: {
    tags: ['electronics', 'popular', 'on-sale'],  // Replaces whole array
  },
});
```

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

  // 4. UPDATE - Change settings
  await client.updateNode(item.id, {
    settings: {
      quantity: 15,
      price: 89.99,
    },
  });
  console.log('Updated item');

  // 5. UPDATE - Change name
  await client.updateNode(item.id, {
    name: 'Widget Pro v2',
  });
  console.log('Renamed item');

  // 6. DELETE
  await client.deleteNode(item.id);
  console.log('Deleted item');
}
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
  settings?: Record<string, unknown>;  // Partial update
  data?: Record<string, unknown>;
  ui?: Record<string, unknown>;
  position?: { x: number; y: number };
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
A: Always use `parentRef`. The field is called `parentRef` in the API.

**Q: How do settings work?**
A: Settings structure comes from your `config/nodes.yaml` node profile. Define defaults and validation rules there.

**Q: Can I still access the raw RAS client?**
A: Yes, use `client.getRASClient()` for advanced APIs.

**Q: How do I handle authentication?**
A: Pass the `token` parameter when creating the client. It's automatically injected into all requests.

**Q: What if I need an API not wrapped by this client?**
A: Use `client.getRASClient()` to access the full RAS client.

**Q: Does this work with all plugins?**
A: Yes! It's completely generic and works with any plugin.

## See Also

- [Node Profiles Documentation](/home/user/code/go/nube/rubix/docs/system/v1/plugins/NODE-PROFILES.md)
- [Port Profiles Documentation](/home/user/code/go/nube/rubix/docs/system/v1/plugins/PORT-PROFILES.md)
- [Query Language Reference](/home/user/code/go/nube/rubix/docs/system/v1/query/QUERY-TABLE.md)
- [RAS Client Documentation](/home/user/code/go/nube/rubix-sdk/frontend-sdk/ras/)
