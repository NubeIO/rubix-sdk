# Serialized Unit Domain

**Status**: 🚧 Placeholder - Not Yet Implemented

This directory will contain all code related to **Serialized Units** (individual produced units with serial numbers).

---

## 📁 Planned Structure

```
serialized-unit/
├── api/
│   ├── serialized-unit-api.ts      # CRUD operations
│   └── index.ts
├── hooks/
│   ├── use-serialized-units.ts     # Multiple units hook
│   ├── use-serialized-unit.ts      # Single unit hook
│   └── index.ts
├── types/
│   ├── serialized-unit.types.ts    # Interfaces
│   └── index.ts
├── components/
│   ├── SerializedUnitTable.tsx     # Table component
│   ├── SerializedUnitForm.tsx      # Form component
│   ├── SerialNumberScanner.tsx     # Barcode/QR scanner
│   ├── UnitTracker.tsx             # Track unit journey
│   ├── UnitStatusBadge.tsx         # Status badge
│   └── index.ts
├── pages/
│   ├── SerializedUnitsListPage.tsx # Main list page
│   ├── SerializedUnitDetailPage.tsx # Detail page
│   └── index.ts
├── widgets/
│   └── SerializedUnitWidget.tsx    # Dashboard widget
└── README.md
```

---

## 🎯 Key Features (Planned)

### Core Functionality
- **Generate Serial Numbers**: Auto or manual serial numbers
- **Track Production**: Link units to production runs
- **Scan Capability**: Barcode/QR code scanning
- **Quality Tracking**: Pass/fail, test results
- **Traceability**: Full unit history, genealogy
- **Shipping/Receiving**: Track unit movements

### Data Model (Draft)
```typescript
interface SerializedUnit {
  id: string;
  name: string; // Often the serial number itself
  type: 'plm.serialized-unit';
  settings: {
    serialNumber: string;         // Unique serial number
    productRef: string;           // Link to product
    productionRunRef?: string;    // Link to production run
    status: 'in-production' | 'testing' | 'passed' | 'failed' | 'shipped' | 'in-service' | 'retired';
    manufacturedDate?: string;
    batchNumber?: string;
    qualityTests?: Array<{
      testName: string;
      result: 'pass' | 'fail';
      timestamp: string;
      notes?: string;
    }>;
    location?: {
      type: 'site' | 'warehouse' | 'customer';
      reference: string;
    };
    metadata?: Record<string, any>; // Custom fields
  };
}
```

---

## 🚀 Getting Started (When Implementing)

1. **Copy the product/ structure** as a template
2. **Define types** in `types/serialized-unit.types.ts`
3. **Create API client** in `api/serialized-unit-api.ts`
4. **Build hooks** for data fetching
5. **Create components** (table, scanner, tracker)
6. **Build pages** (list, detail with history)
7. **Add to plugin.json** pages array
8. **Update vite.config.ts** exposes

---

## 📚 Related Domains

- **product/** - Product definitions
- **production-run/** - Manufacturing runs that produce units
- **work-item/** - Work performed on units
- **site/** - Where units are located

---

## 🎨 UI Considerations

### Views
- **List View**: Filterable table (by product, run, status)
- **Scanner View**: Camera-based barcode/QR scanner
- **Tracker View**: Visual timeline of unit journey
- **Genealogy View**: Parent/child relationships (assemblies)

### Features
- **Barcode Scanning**: Web-based camera scanning
- **Bulk Import**: Upload CSV of serial numbers
- **Status Transitions**: Visual workflow (production → testing → shipping)
- **Genealogy Tree**: For assemblies with sub-components

---

## 📱 Scanning Integration

Consider using:
- **@zxing/library** (free, open-source barcode scanner)
- **html5-qrcode** (free, QR code focused)
- **QuaggaJS** (free, 1D barcode focused)

```tsx
// Example scanner component structure
interface SerialNumberScannerProps {
  onScan: (serialNumber: string) => void;
  onError?: (error: Error) => void;
}

function SerialNumberScanner({ onScan, onError }: SerialNumberScannerProps) {
  // Scanner implementation
}
```

---

## 🔍 Traceability Features

Key traceability capabilities:
- **Forward Trace**: Where did this unit go? (shipping, customer)
- **Backward Trace**: Where did this unit come from? (materials, batch)
- **Full History**: All events (production, testing, shipping, service)
- **Genealogy**: Parent/child relationships for assemblies

```tsx
// Example tracker component
interface UnitTrackerProps {
  unit: SerializedUnit;
  events: UnitEvent[];
}

interface UnitEvent {
  timestamp: string;
  eventType: 'production' | 'test' | 'ship' | 'service';
  description: string;
  location?: string;
  operator?: string;
}
```

---

## ✅ Implementation Checklist

When implementing this domain:

- [ ] Define TypeScript types
- [ ] Create API client
- [ ] Build React hooks
- [ ] Create scanner component (choose library)
- [ ] Create tracker/timeline component
- [ ] Create genealogy tree component
- [ ] Build list page (tabbed, filterable)
- [ ] Build detail page (history, tests)
- [ ] Add dashboard widget
- [ ] Update plugin.json
- [ ] Update vite.config.ts
- [ ] Write tests
- [ ] Update this README

---

**See**: [`product/README.md`](../product/README.md) for the reference implementation pattern.
