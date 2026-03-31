# PLM Plugin - Product Vision

**Unified Product Lifecycle Management for Software + Hardware Teams**

---

## Executive Summary

A **single UI** to manage the complete lifecycle of both software and hardware products, designed for a 20-person team that builds integrated solutions (hardware controllers, firmware, software services, and frontends).

**Core Philosophy:**
- **Track hardware deeply** (manufacturing, serialization, QA, RMA)
- **Track software manually** (manual version entry, deployment tracking)
- **Manage hybrid products** (firmware + hardware + software as one product)
- **Enable team collaboration** (one source of truth for product status)
- **Optional integrations** (Git/GitHub integration available but not required)

**Timeline:** 10-14 weeks for core system, +2-3 weeks for optional Git integration
**Current Status:** Phase 1 complete (basic CRUD)

---

## The Problem We're Solving

### Current Pain Points

**Fragmented Product Information:**
- Hardware specs in one place, software versions in another
- No single view of "what's in production right now?"
- Hard to answer: "Which firmware works with which hardware revision?"
- Customer issues span hardware + software, but tracking is siloed

**Hardware Lifecycle Gaps:**
- Manual serial number tracking (spreadsheets)
- No formal QA test recording
- RMA workflow is email-based
- Warranty tracking is ad-hoc

**Software Release Chaos:**
- Software versions tracked in multiple places (Git, wikis, spreadsheets)
- No visibility into which software version is deployed where
- Breaking changes between firmware/backend cause field issues
- Deployment history scattered across tools and people

**Team Coordination:**
- Product managers don't know what's ready to ship
- Support team can't quickly look up unit history
- Manufacturing doesn't know which firmware to flash
- Sales can't see product roadmap status

---

## Our Vision: The Single Source of Truth

```
┌────────────────────────────────────────────────────────────────────┐
│                    RUBIX PLM - PRODUCT COMMAND CENTER              │
│                                                                    │
│  "One UI to see every product, every version, every unit"         │
└────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  HARDWARE PRODUCTS  │  │  SOFTWARE PRODUCTS  │  │   HYBRID PRODUCTS   │
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│                     │  │                     │  │                     │
│ • Controller boards │  │ • Cloud backend     │  │ • SmartController   │
│ • Sensors           │  │ • Mobile app        │  │   (HW + FW + Cloud) │
│ • Enclosures        │  │ • Desktop UI        │  │                     │
│ • Cables/adapters   │  │ • Firmware          │  │ • EdgeGateway       │
│                     │  │ • Libraries         │  │   (HW + FW + UI)    │
│                     │  │                     │  │                     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
         │                         │                         │
         └─────────────────────────┴─────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         │                                                   │
         ▼                                                   ▼
┌────────────────────┐                            ┌────────────────────┐
│   MANUFACTURING    │                            │  FIELD DEPLOYMENT  │
├────────────────────┤                            ├────────────────────┤
│                    │                            │                    │
│ • Production runs  │                            │ • Installed units  │
│ • QA testing       │                            │ • Customer sites   │
│ • Serial numbers   │                            │ • Software deploys │
│ • Inventory        │                            │ • Update history   │
│                    │                            │                    │
└────────────────────┘                            └────────────────────┘
         │                                                   │
         └─────────────────────────┬─────────────────────────┘
                                   │
                                   ▼
                        ┌────────────────────┐
                        │  SERVICE & SUPPORT │
                        ├────────────────────┤
                        │                    │
                        │ • RMA workflow     │
                        │ • Issue tracking   │
                        │ • Warranty status  │
                        │ • Work logs        │
                        │                    │
                        └────────────────────┘
```

---

## System Architecture

### High-Level Design

```
┌──────────────────────────────────────────────────────────────────────┐
│                         RUBIX PLM ARCHITECTURE                        │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER (Single UI)                                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Product    │  │ Manufacturing│  │   Service    │              │
│  │  Catalog     │  │   Dashboard  │  │   Portal     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  BOM Editor  │  │  QA Testing  │  │  RMA Tracker │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  React Widgets (Module Federation) + Full-Page Views                │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API
                                    │
┌──────────────────────────────────────────────────────────────────────┐
│ PLM PLUGIN (Go Backend)                                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ PRODUCT REGISTRY                                                │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ • Product definitions (HW, SW, Hybrid)                         │ │
│  │ • Revision management (versions, BOMs)                         │ │
│  │ • Compatibility matrix (firmware ↔ hardware)                   │ │
│  │ • Cost calculation (BOM rollup)                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ MANUFACTURING ENGINE                                            │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ • Production run management                                    │ │
│  │ • Serial number generation                                     │ │
│  │ • QA test recording (pass/fail/calibration)                    │ │
│  │ • Inventory tracking (parts, BOMs)                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ DEPLOYMENT TRACKER                                              │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ • Software releases (Git integration)                          │ │
│  │ • Deployment history (dev/staging/prod)                        │ │
│  │ • Field installations (unit → site mapping)                    │ │
│  │ • Update management (OTA, manual)                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ SERVICE & SUPPORT                                               │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ • Work items (RMA, bugs, features)                             │ │
│  │ • Customer/site management                                     │ │
│  │ • Warranty tracking (per serialized unit)                      │ │
│  │ • Work logs (time tracking, notes)                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Integration Layer
                                    │
┌──────────────────────────────────────────────────────────────────────┐
│ EXTERNAL INTEGRATIONS                                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │     Git      │  │    CI/CD     │  │   GitHub     │              │
│  │  (versions)  │  │  (builds)    │  │  (issues)    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Package    │  │   Inventory  │  │   Supplier   │              │
│  │  Registries  │  │   Systems    │  │    APIs      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Node Hierarchy (Data Model)

**Pattern:** Service root → Collections → Records (like database: instance → tables → rows)

```
Device Root (rubix.device)
  │
  └─ plm.service (PLM System Root - singleton, MaxOneNode)
      │
      ├─ plm.products (Products Collection - singleton)
      │   ├─ plm.product (EdgeController v2)
      │   ├─ plm.product (TempSensor Pro)
      │   └─ plm.product (Rubix Cloud Backend)
      │
      ├─ plm.production-runs (Manufacturing Runs Collection)
      │   ├─ plm.production-run (Run #1234 - EdgeController v2)
      │   │   ├─ plm.serialized-unit (EC-SN-001)
      │   │   ├─ plm.serialized-unit (EC-SN-002)
      │   │   └─ plm.serialized-unit (EC-SN-003)
      │   └─ plm.production-run (Run #5678 - TempSensor Pro)
      │
      ├─ plm.serialized-units (All Units Collection)
      │   └─ plm.serialized-unit (TS-SN-100 - standalone/RMA unit)
      │
      ├─ plm.work-items (Service Tickets Collection)
      │   ├─ plm.work-item (RMA-456 - Failed sensor)
      │   ├─ plm.work-item (BUG-789 - Firmware crash)
      │   └─ plm.work-item (FEAT-123 - Add WiFi support)
      │
      ├─ plm.deployments (Software Deployments Collection)
      │   ├─ plm.deployment (Backend v2.3.0 → Production)
      │   └─ plm.deployment (Mobile v1.2.0 → Staging)
      │
      └─ plm.sites (Customer Sites Collection)
          ├─ plm.site (Acme Corp HQ)
          └─ plm.site (Beta Test Lab)
```

**Why Two Levels:**
- **Service root** (`plm.service`) - Single source of truth, owns entire PLM subsystem
- **Collections** (`plm.products`, `plm.production-runs`) - Act as "tables", singleton containers
- **Records** (`plm.product`, `plm.production-run`) - Individual instances, like database "rows"

**Benefits:**
- Clean organization (100s of products don't clutter service root)
- Easy queries: `type is "plm.product" and parentRef is {productsCollectionId}`
- Collection nodes can have custom UI (table widgets, dashboards)
- Follows database-like pattern familiar to developers

**Node Constraints:**
```go
// Service root
plm.service: MaxOneNode=true, AllowedParents=["rubix.device"]

// Collections (singletons)
plm.products: MaxOneNode=true, AllowedParents=["plm.service"]
plm.production-runs: MaxOneNode=true, AllowedParents=["plm.service"]

// Records (multiple instances)
plm.product: MaxOneNode=false, AllowedParents=["plm.products"]
plm.production-run: MaxOneNode=false, AllowedParents=["plm.production-runs"]
plm.serialized-unit: MaxOneNode=false, AllowedParents=["plm.production-runs", "plm.serialized-units"]
```

**Flexible Nesting:**
- Units can live under production runs (manufactured units)
- Units can live under units collection (standalone/RMA units)
- Work items can reference products, units, deployments via refs

---

## Product Type Taxonomy

### Hardware Products

**Characteristics:**
- Physical components with manufacturing
- Serialized units with unique identifiers
- BOM with parts, quantities, costs
- QA testing required before shipment
- RMA workflow for defects

**Lifecycle:**
```
Design → Prototype → Manufacturing → QA → Shipped → Installed → Service
```

**Examples:**
- BACnet Controller (PCB + enclosure)
- Temperature Sensor (hardware only)
- Power Supply Module

**Data Tracked:**
- Bill of Materials (parts list)
- Manufacturing runs
- Serial numbers per unit
- QA test results
- Warranty start/end dates
- RMA history

---

### Software Products

**Characteristics:**
- Versioned releases (semantic versioning)
- Deployed to environments (dev/staging/prod)
- Manual version entry (Git integration optional)
- Dependencies tracked (manual or imported)
- No physical manufacturing

**Lifecycle:**
```
Development → Testing → Release → Deployment → Updates → Deprecation
```

**Examples:**
- Rubix Cloud Backend
- Mobile App (iOS/Android)
- React Dashboard UI
- Shared Libraries

**Data Tracked (Core):**
- Release versions (manually entered)
- Deployment history (dates, environments)
- Compatibility requirements
- License type (MIT, proprietary, etc.)
- Release notes/changelog (text)

**Data Tracked (Optional - with Git Integration):**
- Git repository URL
- Auto-import releases from GitHub/GitLab
- Dependencies auto-imported from package files
- Link to GitHub releases
- Commit history

---

### Firmware Products

**Characteristics:**
- Software that runs ON hardware
- Versioned like software
- Flashed during manufacturing or updated in field
- Tightly coupled to hardware revisions

**Lifecycle:**
```
Development → Testing → Manufacturing (flash) → Field Updates → EOL
```

**Examples:**
- Controller Firmware v2.1.3
- Sensor Bootloader
- FPGA Configuration

**Data Tracked:**
- Version number (manually entered)
- Hardware compatibility (works with HW v2.x only)
- Flashing instructions
- Field update capability (OTA, manual)
- Flash success rate
- Rollback procedures
- Binary file location (path or URL)

---

### Hybrid Products (★ Core Use Case)

**Characteristics:**
- Multi-component product (HW + FW + SW)
- Coordinated releases (firmware must match backend API)
- Compatibility matrix required
- Unified product from customer perspective

**Lifecycle:**
```
Design → Development → Integration Testing → Manufacturing →
Deployment → Field Updates → Support → EOL
```

**Example: SmartController v3.0**

```
┌────────────────────────────────────────────────────────────┐
│ HYBRID PRODUCT: SmartController v3.0                       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Component 1: Hardware                                     │
│  ├─ Product: SmartController Board Rev 3.2                │
│  ├─ BOM: 45 parts (PCB, CPU, sensors, enclosure)          │
│  ├─ Manufacturing: Production run #156                     │
│  └─ Serialized Units: SC-00012345 to SC-00012444          │
│                                                             │
│  Component 2: Firmware                                     │
│  ├─ Version: v3.0.5                                       │
│  ├─ Released: 2026-03-01                                  │
│  ├─ Compatibility: Hardware >= v3.0 (HW v2.x won't work)  │
│  └─ Flashed During: Manufacturing (QA test station)        │
│                                                             │
│  Component 3: Cloud Backend                                │
│  ├─ Version: v4.2.1                                       │
│  ├─ Released: 2026-03-10                                  │
│  ├─ Compatibility: Firmware >= v3.0.0 (API v3)            │
│  └─ Deployed: Production (2026-03-15)                      │
│                                                             │
│  Component 4: Dashboard UI                                 │
│  ├─ Version: v2.8.3                                       │
│  ├─ Released: 2026-03-12                                  │
│  ├─ Compatibility: Backend >= v4.0.0                       │
│  └─ Deployed: CDN (2026-03-18)                             │
│                                                             │
│  Product Status: ✅ Active (in production)                 │
│  Units in Field: 100 units (SC-00012345 to SC-00012444)   │
│  Next Release: v3.1.0 (planned Q2 2026)                    │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Data Tracked:**
- Product definition (which components)
- Compatibility matrix (FW v3.x requires HW v3.x)
- Release coordination (all components versioned together)
- Field deployment status (which units have which versions)
- Update procedures (firmware OTA, backend deploy, UI CDN)

---

## PLM Node Architecture & Rubix Integration

### Why Everything is a Node

PLM leverages rubix's powerful node system to get automatic benefits:

✅ **Tree hierarchy** (parentRef) - Organize products, revisions, units
✅ **Auto-computed refs** (siteRef, equipRef) - Fast cross-tree queries
✅ **Haystack queries** - Rich filtering (`productRef is 'prod_001' and i has 'unit'`)
✅ **Hot-reload** - Changes apply immediately, no restart
✅ **Permissions** - Inherit rubix's node-level permissions
✅ **History** - Automatic audit trail for all changes
✅ **Runtime integration** - Can trigger flows on PLM events (optional)

**Principle:** Use nodes for core entities, use plugin tables for large datasets (test results, logs, analytics).

---

### PLM Node Types

All PLM entities are nodes with specific types:

```
┌────────────────────────────────────────────────────────────────┐
│ PLM NODE TAXONOMY                                              │
└────────────────────────────────────────────────────────────────┘

Products & Design
├─ plm.product           → Product definition (SmartController)
├─ plm.revision          → Product version (v3.0, v3.1)
├─ plm.part              → Component/part (PCB, screw, IC)
└─ plm.bom-item          → Bill of materials entry (product uses part)

Manufacturing
├─ plm.run               → Manufacturing run (batch of 500 units)
├─ plm.unit              → Serialized unit (SN-12345)
└─ plm.qa-test           → QA test record (functional, calibration)

Deployment
├─ plm.environment       → Software environment (dev, staging, prod)
├─ plm.deployment        → Deployment event (backend v5.0.0 → prod)
└─ plm.update-campaign   → Firmware update campaign

Customers & Field
├─ plm.customer          → Customer organization (ACME Corp)
├─ plm.customer-site     → Customer location (Building A)
└─ plm.installation      → Unit installation record

Service & Support
├─ plm.work-item         → Issue/RMA/feature request
└─ plm.work-log          → Time tracking entry
```

---

### PLM Identity Tags

Nodes use identity arrays for classification (fast queries):

```json
// Product node
{
  "id": "prod_001",
  "type": "plm.product",
  "name": "SmartController",
  "identity": ["product", "hardware", "active"],
  "settings": {
    "productCode": "SC-3000",
    "productType": "Hybrid",
    "status": "Production"
  }
}

// Serialized unit node
{
  "id": "unit_12345",
  "type": "plm.unit",
  "name": "SC-00012345",
  "identity": ["unit", "serialized", "tested", "shipped"],
  "settings": {
    "serialNumber": "SC-00012345",
    "warrantyStart": "2026-03-20",
    "warrantyEnd": "2027-03-20"
  }
}

// Work item (RMA) node
{
  "id": "work_456",
  "type": "plm.work-item",
  "name": "RMA #456 - Faulty sensor",
  "identity": ["work-item", "rma", "open"],
  "settings": {
    "workItemType": "RMA",
    "priority": "High",
    "status": "In Progress"
  }
}
```

---

### PLM Refs (Relationships)

PLM uses refs to create relationships between entities:

#### **Hierarchy Refs (Tree Structure)**

```typescript
// Product revision under product
{
  refName: "parentRef",
  fromNodeId: "rev_v3.0",
  toNodeId: "prod_001"
}

// QA test under unit
{
  refName: "parentRef",
  fromNodeId: "qa_test_123",
  toNodeId: "unit_12345"
}
```

#### **PLM-Specific Refs (Cross-Tree)**

```typescript
// Unit → Product (which product this unit is)
{
  refName: "productRef",
  fromNodeId: "unit_12345",
  toNodeId: "prod_001",
  metadata: { "revisionId": "rev_v3.0" }  // Optional: track revision
}

// Unit → Manufacturing Run
{
  refName: "runRef",
  fromNodeId: "unit_12345",
  toNodeId: "run_157"
}

// BOM Item → Part
{
  refName: "partRef",
  fromNodeId: "bom_item_001",
  toNodeId: "part_pcb_001",
  metadata: { "quantity": 1, "cost": 12.50 }
}

// Unit → Customer Site (where installed)
{
  refName: "customerSiteRef",
  fromNodeId: "unit_12345",
  toNodeId: "customer_site_789"
}

// Customer Site → Customer
{
  refName: "customerRef",
  fromNodeId: "customer_site_789",
  toNodeId: "customer_001"
}

// Work Item → Unit (RMA for which unit)
{
  refName: "unitRef",
  fromNodeId: "work_456",
  toNodeId: "unit_12345"
}

// Deployment → Environment
{
  refName: "environmentRef",
  fromNodeId: "deploy_550",
  toNodeId: "env_production"
}

// Software Product → Firmware Product (compatibility)
{
  refName: "requiresRef",
  fromNodeId: "prod_backend",
  toNodeId: "prod_firmware",
  metadata: { "minVersion": "v3.0.0" }
}
```

#### **Auto-Computed PLM Refs**

The system can auto-compute refs by walking the tree:

```typescript
// Auto-compute productRef for all child nodes
// (revision, BOM items, units, tests)
Node: qa_test_123
  → parentRef → unit_12345
    → productRef → prod_001
  → productRef (auto-computed) → prod_001

// Query: All QA tests for a product (fast!)
productRef is 'prod_001' and i has 'qa-test'
```

---

### PLM Query Examples

Leverage Haystack syntax for powerful filtering:

#### **Product Queries**

```bash
# All hardware products in production
i has ['product', 'hardware'] and settings.status is 'Production'

# All products created this year
i has 'product' and createdAt >= '2026-01-01T00:00:00Z'

# Find product by code
i has 'product' and settings.productCode is 'SC-3000'

# All software products with manual versioning
i has ['product', 'software'] and settings.versioningMethod is 'manual'
```

#### **Manufacturing Queries**

```bash
# All units from manufacturing run #157
runRef is 'run_157'

# All tested units (ready to ship)
i has ['unit', 'tested'] and i not has 'shipped'

# Units manufactured this month
i has 'unit' and createdAt >= '2026-03-01T00:00:00Z'

# Find unit by serial number
i has 'unit' and settings.serialNumber is 'SC-00012345'

# QA test failures for a product
productRef is 'prod_001' and i has 'qa-test' and settings.result is 'FAIL'
```

#### **Field Deployment Queries**

```bash
# All units installed at a customer site
customerSiteRef is 'site_789'

# Units at customer "ACME Corp"
customerSiteRef->customerRef is 'customer_acme'

# Units with expired warranty
i has 'unit' and settings.warrantyEnd < '2026-03-20T00:00:00Z'

# Units running firmware < v3.0
i has 'unit' and settings.firmwareVersion < 'v3.0.0'
```

#### **Service & Support Queries**

```bash
# All open RMA work items
i has ['work-item', 'rma', 'open']

# High priority issues
i has 'work-item' and settings.priority is 'High'

# Work items for a specific unit
unitRef is 'unit_12345'

# Work items for a product
productRef is 'prod_001' and i has 'work-item'

# Unassigned work items
i has 'work-item' and settings.assignedTo is null
```

#### **Software Deployment Queries**

```bash
# All production deployments
environmentRef is 'env_production' and i has 'deployment'

# Deployments this week
i has 'deployment' and createdAt >= '2026-03-17T00:00:00Z'

# Find what's deployed in production
environmentRef is 'env_production' and i has 'deployment' | sort createdAt desc | limit 10

# Backend deployments
productRef is 'prod_backend' and i has 'deployment'
```

#### **Cross-Product Queries (Hybrid)**

```bash
# All components of a hybrid product
parentRef is 'prod_smartcontroller'

# Find firmware compatible with hardware v3.x
i has 'product' and settings.hardwareCompatibility contains 'v3'

# Units with mismatched firmware (incompatible)
i has 'unit' and settings.firmwareVersion < settings.requiredFirmwareVersion
```

---

### PLM Tree Hierarchy Example

```
PLM Root (plm.root)
├─ Products (plm.container)
│  ├─ SmartController (plm.product, prod_001)
│  │  ├─ v3.0 (plm.revision, rev_v3.0)
│  │  │  ├─ BOM (plm.container)
│  │  │  │  ├─ PCB (plm.bom-item) [partRef → part_pcb_001]
│  │  │  │  ├─ Enclosure (plm.bom-item) [partRef → part_enclosure_001]
│  │  │  │  └─ Screws x4 (plm.bom-item) [partRef → part_screw_m3]
│  │  │  └─ Components (plm.container)
│  │  │     ├─ Firmware v3.0.5 (plm.product, prod_firmware)
│  │  │     ├─ Backend v4.2.1 (plm.product, prod_backend)
│  │  │     └─ UI v2.8.3 (plm.product, prod_ui)
│  │  └─ v3.1 (plm.revision, rev_v3.1)
│  └─ Temperature Sensor (plm.product, prod_002)
├─ Parts (plm.container)
│  ├─ PCB-SC-v3 (plm.part, part_pcb_001)
│  ├─ Enclosure-Plastic (plm.part, part_enclosure_001)
│  └─ Screw-M3 (plm.part, part_screw_m3)
├─ Manufacturing (plm.container)
│  ├─ Run #157 (plm.run, run_157) [productRef → prod_001]
│  │  ├─ Unit SC-00012445 (plm.unit) [runRef → run_157, productRef → prod_001]
│  │  │  ├─ QA Test #1 (plm.qa-test) [result: PASS]
│  │  │  └─ QA Test #2 (plm.qa-test) [result: PASS]
│  │  └─ Unit SC-00012446 (plm.unit)
│  └─ Run #158 (plm.run, run_158)
├─ Customers (plm.container)
│  ├─ ACME Corp (plm.customer, customer_001)
│  │  ├─ Building A (plm.customer-site, site_789)
│  │  │  └─ Installation Record (plm.installation)
│  │  │     [unitRef → unit_12345, customerSiteRef → site_789]
│  │  └─ Building B (plm.customer-site, site_790)
│  └─ GlobalTech (plm.customer, customer_002)
├─ Service (plm.container)
│  ├─ Work Item #456 (plm.work-item)
│  │  [unitRef → unit_12345, productRef → prod_001]
│  │  └─ Work Log (plm.work-log) [2 hours, fixed sensor]
│  └─ Work Item #457 (plm.work-item)
└─ Deployments (plm.container)
   ├─ Production (plm.environment, env_production)
   │  ├─ Deploy 2026-03-15 (plm.deployment)
   │  │  [productRef → prod_backend, environmentRef → env_production]
   │  └─ Deploy 2026-03-18 (plm.deployment)
   └─ Staging (plm.environment, env_staging)
```

**Query this tree:**
```bash
# All units from Run #157
runRef is 'run_157'

# All work items for ACME Corp
customerSiteRef->customerRef is 'customer_001' and i has 'work-item'

# Find where unit SC-00012345 is installed
i has 'installation' and unitRef is 'unit_12345'
```

---

### Plugin Tables vs. Nodes

**Use Nodes For:**
- Core entities (products, units, customers, work items)
- Entities that need hierarchy, refs, queries
- Entities that appear in UI (searchable, navigable)
- < 10,000 records per entity type

**Use Plugin Tables For:**
- Large datasets (millions of test records, logs)
- Time-series data (performance metrics, analytics)
- Aggregated reports (monthly summaries)
- Data that doesn't need tree hierarchy

**Hybrid Approach (Recommended):**

```
Nodes:
- plm.product (100-500 products)
- plm.unit (10,000-50,000 units)
- plm.work-item (1,000-5,000 active items)

Plugin Tables:
- qa_test_results (millions of test records)
  ├─ Links to unit node via unitId
  └─ Queried via SQL for analytics
- work_logs (detailed time entries)
  ├─ Links to work item node via workItemId
  └─ Aggregated for reporting
- deployment_history (full deployment logs)
  ├─ Links to deployment node via deploymentId
  └─ Used for audit trail
```

**Example:**
```json
// Node: Serialized unit (searchable, navigable)
{
  "id": "unit_12345",
  "type": "plm.unit",
  "name": "SC-00012345",
  "identity": ["unit", "tested", "shipped"],
  "settings": {
    "serialNumber": "SC-00012345",
    "qaSummary": {
      "totalTests": 5,
      "passed": 5,
      "failed": 0
    }
  }
}

// Plugin Table: Detailed test results (millions of rows)
qa_test_results:
  unit_id: "unit_12345"
  test_type: "Functional"
  test_name: "Power-on test"
  result: "PASS"
  timestamp: "2026-03-20T14:30:00Z"
  tester: "alice@nube.io"
  raw_data: {...}  // Full sensor readings, oscilloscope traces, etc.
```

---

### Runtime Integration (Optional Advanced Feature)

PLM nodes can interact with rubix's flow runtime for smart workflows:

#### **Example 1: Auto-Create Work Item on Unit Failure**

```
Flow: "Auto-RMA on Failure"

1. Unit node (plm.unit) reports alarm
   → Alarm published via NATS: plm.unit.{unitId}.alarm

2. Trigger node subscribes to alarm topic
   → Receives alarm event

3. Logic node checks alarm severity
   → If severity = "Critical"

4. Create Work Item node
   → Creates plm.work-item node via API
   → Links to unit via unitRef
   → Sends notification to support team
```

#### **Example 2: Warranty Expiration Alerts**

```
Flow: "Warranty Expiration Check"

1. Schedule node (daily at 9am)
   → Triggers flow

2. Query node
   → Query: i has 'unit' and settings.warrantyEnd < '7 days from now'
   → Returns list of expiring units

3. For Each node
   → Iterates over units

4. Notification node
   → Sends email to customer
   → Creates work item for renewal offer
```

#### **Example 3: BOM Cost Rollup**

```
Flow: "Product Cost Calculator"

1. HTTP trigger (webhook from BOM editor)
   → Receives productId

2. Query node
   → Query: parentRef is '{productId}' and i has 'bom-item'
   → Returns all BOM items

3. Transform node
   → Sums partRef->cost * quantity for each item
   → Calculates total product cost

4. Update node
   → Updates product node settings.calculatedCost
   → Publishes cost update event
```

**Benefits:**
- Automate repetitive tasks
- Real-time reactions to events
- Complex business logic without custom code
- Leverage rubix's existing runtime

**Note:** Runtime integration is OPTIONAL. PLM works fully without flows (CRUD via API).

---

## Key Workflows

### Workflow 1: New Hardware Product Release

```
┌─────────────────────────────────────────────────────────────────────┐
│ WORKFLOW: Launch SmartSensor v2.0 (Hardware Product)                │
└─────────────────────────────────────────────────────────────────────┘

Step 1: Product Definition
├─ Create product "SmartSensor v2.0" (type: Hardware)
├─ Define BOM:
│  ├─ PCB-SS-v2: $12.50 (qty: 1)
│  ├─ Temp Sensor IC: $3.25 (qty: 1)
│  ├─ Enclosure: $2.00 (qty: 1)
│  ├─ Screws M3: $0.05 (qty: 4)
│  └─ Total cost: $17.80 per unit
└─ Upload docs (schematic, assembly instructions)

Step 2: Manufacturing Run
├─ Create production run #45
├─ Target quantity: 500 units
├─ BOM snapshot: Locked (prevents mid-run BOM changes)
├─ Generate serial numbers: SS-20001 to SS-20500
└─ Print labels (QR codes with serial numbers)

Step 3: QA Testing
├─ Unit SS-20001 → Test station
├─ Run tests:
│  ├─ Power-on test: PASS
│  ├─ Sensor calibration: PASS (offset: +0.2°C)
│  ├─ Communication test: PASS
│  └─ Visual inspection: PASS
├─ Update unit status: Manufactured → Tested
└─ Next unit...

Step 4: Shipment
├─ Pack 50 units for customer "ACME Corp"
├─ Update status: Tested → Shipped
├─ Record:
│  ├─ Ship date: 2026-03-20
│  ├─ Tracking: FedEx 1234567890
│  └─ Warranty start: 2026-03-20 (1 year)

Step 5: Installation
├─ Customer installs units at sites
├─ Update status: Shipped → Installed
├─ Record:
│  ├─ Site: "Building A - Floor 3"
│  ├─ Install date: 2026-03-25
│  └─ Installer: John Doe

Step 6: Field Support
├─ Unit SS-20012 reports high readings
├─ Create work item #456 (type: Issue)
├─ Diagnosis: Faulty sensor IC
├─ RMA approved → Status: Installed → RMA
├─ Repair: Replace sensor IC, recalibrate
└─ Return to customer → Status: RMA → Installed
```

---

### Workflow 2: Software Release Deployment

```
┌─────────────────────────────────────────────────────────────────────┐
│ WORKFLOW: Deploy Rubix Cloud Backend v5.0.0 (Software Product)      │
└─────────────────────────────────────────────────────────────────────┘

Step 1: Product Definition (One-Time)
├─ Create product "Rubix Cloud Backend" (type: Software)
├─ Define environments:
│  ├─ Development
│  ├─ Staging (QA testing)
│  └─ Production (approval required)
└─ Set compatibility: Requires Firmware >= v2.0.0

Step 2: Development & Release
├─ Developers complete work, CI/CD runs tests
├─ Release manager creates release in PLM:
│  ├─ Version: v5.0.0
│  ├─ Release Date: 2026-03-20
│  ├─ Changelog: "Added new dashboard API, fixed auth bug"
│  └─ Status: Released (not yet deployed)
└─ Optional: Reference Git tag (backend-v5.0.0) if using Git integration

Step 3: Deploy to Staging
├─ Trigger deployment (from PLM or CI/CD)
├─ PLM records:
│  ├─ Environment: Staging
│  ├─ Version: v5.0.0
│  ├─ Deploy Date: 2026-03-20 14:30 UTC
│  ├─ Deployed By: alice@nube.io
│  └─ Status: Running
└─ QA team tests in staging

Step 4: Production Deployment
├─ Approval workflow:
│  ├─ QA: ✅ Approved (all tests pass)
│  ├─ Product Manager: ✅ Approved
│  └─ CTO: ✅ Approved
├─ Deploy to production
├─ PLM records:
│  ├─ Environment: Production
│  ├─ Version: v5.0.0
│  ├─ Deploy Date: 2026-03-22 09:00 UTC
│  ├─ Previous Version: v4.9.2
│  └─ Rollback Available: Yes (one-click)
└─ Monitor for issues

Step 5: Compatibility Check
├─ PLM warns: "Backend v5.0.0 requires Firmware >= v2.0.0"
├─ Check field units:
│  ├─ 450 units have Firmware v2.1.x: ✅ Compatible
│  ├─ 50 units have Firmware v1.9.x: ⚠️  Incompatible
│  └─ Action: Schedule firmware updates for 50 units
└─ Send update notifications to affected customers
```

---

### Workflow 3: Hybrid Product Coordinated Release

```
┌─────────────────────────────────────────────────────────────────────┐
│ WORKFLOW: SmartController v3.1.0 Release (Hybrid Product)           │
└─────────────────────────────────────────────────────────────────────┘

Context: New feature requires changes across HW, FW, and Backend

Step 1: Product Planning
├─ Product Manager creates release plan in PLM
├─ Target: SmartController v3.1.0
├─ Components to update:
│  ├─ Hardware: No change (still v3.2)
│  ├─ Firmware: v3.0.5 → v3.1.0 (new sensor support)
│  ├─ Backend: v4.2.1 → v4.3.0 (new API endpoint)
│  └─ UI: v2.8.3 → v2.9.0 (new dashboard widget)
└─ Compatibility matrix:
   ├─ FW v3.1.0 requires HW >= v3.0
   ├─ FW v3.1.0 requires Backend >= v4.3.0
   └─ UI v2.9.0 requires Backend >= v4.3.0

Step 2: Development (Parallel)
├─ Firmware team: Develops v3.1.0
├─ Backend team: Develops v4.3.0
├─ UI team: Develops v2.9.0
└─ PLM tracks development status (manual updates)

Step 3: Integration Testing
├─ All components ready
├─ Integration test environment:
│  ├─ Hardware v3.2 (existing unit SC-TEST-001)
│  ├─ Firmware v3.1.0 (flashed to test unit)
│  ├─ Backend v4.3.0 (deployed to test environment)
│  └─ UI v2.9.0 (deployed to test CDN)
├─ Run integration tests:
│  ├─ New sensor reads correctly: ✅ PASS
│  ├─ Data flows HW → FW → Backend → UI: ✅ PASS
│  └─ Backward compatibility (old FW with new backend): ✅ PASS
└─ PLM records test results

Step 4: Coordinated Release (Backend First)
├─ Deploy Backend v4.3.0 to production (backward compatible)
│  └─ Old firmware v3.0.x still works
├─ Deploy UI v2.9.0 to production CDN
│  └─ New widget hidden (feature flag) until firmware updates
└─ PLM tracks deployment order

Step 5: Manufacturing (New Units)
├─ Production run #157 (100 new units)
├─ Firmware v3.1.0 flashed during manufacturing
├─ Serial numbers: SC-00012445 to SC-00012544
├─ QA tests include new sensor validation
└─ Units ship with v3.1.0 firmware pre-installed

Step 6: Field Updates (Existing Units)
├─ PLM identifies 100 existing units (SC-00012345 to SC-00012444)
├─ Firmware OTA update campaign:
│  ├─ Target: Units with FW < v3.1.0
│  ├─ Method: OTA (over-the-air)
│  ├─ Schedule: Gradual rollout (10% per day)
│  └─ Monitor: Update success rate
├─ PLM tracks update status per unit:
│  ├─ SC-00012345: v3.0.5 → v3.1.0 ✅ Success
│  ├─ SC-00012346: v3.0.5 → v3.1.0 ✅ Success
│  ├─ SC-00012347: v3.0.5 → v3.1.0 ⚠️  Failed (retry scheduled)
│  └─ ...
└─ After 90% updated: Enable feature flag in UI

Step 7: Product Status View
├─ Dashboard shows:
│  ├─ SmartController v3.1.0: Active
│  ├─ Total units in field: 200
│  │  ├─ Hardware v3.2: 200 units (100%)
│  │  ├─ Firmware v3.1.0: 180 units (90%)
│  │  ├─ Firmware v3.0.5: 18 units (9%) ← need update
│  │  └─ Firmware v3.0.4: 2 units (1%) ← need update
│  ├─ Backend v4.3.0: Production (deployed 2026-03-20)
│  └─ UI v2.9.0: Production (deployed 2026-03-20)
└─ Product Manager sees full picture in one view
```

---

## Code Architecture & Organization

### Three-Layer Architecture

PLM follows rubix's established pattern for clean, reusable code:

```
┌────────────────────────────────────────────────────────────────┐
│ 1. NATS HANDLER LAYER (Plugin Backend)                        │
├────────────────────────────────────────────────────────────────┤
│ Location: plugins/nube.plm/                                    │
│                                                                 │
│ Responsibilities:                                              │
│ • NATS subject subscriptions                                   │
│ • Message handling (deserialize, validate, respond)            │
│ • Authentication/authorization checks                          │
│ • Calls business layer                                         │
│                                                                 │
│ Example:                                                       │
│   NATS Subject: "rubix.org1.device1.plm.nube.plm.product.create" │
│   → Deserialize message payload                                │
│   → Call plmService.CreateProduct()                           │
│   → Publish response to reply subject                          │
│                                                                 │
│ Plugin Subjects:                                               │
│ • {prefix}.{org}.{device}.plm.{vendor}.{plugin}.health        │
│ • {prefix}.{org}.{device}.plm.{vendor}.{plugin}.control       │
│ • {prefix}.{org}.{device}.plm.{vendor}.{plugin}.product.*     │
│ • {prefix}.{org}.{device}.plm.{vendor}.{plugin}.unit.*        │
│ • {prefix}.{org}.{device}.plm.{vendor}.{plugin}.workitem.*    │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ 2. BUSINESS LOGIC LAYER (Shared Core Logic)                   │
├────────────────────────────────────────────────────────────────┤
│ Location: internal/business/plm/                               │
│                                                                 │
│ Responsibilities:                                              │
│ • Validation logic (BOM cost calculation, unit limits)         │
│ • Workflow orchestration (RMA approval, QA workflows)          │
│ • Business rules (warranty validation, compatibility checks)   │
│ • Node/ref/query composition                                   │
│ • Reusable by: HTTP API, RxAI, CLI tools, batch jobs          │
│                                                                 │
│ Example:                                                       │
│   plmService.CreateProduct()                                   │
│   → Validate product code uniqueness                           │
│   → Create plm.product node                                    │
│   → Create default revision (v1.0.0)                           │
│   → Call plugin hooks (if enabled)                             │
│   → Hot-reload into runtime                                    │
│                                                                 │
│ Services:                                                      │
│ • ProductService - Product/revision management                 │
│ • ManufacturingService - Runs, units, QA tests                │
│ • DeploymentService - Software deployments                     │
│ • CustomerService - Customer/site management                   │
│ • WorkItemService - RMA, issues, work logs                     │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ 3. SHARED LIBRARY LAYER (Generic Plugin Utilities)            │
├────────────────────────────────────────────────────────────────┤
│ Location: github.com/NubeDev/rubix-plugin                      │
│                                                                 │
│ Responsibilities:                                              │
│ • NATS helpers (publish, subscribe, request/reply)             │
│ • Node type registry (register custom node types)              │
│ • Plugin lifecycle (health, control, shutdown)                 │
│ • Common data structures (Manifest, PluginConfig)              │
│ • Reusable by: ALL plugins (not just PLM)                      │
│                                                                 │
│ Example Usage:                                                 │
│   import "github.com/NubeDev/rubix-plugin/natslib"            │
│                                                                 │
│   // Request/reply pattern for node creation                   │
│   natslib.Request(                                             │
│     subject: "rubix.org1.dev1.nodes.create",                  │
│     payload: NodeCreateMsg{                                    │
│       Type: "plm.product",                                     │
│       Name: "SmartController",                                 │
│       Settings: map[string]any{...},                           │
│     },                                                         │
│   )                                                            │
│                                                                 │
│ Packages:                                                      │
│ • natslib/ - NATS pub/sub/request helpers (EXISTING)          │
│ • pluginnode/ - Plugin lifecycle (EXISTING)                    │
│ • nodelib/ - Node creation via NATS (NEW)                      │
│ • reflib/ - Ref management via NATS (NEW)                      │
│ • querylib/ - Query building utilities (NEW)                   │
│ • validationlib/ - Common validation patterns (NEW)            │
└────────────────────────────────────────────────────────────────┘
```

---

### NATS Subject Patterns

PLM plugin communicates via NATS subjects following rubix conventions:

**Base Pattern:**
```
{prefix}.{orgId}.{deviceId}.plm.{vendor}.{pluginName}.{operation}
```

**Core Subjects (All Plugins):**
```bash
# Health check (heartbeat)
rubix.org1.dev1.plugin.nube.plm.health
→ Plugin responds with status (running/degraded/stopped)

# Control (start/stop/restart)
rubix.org1.dev1.plugin.nube.plm.control
→ Plugin receives control commands

# Widget calls (from frontend via rubix)
rubix.org1.dev1.plugin.nube.plm.widget.{widgetId}.{action}
→ Plugin handles widget-specific actions
```

**PLM-Specific Subjects:**

```bash
# Product Management
rubix.org1.dev1.plm.nube.plm.product.create
rubix.org1.dev1.plm.nube.plm.product.update
rubix.org1.dev1.plm.nube.plm.product.delete
rubix.org1.dev1.plm.nube.plm.product.get
rubix.org1.dev1.plm.nube.plm.product.query

# Product Revisions
rubix.org1.dev1.plm.nube.plm.revision.create
rubix.org1.dev1.plm.nube.plm.revision.list
rubix.org1.dev1.plm.nube.plm.revision.compare

# BOM Management
rubix.org1.dev1.plm.nube.plm.bom.update
rubix.org1.dev1.plm.nube.plm.bom.calculate-cost

# Manufacturing
rubix.org1.dev1.plm.nube.plm.run.create
rubix.org1.dev1.plm.nube.plm.unit.generate
rubix.org1.dev1.plm.nube.plm.unit.query
rubix.org1.dev1.plm.nube.plm.qa-test.record

# Work Items (RMA, Issues)
rubix.org1.dev1.plm.nube.plm.workitem.create
rubix.org1.dev1.plm.nube.plm.workitem.update
rubix.org1.dev1.plm.nube.plm.workitem.query
rubix.org1.dev1.plm.nube.plm.rma.approve

# Deployment Tracking
rubix.org1.dev1.plm.nube.plm.deployment.record
rubix.org1.dev1.plm.nube.plm.deployment.query
```

**Message Format (Request/Reply):**

```go
// Request Message
type ProductCreateRequest struct {
    Name        string            `json:"name"`
    ProductCode string            `json:"productCode"`
    ProductType string            `json:"productType"`
    ParentID    string            `json:"parentId"`
    Settings    map[string]any    `json:"settings"`
}

// Response Message
type ProductCreateResponse struct {
    Success bool         `json:"success"`
    Node    *models.Node `json:"node,omitempty"`
    Error   string       `json:"error,omitempty"`
}

// Usage in plugin handler:
nc.Subscribe("rubix.*.*.plm.nube.plm.product.create", func(msg *nats.Msg) {
    var req ProductCreateRequest
    json.Unmarshal(msg.Data, &req)

    // Call business logic
    node, err := productService.CreateProduct(ctx, req)

    // Respond
    resp := ProductCreateResponse{
        Success: err == nil,
        Node:    node,
        Error:   errToString(err),
    }
    msg.Respond(marshalJSON(resp))
})
```

**Frontend → Plugin Flow:**

```
1. User clicks "Create Product" in React widget
   ↓
2. Frontend calls rubix HTTP API:
   POST /api/v1/orgs/org1/plm/products
   ↓
3. Rubix HTTP handler publishes NATS message:
   Subject: rubix.org1.dev1.plm.nube.plm.product.create
   Payload: {name: "SmartController", ...}
   ↓
4. PLM plugin receives message, processes via business layer
   ↓
5. PLM plugin publishes response on reply subject
   ↓
6. Rubix HTTP handler receives response, returns JSON to frontend
   ↓
7. Frontend displays success/error
```

**Benefits of NATS:**
- ✅ No HTTP server needed in plugin
- ✅ Async communication (fire-and-forget or request/reply)
- ✅ Multiple plugins can subscribe to same subject (pub/sub)
- ✅ Built-in load balancing (queue groups)
- ✅ Automatic reconnection on failure
- ✅ Low latency (< 1ms message delivery)

---

### Business Logic Layer (internal/business/plm/)

**Why this pattern?**

✅ **RxAI can leverage business logic** - AI agent uses same validation as NATS handlers
✅ **Consistent behavior** - Same rules everywhere (NATS, RxAI, CLI, batch jobs)
✅ **Testable** - Business logic isolated from NATS transport
✅ **Reusable** - Multiple entry points share same code

**Structure:**

```
internal/business/plm/
├─ product/
│  ├─ service.go          → ProductService
│  ├─ validator.go        → Product/revision validation
│  ├─ bom_calculator.go   → BOM cost rollup logic
│  └─ errors.go           → Business error types
├─ manufacturing/
│  ├─ service.go          → ManufacturingService
│  ├─ unit_generator.go   → Serial number generation
│  ├─ qa_workflow.go      → QA test workflows
│  └─ inventory.go        → Inventory management
├─ deployment/
│  ├─ service.go          → DeploymentService
│  ├─ compatibility.go    → Version compatibility checker
│  └─ approval.go         → Deployment approval workflow
├─ customer/
│  ├─ service.go          → CustomerService
│  └─ installation.go     → Installation management
├─ workitem/
│  ├─ service.go          → WorkItemService
│  ├─ rma_workflow.go     → RMA state machine
│  └─ warranty.go         → Warranty validation
└─ common/
   ├─ types.go            → Shared types/interfaces
   └─ errors.go           → Common error types
```

**Example Service:**

```go
package product

// ProductService handles product business logic
type ProductService struct {
    repo      repository.Repository
    validator *ProductValidator
    nodeSvc   *nodes.NodeService  // Reuse rubix node business logic
}

// CreateProduct creates a new product with validation
func (s *ProductService) CreateProduct(ctx context.Context, input CreateProductInput) (*models.Node, error) {
    // 1. Validate business rules
    if err := s.validator.ValidateProduct(input); err != nil {
        return nil, err
    }

    // 2. Check product code uniqueness
    existing, _ := s.repo.QueryNodes(ctx, repository.QueryInput{
        OrgID:  input.OrgID,
        Filter: fmt.Sprintf("i has 'product' and settings.productCode is '%s'", input.ProductCode),
    })
    if len(existing) > 0 {
        return nil, ErrProductCodeExists
    }

    // 3. Create product node
    node := &models.Node{
        Type:     "plm.product",
        Name:     input.Name,
        ParentID: input.ParentID,
        Identity: []string{"product", input.ProductType},
        Settings: map[string]any{
            "productCode":    input.ProductCode,
            "productType":    input.ProductType,
            "status":         "Design",
            "price":          input.Price,
        },
    }

    // 4. Use node business logic (validation + hot-reload)
    created, err := s.nodeSvc.Create(ctx, nodes.CreateNodeInput{
        Node:   node,
        UserID: input.UserID,
    })
    if err != nil {
        return nil, err
    }

    // 5. Create default revision (v1.0.0)
    _, err = s.CreateRevision(ctx, CreateRevisionInput{
        ProductID: created.ID,
        Version:   "v1.0.0",
    })
    if err != nil {
        // Rollback product creation
        s.repo.DeleteNode(ctx, created.ID)
        return nil, err
    }

    return created, nil
}
```

**Benefits:**

- RxAI can call `productService.CreateProduct()` with same validation
- NATS handlers call same service
- Batch import scripts call same service
- One source of truth for business logic

---

### Rubix-Plugin Library (Generic Utilities)

**Goal:** Extract common plugin patterns into reusable library

**Current rubix-plugin packages:**
- `natslib/` - NATS wrapper (publish, subscribe, request/reply)
- `pluginnode/` - Plugin lifecycle (health, control, shutdown)
- `plugin/` - Manifest parsing

**PLM should add:**

```
rubix-plugin/
├─ nodelib/              → Node helpers (NEW)
│  ├─ create.go          → Simplified node creation
│  ├─ query.go           → Query building utilities
│  └─ bulk.go            → Bulk operations
├─ reflib/               → Ref helpers (NEW)
│  ├─ create.go          → Create refs with validation
│  ├─ navigate.go        → Ref navigation utilities
│  └─ auto_compute.go    → Auto-computed ref patterns
├─ querylib/             → Query DSL (NEW)
│  ├─ builder.go         → Fluent query builder
│  └─ parser.go          → Parse/validate filters
├─ validationlib/        → Validation helpers (NEW)
│  ├─ semver.go          → Semantic version validation
│  ├─ constraints.go     → Common constraints (unique, required)
│  └─ errors.go          → Validation error formatting
└─ tablelib/             → Plugin table helpers (NEW)
   ├─ schema.go          → Table schema definition
   └─ migration.go       → Migration utilities
```

**Example: nodelib helpers (NATS-based)**

```go
package nodelib

// CreateNode simplifies node creation for plugins via NATS
func CreateNode(ctx context.Context, nats *natslib.Client, input *CreateNodeInput) (*models.Node, error) {
    // Build NATS subject
    subject := fmt.Sprintf("rubix.%s.%s.nodes.create", input.OrgID, input.DeviceID)

    // Request/reply via NATS
    resp, err := nats.Request(subject, &NodeCreateMsg{
        Type:     input.Type,
        Name:     input.Name,
        ParentID: input.ParentID,
        Identity: input.Identity,
        Settings: input.Settings,
    }, 5*time.Second)

    if err != nil {
        return nil, err
    }

    var node models.Node
    if err := json.Unmarshal(resp.Data, &node); err != nil {
        return nil, err
    }

    return &node, nil
}

// QueryNodes with fluent builder (NATS-based)
func Query(orgID, deviceID string, nats *natslib.Client) *QueryBuilder {
    return &QueryBuilder{
        orgID:    orgID,
        deviceID: deviceID,
        nats:     nats,
        filters:  []string{},
    }
}

// Usage in PLM plugin:
nodes, err := nodelib.Query(orgID, deviceID, natsClient).
    HasIdentity("product").
    Where("settings.status", "Production").
    Limit(50).
    Execute(ctx)
```

**Example: reflib helpers (NATS-based)**

```go
package reflib

// CreateRef creates a typed ref via NATS
func CreateRef(ctx context.Context, nats *natslib.Client, input *CreateRefInput) (*models.Ref, error) {
    // Validate ref structure
    if err := ValidateRef(input); err != nil {
        return nil, err
    }

    // Build NATS subject
    subject := fmt.Sprintf("rubix.%s.%s.refs.create", input.OrgID, input.DeviceID)

    // Request/reply via NATS
    resp, err := nats.Request(subject, input, 5*time.Second)
    if err != nil {
        return nil, err
    }

    var ref models.Ref
    if err := json.Unmarshal(resp.Data, &ref); err != nil {
        return nil, err
    }

    return &ref, nil
}

// Usage in PLM:
reflib.CreateRef(ctx, natsClient, &reflib.CreateRefInput{
    OrgID:      orgID,
    DeviceID:   deviceID,
    RefName:    "productRef",
    FromNodeID: unitID,
    ToNodeID:   productID,
})
```

**Benefits:**

- Other plugins can use same helpers
- Reduces code duplication across plugins
- Consistent patterns for node/ref management
- Easier onboarding for new plugin developers

---

### RxAI Integration (AI-Powered PLM)

**What is RxAI?**

RxAI is rubix's built-in AI agent that can:
- Create/update/delete nodes using business logic
- Query nodes with natural language
- Troubleshoot issues
- Automate repetitive tasks

**PLM + RxAI Use Cases:**

#### **1. Natural Language Product Creation**

```
User: "Create a new hardware product called EdgeController with code EC-5000, price $299"

RxAI:
1. Calls plmService.CreateProduct() via business layer
2. Validates product code uniqueness
3. Creates plm.product node
4. Creates default revision v1.0.0
5. Reports: "Created EdgeController (EC-5000) with initial revision v1.0.0"
```

#### **2. Bulk Unit Creation**

```
User: "Create 100 units for manufacturing run #157 with serial numbers starting at SC-00015000"

RxAI:
1. Verifies run #157 exists
2. Calls manufacturingService.GenerateUnits(runID: "run_157", count: 100, startSN: "SC-00015000")
3. Business layer creates 100 plm.unit nodes with:
   - runRef → run_157
   - productRef (auto-computed from run)
   - Serial numbers SC-00015000 to SC-00015099
4. Reports: "Created 100 units for run #157 (SC-00015000 to SC-00015099)"
```

#### **3. RMA Workflow Automation**

```
User: "Create an RMA for unit SC-00012345, issue is faulty sensor, priority high"

RxAI:
1. Searches for unit: i has 'unit' and settings.serialNumber is 'SC-00012345'
2. Calls workItemService.CreateRMA()
3. Business layer:
   - Creates plm.work-item node (type: RMA, priority: High)
   - Links unitRef → unit_12345
   - Updates unit identity tags: shipped → rma
   - Triggers approval workflow
4. Reports: "Created RMA #789 for unit SC-00012345. Approval pending."
```

#### **4. Product Status Reports**

```
User: "How many SmartController units are in the field with firmware v3.0.5?"

RxAI:
1. Searches for product: i has 'product' and name contains 'SmartController'
2. Gets productRef from product node
3. Queries units: productRef is 'prod_001' and i has 'unit' and i has 'installed' and settings.firmwareVersion is 'v3.0.5'
4. Reports: "Found 18 SmartController units in field with firmware v3.0.5
            Locations:
            - ACME Corp Building A: 10 units
            - GlobalTech HQ: 8 units"
```

#### **5. Warranty Expiration Check**

```
User: "Which units have warranties expiring in the next 30 days?"

RxAI:
1. Calculates date range (today + 30 days)
2. Queries: i has 'unit' and settings.warrantyEnd >= 'today' and settings.warrantyEnd <= 'today+30days'
3. Calls customerService.GetCustomerForUnit() for each unit
4. Reports: "5 units with expiring warranties:
            - SC-00012340 (ACME Corp) - Expires 2026-04-10
            - SC-00012341 (GlobalTech) - Expires 2026-04-15
            ..."
```

#### **6. BOM Cost Calculation**

```
User: "What's the total cost to build SmartController v3.1?"

RxAI:
1. Finds product revision: i has 'revision' and parentRef->name is 'SmartController' and settings.version is 'v3.1'
2. Calls productService.CalculateBOMCost(revisionID)
3. Business layer:
   - Queries BOM items: parentRef is 'rev_v3.1' and i has 'bom-item'
   - For each item: gets partRef->cost * quantity
   - Sums total
4. Reports: "SmartController v3.1 BOM cost: $127.50
            Breakdown:
            - PCB: $45.00
            - Enclosure: $22.00
            - Components: $60.50"
```

**How RxAI Accesses PLM:**

```
RxAI Tools (internal/libs/rubixai/pkg/tools/)
├─ plm_create_product.go      → Calls business/plm/product.CreateProduct()
├─ plm_create_unit.go          → Calls business/plm/manufacturing.GenerateUnits()
├─ plm_create_rma.go           → Calls business/plm/workitem.CreateRMA()
├─ plm_query_units.go          → Calls business/plm/manufacturing.QueryUnits()
└─ plm_calculate_bom_cost.go   → Calls business/plm/product.CalculateBOMCost()

All tools use the SAME business logic as HTTP API ✅
```

**Benefits:**

- No manual clicking through UI
- Natural language interface for PLM tasks
- Bulk operations made easy
- Troubleshooting assistance
- Validation/constraints respected (same rules as API)

---

### Code Organization Summary

```
Plugin Code Organization (nube.plm):

plugins/nube.plm/                     → NATS Handler Layer
├─ main.go                            → Plugin entry point + NATS setup
├─ handlers/                          → NATS message handlers
│  ├─ product_handler.go             → Subscribe: *.plm.*.*.product.*
│  ├─ unit_handler.go                → Subscribe: *.plm.*.*.unit.*
│  └─ workitem_handler.go            → Subscribe: *.plm.*.*.workitem.*
└─ frontend/                          → React widgets (Module Federation)
   └─ dist-frontend/                 → Built frontend (served statically)

internal/business/plm/                → Business logic (shared)
├─ product/service.go                → ProductService (reused by NATS + RxAI)
├─ manufacturing/service.go          → ManufacturingService
├─ workitem/service.go               → WorkItemService
└─ ...

internal/libs/rubixai/pkg/tools/     → RxAI tools (AI interface)
├─ plm_create_product.go             → Calls business/plm/product.CreateProduct()
└─ ...

rubix-plugin/                         → Generic library (all plugins use)
├─ natslib/                          → NATS helpers (EXISTING)
├─ nodelib/                          → Node helpers via NATS (NEW)
├─ reflib/                           → Ref helpers via NATS (NEW)
└─ querylib/                         → Query helpers (NEW)
```

**Development Workflow:**

1. **Implement business logic** in `internal/business/plm/`
   - Write service with validation/workflows
   - Write unit tests (no NATS dependencies)

2. **Extract generic patterns** to `rubix-plugin/`
   - If other plugins could use it → extract to library
   - Example: Serial number generation → `rubix-plugin/generatorlib/`

3. **Add NATS handler** in `plugins/nube.plm/handlers/`
   - Subscribe to NATS subject
   - Deserialize message, call business layer service
   - Publish response to reply subject

4. **Add RxAI tool** in `internal/libs/rubixai/pkg/tools/`
   - Call same business layer service
   - Format AI-friendly responses

5. **Frontend** in `plugins/nube.plm/frontend/`
   - Frontend calls rubix HTTP API (not plugin directly)
   - Rubix HTTP API → publishes NATS message → plugin responds
   - Display data in widgets/pages

**Result:** Same logic, three interfaces (NATS, RxAI, UI) ✅

---

## Implementation Roadmap

### Phase 1: Foundation ✅ (Complete)

**Duration:** 2-3 days
**Status:** ✅ Complete

**Delivered:**
- Product node type (`plm.product`)
- CRUD operations
- Plugin hooks
- Product table widget
- Interactive UI elements

---

### Phase 2: Product Types & Versioning

**Duration:** 3-4 weeks
**Effort:** ~15-20 days

**Goals:**
- Support Hardware, Software, Firmware, Hybrid product types
- Revision management (version history)
- BOM editor (hardware products)
- Git integration (software products)

**Deliverables:**

**2.1 Product Type System** (Week 1)
- [ ] Add `product_type` field (Hardware, Software, Firmware, Hybrid)
- [ ] Product type-specific forms
- [ ] Type-specific validation rules
- [ ] Migration for existing products

**2.2 Revision Management** (Week 1-2)
- [ ] `plm.revision` node type
- [ ] Revision nodes as children of product (parentRef)
- [ ] Version numbering in settings (semver)
- [ ] Revision history viewer (query: `parentRef is '{productId}'`)
- [ ] Compare revisions UI
- [ ] Rollback capability

**2.3 BOM Editor (Hardware)** (Week 2-3)
- [ ] `plm.part` node type (parts catalog)
- [ ] `plm.bom-item` node type (links product → part)
- [ ] BOM items as children of revision (parentRef)
- [ ] `partRef` to link BOM item → part (with quantity metadata)
- [ ] BOM editor UI component
- [ ] Cost calculation (BOM rollup via refs)
- [ ] Part inventory tracking (settings.stockLevel)
- [ ] Supplier management (settings.suppliers array)

**2.4 Software Version Entry (Week 3-4)**
- [ ] Manual software version entry form
- [ ] Release notes/changelog field
- [ ] Version history timeline
- [ ] Software product dashboard
- [ ] Compatibility rules UI

**Success Metrics:**
- Can define hardware product with 20-part BOM
- Can track software product with 10 versions (manual entry)
- Software version entry takes < 2 minutes
- BOM cost calculation < 100ms

---

### Phase 3: Manufacturing & Serialization

**Duration:** 3-4 weeks
**Effort:** ~15-20 days

**Goals:**
- Production run management
- Serial number generation/tracking
- QA test recording
- Inventory management

**Deliverables:**

**3.1 Manufacturing Runs** (Week 1)
- [ ] `plm.run` node type
- [ ] Create run from product revision (productRef + revisionRef)
- [ ] BOM snapshot in settings (frozen at run creation)
- [ ] Material consumption tracking (settings.consumed array)
- [ ] Run status in identity tags (planned, active, complete)

**3.2 Serial Number Management** (Week 1-2)
- [ ] `plm.unit` node type (serialized units)
- [ ] Units as children of run (parentRef + runRef)
- [ ] Serial number generation (configurable format in settings)
- [ ] QR code generation (per unit)
- [ ] Unit status in identity tags (manufactured, tested, shipped, installed)
- [ ] Bulk unit creation API
- [ ] Bulk serial number print

**3.3 QA Testing** (Week 2-3)
- [ ] `plm.qa-test` node type
- [ ] Test nodes as children of unit (parentRef)
- [ ] Plugin table for detailed test data (millions of readings)
- [ ] Test templates (Functional, Calibration, Visual)
- [ ] Test recording UI (tablet-friendly)
- [ ] Pass/fail/retest workflow (identity tags)
- [ ] Calibration data in settings
- [ ] Test report generation (PDF)

**3.4 Inventory Tracking** (Week 3-4)
- [ ] Part inventory via settings.stockLevel on plm.part nodes
- [ ] Material consumption via run → BOM → parts queries
- [ ] Low stock alerts (query: `i has 'part' and settings.stockLevel < settings.reorderPoint`)
- [ ] Supplier reorder tracking (settings.suppliers + reorder status)
- [ ] Inventory dashboard (aggregated from nodes)

**Success Metrics:**
- Can create production run for 500 units in < 1 minute
- Serial number generation for 1000 units in < 5 seconds
- QA test entry takes < 30 seconds per unit
- Inventory accuracy within 2%

---

### Phase 4: Software Deployment Tracking

**Duration:** 2-3 weeks
**Effort:** ~10-15 days

**Goals:**
- Track software deployments across environments
- Manual deployment recording
- Environment-specific version tracking
- Deployment history

**Deliverables:**

**4.1 Environment Management** (Week 1)
- [ ] `plm.environment` node type (dev, staging, prod)
- [ ] Environment configuration in settings
- [ ] Environment status dashboard
- [ ] Environment comparison view (query-based)

**4.2 Deployment Tracking** (Week 1-2)
- [ ] `plm.deployment` node type
- [ ] Deployment nodes as children of environment (parentRef)
- [ ] `environmentRef` to link deployment → environment
- [ ] `productRef` to link deployment → software product
- [ ] Record deployment events via API
- [ ] Deployment history query: `environmentRef is 'env_prod' | sort createdAt desc`
- [ ] Rollback tracking (previous deployment ref)
- [ ] Deployment timeline view

**4.3 Deployment Recording** (Week 2-3)
- [ ] Manual deployment entry form
- [ ] Deployment approval workflow (settings.approvals array)
- [ ] Email/Slack notifications
- [ ] Deployment notes/changelog in settings
- [ ] Quick-entry shortcuts

**4.4 Compatibility Matrix** (Week 2-3)
- [ ] Compatibility rules in product settings.compatibility
- [ ] `requiresRef` to link products with version constraints
- [ ] Define version constraints (FW >= 2.0) in metadata
- [ ] Compatibility checker (query refs + parse semver)
- [ ] Warning UI for incompatible versions
- [ ] Field unit compatibility report (query: units with incompatible versions)

**Success Metrics:**
- Deployment entry takes < 2 minutes
- Compatibility check runs in < 200ms
- 100% of deployments tracked
- Zero incompatible deployments to production

---

### Phase 5: Field Deployment & Updates

**Duration:** 2-3 weeks
**Effort:** ~10-15 days

**Goals:**
- Track where units are installed
- Customer/site management
- Firmware/software update tracking
- Update campaign management

**Deliverables:**

**5.1 Customer & Site Management** (Week 1)
- [ ] `plm.customer` node type
- [ ] `plm.customer-site` node type (child of customer)
- [ ] Customer contact management in settings
- [ ] Site address/location in settings (lat/lon for maps)
- [ ] Customer portal (query units: `customerSiteRef->customerRef is '{customerId}'`)

**5.2 Field Installation** (Week 1-2)
- [ ] `plm.installation` node type
- [ ] `customerSiteRef` to link unit → customer site
- [ ] `unitRef` to link installation → unit
- [ ] Installation date in settings
- [ ] Installer information in settings
- [ ] Installation photos/docs as attachments (rubix file upload)
- [ ] Field unit map view (query units with site lat/lon, render on Google Maps)

**5.3 Update Campaigns** (Week 2-3)
- [ ] `plm.update-campaign` node type
- [ ] Define target units via query filter in settings (e.g., "runRef is 'run_157'")
- [ ] Gradual rollout settings (10% per day)
- [ ] Plugin table for per-unit update status (millions of updates)
- [ ] Success/failure tracking in plugin table
- [ ] Auto-retry failed updates (logic in settings)

**5.4 Update History** (Week 3)
- [ ] Plugin table `update_history` (links to unit node via unitId)
- [ ] Track all firmware/software updates
- [ ] Before/after versions
- [ ] Update method (OTA, manual, USB)
- [ ] Update timeline visualization (query plugin table + aggregate)

**Success Metrics:**
- Can identify all units at a customer site in < 500ms
- Update campaign setup takes < 5 minutes
- Update success rate > 95%
- Full update history for any unit in < 1 second

---

### Phase 6: Service & Support

**Duration:** 3-4 weeks
**Effort:** ~15-20 days

**Goals:**
- RMA workflow automation
- Work item tracking (bugs, features, issues)
- Warranty management
- Service history

**Deliverables:**

**6.1 Work Item System** (Week 1-2)
- [ ] `plm.work-item` node type
- [ ] Work item types in identity tags (rma, bug, feature, question)
- [ ] Status in identity tags (open, in-progress, resolved, closed)
- [ ] Priority in settings
- [ ] Assignment to team members (settings.assignedTo)
- [ ] `unitRef` to link work item → unit
- [ ] `productRef` to link work item → product
- [ ] Work item dashboard (query: `i has 'work-item' and i has 'open'`)

**6.2 RMA Workflow** (Week 2-3)
- [ ] RMA request form (creates plm.work-item with type=rma)
- [ ] Approval workflow in settings
- [ ] Return shipping tracking in settings
- [ ] Repair/replace decision (settings.resolution)
- [ ] RMA cost tracking (settings.cost)
- [ ] Customer communication templates
- [ ] Update unit identity tags (installed → rma → repaired → installed)

**6.3 Warranty Tracking** (Week 3)
- [ ] Warranty start/end dates in unit settings
- [ ] Warranty status checker (query: `i has 'unit' and settings.warrantyEnd < 'today'`)
- [ ] Expiration alerts (scheduled query + notifications)
- [ ] Warranty claim tracking
- [ ] Extended warranty management

**6.4 Service History** (Week 3-4)
- [ ] `plm.work-log` node type (child of work item)
- [ ] Plugin table for detailed work logs (high volume)
- [ ] Time tracking per work item (settings.hoursSpent)
- [ ] Notes and updates in work log nodes
- [ ] Resolution documentation in work item settings
- [ ] Service report generation (PDF from node data)
- [ ] Unit service history view (query: `unitRef is '{unitId}' and i has 'work-item'`)

**Success Metrics:**
- RMA workflow reduces manual steps by 80%
- Work item creation takes < 2 minutes
- Warranty status lookup in < 500ms
- Service history complete for 100% of units

---

### Phase 7: Analytics & Reporting

**Duration:** 2-3 weeks
**Effort:** ~10-15 days

**Goals:**
- Product analytics dashboard
- Manufacturing metrics
- Field deployment insights
- Service metrics

**Deliverables:**

**7.1 Product Analytics** (Week 1)
- [ ] Product performance dashboard
- [ ] Top products (by units, revenue)
- [ ] Product lifecycle view
- [ ] Cost analysis (BOM vs. selling price)
- [ ] Product roadmap timeline

**7.2 Manufacturing Metrics** (Week 1-2)
- [ ] Production run metrics
- [ ] QA pass/fail rates
- [ ] Manufacturing cycle time
- [ ] Cost per unit (actual vs. target)
- [ ] Material waste tracking

**7.3 Field Deployment Insights** (Week 2)
- [ ] Deployment map (geographic)
- [ ] Version distribution (what's in field)
- [ ] Update campaign effectiveness
- [ ] Customer adoption metrics
- [ ] Installation trends

**7.4 Service Metrics** (Week 2-3)
- [ ] RMA rate (by product, by revision)
- [ ] Mean time to repair (MTTR)
- [ ] Work item resolution time
- [ ] Top failure modes
- [ ] Customer satisfaction tracking

**7.5 Executive Dashboard** (Week 3)
- [ ] High-level KPIs (one page)
- [ ] Product health score
- [ ] Revenue tracking
- [ ] Team performance metrics
- [ ] Export to PDF/PowerPoint

**Success Metrics:**
- Dashboard loads in < 2 seconds
- All metrics update in real-time
- Executive dashboard answers 90% of questions
- Zero manual report generation needed

---

### Phase 8: Git/GitHub Integration (Optional)

**Duration:** 2-3 weeks
**Effort:** ~10-15 days

**Status:** ⭐ **OPTIONAL** - System fully functional without this

**Goals:**
- Auto-import releases from Git repositories
- Reduce manual data entry for software products
- Link PLM to GitHub/GitLab
- Auto-sync deployments via webhooks

**Deliverables:**

**8.1 Git Repository Integration** (Week 1)
- [ ] Link Git repo URL to product
- [ ] GitHub API integration
- [ ] GitLab API integration
- [ ] Gitea support
- [ ] Authentication/tokens management

**8.2 Release Auto-Import** (Week 1-2)
- [ ] Import releases from GitHub API
- [ ] Auto-detect new tags (webhook or polling)
- [ ] Parse changelog from GitHub releases
- [ ] Import release notes automatically
- [ ] Handle rate limits gracefully

**8.3 CI/CD Webhook Integration** (Week 2-3)
- [ ] Webhook receiver (GitHub Actions, GitLab CI)
- [ ] Auto-record deployments
- [ ] Build status tracking
- [ ] Trigger PLM actions on deploy
- [ ] Webhook security (signature verification)

**8.4 Dependency Scanning** (Week 3)
- [ ] Auto-import package.json dependencies
- [ ] Auto-import go.mod dependencies
- [ ] Auto-import requirements.txt (Python)
- [ ] Vulnerability scanning integration
- [ ] License compliance checking

**Success Metrics:**
- Git releases auto-import within 5 minutes
- Deployment webhooks succeed 99.9% of time
- Dependency import accuracy > 98%
- Zero manual entry for software versions (if enabled)

**Why Optional:**
- Core PLM fully functional with manual entry
- Not all teams use GitHub/GitLab
- Some teams prefer manual control
- Adds complexity and external dependencies
- Can be added later without breaking changes

---

## Timeline Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│ PLM CORE IMPLEMENTATION (10-14 weeks)                                │
└─────────────────────────────────────────────────────────────────────┘

Week 1-4:   Phase 2 - Product Types & Versioning
            ├─ Product type system
            ├─ Revision management
            ├─ BOM editor
            └─ Software version entry (manual)

Week 5-8:   Phase 3 - Manufacturing & Serialization
            ├─ Manufacturing runs
            ├─ Serial numbers
            ├─ QA testing
            └─ Inventory tracking

Week 9-11:  Phase 4 - Software Deployment Tracking
            ├─ Environment management
            ├─ Manual deployment recording
            ├─ Deployment approval workflow
            └─ Compatibility matrix

Week 12-14: Phase 5 - Field Deployment & Updates
            ├─ Customer/site management
            ├─ Field installation
            ├─ Update campaigns
            └─ Update history

Week 15-18: Phase 6 - Service & Support
            ├─ Work item system
            ├─ RMA workflow
            ├─ Warranty tracking
            └─ Service history

Week 19-21: Phase 7 - Analytics & Reporting
            ├─ Product analytics
            ├─ Manufacturing metrics
            ├─ Field insights
            ├─ Service metrics
            └─ Executive dashboard

┌─────────────────────────────────────────────────────────────────────┐
│ CORE SYSTEM: 10-14 weeks (50-70 work days)                           │
│ Team: 2-3 developers                                                 │
│ Effort: ~120-170 person-days                                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ OPTIONAL: Phase 8 - Git/GitHub Integration                           │
└─────────────────────────────────────────────────────────────────────┘

Week 22-24: ⭐ Phase 8 - Git Integration (Optional)
            ├─ Git repository integration
            ├─ Release auto-import
            ├─ CI/CD webhook integration
            └─ Dependency scanning

┌─────────────────────────────────────────────────────────────────────┐
│ WITH GIT INTEGRATION: 12-17 weeks (60-85 work days)                  │
│ Additional effort: ~10-15 person-days                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Success Criteria

### Team Adoption (3 months post-launch)

- [ ] **80% of team** uses PLM daily
- [ ] **100% of products** tracked in system
- [ ] **Zero spreadsheets** for product tracking
- [ ] **100% of serial numbers** generated via PLM
- [ ] **All RMAs** processed through PLM workflow

### Efficiency Gains

- [ ] **50% reduction** in time to create production run
- [ ] **50% reduction** in product tracking overhead (centralized system)
- [ ] **30% faster** RMA processing time
- [ ] **Zero lost serial numbers** (was ~5% with spreadsheets)
- [ ] **Real-time visibility** into product status (was daily/weekly)

### Data Quality

- [ ] **100% accuracy** on BOM costs
- [ ] **100% traceability** for serialized units
- [ ] **Zero manual errors** in version tracking
- [ ] **Complete audit trail** for all changes
- [ ] **Warranty data complete** for all field units

### Business Impact

- [ ] **Faster time to market** (coordinated releases)
- [ ] **Reduced RMA costs** (better diagnosis, warranty tracking)
- [ ] **Improved customer satisfaction** (faster support)
- [ ] **Better forecasting** (data-driven product planning)
- [ ] **Single source of truth** (no conflicting information)

---

## Technical Decisions

### Why Plugin Architecture?

**Pros:**
- Isolated from core rubix (faster iteration)
- Can be enabled/disabled per org
- Extensible (other plugins can integrate)
- Easier testing (plugin-specific tests)

**Cons:**
- More complex deployment (plugin + frontend)
- Additional NATS communication overhead

**Decision:** ✅ Plugin architecture - flexibility outweighs complexity

---

### Why Node-Based Storage?

**Pros:**
- Consistent with rubix patterns
- Leverages existing permissions
- Hierarchical organization (products → revisions)
- Haystack query syntax

**Cons:**
- JSONB settings less structured than dedicated tables
- Query performance concerns at scale

**Decision:** ✅ Hybrid approach
- Core product data: Nodes (settings JSONB)
- Related data: Dedicated tables (BOMs, units, tests)
- Best of both worlds

---

### Why is Git Integration Optional?

**System works fully without it:**
- Manual version entry is fast (< 2 minutes)
- Teams have full control over data
- No external dependencies
- Simpler architecture

**Pros of adding Git integration:**
- Reduces manual data entry (90% reduction)
- Automatic changelog import
- Sync with existing workflow
- Dependency scanning

**Cons of Git integration:**
- Requires webhook/API integration
- External dependency (GitHub/GitLab uptime)
- More complex setup
- Authentication/token management

**Decision:** ⭐ **Optional** (Phase 8)
- Core system fully functional without it
- Teams can choose to enable later
- Manual entry is the default path
- Git integration is a productivity enhancement, not a requirement

---

### Why Module Federation for UI?

**Pros:**
- Native React integration (no iframes)
- Shared dependencies (smaller bundle)
- Live updates (no rubix rebuild)
- Consistent UX with rubix

**Cons:**
- More complex build setup
- Version compatibility concerns

**Decision:** ✅ Module Federation v2
- Already proven in rubix ecosystem
- Widget + full-page support
- Development velocity > complexity

---

## Risk Mitigation

### Risk 1: Scope Creep

**Mitigation:**
- Strict phase boundaries (ship Phase 2 before starting Phase 3)
- MVP mindset (80% solution is fine)
- User feedback between phases (validate before expanding)

### Risk 2: User Adoption of Manual Entry

**Risk:** Users may find manual version entry tedious

**Mitigation:**
- Quick-entry forms (< 2 minutes per entry)
- Keyboard shortcuts for power users
- Bulk import from CSV/Excel
- Git integration available as upgrade path (Phase 8)
- Templates for common entries

### Risk 3: Data Migration (Existing Products)

**Mitigation:**
- Migration scripts for each phase
- Backward compatibility (old data still works)
- Gradual migration (not big-bang)
- Rollback plan for each phase

### Risk 4: Team Adoption

**Mitigation:**
- Early user testing (Phase 2)
- Training sessions (per phase)
- Champion users (power users first)
- Feedback loop (weekly check-ins)

### Risk 5: Performance at Scale

**Mitigation:**
- Database indexing (queries < 500ms)
- Pagination for large lists
- Caching for expensive queries (BOM rollup)
- Load testing (1000 products, 10,000 units)

---

## Next Steps

### Immediate (Next 2 Weeks)

1. **Validate vision** with stakeholders
   - Product team
   - Manufacturing team
   - Support team
   - Engineering team

2. **Refine Phase 2 scope**
   - Detailed task breakdown
   - UI mockups for BOM editor
   - UI mockups for manual version entry
   - Database schema design

3. **Set up development environment**
   - Prototype BOM editor UI
   - Prototype software version entry form
   - Performance testing (revision queries)

4. **Create project tracking**
   - GitHub project board
   - Milestones per phase
   - Assign initial tasks

### Medium-Term (1-2 Months)

1. **Complete Phase 2** (Product Types & Versioning)
2. **User testing** with 3-5 team members
3. **Iterate** based on feedback
4. **Begin Phase 3** (Manufacturing)

### Long-Term (3-6 Months)

1. **Complete Phases 3-7**
2. **Full team rollout**
3. **Measure success metrics**
4. **Plan v2.0 features** (AI-powered insights, mobile app, etc.)

---

## Related Documents

- [Current Status](./PLM_PLUGIN_STATUS.md) - Phase 1 implementation details
- [Original Overview](./OVERVIEW.md) - Hardware-focused initial design
- [Plugin Backend](../plugins/BACKEND.md) - Plugin architecture
- [Plugin Frontend](../plugins/FRONTEND.md) - Module Federation setup

---

**Document Owner:** Product Team
**Last Updated:** 2026-03-20
**Next Review:** After Phase 2 completion

---

**Questions? Feedback?**
Open an issue or discuss in #plm-plugin Slack channel
