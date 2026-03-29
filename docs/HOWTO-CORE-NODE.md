# How to Extend Core Node Types - Developer Guide

Complete guide for creating custom node types that extend Rubix core types (core.product, core.task, etc.).

## Two Patterns: Custom Types vs Profiles

There are **two ways** to customize core node types in your plugin:

### Pattern 1: Custom Type (Recommended)
Create a new namespaced type that extends a core type. Your plugin owns this type.

**Example:** `plm.product` extends `core.product`, `plm.task` extends `core.task`

**When to use:**
- You want full control over the node type
- You need plugin-specific defaults and validation
- You want consistent naming (e.g., `plm.product`, `plm.task`)

### Pattern 2: Profile
Customize an existing core type with plugin-specific UI/constraints.

**Example:** `core.task` with profile `"plm-task"`

**When to use:**
- Lightweight customization only
- You don't need a distinct type
- You're just adding UI hints or constraints

**This guide focuses on Pattern 1 (Custom Types).**

---

## Step-by-Step: Creating a Custom Type

### Step 1: Add to `config/nodes.yaml`

Define your custom type in `config/nodes.yaml`:

```yaml
nodeTypes:
  - type: plm.task                    # Your custom type (namespace.name)
    baseType: core.task               # The core type you're extending
    displayName: Task                 # Human-readable name
    description: Product development task or work item
    autoPluginId: true                # Auto-set pluginId from type prefix
    autoIdentity: [task, plm]         # Auto-add identity tags

    defaults:                         # Default settings for new nodes
      status: "pending"
      priority: "Medium"

    validation:                       # Validation rules
      required: []
      rules:
        status:
          enum: [pending, in-progress, completed, cancelled]
          message: "Invalid status"
        priority:
          enum: [Low, Medium, High]
          message: "Invalid priority"

    uiHints:                          # UI presentation hints
      icon: list-checks
      color: "#8b5cf6"
```

**Key fields:**
- `type` - Your custom type ID (must be namespaced: `plugin.typename`)
- `baseType` - The core type you're extending (e.g., `core.task`, `core.product`)
- `autoPluginId: true` - Auto-sets `pluginId` from type prefix (e.g., `plm.task` → `pluginId: "plm"`)
- `autoIdentity: [...]` - Auto-adds identity tags to nodes
- `defaults` - Default settings applied to new nodes
- `validation` - Validation rules for node creation/update
- `uiHints` - UI display hints (icon, color, etc.)

---

### Step 2: Update `plugin.json`

You need to update **THREE places** in `plugin.json`:

#### 2a. Add to `nodeTypes` array

List your custom type:

```json
{
  "nodeTypes": [
    "plm.service",
    "plm.product",
    "plm.task",        // ← Add your custom type here
    "plm.manufacturing-unit"
  ]
}
```

#### 2b. Add base type to `coreNodeTypes` array

**CRITICAL:** You MUST declare the core type you're extending:

```json
{
  "coreNodeTypes": [
    "core.asset",
    "core.product",
    "core.service",
    "core.task",       // ← Required because plm.task extends core.task
    "core.ticket"
  ]
}
```

**Why?** Rubix validates that custom types only extend declared core types. If `plm.task` extends `core.task`, but `core.task` is not in `coreNodeTypes`, the plugin will fail to load:

```
ERROR: manifest validation failed: custom type plm.task references
       undeclared core type: core.task (add to plugin.json coreNodeTypes)
```

#### 2c. Add to `nodes` array

Define how the node appears in the UI:

```json
{
  "nodes": [
    {
      "type": "plm.task",                          // Your custom type
      "displayName": "Task",
      "description": "Product development task or work item",
      "icon": "list-checks",
      "color": "#8b5cf6",
      "category": "manufacturing",
      "propertyPanels": ["node-settings", "tags-references"],
      "constraints": {
        "allowedParents": ["plm.product"]          // What can parent this node
      },
      "autoFields": {
        "identity": ["task", "plm"],               // Auto-add identity tags
        "pluginId": true                           // Auto-set pluginId
      }
    }
  ]
}
```

**IMPORTANT - allowedParents:**
The `allowedParents` constraint must match your actual node hierarchy. Common mistakes:
- ❌ `allowedParents: ["rubix.device"]` but you create nodes under a service
- ❌ `allowedParents: ["rubix.plugin"]` but bootstrap creates under device

**Example hierarchies:**

```
Plugin → Service → Collections → Items:
- rubix.plugin (e.g., plugin_nube.plm)
  └─ plm.service (allowedParents: ["rubix.plugin"])
     └─ plm.products (allowedParents: ["plm.service"])
        └─ plm.product (allowedParents: ["plm.products"])
           └─ plm.task (allowedParents: ["plm.product"])
```

#### 2d. Add to `policy.nodeTypes` (if using hooks)

If your plugin uses hooks, add to policy:

```json
{
  "policy": {
    "nodeTypes": [
      "plm.service",
      "plm.product",
      "plm.task",      // ← Add here if you have hooks
      "plm.manufacturing-unit"
    ],
    "hooks": {
      "enabled": true,
      ...
    }
  }
}
```

---

## Configuration Checklist

Use this checklist to verify your configuration:

### nodes.yaml ✓
- [ ] Custom type defined in `nodeTypes` array
- [ ] `baseType` points to correct core type (e.g., `core.task`)
- [ ] `autoPluginId: true` set
- [ ] `autoIdentity` tags defined
- [ ] Defaults configured
- [ ] Validation rules set (if needed)

### plugin.json ✓
- [ ] Custom type added to `nodeTypes` array
- [ ] Base type added to `coreNodeTypes` array (**CRITICAL**)
- [ ] Node defined in `nodes` array
- [ ] `allowedParents` matches actual hierarchy
- [ ] `autoFields.pluginId: true` set
- [ ] `autoFields.identity` matches `nodes.yaml`
- [ ] Added to `policy.nodeTypes` (if using hooks)

---

## Common Mistakes & How to Fix

### 1. Plugin fails to load: "custom type references undeclared core type"

**Error:**
```
manifest validation failed: custom type plm.task references
undeclared core type: core.task (add to plugin.json coreNodeTypes)
```

**Fix:** Add the base type to `coreNodeTypes`:
```json
{
  "coreNodeTypes": ["core.task"]  // Add the core type you're extending
}
```

### 2. Nodes not showing in UI

**Symptoms:**
- Nodes exist in database (verified via API)
- Nodes don't appear in UI tree

**Common causes:**

**A. Wrong parent hierarchy**
```json
// plugin.json - plm.service
"allowedParents": ["rubix.device"]  // ❌ But created under rubix.plugin

// Fix:
"allowedParents": ["rubix.plugin"]  // ✅ Matches actual parent
```

**B. Missing parentRef in database**
Nodes need a `parentRef` to appear in the tree. Bootstrap functions should create this automatically.

**C. Frontend caching**
After changing `plugin.json`, you must:
1. Restart the plugin: `make dev-plugin`
2. Refresh browser (hard refresh: Ctrl+Shift+R)

### 3. Frontend using wrong type

**Symptoms:**
- Backend configured for `plm.task`
- Frontend queries for `core.task`
- No results returned

**Fix:** Update frontend to use custom type:

```typescript
// ❌ WRONG
const result = await client.queryNodes({
  filter: `parent.id is "${productId}" and type is "core.task"`
});

// ✅ CORRECT
const result = await client.queryNodes({
  filter: `parent.id is "${productId}" and type is "plm.task"`
});
```

```typescript
// ❌ WRONG
await client.createNode({
  type: 'core.task',
  ...
});

// ✅ CORRECT
await client.createNode({
  type: 'plm.task',
  ...
});
```

---

## Understanding Parent Relationships

Parent references work differently depending on whether you're **creating**, **querying**, or **reading** nodes:

### When Creating Nodes

Use `parentRef` (NOT `parentId`):

```typescript
// ✅ CORRECT
await client.createNode({
  type: 'plm.ticket',
  name: 'Fix bug',
  parentRef: taskId,  // ← Use parentRef
  settings: { ... }
});

// ❌ WRONG - will create orphaned node!
await client.createNode({
  type: 'plm.ticket',
  name: 'Fix bug',
  parentId: taskId,  // ← Don't use parentId
  settings: { ... }
});
```

### When Querying Nodes

Use `parent.id` or shorthand `p.id` in filters:

```typescript
// ✅ CORRECT - Full syntax
const tickets = await client.queryNodes({
  filter: `type is "plm.ticket" and parent.id is "${taskId}"`
});

// ✅ CORRECT - Shorthand syntax
const tickets = await client.queryNodes({
  filter: `type is "plm.ticket" and p.id is "${taskId}"`
});

// ✅ CORRECT - Query by parent type
const tickets = await client.queryNodes({
  filter: `type is "plm.ticket" and parent.type is "plm.task"`
});

// ✅ CORRECT - Multi-level query
const tickets = await client.queryNodes({
  filter: `type is "plm.ticket" and parent.parent.id is "${productId}"`
});
```

### When Reading Node Responses

The response includes `parentId` field:

```typescript
const node = await client.getNode(nodeId);

console.log(node.parentId);  // ← Response has parentId
// "parent_abc123"
```

### Summary

| Operation | Field Name | Example |
|-----------|-----------|---------|
| **Create** | `parentRef` | `createNode({ parentRef: 'xyz' })` |
| **Query** | `parent.id` or `p.id` | `filter: "p.id is 'xyz'"` |
| **Read Response** | `parentId` | `node.parentId` |

**Remember:**
- CREATE with `parentRef`
- QUERY with `parent.id` or `p.id`
- RESPONSE has `parentId`

---

## Complete Example: plm.task

### config/nodes.yaml
```yaml
nodeTypes:
  - type: plm.task
    baseType: core.task
    displayName: Task
    description: Product development task or work item
    autoPluginId: true
    autoIdentity: [task, plm]

    defaults:
      status: "pending"
      priority: "Medium"

    validation:
      required: []
      rules:
        status:
          enum: [pending, in-progress, completed, cancelled]
          message: "Invalid status"
        priority:
          enum: [Low, Medium, High]
          message: "Invalid priority"

    uiHints:
      icon: list-checks
      color: "#8b5cf6"
```

### plugin.json
```json
{
  "id": "nube.plm",
  "nodeTypes": [
    "plm.service",
    "plm.product",
    "plm.task"
  ],
  "coreNodeTypes": [
    "core.product",
    "core.service",
    "core.task"
  ],
  "policy": {
    "nodeTypes": [
      "plm.service",
      "plm.product",
      "plm.task"
    ]
  },
  "nodes": [
    {
      "type": "plm.task",
      "displayName": "Task",
      "description": "Product development task or work item",
      "icon": "list-checks",
      "color": "#8b5cf6",
      "category": "manufacturing",
      "propertyPanels": ["node-settings", "tags-references"],
      "constraints": {
        "allowedParents": ["plm.product"]
      },
      "autoFields": {
        "identity": ["task", "plm"],
        "pluginId": true
      }
    }
  ]
}
```

### Frontend usage
```typescript
// Query for tasks
const tasks = await client.queryNodes({
  filter: `parent.id is "${productId}" and type is "plm.task"`
});

// Create task
await client.createNode({
  type: 'plm.task',
  name: 'Fix bug',
  parentRef: productId,  // ✅ Use parentRef, NOT parentId
  settings: {
    status: 'pending',
    priority: 'High'
  }
});
```

---

## Verification Steps

After configuration, verify your setup:

### 1. Plugin loads successfully
```bash
make dev-plugin
```

Check logs for:
```
✅ loaded node profiles
✅ Plugin nube.plm initialized successfully
```

NOT:
```
❌ node config loading failed — plugin init aborted
ERROR: manifest validation failed
```

### 2. API returns node type
```bash
curl "http://localhost:9000/api/v1/orgs/test/devices/$DEVICE_ID/nodes?type=plm.task" \
  -H "Authorization: Bearer $TOKEN"
```

Should return your nodes.

### 3. Create test node
```bash
curl -X POST "http://localhost:9000/api/v1/orgs/test/devices/$DEVICE_ID/nodes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "plm.task",
    "name": "Test Task",
    "parentRef": "parent_node_id",
    "settings": {
      "status": "pending"
    }
  }'
```

Should return created node with:
- `type: "plm.task"`
- `pluginId: "plm"`
- `identity: ["task", "plm"]`

### 4. UI displays node
- Refresh browser (hard refresh)
- Check node tree
- Node should appear under correct parent

---

## Reference: Custom Type vs Profile

| | Custom Type | Profile |
|---|---|---|
| **Config** | nodes.yaml `nodeTypes` | nodes.yaml `nodeProfiles` |
| **Type ID** | `plm.task` | `core.task` |
| **plugin.json nodeTypes** | ✅ Listed | ❌ Not listed |
| **plugin.json coreNodeTypes** | ✅ Base type listed | ✅ Core type listed |
| **plugin.json nodes array** | `"type": "plm.task"` | `"type": "core.task", "profile": "..."` |
| **Frontend queries** | `type is "plm.task"` | `type is "core.task"` |
| **Ownership** | Plugin owns type | Core owns type |

---

## Using Core Nodes Without Profiles

Sometimes you don't need to customize a core node type at all - you just want to use it as-is. A great example is the **comments pattern** using `core.note`.

### Example: Comments Using core.note

The PLM plugin uses `core.note` nodes to store comments for tasks and tickets **without creating a profile or custom type**:

**1. Declare core.note in plugin.json**

```json
{
  "coreNodeTypes": [
    "core.note",     // ← Just declare you're using it
    "core.task",
    "core.ticket"
  ]
}
```

**2. Create note nodes from frontend**

```typescript
// Create a hidden note child to store comments
const noteNode = await client.createNode({
  type: 'core.note',           // ← Use core type directly
  name: '_comments',
  parentRef: taskId,
  settings: {
    hidden: true,
    noteType: 'comments'
  }
});

// Execute commands on the note node
await executePostCommand(client, noteNode.id, 'addComment', {
  text: 'This is a comment'
});
```

**Why this works:**
- ✅ `core.note` already has `addComment`, `listComments`, `deleteComment` commands
- ✅ No backend Go code needed in your plugin
- ✅ No profile configuration needed
- ✅ Just declare the core type and use it

**See full example:** `/home/user/code/go/nube/rubix-sdk/docs/sessions/comments.md`

### When to Use Core Nodes Directly

Use a core node directly (without profile or custom type) when:
- The core node already has the commands/behavior you need
- You don't need custom defaults or validation
- You want to minimize configuration
- You're using it for internal/hidden functionality (like `_comments`)

Common examples:
- `core.note` - For comments, notes, logs
- `core.folder` - For organizing child nodes
- `core.document` - For storing files/attachments
- `core.entry` - For time logs, activity feeds

## See Also

- [Node Profiles Guide](/home/user/code/go/nube/rubix/docs/system/v1/plugins/NODE-PROFILES.md) - Complete node profiles documentation
- [Plugin Backend](/home/user/code/go/nube/rubix/docs/system/v1/plugins/BACKEND.md) - Implementing node types
- [Creating Nodes](/home/user/code/go/nube/rubix/docs/system/v1/nodes/CREATING-NODES.md) - Node creation API
- [Comments Implementation](/home/user/code/go/nube/rubix-sdk/docs/sessions/comments.md) - Example of using core.note for comments
