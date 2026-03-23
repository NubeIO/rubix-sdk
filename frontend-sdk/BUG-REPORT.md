# Bug Report: PluginClient Response Unwrapping

**Date:** 2026-03-22
**Status:** 🔴 CRITICAL - Affects all CRUD operations

---

## Summary

The `PluginClient` does NOT unwrap the `{data, meta}` response wrapper from the Rubix API, causing **all node operations to fail**.

## Root Cause

Rubix API returns ALL responses in this format:
```json
{
  "data": { ... actual node data ... },
  "meta": { "timestamp": "..." }
}
```

But `PluginClient` methods return the **entire response object** instead of just `data`, causing:
- ❌ `node.id` is `undefined` (it's actually at `node.data.id`)
- ❌ `node.name` is `undefined` (it's actually at `node.data.name`)
- ❌ `node.settings` is `undefined` (it's actually at `node.data.settings`)
- ❌ Delete fails with "node not found" because ID is undefined
- ❌ Update fails because ID is undefined
- ❌ All operations break

## Evidence from Integration Tests

### Backend Response (CORRECT):
```json
{
  "data": {
    "id": "nod_6D14AED086A0",
    "type": "core.folder",
    "name": "test-node",
    "position": { "x": 0, "y": 0 },
    "createdAt": "2026-03-22T09:29:47Z",
    "updatedAt": "2026-03-22T09:29:47Z"
  },
  "meta": { "timestamp": "2026-03-22T09:29:47Z" }
}
```

### What PluginClient Returns (WRONG):
```typescript
const node = await client.createNode({ ... });
// node = { data: { id: '...', ... }, meta: { ... } }
//        ^^^^^ Wrong! Should be just the node object

console.log(node.id);        // undefined ❌
console.log(node.data.id);   // 'nod_6D14AED086A0' ✅ (but shouldn't need .data)
```

### Delete Failure:
```
[PluginClient] deleteNode called: {
  nodeId: undefined,  ← Bug! Should be 'nod_6D14AED086A0'
  url: '/orgs/test/devices/dev_25AE33CEF0C0/nodes/undefined'
}
Error: node not found ← Because nodeId is undefined!
```

## Affected Methods

ALL PluginClient methods are affected:

| Method | File | Line | Current | Should Be |
|--------|------|------|---------|-----------|
| `createNode()` | plugin-client/index.ts | ~216 | `return result` | `return result.data` |
| `getNode()` | plugin-client/index.ts | ~173 | `return result` | `return result.data` |
| `updateNode()` | plugin-client/index.ts | ~252 | `return result` | `return result.data` |
| `queryNodes()` | plugin-client/index.ts | ~147 | `return result?.data` | ✅ CORRECT! |
| `listNodes()` | plugin-client/index.ts | ~??? | Needs checking | Needs checking |

**Note:** `queryNodes()` already unwraps correctly! It returns `result?.data`.

## The Fix

### Option A: Fix Each Method (Simple)

```typescript
// createNode
async createNode(input: CreateNodeInput): Promise<Node> {
  const result = await this.client.nodes.create({ ... });
  return result.data as Node;  // ← Add .data
}

// getNode
async getNode(nodeId: string): Promise<Node> {
  const result = await this.client.nodes.get({ ... });
  return result.data as Node;  // ← Add .data
}

// updateNode
async updateNode(nodeId: string, input: UpdateNodeInput): Promise<Node> {
  const result = await this.client.nodes.update({ ... });
  return result.data as Node;  // ← Add .data
}
```

### Option B: Fix RAS Client (Better Long-term)

Make the RAS client auto-unwrap `data` for all methods, so all consumers benefit.

## Impact

### Before Fix:
- ❌ Cannot delete nodes (ID is undefined)
- ❌ Cannot update nodes (ID is undefined)
- ❌ Cannot use node data properly
- ❌ PLM plugin delete broken
- ❌ All plugins using PluginClient broken

### After Fix:
- ✅ All CRUD operations work
- ✅ Node IDs properly accessible
- ✅ Delete works correctly
- ✅ Update works correctly
- ✅ PLM plugin works
- ✅ All plugins work

## Test Results

**Before fix:**
```
Test Files  2 failed
Tests  10 failed | 1 passed | 12 skipped
```

**Expected after fix:**
```
Test Files  2 passed
Tests  23 passed
```

## Recommended Action

1. **Immediate:** Fix `createNode()`, `getNode()`, `updateNode()` in PluginClient
2. **Verify:** Run integration tests (`pnpm test:run`)
3. **Rebuild SDK:** `pnpm build`
4. **Rebuild PLM plugin:** `cd nube.plm/frontend && pnpm build`
5. **Deploy:** `cd nube.plm && bash deploy.sh`
6. **Test in browser:** Verify delete now works

## Related Files

- `/home/user/code/go/nube/rubix-sdk/frontend-sdk/plugin-client/index.ts`
- `/home/user/code/go/nube/rubix-sdk/frontend-sdk/tests/node-crud.test.ts`
- `/home/user/code/go/nube/rubix-sdk/nube.plm/frontend/src/products/common/api.ts`

---

**Next Steps:** Apply the fix and run tests to verify ✅
