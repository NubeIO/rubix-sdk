# Product Detail View - Overview & BOM Tabs

**Status**: ✅ Implemented
**Date**: 2026-03-24

## Overview

Beautiful, tabbed product detail view with lazy loading and clean UI.

## Features

### ✅ Overview Tab
- **Clean card-based layout** with sections:
  - Basic Information (name, code, category, status)
  - Pricing (price, currency)
  - Hardware Details (SKU, manufacturer, model, weight)
  - Software Details (version, license, platform)
  - System Information (node ID, type)
- **Edit button** - opens schema-driven edit dialog
- **Refresh button** - reload product data
- **Status badges** - color-coded by product lifecycle stage

### ✅ BOM Tab (Hardware Products Only)
- **Component table** with columns:
  - Part # (part number)
  - Description (name + description)
  - Qty (quantity)
  - Unit Price
  - Total (qty × price)
  - Actions (delete button)
- **Add Component** button - creates child node
- **Empty state** - friendly message when no components
- **Total BOM Cost** - calculated from all components
- **Lazy loading** - only fetches when tab is clicked

## Component Structure

```
products/node/
├── product-detail-view.tsx      # Main component with tabs
├── product-overview-tab.tsx     # Overview content
├── product-bom-tab.tsx          # BOM table
└── index.ts                     # Exports
```

## Usage

```tsx
import { ProductDetailView } from '@/products/node';

<ProductDetailView
  product={product}
  orgId="org1"
  deviceId="device1"
  baseUrl="/api/v1"
  token={authToken}
  onProductUpdated={() => refetch()}
/>
```

## URL-Based Tabs

Tabs use URL query parameters for:
- ✅ Shareable links (`?tab=bom`)
- ✅ Browser back/forward navigation
- ✅ Lazy loading (API calls only when tab is active)

**Examples:**
- `/products/prod-123?tab=overview` - Overview tab
- `/products/prod-123?tab=bom` - BOM tab

## Tab Visibility

Tabs are conditional based on product category:

| Category  | Tabs Shown           |
|-----------|---------------------|
| Hardware  | Overview, BOM       |
| Software  | Overview only       |

## API Endpoints Used

- `GET /orgs/{org}/devices/{device}/nodes/{productId}` - Product details
- `GET /orgs/{org}/devices/{device}/nodes/{productId}/children` - BOM items
- `POST /orgs/{org}/devices/{device}/nodes` - Create component
- `DELETE /orgs/{org}/devices/{device}/nodes/{componentId}` - Delete component
- `PATCH /orgs/{org}/devices/{device}/nodes/{productId}` - Update product

## Design System Compliance

✅ **Tabs**: Pill-style with icons (from `TABS.md`)
✅ **Cards**: Sectioned content with clear headers
✅ **Buttons**: Standard primary/outline/ghost variants
✅ **Tables**: Clean rows with hover states
✅ **Empty States**: Friendly icons + messages
✅ **Loading States**: Spinners with descriptive text
✅ **Refresh Button**: Top-right corner with loading state

## Future Enhancements

### Phase 2 (Commented Out in Code)
- Revisions tab (version history)
- Manufacturing tab (assembly instructions)
- Testing tab (test plans and results)

### BOM Improvements
- Inline editing (double-click to edit qty/price)
- Drag-and-drop reordering
- Import from CSV
- Export to PDF/Excel
- Nested assemblies (BOM hierarchy)
- Component search/filter

### Software Products
- Dependencies tab (like BOM for software)
- Licenses tab (license key management)
- Releases tab (version history)

## Integration

To integrate into rubix core, register the detail view for `plm.product` node types:

```tsx
// In node view router
if (node.type === 'plm.product') {
  return <ProductDetailView product={node} ... />;
}
```

## Testing

1. **Create a hardware product** with category="hardware"
2. **Navigate to Overview tab** - verify all fields display correctly
3. **Click BOM tab** - should lazy-load components
4. **Add a component** - should create child node and refresh table
5. **Edit product** - should open dialog and update on save
6. **Check URL** - should show `?tab=overview` or `?tab=bom`

## Notes

- BOM items are currently stored as `core.folder` nodes (can create dedicated `plm.bom-item` type later)
- Total cost calculation is client-side (sum of qty × unitPrice)
- Edit dialog uses MultiSettingsDialog (schema-driven forms)
- Refresh button causes page reload (can optimize with React Query later)
