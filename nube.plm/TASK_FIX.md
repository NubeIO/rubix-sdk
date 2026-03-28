# Fix Task Implementation - Use plm.task (Same as plm.product)

## Current Status

✅ **nodes.yaml** - plm.task is CORRECT (lines 108-130)
```yaml
  - type: plm.task
    baseType: core.task
    displayName: Task
    autoPluginId: true
    autoIdentity: [task, plm]
    defaults:
      status: "pending"
      priority: "Medium"
```

✅ **plugin.json** - plm.task is CORRECT
- ✅ In `nodeTypes` array (line 12)
- ✅ In `policy.nodeTypes` array (line 42)
- ✅ In `nodes` array with `"type": "plm.task"` (no profile)

❌ **Frontend Code** - Still uses `'core.task'` - NEEDS FIX

---

## What Needs to Change

### 1. TaskDialog.tsx
**File:** `nube.plm/frontend/src/features/product/v2/components/TaskDialog.tsx`

**Line ~58:** Change from:
```typescript
const schemasList = await listNodeTypeSchemas(client, 'core.task');
```
To:
```typescript
const schemasList = await listNodeTypeSchemas(client, 'plm.task');
```

**Line ~65:** Change from:
```typescript
fetchedSchema = await getNodeTypeSchema(client, 'core.task', defaultSchema.name);
```
To:
```typescript
fetchedSchema = await getNodeTypeSchema(client, 'plm.task', defaultSchema.name);
```

**Line ~94:** Change from:
```typescript
await client.createNode({
  type: 'core.task',
  ...
});
```
To:
```typescript
await client.createNode({
  type: 'plm.task',
  ...
});
```

---

### 2. TasksSectionV2.tsx
**File:** `nube.plm/frontend/src/features/product/v2/sections/TasksSectionV2.tsx`

**Line ~42:** Change from:
```typescript
filter: `parent.id is "${product.id}" and type is "core.task"`,
```
To:
```typescript
filter: `parent.id is "${product.id}" and type is "plm.task"`,
```

---

## Summary

**Pattern:** plm.task follows the EXACT same pattern as plm.product

| | plm.product | plm.task |
|---|---|---|
| **Type in code** | `'plm.product'` | `'plm.task'` ✅ |
| **nodes.yaml** | Custom type | Custom type ✅ |
| **plugin.json nodeTypes** | Listed | Listed ✅ |
| **plugin.json nodes array** | `"type": "plm.product"` | `"type": "plm.task"` ✅ |
| **Frontend** | Uses `'plm.product'` | Should use `'plm.task'` ❌ |

**Total Changes Needed:** 4 lines in 2 files (all change `'core.task'` → `'plm.task'`)
