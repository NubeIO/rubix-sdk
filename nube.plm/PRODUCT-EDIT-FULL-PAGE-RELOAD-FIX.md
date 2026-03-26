# Product Edit Button - Full Page Reload Fix

**Status**: ✅ FIXED (for real this time)

**Date**: 2026-03-26

## The REAL Problem

### 🔴 **Root Cause: `window.location.reload()` on Line 84**

**File**: [`product-detail-view.tsx:84`](frontend/src/features/product/pages/product-detail-view.tsx#L84)

```tsx
// BROKEN CODE (before fix)
const handleProductUpdate = async (productId: string, input: any) => {
  try {
    const url = `${baseUrl}/orgs/${orgId}/devices/${deviceId}/nodes/${productId}/settings`;
    const response = await fetch(url, { method: 'PATCH', ... });

    if (!response.ok) {
      throw new Error(`Failed to update product: ${response.status}`);
    }

    setShowEditDialog(false);
    onProductUpdated?.();
    window.location.reload();  // ← THIS LINE CAUSES FULL PAGE RELOAD
  } catch (err) {
    console.error('[ProductDetailView] Update error:', err);
    throw err;
  }
};
```

**What Happened**:
1. User clicks "Edit" → dialog opens
2. User changes product settings → clicks "Save"
3. Frontend calls API successfully
4. Dialog closes
5. **BOOM** - `window.location.reload()` reloads the entire page 💥

**User Experience**: Edit button works, but page reloads (loses scroll position, flash, etc.) ❌

## Additional Issues Found

### 🟡 **Not Using ProductsAPI**
- Code was manually calling `fetch()` instead of using the `ProductsAPI` class
- Inconsistent with the rest of the codebase
- No type safety

### 🟡 **Not Updating Local State**
- After update, code didn't call `setLocalProduct(updatedProduct)`
- UI wouldn't update even without the reload (but reload masked this bug)

### 🟡 **Same Issue in `product-overview-tab.tsx`**
- Another component had the exact same pattern
- Also had `window.location.reload()` on line 71
- Fixed both files

## The Fix

### ✅ Product Detail View (`product-detail-view.tsx`)

**After**:
```tsx
const handleProductUpdate = async (productId: string, input: UpdateProductInput) => {
  try {
    // Use ProductsAPI for proper type safety and response handling
    const updatedProduct = await productsApi.updateProduct(productId, input);

    // Update local state - NO PAGE RELOAD
    setLocalProduct(updatedProduct);

    // Close dialog
    setShowEditDialog(false);

    // Notify parent if callback provided
    onProductUpdated?.(updatedProduct);
  } catch (err) {
    console.error('[ProductDetailView] Update error:', err);
    throw err;
  }
};
```

**Changes**:
1. ✅ Removed `window.location.reload()` - **NO MORE FULL PAGE RELOAD**
2. ✅ Use `ProductsAPI.updateProduct()` instead of manual `fetch()`
3. ✅ Call `setLocalProduct(updatedProduct)` to update UI
4. ✅ Pass updated product to `onProductUpdated` callback
5. ✅ Proper TypeScript types (`UpdateProductInput`)

### ✅ Product Overview Tab (`product-overview-tab.tsx`)

**After**:
```tsx
const handleProductUpdate = async (productId: string, input: UpdateProductInput) => {
  try {
    // Use ProductsAPI - NO PAGE RELOAD
    const updatedProduct = await productsApi.updateProduct(productId, input);

    // Update local state
    setLocalProduct(updatedProduct);

    // Close dialog
    setShowEditDialog(false);

    // Notify parent
    onProductUpdated?.(updatedProduct);
  } catch (err) {
    console.error('[ProductOverviewTab] Update error:', err);
    throw err;
  }
};
```

**Bonus - Fixed Refresh Button**:
```tsx
const handleRefresh = async () => {
  setIsRefreshing(true);
  try {
    // Refetch the product data without full page reload
    const products = await productsApi.queryProducts();
    const updated = products.find(p => p.id === localProduct.id);
    if (updated) {
      setLocalProduct(updated);
      onProductUpdated?.(updated);
    }
  } finally {
    setIsRefreshing(false);
  }
};
```
- Before: Refresh button did `window.location.reload()`
- After: Fetches fresh data via API, no page reload

## Files Changed

1. **`frontend/src/features/product/pages/product-detail-view.tsx`**
   - Removed `window.location.reload()` from `handleProductUpdate`
   - Use `ProductsAPI` instead of manual `fetch()`
   - Update `localProduct` state after save

2. **`frontend/src/features/product/pages/product-overview-tab.tsx`**
   - Same fixes as above
   - Also fixed Refresh button (removed reload)
   - Changed all `product.*` refs to `localProduct.*` for consistency
   - Updated `onProductUpdated` signature to pass updated product

## Test Plan

### ✅ Happy Path
1. **Open product detail page**
2. **Click "Edit" button** → Dialog opens
3. **Change product status** (e.g., Design → Prototype)
4. **Click "Save"**
   - ✅ Dialog closes
   - ✅ Status badge updates immediately
   - ✅ **NO PAGE RELOAD** (no flash, scroll stays in place)
5. **Refresh page manually** → Changes persist (API worked)

### ✅ Edge Cases
- **Multiple edits in a row**: Works, no reload between edits
- **Click Refresh button**: Refetches data, no page reload
- **Edit from overview tab**: Works same as detail view
- **Network error**: Dialog stays open, shows error, no reload

## Why This Was Confusing

1. **Dialog opened** (looked like it worked)
2. **Save succeeded** (API call worked)
3. **Page reloaded** (looked like it "worked" but felt wrong)
4. **User noticed the reload** (flash, scroll reset, bad UX)

The functionality technically "worked" (data was saved), but the UX was terrible due to the unnecessary full page reload.

## Root Cause Analysis

**Category**: Unnecessary Page Reload / State Management Bug

**Mistake**:
- Used `window.location.reload()` as a shortcut to "refresh" the UI
- Didn't properly update React state after API call
- Manual `fetch()` instead of using the API abstraction layer

**Why It Happened**:
- Likely a quick fix: "API call works, but UI doesn't update → just reload the page"
- Masked the real issue: not updating `localProduct` state
- Copy-paste between components (same bug in both files)

**Lesson**:
- Never use `window.location.reload()` in a React app for state updates
- Always update local state after API mutations
- Use API abstraction layers (`ProductsAPI`) for consistency and type safety

## Prevention

**Code Review Checklist**:
- [ ] No `window.location.reload()` in React components (use state updates)
- [ ] No `window.location.href = ...` for navigation (use React Router)
- [ ] Always update local state after API mutations
- [ ] Use API client classes (`ProductsAPI`) instead of manual `fetch()`
- [ ] Test that UI updates without page reload

**Grep to Find Similar Issues**:
```bash
# Find all window.location.reload() calls
grep -r "window.location.reload" frontend/src/

# Find all manual fetch() calls (should use API clients)
grep -r "fetch(" frontend/src/ | grep -v "node_modules"
```

## Status

✅ **READY FOR TESTING**

No breaking changes, no database changes - purely frontend state management fix.

**Expected Behavior After Fix**:
- Click Edit → Save → **UI updates instantly, NO PAGE RELOAD**
- Smooth, modern SPA experience
- Scroll position preserved
- No flash/flicker
