# PLM Plugin - Overview

**Product Lifecycle Management (PLM) System**

---

## Current Status

**Phase 1 Complete:** Basic product management with CRUD operations, plugin hooks, and interactive widget.

See [PLM_PLUGIN_STATUS.md](./PLM_PLUGIN_STATUS.md) for current implementation details, testing instructions, and working features.

---

## Vision: Complete Product Lifecycle Platform

A unified system to manage the full lifecycle of products from design through manufacturing to service.

### Core Concepts

**Products & Parts**
- Versioned products with revision history
- Parts inventory and suppliers
- Bill of Materials (BOM) tracking
- Product dependencies (product uses other products as components)

**Manufacturing**
- Production runs with BOM snapshots
- Serialized unit tracking
- QA test records and calibration
- Material consumption tracking

**Service & Support**
- RMA (Return Merchandise Authorization) workflow
- Work items (issues, tasks, feature requests)
- Warranty tracking per serialized unit
- Customer/site management

**Documents**
- Attachments for products, parts, units
- Specs, drawings, manuals, certifications
- Versioned with parent entity

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCT LIFECYCLE PLATFORM                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 1. PRODUCTS & PARTS (Phase 1-2)                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Products ──→ Product Revisions ──→ Dependencies (BOM)           │
│      │              │                      │                     │
│      │              │                      ↓                     │
│      │              │                   Parts ──→ Suppliers      │
│      │              │                                            │
│      ↓              ↓                                            │
│   Settings      Version History                                 │
│   (JSONB)       (Data Store)                                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 2. MANUFACTURING (Phase 3)                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Manufacturing Runs ──→ BOM Snapshot ──→ Material Consumption    │
│         │                                                         │
│         ↓                                                         │
│  Serialized Units ──→ QA Test Records                           │
│         │                    │                                   │
│         ├─→ Status: Manufactured → Tested → Shipped → Installed  │
│         └─→ Warranty Tracking                                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 3. SERVICE & SUPPORT (Phase 4)                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Serialized Units ──→ Customers / Sites                          │
│         │                                                         │
│         ↓                                                         │
│  Work Items (RMA, Issues, Tasks)                                 │
│         │                                                         │
│         ├─→ RMA Workflow: Open → In Progress → Resolved          │
│         └─→ Work Logs (time tracking, notes)                     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Example

```
1. DESIGN
   Product "Widget Pro v1.0" created
   ├─→ BOM: 4x Screw M4, 2x PCB, 1x Housing
   └─→ Cost calculated: $125.50

2. MANUFACTURING
   Manufacturing Run #42 created
   ├─→ BOM snapshot frozen (Widget Pro v1.0)
   ├─→ Produce 100 units
   └─→ Each unit gets serial number (SN-12345, SN-12346...)

3. QA TESTING
   Unit SN-12345 → QA tests
   ├─→ Functional test: PASS
   ├─→ Calibration: PASS
   └─→ Status: Manufactured → Tested

4. SHIPMENT
   Unit SN-12345 → Customer ACME Corp
   ├─→ Installed at Site "Building A"
   └─→ Warranty start date: 2026-03-01

5. SERVICE
   Issue reported on SN-12345
   ├─→ Work Item #123 created
   ├─→ Diagnosis: Faulty sensor
   ├─→ RMA approved
   └─→ Repair completed, unit returned
```

---

## Phase 1: Basic CRUD (✅ Complete)

**Implemented:**
- Product node type (`plm.product`)
- CRUD operations (create, read, update, delete)
- Plugin hooks (before/after create/update/delete)
- Product Table Widget in scene-builder
- Interactive buttons and dialogs
- REST API integration

**Fields:**
- Name
- Product Code
- Description
- Status (Design, Prototype, Production, Discontinued)
- Price

**See:** [PLM_PLUGIN_STATUS.md](./PLM_PLUGIN_STATUS.md) for implementation details

---

## Phase 2: Versioning & Parts (Planned)

**Products:**
- Add `product_revisions` table
- Track version history (v1.0, v1.1, v2.0, etc.)
- Revision notes and change tracking
- Active revision pointer

**Parts:**
- Add `parts` table
- Part number, description, cost
- Supplier tracking
- Stock levels

**Dependencies (BOM):**
- Add `product_dependencies` table
- Product → Product relationships
- Product → Part relationships
- Quantity per dependency

**Features:**
- View product revision history
- Compare revisions
- Roll back to previous revision
- Calculate product cost from BOM
- Track part inventory

---

## Phase 3: Manufacturing (Planned)

**Manufacturing Runs:**
- Add `manufacturing_runs` table
- Link to product revision (BOM snapshot)
- Quantity to produce
- Start/end dates
- Material consumption tracking

**Serialized Units:**
- Add `serialized_units` table
- Serial number generation
- Link to manufacturing run
- Status tracking (Manufactured → Tested → Shipped → Installed)

**QA Testing:**
- Add `qa_tests` table
- Link to serialized unit
- Test types (Functional, Calibration, Inspection)
- Pass/fail results
- Tester and timestamp

**Features:**
- Create manufacturing run from product BOM
- Generate serial numbers for units
- Record QA test results
- Track unit status through lifecycle

---

## Phase 4: Service & Support (Planned)

**Work Items:**
- Add `work_items` table
- Types: Issue, RMA, Feature Request, Question
- Link to serialized unit
- Status workflow
- Priority and assignment

**Customers & Sites:**
- Add `customers` and `sites` tables
- Track where units are installed
- Customer contact information
- Site addresses

**Work Logs:**
- Add `work_logs` table
- Time tracking per work item
- Notes and updates
- Resolution details

**Features:**
- Create RMA for faulty unit
- Track work item status
- Search units by serial number or site
- Warranty tracking

---

## Technical Implementation

### Current (Phase 1)

**Backend:**
- Go plugin (`rubix-plugin/nube.plm`)
- Plugin hooks via HTTP
- Node CRUD via rubix API
- Query via Haystack filter syntax

**Frontend:**
- React widget (Module Federation v2)
- Product table with CRUD buttons
- Create/Edit dialogs
- Interactive elements work in scene-builder

**Storage:**
- Nodes stored in `rubix_nodes` table
- Settings in JSONB column
- No custom tables yet

### Future Phases

**Storage:**
- Plugin data tables for revisions, parts, BOMs, etc.
- Migrations via `migrations.json`
- Org-scoped tables (e.g., `test_plugintable_nube_plm_parts`)

**API:**
- Additional REST endpoints for complex queries
- BOM calculation endpoints
- Serial number generation
- Work item workflows

**UI:**
- Additional widgets for manufacturing, QA, service
- BOM viewer/editor
- Revision history viewer
- Work item dashboard

---

## Development Roadmap

| Phase | Status | Scope | Estimated Effort |
|-------|--------|-------|------------------|
| **Phase 1** | ✅ Complete | Basic CRUD + Widget + Hooks | 2-3 days |
| **Phase 2** | 🔲 Planned | Versioning + Parts + BOM | 5-7 days |
| **Phase 3** | 🔲 Planned | Manufacturing + Serial Numbers + QA | 7-10 days |
| **Phase 4** | 🔲 Planned | Service + RMA + Work Items | 7-10 days |

**Total estimated time for complete system:** ~21-30 days

**Current investment:** ~3 days (Phase 1 complete)

---

## Key Decisions & Rationale

### Why Plugin-Based?
- **Isolation:** PLM logic separate from core rubix
- **Flexibility:** Can be enabled/disabled per org
- **Extensibility:** Other plugins can integrate with PLM
- **Development speed:** Faster iteration without touching core

### Why Node-Based Storage?
- **Consistency:** Uses rubix's existing node system
- **Hierarchy:** Products can be organized in tree structures
- **Permissions:** Leverages rubix's node permissions
- **Query:** Uses existing Haystack query syntax

### Why Scene-Builder Widgets?
- **Integration:** PLM data visible in dashboards
- **Real-time:** Updates reflected immediately
- **Flexibility:** Users can place widgets where needed
- **Consistency:** Same UI patterns as rest of rubix

---

## Use Cases

**Manufacturing Company:**
- Track product designs and BOMs
- Generate serial numbers during production
- Record QA test results
- Manage warranty and RMA

**Integration Company:**
- Manage custom controller hardware
- Track firmware versions
- Monitor field installations
- Support tickets linked to units

**R&D Team:**
- Version product designs
- Track parts and suppliers
- Estimate costs from BOMs
- Manage prototypes vs production

---

## Related Docs

- **Current Status:** [PLM_PLUGIN_STATUS.md](./PLM_PLUGIN_STATUS.md)
- **Plugin System:** [../plugins/BACKEND.md](../plugins/BACKEND.md)
- **Plugin Frontend:** [../plugins/FRONTEND.md](../plugins/FRONTEND.md)
- **Widgets vs Nodes:** [../plugins/WIDGETS-NODES.md](../plugins/WIDGETS-NODES.md)

---

**Last Updated:** 2026-03-20
