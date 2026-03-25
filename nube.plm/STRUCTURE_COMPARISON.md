# Structure Comparison: Current vs Proposed

## ❌ Current Structure (Won't Scale)

```
nube.plm/frontend/src/
│
├── products/                           # ⚠️ Problem: Everything mixed together
│   ├── common/                        # ⚠️ Types, API, hooks all in one place
│   │   ├── types.ts                  # Product types
│   │   ├── api.ts                    # Product API
│   │   ├── hooks.ts                  # Product hooks
│   │   └── utils.ts                  # Product utilities
│   │
│   ├── components/                    # ⚠️ Which components? For what page?
│   │   ├── product-table.tsx
│   │   ├── product-form-fields.tsx
│   │   └── product-status-badge.tsx
│   │
│   ├── page/                         # ⚠️ "Page" is vague - which page?
│   │   ├── ProductsPage.tsx
│   │   ├── products-page-tabs.tsx
│   │   ├── products-page-content.tsx
│   │   ├── products-page-dialogs.tsx
│   │   └── use-products-page-state.ts
│   │
│   ├── widget/                       # ✅ OK - clear purpose
│   │   └── ProductTableWidget.tsx
│   │
│   └── node/                         # ✅ OK - clear purpose
│       └── ProductDetailPage.tsx
│
└── shared/                            # ✅ OK
    ├── components/
    ├── hooks/
    └── utils/
```

**Problems When Scaling:**
```
❌ When adding 5 more product pages:
   → Do they go in page/? It's already crowded
   → What about page-specific components?
   → Where do page-specific hooks go?

❌ When adding production-run domain:
   → Create production-runs/? But products/ is plural...
   → Or production-run/? But then inconsistent naming...
   → common/ explodes to 50+ files across domains

❌ When team has 10 developers:
   → Everyone touches products/common/
   → Merge conflicts constantly
   → Hard to split work by feature
```

---

## ✅ Proposed Structure (Scales to 100+ Files)

```
nube.plm/frontend/src/
│
├── product/                          # ✅ Single responsibility: Product domain
│   ├── api/                         # ✅ Clear: Product API operations
│   │   ├── product-api.ts          # CRUD operations
│   │   └── product-queries.ts      # Query builders
│   │
│   ├── hooks/                       # ✅ Clear: Product-specific hooks
│   │   ├── use-product.ts          # Single product
│   │   ├── use-products.ts         # Multiple products
│   │   └── use-product-mutations.ts # Create/update/delete
│   │
│   ├── types/                       # ✅ Clear: Product types
│   │   ├── product.types.ts
│   │   └── product-form.types.ts
│   │
│   ├── components/                  # ✅ Clear: Reusable product components
│   │   ├── ProductTable.tsx
│   │   ├── ProductForm.tsx
│   │   ├── ProductStatusBadge.tsx
│   │   └── ProductTypeBadge.tsx
│   │
│   ├── pages/                       # ✅ Clear: Product pages
│   │   ├── ProductsListPage/       # ✅ Page + sub-components
│   │   │   ├── index.tsx
│   │   │   ├── ProductsPageTabs.tsx
│   │   │   ├── ProductDialogs.tsx
│   │   │   └── use-products-list-state.ts
│   │   │
│   │   └── ProductDetailPage/      # ✅ Page + sub-components
│   │       ├── index.tsx
│   │       ├── ProductOverviewTab.tsx
│   │       ├── ProductSpecsTab.tsx
│   │       └── use-product-detail-state.ts
│   │
│   ├── widgets/                     # ✅ Clear: Dashboard widgets
│   │   └── ProductTableWidget.tsx
│   │
│   └── utils/                       # ✅ Clear: Product utilities
│       └── product-formatters.ts
│
├── production-run/                   # ✅ Future: Same structure
│   ├── api/
│   ├── hooks/
│   ├── types/
│   ├── components/
│   ├── pages/
│   │   ├── ProductionRunsListPage/
│   │   └── ProductionRunDetailPage/
│   ├── widgets/
│   └── utils/
│
├── work-item/                        # ✅ Future: Same structure
│   └── ...same structure...
│
├── site/                             # ✅ Future: Same structure
│   └── ...same structure...
│
└── shared/                           # ✅ Cross-domain code
    ├── components/                   # Generic components
    ├── hooks/                        # Generic hooks
    └── utils/                        # Generic utilities
```

**Benefits When Scaling:**
```
✅ Adding 5 more product pages:
   → Create product/pages/{PageName}/
   → Page-specific components inside page folder
   → Clear structure, easy to find

✅ Adding production-run domain:
   → Copy product/ structure
   → Rename to production-run/
   → Consistent, predictable, independent

✅ Team with 10 developers:
   → Developer A: works on product/
   → Developer B: works on production-run/
   → Developer C: works on work-item/
   → No conflicts, parallel development
```

---

## 📊 File Count Projection

### Current Structure (Breaks at ~50 files)
```
products/common/         ← 20 files (types, API, hooks, utils)
products/components/     ← 15 files (all mixed together)
products/page/          ← 10 files (but which page?)
products/widget/        ← 2 files
products/node/          ← 2 files
------------------
TOTAL: 49 files in products/
```

**Problem:** Add 3 more domains = **196 files** all mixed in flat structure!

### Proposed Structure (Scales to 1000+ files)
```
product/
├── api/           ← 5 files
├── hooks/         ← 8 files
├── types/         ← 3 files
├── components/    ← 10 files
├── pages/         ← 15 files (nested in page folders)
├── widgets/       ← 2 files
└── utils/         ← 3 files
TOTAL: 46 files, but organized!

production-run/    ← 45 files (same structure)
work-item/         ← 40 files (same structure)
site/              ← 35 files (same structure)
serialized-unit/   ← 38 files (same structure)
------------------
TOTAL: 204 files, perfectly organized by domain! ✅
```

---

## 🎯 Key Principle: Feature-Based > Type-Based

### ❌ Type-Based (Current)
```
Group by: Component type (components, hooks, types)
Problem: Mixed concerns, unclear ownership
```

### ✅ Feature-Based (Proposed)
```
Group by: Business domain (product, production-run, work-item)
Benefit: Clear boundaries, independent development
```

**Example:**
```
Question: "Where do I add the production run editing form?"

❌ Type-based answer:
   "Uh... production-runs/components/? Or production-runs/page/?
    Wait, do we even have production-runs/ yet?"

✅ Feature-based answer:
   "production-run/pages/ProductionRunEditPage/EditForm.tsx"
   Clear. Obvious. Consistent.
```

---

## 🚀 Migration Path

### Option 1: Big Bang (Not Recommended)
```
1. Move everything at once
2. Fix all imports
3. Hope nothing breaks
4. Deploy

Risk: HIGH - Everything breaks at once
Time: 2-3 days of chaos
```

### Option 2: Incremental (Recommended)
```
1. Create new structure alongside old
2. Build new features in new structure
3. Migrate old files one by one
4. Delete old structure when empty

Risk: LOW - Old code still works
Time: 1 week, but production never breaks
```

### Option 3: Hybrid (Best)
```
1. Build ProductDetailPage in NEW structure (proves concept)
2. Refactor product/ in one go (small enough)
3. Use product/ as template for future domains
4. Deploy

Risk: LOW - Only product/ affected
Time: 3-4 days
Benefit: Fast value (ProductDetailPage), clean foundation
```

**Recommendation: Option 3** ✅

---

## 📝 Next Steps

1. **Review this comparison**
2. **Choose migration strategy**
3. **Start with ProductDetailPage** (proves new structure works)
4. **Refactor product/** (foundation for future)
5. **Copy structure for new domains**

**Result: Scalable codebase ready for 100+ features!** 🎉
