# Scope: Remove Custom APIs, Use Plugin Client SDK Directly

**Date**: 2026-03-26
**Status**: 🔴 NOT STARTED
**Priority**: HIGH - Blocking production use

---

## Problem

We've been creating custom API wrapper classes (`ProductsAPI`, `TaskAPI`, etc.) that wrap the `plugin-client` SDK. This causes:

1. **Nested Settings Bug** - Double wrapping creates `settings.settings.settings...` infinite nesting
2. **Unnecessary Complexity** - Maintaining duplicate API logic
3. **Type Mismatches** - Custom types don't match SDK responses
4. **Inconsistent Patterns** - Some code uses API classes, some uses SDK directly

**Example of the issue:**
```typescript
// Custom API wraps settings in another settings key
const input: UpdateProductInput = {
  settings: { productCode: "...", category: "..." }
};

// Then plugin-client wraps it AGAIN
await this.client.updateNodeSettings(productId, input.settings);
// Result: { settings: { settings: { productCode: "..." } } }
```

---

## Solution

**DELETE all custom API classes and use `plugin-client` SDK directly**

The SDK already provides everything we need:
- `createNode(input)`
- `updateNode(id, input)`
- `updateNodeSettings(id, settings)` ← Use this
- `deleteNode(id)`
- `getNode(id)`
- `queryNodes(filter)`

---

## Scope of Work

### Phase 1: Audit Current API Usage

**Files to check:**
- `/home/user/code/go/nube/rubix-sdk/nube.plm/frontend/src/features/product/api/`
- `/home/user/code/go/nube/rubix-sdk/nube.plm/frontend/src/features/task/api/`
- `/home/user/code/go/nube/rubix-sdk/nube.plm/frontend/src/features/bom/api/`
- `/home/user/code/go/nube/rubix-sdk/nube.plm/frontend/src/features/release/api/`

**What to find:**
- All places using `ProductsAPI`, `TaskAPI`, `BOMAPI`, etc.
- All places using `plugin-client` directly (keep these!)
- Custom types like `UpdateProductInput`, `CreateProductInput`

### Phase 2: Update All Components to Use SDK Directly

**Pattern to follow:**
```typescript
// ❌ OLD (custom API wrapper)
import { ProductsAPI } from '@features/product/api/product-api';
const api = new ProductsAPI({ orgId, deviceId, baseUrl, token });
await api.updateProduct(id, { settings: {...} });

// ✅ NEW (SDK direct)
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
const client = createPluginClient({ orgId, deviceId, baseUrl, token });
await client.updateNodeSettings(id, { productCode: "...", category: "..." });
```

**Files to update:**
1. `features/product/pages/product-detail-view.tsx` - Remove ProductsAPI
2. `features/product/pages/ProductsListPage.tsx` - Remove ProductsAPI
3. `features/product/widgets/ProductTableWidget.tsx` - Remove ProductsAPI
4. `features/task/pages/TasksListTab.tsx` - Remove TaskAPI
5. `features/bom/components/BOMSection.tsx` - Remove BOMAPI
6. All dialogs (create/edit/delete)

### Phase 3: Delete Custom API Files

**Files to DELETE:**
- `features/product/api/product-api.ts` ← DELETE
- `features/task/api/task-api.ts` ← DELETE
- `features/bom/api/bom-api.ts` ← DELETE (if exists)
- `features/release/api/release-api.ts` ← DELETE (if exists)

**Types to keep (in types files, NOT api files):**
- `Product`, `Task`, `BOMItem`, `Release` types
- Keep in `types/*.types.ts` files

### Phase 4: Update Dialogs

**Simple Edit Dialog Pattern:**
```typescript
// ✅ Correct - pass settings flat, no wrapping
const handleSubmit = async (formData) => {
  await client.updateNodeSettings(product.id, {
    productCode: formData.productCode,
    category: formData.category,
    status: formData.status,
    price: formData.price,
    // No "settings" wrapper!
  });
};
```

**Files to update:**
- `components/edit-product-dialog-simple.tsx` - Already using correct pattern
- `components/create-product-dialog-sdk.tsx` - Fix settings wrapping
- `components/EditTaskDialog.tsx` - Use SDK directly
- `components/CreateBOMItemDialog.tsx` - Use SDK directly

### Phase 5: Fix Existing Corrupted Data

**Backend fix needed:**
- Add migration script to unwrap nested settings in database
- OR add backend validation to reject nested settings
- OR add backend middleware to auto-unwrap on save

**Frontend cleanup:**
- Remove all "unwrapping" logic from components
- Once backend is clean, we shouldn't need to handle corrupted data

---

## Testing Checklist

After refactor, test all CRUD operations:

**Products:**
- [ ] Create product - settings are flat
- [ ] Edit product - settings are flat, no nesting
- [ ] Delete product
- [ ] Query products by parent

**Tasks:**
- [ ] Create task
- [ ] Edit task - settings are flat
- [ ] Delete task
- [ ] Query tasks

**BOM:**
- [ ] Add BOM item
- [ ] Edit BOM item
- [ ] Delete BOM item

**Check Database:**
```sql
-- Should NOT see nested settings
SELECT id, name, settings FROM nodes WHERE type = 'plm.product';
-- settings should be flat: { productCode: "...", category: "..." }
-- NOT: { settings: { settings: { ... } } }
```

---

## Benefits

1. ✅ **No More Nested Settings** - Single source of truth for API calls
2. ✅ **Less Code** - Delete ~500 lines of wrapper code
3. ✅ **Consistent** - All plugins use SDK the same way
4. ✅ **Type Safe** - SDK types match backend responses
5. ✅ **Maintainable** - One place to fix bugs (SDK), not N wrappers

---

## Estimated Effort

- **Phase 1 (Audit)**: 30 minutes
- **Phase 2 (Update components)**: 2 hours
- **Phase 3 (Delete APIs)**: 15 minutes
- **Phase 4 (Fix dialogs)**: 1 hour
- **Phase 5 (Data cleanup)**: 1 hour (if needed)

**Total: 4-5 hours**

---

## Risks

🟡 **MEDIUM** - Touching all CRUD operations could break things

**Mitigation:**
- Do one feature at a time (Products first, then Tasks, etc.)
- Test after each change
- Keep git commits small and focused
- Can rollback easily if issues found

---

## Next Steps

1. Read `/home/user/code/go/nube/rubix-sdk/frontend-sdk/plugin-client` to understand SDK API
2. Start with Products feature (most used)
3. Update simple-edit-dialog to use SDK correctly
4. Test thoroughly
5. Repeat for Tasks, BOM, etc.
6. Delete API wrapper files
7. Clean corrupted data in database

---

## Questions to Answer

1. Does `updateNodeSettings` return the updated node, or do we need to fetch after?
2. Does SDK handle name updates separately from settings updates?
3. What's the SDK method for batch operations (if needed)?
4. Should we keep any helper functions (e.g., `formatPrice`, `formatProductCode`)?

---

## Success Criteria

- [ ] Zero API wrapper classes in codebase
- [ ] All components use `createPluginClient()` directly
- [ ] Database has NO nested settings
- [ ] All CRUD operations work correctly
- [ ] Edit dialog saves without creating nested settings
- [ ] Page doesn't crash or go white
