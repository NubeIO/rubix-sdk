# PLM Frontend Refactor & Product Tab Update

**Date**: 2026-03-25
**Status**: Planning
**Priority**: High (Foundation for 100+ future features)

---

## 🎯 Goals

1. **Product Tab Enhancement** - Add node-specific product detail view with tabs
2. **Codebase Restructure** - Prepare for 100s of files (production runs, work items, sites, etc.)
3. **Scalable Architecture** - Feature-based organization instead of component-type-based

---

## 📋 Current Structure (Problems)

```
nube.plm/frontend/src/
├── products/              # ❌ Mixes concerns
│   ├── common/           # Types, hooks, API all mixed
│   ├── components/       # Which components? For what?
│   ├── page/            # Page-level components
│   ├── widget/          # Dashboard widget
│   └── node/            # Node detail view
└── shared/              # Shared utilities
```

**Problems:**
- ❌ Flat `common/` directory will explode to 100s of files
- ❌ Unclear where to put new product features
- ❌ Hard to find files (is it in `components/` or `page/`?)
- ❌ Doesn't scale to multiple domains (production runs, work items, sites)
- ❌ `products/` is plural but also contains product detail (singular) - confusing

---

## ✅ Proposed Structure (Solution)

```
nube.plm/frontend/src/
├── product/                      # Product domain (singular)
│   ├── api/
│   │   ├── product-api.ts       # CRUD operations
│   │   └── product-queries.ts   # Query helpers
│   ├── hooks/
│   │   ├── use-product.ts       # Single product hook
│   │   ├── use-products.ts      # Multiple products hook
│   │   └── use-product-mutations.ts
│   ├── types/
│   │   ├── product.types.ts     # Product interfaces
│   │   └── product-form.types.ts
│   ├── components/              # Reusable product components
│   │   ├── ProductTable.tsx
│   │   ├── ProductForm.tsx
│   │   ├── ProductStatusBadge.tsx
│   │   └── ProductTypeBadge.tsx
│   ├── pages/                   # Full-page views
│   │   ├── ProductsListPage.tsx      # Main products list (tabbed)
│   │   └── ProductDetailPage.tsx     # Single product detail (NEW)
│   ├── widgets/                 # Dashboard widgets
│   │   └── ProductTableWidget.tsx
│   └── utils/
│       └── product-formatters.ts
│
├── production-run/              # Future: Production run domain
│   ├── api/
│   ├── hooks/
│   ├── types/
│   ├── components/
│   ├── pages/
│   └── widgets/
│
├── work-item/                   # Future: Work item domain
├── site/                        # Future: Site domain
├── serialized-unit/            # Future: Serialized unit domain
│
└── shared/                      # Cross-domain shared code
    ├── components/              # Generic components (forms, tables)
    ├── hooks/                   # Generic hooks (use-plm-hierarchy)
    ├── utils/                   # Generic utilities
    └── types/                   # Cross-domain types
```

**Benefits:**
- ✅ Clear domain boundaries (product, production-run, work-item, site)
- ✅ Easy to find files (product API? → `product/api/`)
- ✅ Scales to 100s of files without confusion
- ✅ Each domain is self-contained and independent
- ✅ Parallel development (teams can work on different domains)
- ✅ Consistent structure across all domains

---

## 📝 Phase 1: Product Detail Page (Node-Specific View)

### Current State

**Problem**: Clicking a product node shows generic properties view, not product-specific UI.

**What Exists:**
- ✅ `ProductsListPage.tsx` - Full page with tabbed table (All/Software/Hardware)
- ✅ `ProductTableWidget.tsx` - Dashboard widget
- ❌ No product detail page for individual product node

### What to Build

**ProductDetailPage.tsx** - Tabbed view for individual product

**Tabs:**
1. **Overview** - Product details (name, code, type, status, price)
2. **Specifications** - Custom fields, attributes, metadata
3. **Production** - Linked production runs (future)
4. **Units** - Serialized units produced (future)
5. **History** - Audit log of changes

**Features:**
- Edit button in header (opens edit dialog)
- Delete button (with confirmation)
- Breadcrumb navigation (Products → {ProductName})
- Refresh button per tab
- Real-time updates (when product edited elsewhere)

**Route:**
- Shown when user clicks product node in tree
- Uses plugin page pattern (Module Federation)
- Defined in `plugin.json` pages array

---

## 📝 Phase 2: Codebase Refactor

### Step 1: Create New Structure

**Create directories:**
```bash
mkdir -p nube.plm/frontend/src/product/{api,hooks,types,components,pages,widgets,utils}
```

**Move files systematically:**

#### 1.1 Types
```
products/common/types.ts → product/types/product.types.ts
```

#### 1.2 API
```
products/common/api.ts → product/api/product-api.ts
```

#### 1.3 Hooks
```
products/common/hooks.ts → product/hooks/use-products.ts
```

#### 1.4 Components
```
products/components/product-table.tsx → product/components/ProductTable.tsx
products/components/product-form-fields.tsx → product/components/ProductForm.tsx
products/components/product-status-badge.tsx → product/components/ProductStatusBadge.tsx
```

#### 1.5 Pages
```
products/page/ProductsPage.tsx → product/pages/ProductsListPage.tsx
products/page/products-page-tabs.tsx → product/pages/ProductsListPage/ProductsPageTabs.tsx
products/page/products-page-content.tsx → DELETE (no longer used)
products/page/products-page-dialogs.tsx → product/pages/ProductsListPage/ProductDialogs.tsx
```

#### 1.6 Widgets
```
products/widget/ProductTableWidget.tsx → product/widgets/ProductTableWidget.tsx
```

#### 1.7 Node Views
```
products/node/ProductDetailPage.tsx → product/pages/ProductDetailPage.tsx
```

### Step 2: Update Imports

**Update all import paths** throughout codebase:
```typescript
// ❌ Old
import { Product } from '../common/types';
import { ProductsAPI } from '../common/api';

// ✅ New
import { Product } from '../../types/product.types';
import { ProductsAPI } from '../../api/product-api';
```

**Use path aliases** (add to tsconfig.json):
```json
{
  "compilerOptions": {
    "paths": {
      "@product/*": ["./src/product/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

Then imports become:
```typescript
import { Product } from '@product/types/product.types';
import { ProductsAPI } from '@product/api/product-api';
```

### Step 3: Update plugin.json

**Update page paths:**
```json
{
  "pages": [
    {
      "pageId": "products-list",
      "title": "Products",
      "nodeTypes": ["plm.products"],
      "props": {
        "exposedPath": "./ProductsListPage"  // Update path
      }
    },
    {
      "pageId": "product-detail",
      "title": "Product Detail",
      "nodeTypes": ["plm.product"],
      "props": {
        "exposedPath": "./ProductDetailPage"  // NEW
      }
    }
  ]
}
```

### Step 4: Update vite.config.ts

**Update Module Federation exposes:**
```typescript
exposes: {
  './ProductsListPage': './src/product/pages/ProductsListPage.tsx',
  './ProductDetailPage': './src/product/pages/ProductDetailPage.tsx',
  './Widget': './src/product/widgets/ProductTableWidget.tsx',
}
```

---

## 🎨 Product Detail Page Design

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ ← Products                    Widget Pro      [Edit] [×] │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Overview  Specifications  Production  History   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                     [↻]   │
│                                                           │
│  Overview Tab Content:                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Product Code:  WP-001                           │   │
│  │ Type:          Software                         │   │
│  │ Status:        Production                       │   │
│  │ Price:         $99.99                           │   │
│  │ Description:   Premium widget for...           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Components Needed

1. **ProductDetailPage.tsx** - Main page component
   - Header with breadcrumb
   - Edit/Delete buttons
   - Tabbed interface

2. **ProductOverviewTab.tsx** - Overview tab content
   - Product details in card
   - Key-value pairs
   - Status badges

3. **ProductSpecificationsTab.tsx** - Specifications tab
   - Custom fields editor
   - Metadata viewer
   - Dynamic form based on product schema

4. **ProductHistoryTab.tsx** - History tab (future)
   - Audit log table
   - Show who changed what when

---

## 🔄 Migration Strategy

### Phase 1: Product Detail Page (1-2 days)
1. Create `ProductDetailPage.tsx` in current structure
2. Add to plugin.json pages
3. Test with existing products
4. **Deploy to production** ✅

### Phase 2: Refactor Preparation (0.5 days)
1. Document all current import paths
2. Create new directory structure
3. Set up path aliases in tsconfig.json

### Phase 3: Move Files (1 day)
1. Move files to new locations
2. Update imports systematically
3. Fix TypeScript errors
4. Run tests

### Phase 4: Cleanup (0.5 days)
1. Delete old `products/` directory
2. Update documentation
3. Create structure README for future domains
4. **Deploy to production** ✅

**Total Estimated Time: 3-4 days**

---

## ✅ Success Criteria

### Product Detail Page
- [ ] Clicking product node shows ProductDetailPage
- [ ] Overview tab displays all product details
- [ ] Edit button opens edit dialog
- [ ] Delete button works with confirmation
- [ ] Tabs lazy load content
- [ ] Refresh button per tab works
- [ ] Breadcrumb navigation works

### Codebase Refactor
- [ ] All files in new structure
- [ ] All imports updated and working
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Build succeeds
- [ ] Plugin loads in production
- [ ] Old `products/` directory deleted
- [ ] Documentation updated

---

## 📚 Future Domains (Post-Refactor)

Once product domain is refactored, add these domains using the same pattern:

1. **production-run/** - Manufacturing runs
   - Pages: ProductionRunsListPage, ProductionRunDetailPage
   - Components: ProductionRunTable, RunStatusBadge
   - API: production-run-api.ts

2. **work-item/** - Tasks and work orders
   - Pages: WorkItemsListPage, WorkItemDetailPage
   - Components: WorkItemBoard, TaskCard
   - API: work-item-api.ts

3. **site/** - Manufacturing sites/locations
   - Pages: SitesListPage, SiteDetailPage
   - Components: SiteMap, LocationPicker
   - API: site-api.ts

4. **serialized-unit/** - Individual produced units
   - Pages: UnitsListPage, UnitDetailPage
   - Components: UnitTracker, SerialNumberScanner
   - API: serialized-unit-api.ts

**Each domain follows the same structure** - copy `product/` as template! 🎯

---

## 🚀 Next Steps

1. **Review this scope** with team
2. **Approve structure** before starting
3. **Start with Phase 1** (ProductDetailPage) - ships fast, adds value
4. **Schedule Phase 2-4** (refactor) - foundation for future growth

**Questions? Discuss before proceeding!**
