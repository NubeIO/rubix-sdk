# Product Domain

This directory contains all code related to the **Product** domain, organized using a feature-based architecture.

**Date Refactored**: 2026-03-28
**Status**: ✅ Production Ready - V2 Architecture

---

## 📁 Directory Structure

```
product/
├── api/                          # API layer
│   ├── product-api.ts           # ProductsAPI class (CRUD operations)
│   └── index.ts                 # Exports
├── hooks/                        # React hooks
│   ├── use-products.ts          # Multiple products hook
│   ├── use-product-schemas.ts   # Schema fetching hook
│   └── index.ts                 # Exports
├── types/                        # TypeScript types
│   ├── product.types.ts         # Product interfaces
│   └── index.ts                 # Exports
├── components/                   # Reusable components
│   ├── ProductTable.tsx         # Product table component
│   ├── ProductForm.tsx          # Product form fields
│   ├── ProductStatusBadge.tsx   # Status badge
│   ├── create-product-dialog-sdk.tsx  # Create dialog
│   ├── edit-product-dialog-sdk.tsx    # Edit dialog
│   ├── delete-product-dialog-sdk.tsx  # Delete dialog
│   └── index.ts                 # Exports
├── pages/                        # Full-page views
│   ├── ProductsListPage.tsx     # Main products list (tabbed)
│   ├── ProductDetailPageV2Entry.tsx # Product detail V2 (MF entry)
│   ├── products-page-tabs.tsx   # Page tabs component
│   ├── products-page-dialogs.tsx # Page dialogs
│   └── use-products-page-state.ts # Page state hook
├── v2/                           # V2 Product Detail Page
│   ├── ProductDetailPageV2.tsx  # Main V2 detail page
│   ├── components/              # V2-specific components
│   │   ├── ProductHeader.tsx    # Product header
│   │   ├── SidebarNavigation.tsx # Sidebar navigation
│   │   ├── StatCard.tsx         # Statistics card
│   │   └── AddBOMItemDialog.tsx # BOM item dialog
│   ├── sections/                # V2 page sections
│   │   ├── OverviewSection.tsx  # Overview section
│   │   ├── BasicInfoSection.tsx # Basic info section
│   │   ├── PricingSection.tsx   # Pricing section
│   │   ├── SystemInfoSection.tsx # System info section
│   │   ├── BOMSectionV2.tsx     # BOM section
│   │   └── TasksSectionV2.tsx   # Tasks section
│   └── widgets/                 # V2 widgets
│       ├── QuickActions.tsx     # Quick actions widget
│       └── RecentTasks.tsx      # Recent tasks widget
├── widgets/                      # Dashboard widgets
│   └── ProductTableWidget.tsx   # Product table widget
├── utils/                        # Utility functions
│   └── product-formatters.ts    # Formatting utilities
└── README.md                     # This file
```

---

## 🎯 Design Principles

### 1. **Domain-Driven Organization**
- All product-related code lives in `product/`
- Clear separation by concern (api, hooks, types, components, pages)
- Self-contained and independent

### 2. **Path Aliases**
Use clean imports via TypeScript path aliases:

```typescript
// ✅ Good
import { Product } from '@features/product/types/product.types';
import { ProductsAPI } from '@features/product/api/product-api';
import { useProducts } from '@features/product/hooks/use-products';

// ❌ Bad
import { Product } from '../../../product/types/product.types';
```

### 3. **Scalability**
This structure scales to 100s of files without confusion:
- Easy to find files (product API? → `product/api/`)
- No mixing of concerns
- Clear ownership boundaries

---

## 📝 Key Files

### API Layer (`api/`)

**`product-api.ts`** - ProductsAPI class
- `queryProducts()` - Query all products
- `getProduct(id)` - Get single product
- `createProduct(input)` - Create new product
- `updateProduct(id, input)` - Update product
- `deleteProduct(id)` - Delete product

### Hooks (`hooks/`)

**`use-products.ts`** - Multiple products management
- Fetches product list
- Provides CRUD operations
- Handles hierarchy (products collection ID)
- Auto-refresh support

**`use-product-schemas.ts`** - Schema fetching
- Fetches product settings schemas
- Generates variant schemas (hardware/software)

### Types (`types/`)

**`product.types.ts`** - Core types
- `Product` - Product node interface
- `ProductFormData` - Form data structure
- `ProductStatus` - Status enum
- `CreateProductInput`, `UpdateProductInput` - API payloads

### Components (`components/`)

**Reusable Components:**
- `ProductTable.tsx` - Table with edit/delete actions
- `ProductForm.tsx` - Form fields component
- `ProductStatusBadge.tsx` - Status badge

**Dialogs (SDK Version):**
- `create-product-dialog-sdk.tsx` - Create dialog
- `edit-product-dialog-sdk.tsx` - Edit dialog
- `delete-product-dialog-sdk.tsx` - Delete dialog

### Pages (`pages/`)

**`ProductsListPage.tsx`** - Main entry point
- Full-page tabbed view (All/Software/Hardware)
- Create/Edit/Delete operations
- Module Federation export (`./Page`)

**`ProductDetailPageV2Entry.tsx`** - Product detail V2 entry
- Module Federation mount/unmount wrapper
- Module Federation export (`./ProductDetail`)
- Shows when clicking product node in tree
- Wraps the V2 ProductDetailPageV2 component

### V2 Architecture (`v2/`)

**`ProductDetailPageV2.tsx`** - Modern product detail page
- Sidebar navigation with section switching
- Lazy-loaded sections for performance
- Real-time product updates
- Integrated task and BOM management

**V2 Components:**
- Modern, responsive UI components
- Optimized for performance with lazy loading
- Consistent styling with shadcn/ui

### Widgets (`widgets/`)

**`ProductTableWidget.tsx`** - Dashboard widget
- Embeddable product table
- Module Federation export (`./ProductTableWidget`)

---

## 🚀 Usage Examples

### Import Product Types
```typescript
import { Product, ProductStatus } from '@features/product/types/product.types';

const product: Product = {
  id: 'node_001',
  name: 'Widget Pro',
  type: 'plm.product',
  settings: {
    productCode: 'WP-001',
    status: 'Production',
    price: 99.99
  }
};
```

### Use Products Hook
```typescript
import { useProducts } from '@features/product/hooks/use-products';

function MyComponent() {
  const { products, loading, createProduct, updateProduct } = useProducts({
    orgId: 'org_001',
    deviceId: 'dev_001',
    baseUrl: '/api/v1',
    autoRefresh: true,
    refreshInterval: 30000
  });

  // Use products...
}
```

### Use API Directly
```typescript
import { ProductsAPI } from '@features/product/api/product-api';

const api = new ProductsAPI({
  orgId: 'org_001',
  deviceId: 'dev_001',
  baseUrl: '/api/v1',
  token: 'auth_token'
});

const products = await api.queryProducts();
```

---

## 🔄 Module Federation Exports

The following components are exposed via Module Federation:

| Export Name          | File                              | Usage                          |
|---------------------|-----------------------------------|--------------------------------|
| `./Page`            | `pages/ProductsListPage.tsx`      | Main products list page        |
| `./ProductDetail`   | `pages/ProductDetailPage.tsx`     | Single product detail page     |
| `./ProductTableWidget` | `widgets/ProductTableWidget.tsx` | Dashboard widget              |

---

## 🏗️ Future Domains

When adding new domains (e.g., production-run, work-item, site), **copy this structure**:

```
production-run/
├── api/
├── hooks/
├── types/
├── components/
├── pages/
├── widgets/
└── utils/
```

Each domain is self-contained and follows the same pattern.

---

## 📊 Migration Notes

### Before (Old Structure)
```
products/
├── common/          # ❌ Mixed types, API, hooks, utils
├── components/      # ❌ Unclear which components
├── page/           # ❌ Singular or plural?
├── node/           # ❌ What is this?
├── dialogs/        # ❌ Separate from components
└── widget/         # ❌ Separate from everything
```

### After (New Structure) ✅
```
product/            # Singular, clear domain
├── api/            # API layer
├── hooks/          # React hooks
├── types/          # TypeScript types
├── components/     # All reusable components
├── pages/          # Full-page views
├── widgets/        # Dashboard widgets
└── utils/          # Utilities
```

**Benefits:**
- ✅ Clear boundaries
- ✅ Easy to find files
- ✅ Scales to 100s of files
- ✅ Consistent structure
- ✅ Self-documenting

---

## ✅ Checklist for New Features

When adding new product features:

- [ ] Types → `types/product.types.ts`
- [ ] API → `api/product-api.ts`
- [ ] Hooks → `hooks/use-*.ts`
- [ ] Components → `components/*.tsx`
- [ ] Pages → `pages/*.tsx` (if full-page)
- [ ] Widgets → `widgets/*.tsx` (if dashboard widget)
- [ ] Utils → `utils/*.ts` (if shared utilities)
- [ ] Update index.ts exports
- [ ] Use `@features/product/*` path aliases
- [ ] Test build with `npm run build`

---

## 🐛 Troubleshooting

### Build fails with "Cannot resolve..."
- Check that path aliases are configured in `tsconfig.json` and `vite.config.ts`
- Ensure imports use `@features/product/*` not relative paths

### Module Federation not loading
- Verify `vite.config.ts` exposes are correct
- Check `plugin.json` page definitions
- Ensure build succeeded (`npm run build`)

### Type errors
- Run `npx tsc --noEmit` to check TypeScript errors
- Ensure all exports are in index.ts files

---

**Questions?** See the [REFACTOR_SCOPE.md](/home/user/code/go/nube/rubix-sdk/nube.plm/REFACTOR_SCOPE.md) for the original refactor plan.
