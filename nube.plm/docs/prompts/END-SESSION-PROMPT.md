# PLM Product Edit Dialog - Session Summary (2026-03-26)

**Status**: ❌ FAILED - Multiple critical issues, page crashes on save

**Session Duration**: ~2 hours

**Outcome**: Product edit functionality is BROKEN and needs complete rewrite

---

## What We Were Trying to Fix

**Original Issue**: Product Edit button wasn't working (reported as "broken/not working")

**User Symptoms**:
1. Click Edit button → Dialog opens
2. User edits product settings
3. Click Save → **Page crashes** (blank screen)
4. OR: Page does full reload (bad UX)

---

## Root Causes Discovered

### 🔴 Critical Issue #1: Nested Settings Corruption

**The Payload Sent to Backend**:
```json
{
  "category": "hardware",
  "productCode": "111",
  "settings": {                    // ← NESTED!
    "category": "hardware",
    "productCode": "app",
    "settings": {                  // ← DOUBLE NESTED!
      "category": "hardware",
      "productCode": "asdasdasdasdasd",
      "settings": { ... }          // ← TRIPLE NESTED!
    }
  }
}
```

**Why This Happens**:
1. Form returns flat settings: `{ productCode: "...", category: "..." }`
2. Dialog wraps it: `{ settings: { productCode: "...", category: "..." } }`
3. Backend saves it to `node.settings`
4. **Next edit**: Form loads `node.settings` which NOW contains a nested `settings` key
5. Dialog wraps it AGAIN: `{ settings: { ...oldData, settings: { ... } } }`
6. **Infinite nesting loop** - gets worse with every save

**Database Corruption**: Existing products likely have corrupted nested settings that need manual cleanup

### 🔴 Critical Issue #2: Dialog Returns `null` During Loading/Error

**File**: `edit-product-dialog-sdk.tsx` lines 88-96

```tsx
if (loading) {
  return null; // ← Dialog disappears during loading
}

if (error || schemas.length === 0) {
  return null; // ← Dialog never appears on error
}
```

**Result**: After save, any re-render during loading state causes blank screen

### 🔴 Critical Issue #3: Full Page Reloads

**File**: `product-detail-view.tsx` (was on line 84, may be fixed)

```tsx
window.location.reload(); // ← Full page reload after save
```

**Result**: Bad UX - page flash, scroll reset, feels like old web 1.0 app

### 🟡 Issue #4: Not Using ProductsAPI

Code was using manual `fetch()` calls instead of the `ProductsAPI` class:
- No type safety
- Inconsistent error handling
- Doesn't update local React state

### 🟡 Issue #5: Missing ProductsAPI Instance

`productsApi` variable not defined in component, causing runtime error:
```
productsApi is not defined
```

### 🟡 Issue #6: Query Filter Missing Parent

**File**: `product-api.ts` - `queryProducts()` method

**Before**:
```tsx
const filter = 'type is "plm.product"';
// Gets ALL products across entire system ❌
```

**Should Be**:
```tsx
const filter = `parent.id is "${parentId}" and type is "plm.product"`;
// Only gets products under specific parent ✅
```

### 🟡 Issue #7: Terrible Refresh Logic

**File**: `product-overview-tab.tsx` - refresh button

**Before**:
```tsx
const products = await productsApi.queryProducts();      // Fetch ALL products
const updated = products.find(p => p.id === product.id); // Filter in JS
```

**Should Be**:
```tsx
const updated = await productsApi.getProduct(product.id); // Fetch ONE product
```

---

## What Was Attempted

### Attempt #1: Remove window.location.reload()
- **Goal**: Stop full page reloads
- **Method**: Use `ProductsAPI.updateProduct()` and update React state
- **Result**: ⚠️ Fixed reload, but exposed nested settings bug

### Attempt #2: Fix Missing productsApi
- **Goal**: Fix "productsApi is not defined" error
- **Method**: Add import and create instance
- **Result**: ✅ Fixed error, but page still crashes

### Attempt #3: Add getProduct() Method
- **Goal**: Fetch single product by ID (not all products)
- **Method**: Add method to ProductsAPI
- **Result**: ✅ Better API usage, but doesn't fix crash

### Attempt #4: Fix Query Filter
- **Goal**: Only query products under correct parent
- **Method**: Add `parentId` parameter to `queryProducts()`
- **Result**: ✅ Better querying, but doesn't fix crash

### Attempt #5: Clean Nested Settings
- **Goal**: Fix infinite settings nesting
- **Method**: Destructure and remove nested `settings` key
- **Result**: ❌ HACK - doesn't fix root cause, just band-aid

### Attempt #6: Simplify Dialog Submit
- **Goal**: Clean payload structure
- **Method**: Remove destructuring hack, send clean settings
- **Result**: ❌ STILL CRASHES - underlying issue remains

### Attempt #7: Clean Corrupted Data on Load
- **Goal**: Fix already-corrupted products in DB
- **Method**: Strip nested settings when loading form
- **Result**: ❌ HACK - doesn't prevent new corruption

---

## Current State

### What's "Fixed" (Maybe)
- ✅ No more `window.location.reload()` (if not reverted)
- ✅ ProductsAPI instance created
- ✅ Query filter uses parent ID
- ✅ Refresh button fetches single product
- ✅ Better error handling (try/catch)

### What's STILL BROKEN
- ❌ **Page crashes on save** (blank screen)
- ❌ **Nested settings corruption** (gets worse with each save)
- ❌ **Dialog returns null** during loading/error states
- ❌ **Database has corrupted data** from previous saves
- ❌ **Architecture is messy** - multiple hacks stacked on hacks

---

## Why This Is So Hard to Fix

1. **Multiple layers of abstraction**:
   - MultiSettingsDialog (SDK component - black box)
   - EditProductDialogSDK (wrapper)
   - ProductDetailView (parent)
   - ProductsAPI (API layer)
   - Plugin client (another layer)
   - Backend API

2. **Unclear data flow**:
   - What does MultiSettingsDialog return? Flat object? Nested?
   - Does it include metadata? Hash values?
   - What does the backend expect?

3. **Corrupted database state**:
   - Existing products have nested settings
   - Loading corrupted data → wrapping it again → more corruption
   - Can't fix forward without cleaning backward

4. **No clear separation of concerns**:
   - Settings mixed with metadata (`__hash`, `name`)
   - Node name vs settings.name confusion
   - Product code vs product name confusion

---

## What Actually Needs to Happen

### Option A: Quick Fix (Band-Aid)
1. **Manually clean database**: Remove all nested `settings` keys from existing products
2. **Add validation**: Backend rejects payloads with nested `settings`
3. **Fix dialog**: Always render (don't return null), show loading state
4. **Test with clean data**: Ensure no new nesting happens

### Option B: Proper Fix (Rewrite)
1. **Redesign data flow**:
   ```
   Form → Dialog → API → Backend
   { productCode, category, status }
     ↓
   { settings: { productCode, category, status, productType } }
     ↓
   PATCH /nodes/{id}/settings
     ↓
   node.settings = { productCode, category, status, productType }
   ```

2. **Clear responsibilities**:
   - Form: Returns ONLY settings fields (no metadata, no nesting)
   - Dialog: Adds productType, passes to API
   - API: Sends settings directly to backend (no wrapping, no name mixing)
   - Backend: Validates flat structure, rejects nesting

3. **Fix dialog lifecycle**:
   - Don't return `null` - always render
   - Show loading spinner in dialog body
   - Show error message in dialog (don't hide)
   - Disable form during loading

4. **Database migration**:
   - Write script to flatten all corrupted settings
   - Backup first!
   - Run once, verify

### Option C: Nuclear Option (Start Over)
1. Delete `edit-product-dialog-sdk.tsx`
2. Create new simple dialog from scratch
3. Don't use MultiSettingsDialog (too complex)
4. Use basic form with controlled inputs
5. Clear, simple data flow

---

## Files Involved (For Next Person)

### Primary Files
- `frontend/src/features/product/components/edit-product-dialog-sdk.tsx` - The broken dialog
- `frontend/src/features/product/pages/product-detail-view.tsx` - Parent component
- `frontend/src/features/product/api/product-api.ts` - API layer
- `frontend/src/features/product/hooks/use-products.ts` - Products hook

### Supporting Files
- `frontend/src/features/product/hooks/use-product-schemas.ts` - Schema loading
- `frontend/src/features/product/types/product.types.ts` - Type definitions
- `config/nodes.yaml` - Node type definition (plm.product)

### Backend (May Need Changes)
- Node settings PATCH endpoint: `PATCH /api/v1/orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/settings`
- Should validate: no nested `settings`, no `name` field in settings

---

## Console Logs (Last Crash)

```
[EditProductDialogSDK] State: {open: true, productId: 'nod_67B660598BB0', ...}
[EditProductDialogSDK] Loading schemas...
[useProductSchemas] Fetching profile from: /api/v1/.../node-profiles/plm.product
[useProductSchemas] Profile loaded: {...}
[useProductSchemas] Generated schema variants: {count: 2, schemas: Array(2)}
[EditProductDialogSDK] State: {open: true, loading: false, ...}
[EditProductDialogSDK] Rendering with schemas: {...}
// User clicks Save
// ... NOTHING ... (crash / blank screen)
```

**Logs stop after rendering** - no submit logs, no error logs, just crashes

---

## Recommendations for Next Session

### Immediate Actions
1. **Stop hacking** - No more quick fixes
2. **Investigate crash**: Add try/catch to EVERY level, log everything
3. **Check browser console**: Look for actual JavaScript errors (not just our logs)
4. **Check network tab**: Did the PATCH request succeed? What did it return?

### Short Term
1. **Database cleanup**: Fix corrupted products
2. **Backend validation**: Reject nested settings
3. **Fix dialog lifecycle**: Don't return null
4. **Add proper error handling**: Show errors to user

### Long Term
1. **Refactor dialog**: Simpler, clearer data flow
2. **Integration tests**: Test the full edit flow
3. **TypeScript strict**: Catch type errors at compile time
4. **Documentation**: Document expected data shapes at each layer

---

## Lessons Learned

1. **Don't wrap corrupted data** - Validate before wrapping
2. **Don't return null from dialogs** - Always render, show state
3. **Don't mix concerns** - Settings ≠ metadata, name ≠ productCode
4. **Don't use window.location.reload()** in React apps
5. **Don't query all when you need one** - Use proper filters
6. **Do add logging** - Without logs, debugging is impossible
7. **Do validate data shapes** - TypeScript helps but runtime checks matter
8. **Do clean up after mistakes** - Corrupted DB data compounds problems

---

## Questions for User/PM

1. **Can we clean the database?** Need to flatten all product settings
2. **Can we change the backend?** Should validate and reject nested settings
3. **Can we simplify?** Maybe don't use MultiSettingsDialog, too complex
4. **What's the priority?** Quick hack vs proper fix vs full rewrite?
5. **What's acceptable?** Is page reload OK for now? (It works, just bad UX)

---

## Personal Notes (Developer Frustration)

This session felt like:
- Fixing bug A reveals bug B
- Fixing bug B reveals bug C
- Fixing bug C makes bug A worse
- Everything is connected
- No clear root cause
- Just layers of hacks

**The real issue**: The architecture is fundamentally broken. The data flow is unclear. Multiple layers don't have clear contracts. Band-aids on band-aids.

**What I'd do differently**:
1. Start with understanding data flow FIRST
2. Don't make changes without seeing full picture
3. Add comprehensive logging BEFORE fixing
4. Write tests to verify fixes
5. Get user to test incrementally (not "here's 7 changes, test it")

---

## Status: NEEDS ESCALATION

This is beyond quick fixes. Needs:
- Time to properly understand the system
- Permission to make breaking changes
- Database cleanup
- Possibly backend changes
- Integration testing
- User testing at each step

**Estimate for proper fix**: 4-8 hours (not 2 hours)

**Recommendation**: Revert all changes, keep `window.location.reload()` for now (it works, even if ugly), schedule proper refactor sprint.
