# Product Detail Page Edit Button - Debug Scope

## Problem

The **Edit** button on the product detail page is broken/not working. Possible page crash.

**Location**: Product detail view → Edit button (top right)

## Expected Behavior

When clicking Edit button:
1. ✅ Dialog opens with current product data pre-filled
2. ✅ User edits fields (name, settings, etc.)
3. ✅ Clicks "Save"
4. ✅ Dialog closes
5. ✅ Product updates **without page reload** (smooth UX)
6. ✅ Updated data displays immediately

## Previous Fix (May Have Issues)

**Last changes** (mentioned by user):
- Uses `ProductsAPI` (same as products table)
- Updates `localProduct` state when edited
- Removed `window.location.reload()`
- Should use `/settings` endpoint (PATCH)

**Quote from previous work:**
> "Perfect! Fixed it. Now the product detail page will update without reloading, just like the products table."

But it's **still broken** - suggesting the fix didn't work or introduced new issues.

## Suspected Issues

### 1. **Page Crash** (Most Likely)
- Dialog might be throwing an error on open/close
- State update might cause re-render crash
- API call might fail silently

### 2. **Hacky Code** (User's Concern)
- Quick fixes that didn't properly integrate
- Missing error handling
- Incomplete state management

### 3. **API Mismatch**
- Wrong endpoint being called
- Incorrect request format
- Token/auth issues

### 4. **State Not Updating**
- `localProduct` not being updated correctly
- Parent component not receiving update
- React state stale closure

## Files to Investigate

### Primary Suspects
1. **`features/product/pages/product-detail-view.tsx`**
   - Edit button handler
   - Dialog state management
   - Product update callback
   - Local state update logic

2. **`features/product/components/edit-product-dialog-sdk.tsx`**
   - Dialog implementation
   - Form submission
   - API call
   - Close handler

3. **`features/product/api/product-api.ts`**
   - `updateProduct()` method
   - Endpoint: Should use `/nodes/{id}/settings` (PATCH)
   - Response handling

### Supporting Files
4. **`features/product/pages/ProductDetailPage.tsx`** (if different from product-detail-view.tsx)
5. **Browser console** - Check for errors/crashes

## Investigation Steps

### Step 1: Check Browser Console
```bash
# Open product detail page
# Click Edit button
# Check console for:
- ❌ Errors (crash)
- ⚠️ Warnings (state updates)
- 🔍 Network calls (API endpoint)
```

### Step 2: Read Edit Button Code
**File**: `product-detail-view.tsx` or `ProductDetailPage.tsx`

**Look for**:
```tsx
// Edit button handler
const handleEdit = async () => {
  // Dialog should open
  setShowEditDialog(true);
}

// Dialog component
<EditProductDialogSDK
  open={showEditDialog}
  onSubmit={handleProductUpdate}  // ← Check this
  onClose={() => setShowEditDialog(false)}
/>
```

**Questions**:
- [ ] Does `handleProductUpdate` exist?
- [ ] Does it call `ProductsAPI.updateProduct()`?
- [ ] Does it update `localProduct` state after success?
- [ ] Is there error handling?

### Step 3: Check Dialog Implementation
**File**: `edit-product-dialog-sdk.tsx`

**Look for**:
```tsx
const handleSubmit = async (settings) => {
  await onSubmit(productId, settings);  // ← Does this work?
  onClose();  // ← Does this crash?
}
```

**Questions**:
- [ ] Is `productId` passed correctly?
- [ ] Is `onSubmit` prop being called?
- [ ] Are there try/catch blocks?
- [ ] Does close handler work?

### Step 4: Verify API Call
**File**: `product-api.ts`

**Check**:
```tsx
async updateProduct(productId: string, input: UpdateProductInput) {
  // Should use PATCH /nodes/{id}/settings
  const node = await this.client.updateNodeSettings(productId, input.settings);
  return node as Product;
}
```

**Questions**:
- [ ] Is endpoint correct? (Should be `/settings` endpoint)
- [ ] Is request body correct?
- [ ] Does it return updated product?

### Step 5: Check State Update
**File**: `product-detail-view.tsx`

**After API success**:
```tsx
const handleProductUpdate = async (productId, input) => {
  // Call API
  const updated = await productsApi.updateProduct(productId, input);

  // Update local state (CRITICAL!)
  setLocalProduct(updated);  // ← Is this line present?

  // Close dialog
  setShowEditDialog(false);

  // NO window.location.reload() ← Should be removed
}
```

**Questions**:
- [ ] Does `setLocalProduct()` get called?
- [ ] Is `updated` the full product object?
- [ ] Is `localProduct` used in the UI?

## Common Issues & Fixes

### Issue 1: Dialog Crashes on Open
**Symptom**: Click Edit → Nothing happens or white screen

**Check**:
- Missing product data prop
- Schema loading error
- Invalid initial values

**Fix**:
```tsx
<EditProductDialogSDK
  product={localProduct}  // ← Must pass product
  // ... other props
/>
```

### Issue 2: Update Doesn't Reflect
**Symptom**: Edit saves, but UI shows old data

**Check**:
- `localProduct` not updated after save
- Using `product` prop instead of `localProduct` state

**Fix**:
```tsx
// Use local state
const [localProduct, setLocalProduct] = useState(product);

// Update after edit
setLocalProduct(updatedProduct);

// Render from local state
<ProductInfo product={localProduct} />  // ← Not {product}
```

### Issue 3: API Error
**Symptom**: Save fails, no feedback

**Check**:
- Wrong endpoint
- Missing token
- Invalid data format

**Fix**:
```tsx
try {
  await productsApi.updateProduct(id, input);
} catch (err) {
  console.error('[ProductDetailView] Update error:', err);
  toast.error('Failed to update product');
  // Don't close dialog on error
  return;
}
```

### Issue 4: Stale Closure
**Symptom**: Callback uses old product data

**Check**:
- `handleProductUpdate` not in dependency array
- Closure over old state

**Fix**:
```tsx
const handleProductUpdate = useCallback(async (id, input) => {
  // ...
}, [productsApi, setLocalProduct]);  // ← Add dependencies
```

## Acceptance Criteria

After fix:
- [ ] Click Edit button → Dialog opens (no crash)
- [ ] Dialog shows current product data pre-filled
- [ ] Edit fields and click Save
- [ ] Dialog closes smoothly
- [ ] Product detail page updates **without reload**
- [ ] Changes visible immediately
- [ ] No console errors
- [ ] Works for all product types (hardware, software, etc.)

## Test Plan

1. **Open product detail page** for any product
2. **Click Edit button**
   - Dialog should open
   - Fields should be pre-filled
3. **Change product name** (e.g., "Test Product" → "Test Product EDITED")
4. **Click Save**
   - Dialog should close
   - Page should NOT reload
   - Product name should update in header
5. **Check browser console**
   - No errors
   - Network tab shows PATCH request to `/settings` endpoint
6. **Verify persistence**
   - Refresh page manually
   - Product should still show "Test Product EDITED"

## Debug Commands

### Check if Dialog Component Exists
```bash
cd /home/user/code/go/nube/rubix-sdk/nube.plm/frontend
grep -r "EditProductDialogSDK" src/features/product/pages/
```

### Check API Endpoint
```bash
grep -A 10 "updateProduct" src/features/product/api/product-api.ts
```

### Check State Management
```bash
grep -B 5 -A 10 "setLocalProduct\|localProduct" src/features/product/pages/product-detail-view.tsx
```

### Test API Directly (curl)
```bash
TOKEN="<your-token>"
DEVICE_ID="dev_E5D053EA49AE"
PRODUCT_ID="<product-id>"

curl -X PATCH "http://localhost:9000/api/v1/orgs/test/devices/${DEVICE_ID}/nodes/${PRODUCT_ID}/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productCode": "TEST-EDIT",
    "category": "hardware",
    "status": "Design"
  }'
```

## Estimated Effort

- **Investigation**: 15-30 min
- **Fix**: 15-45 min (depending on root cause)
- **Testing**: 10 min
- **Total**: 40-85 min

## Priority

🔴 **HIGH** - Core CRUD functionality broken on main product view

## Notes

- User suspects "hacking" = quick fixes that weren't properly integrated
- Previously worked (or claimed to work), so regression likely
- Similar functionality works in products table, so API is probably fine
- Most likely: state management issue or dialog crash
