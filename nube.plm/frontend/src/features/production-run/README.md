# Production Run Domain

**Status**: 🚧 Placeholder - Not Yet Implemented

This directory will contain all code related to **Production Runs** (manufacturing runs).

---

## 📁 Planned Structure

```
production-run/
├── hooks/
│   ├── use-production-runs.ts      # Multiple runs hook
│   ├── use-production-run.ts       # Single run hook
│   └── index.ts
├── types/
│   ├── production-run.types.ts     # Interfaces
│   └── index.ts
├── components/
│   ├── ProductionRunTable.tsx      # Table component
│   ├── ProductionRunForm.tsx       # Form component
│   ├── ProductionRunStatusBadge.tsx
│   └── index.ts
├── pages/
│   ├── ProductionRunsListPage.tsx  # Main list page
│   ├── ProductionRunDetailPage.tsx # Detail page
│   └── index.ts
├── widgets/
│   └── ProductionRunWidget.tsx     # Dashboard widget
└── README.md
```

---

## 🎯 Key Features (Planned)

### Core Functionality
- **Create Production Runs**: Start new manufacturing runs
- **Track Progress**: Monitor run status, completion percentage
- **Manage Work Items**: Link tasks to production runs
- **Track Serialized Units**: See units produced in each run
- **Run History**: View past runs, analytics

### Data Model (Draft)
```typescript
interface ProductionRun {
  id: string;
  name: string;
  type: 'plm.production-run';
  settings: {
    productRef: string;           // Link to product
    runNumber: string;            // Run identifier
    status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
    targetQuantity: number;       // Units to produce
    producedQuantity: number;     // Units produced so far
    startDate?: string;
    endDate?: string;
    notes?: string;
  };
}
```

---

## 🚀 Getting Started (When Implementing)

1. **Copy the product/ structure** as a template
2. **Define types** in `types/production-run.types.ts`
3. **Create API client** in `api/production-run-api.ts`
4. **Build hooks** for data fetching
5. **Create components** (table, form, badges)
6. **Build pages** (list, detail)
7. **Add to plugin.json** pages array
8. **Update vite.config.ts** exposes

---

## 📚 Related Domains

- **product/** - Products being manufactured
- **work-item/** - Tasks within production runs
- **serialized-unit/** - Individual units produced
- **site/** - Manufacturing locations

---

## ✅ Implementation Checklist

When implementing this domain:

- [ ] Define TypeScript types
- [ ] Create API client
- [ ] Build React hooks
- [ ] Create reusable components
- [ ] Build list page (tabbed)
- [ ] Build detail page (tabbed)
- [ ] Add dashboard widget
- [ ] Update plugin.json
- [ ] Update vite.config.ts
- [ ] Write tests
- [ ] Update this README

---

**See**: [`product/README.md`](../product/README.md) for the reference implementation pattern.
