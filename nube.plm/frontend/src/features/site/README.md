# Site Domain

**Status**: 🚧 Placeholder - Not Yet Implemented

This directory will contain all code related to **Sites** (manufacturing sites, locations, facilities).

---

## 📁 Planned Structure

```
site/
├── api/
│   ├── site-api.ts                 # CRUD operations
│   └── index.ts
├── hooks/
│   ├── use-sites.ts                # Multiple sites hook
│   ├── use-site.ts                 # Single site hook
│   └── index.ts
├── types/
│   ├── site.types.ts               # Interfaces
│   └── index.ts
├── components/
│   ├── SiteTable.tsx               # Table component
│   ├── SiteCard.tsx                # Card component
│   ├── SiteMap.tsx                 # Map visualization
│   ├── SiteForm.tsx                # Form component
│   ├── LocationPicker.tsx          # Location selector
│   └── index.ts
├── pages/
│   ├── SitesListPage.tsx           # Main list page
│   ├── SiteDetailPage.tsx          # Detail page
│   └── index.ts
├── widgets/
│   └── SiteMapWidget.tsx           # Dashboard widget
└── README.md
```

---

## 🎯 Key Features (Planned)

### Core Functionality
- **Manage Sites**: Create, edit, delete manufacturing sites
- **Location Tracking**: Physical addresses, coordinates
- **Capacity Planning**: Track site capacity, utilization
- **Production Runs by Site**: See runs at each location
- **Hierarchical Structure**: Multi-site organizations

### Data Model (Draft)
```typescript
interface Site {
  id: string;
  name: string;
  type: 'plm.site';
  settings: {
    siteCode: string;             // Unique site identifier
    address: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
    };
    capacity?: {
      maxConcurrentRuns?: number;
      squareFeet?: number;
    };
    contactInfo?: {
      phone?: string;
      email?: string;
      manager?: string;
    };
    operatingHours?: string;
    timezone?: string;
    status: 'active' | 'inactive' | 'maintenance';
  };
}
```

---

## 🚀 Getting Started (When Implementing)

1. **Copy the product/ structure** as a template
2. **Define types** in `types/site.types.ts`
3. **Create API client** in `api/site-api.ts`
4. **Build hooks** for data fetching
5. **Create components** (table, map, form)
6. **Build pages** (list, detail with map)
7. **Add to plugin.json** pages array
8. **Update vite.config.ts** exposes

---

## 📚 Related Domains

- **production-run/** - Runs at each site
- **work-item/** - Work happening at sites
- **product/** - Products manufactured at sites
- **serialized-unit/** - Units produced at sites

---

## 🎨 UI Considerations

### Views
- **Map View**: Interactive map showing all sites
- **List View**: Table with site details
- **Card Grid**: Visual cards with key info

### Features
- **Map Integration**: Show sites on map (Google Maps / OpenStreetMap)
- **Geocoding**: Auto-fill coordinates from address
- **Capacity Visualization**: Charts showing utilization
- **Production Activity**: Live runs at each site

---

## 🗺️ Map Integration

Consider using:
- **Leaflet** + OpenStreetMap (free, open-source)
- **Google Maps API** (paid, familiar)
- **Mapbox** (paid, customizable)

```tsx
// Example map component structure
interface SiteMapProps {
  sites: Site[];
  selectedSiteId?: string;
  onSiteClick: (siteId: string) => void;
}

function SiteMap({ sites, selectedSiteId, onSiteClick }: SiteMapProps) {
  // Map implementation
}
```

---

## ✅ Implementation Checklist

When implementing this domain:

- [ ] Define TypeScript types
- [ ] Create API client
- [ ] Build React hooks
- [ ] Create map component (choose library)
- [ ] Create table/card components
- [ ] Build list page (map + list views)
- [ ] Build detail page (tabbed)
- [ ] Add dashboard widget
- [ ] Update plugin.json
- [ ] Update vite.config.ts
- [ ] Write tests
- [ ] Update this README

---

**See**: [`product/README.md`](../product/README.md) for the reference implementation pattern.
