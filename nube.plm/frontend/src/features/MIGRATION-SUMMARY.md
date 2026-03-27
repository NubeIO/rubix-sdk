# Features Migration Summary

## Date: 2026-03-27

## Overview

Migrated all feature code to use correct settings update patterns following the new Plugin Client SDK guidelines.

## Changes Made

### ❌ Old Pattern (Incorrect)
```typescript
// DON'T DO THIS - updateNode with settings
await client.updateNode(nodeId, {
  name: 'New Name',
  settings: { field: 'value' }
});
```

### ✅ New Pattern (Correct)
```typescript
// Separate name and settings updates
if (input.name) {
  await client.updateNode(nodeId, { name: input.name });
}
// Use updateNodeSettings for settings (uses PATCH endpoint)
if (input.settings) {
  await client.updateNodeSettings(nodeId, input.settings);
}
```

## Why This Change?

1. **Settings PATCH endpoint** (`updateNodeSettings`) performs a **deep merge** - preserves unchanged fields
2. **Re-initializes the node** properly with new settings
3. **Validates against schema** correctly
4. **Triggers correct lifecycle events** in the backend

## Files Updated

### Task Features
- ✅ `/features/task/pages/TasksPage.tsx`
  - Updated `updateTask` to use `updateNodeSettings`

### Product Features
- ✅ `/features/product/pages/ProductsListPage.tsx`
  - Updated `updateProduct` to use `updateNodeSettings`
  - Updated `updateTask` to use `updateNodeSettings`

- ✅ `/features/product/hooks/use-products.ts`
  - Updated `updateProduct` to use `updateNodeSettings`

- ✅ `/features/product/pages/product-detail-view.tsx`
  - Updated `handleProductUpdate` to use `updateNodeSettings`

- ✅ `/features/product/pages/product-overview-tab.tsx`
  - Updated `handleProductUpdate` to use `updateNodeSettings`

- ✅ `/features/product/v2/ProductDetailPageV2.tsx`
  - Updated `updateProduct` to use `updateNodeSettings`

## Total Files Changed: 6

## Testing Checklist

After this migration, test:

- [ ] Creating new products works
- [ ] Updating product name works
- [ ] Updating product settings works
- [ ] Partial settings updates preserve other fields (deep merge)
- [ ] Creating new tasks works
- [ ] Updating task name works
- [ ] Updating task settings works
- [ ] Task settings updates preserve other fields

## Related Documentation

- [Plugin Client README](../../../../frontend-sdk/plugin-client/README.md) - Complete SDK documentation
- [URL Builder](../../../../frontend-sdk/plugin-client/url-builder.ts) - URL builder utilities
- [Examples](../../../../frontend-sdk/plugin-client/examples/) - Real-world usage examples

## Key Takeaways

1. **Never use `updateNode()` for settings** - it doesn't use the correct endpoint
2. **Always use `updateNodeSettings()`** for settings updates - uses PATCH endpoint
3. **Use URL builders** for any manual fetch calls (none found in features directory)
4. **Separate name and settings updates** - they use different endpoints
5. **Settings PATCH = deep merge** - only send changed fields

## Next Steps

If adding new features or updates:

1. ✅ Use `client.updateNode()` for name/metadata ONLY
2. ✅ Use `client.updateNodeSettings()` for settings updates
3. ✅ Import and use URL builders for manual fetch calls:
   ```typescript
   import { urls } from '@rubix-sdk/frontend/plugin-client';
   const url = urls.node.settingsPatch(config, nodeId);
   ```
4. ✅ Check examples in `frontend-sdk/plugin-client/examples/`
