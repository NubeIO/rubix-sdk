# PLM Plugin - V2 Overview

**Rubix-native PLM modeled as nodes, refs, identities, and settings**

---

## Core Principle

PLM in Rubix is not a separate database-shaped subsystem.

It is a set of Rubix node types that model product lifecycle concepts using:

- node types
- parent/child hierarchy
- refs
- identity tags
- settings schemas
- node constraints

This is the key V2 design rule:

- `Products`, `sources`, `releases`, `manufacturing runs`, `units`, `RMAs`, and `work items` are all nodes
- `PLM` is a node-native domain inside Rubix
- `GitHub` is an optional integration target, not the source of truth
- `Work items` live in PLM first and may sync out to GitHub later

---

## V2 Goal

Define a Rubix-native PLM model that makes it easy to:

- assign a Rubix team and owner to a product
- link code, docs, CAD, BOM, and QA artifacts to a product
- create work items directly in PLM
- relate work items to releases, manufacturing runs, units, and RMAs
- let AI query and create PLM nodes using existing Rubix tooling
- optionally sync selected work items to GitHub issues

**Key Design Decision: Maximize Core Node Reuse**

Instead of creating custom `plm.*` types for everything, V2 uses **core nodes with profiles**:

| ❌ V1 Approach (Custom Types) | ✅ V2 Approach (Core + Profiles) |
|-------------------------------|-----------------------------------|
| `plm.product` | `core.product` with PLM profile |
| `plm.document` | `core.document` with PLM profile |
| `plm.release` | `core.release` with PLM profile |
| `plm.unit` | `core.asset` with PLM profile |
| `plm.work-item` | `core.ticket` with PLM profile |
| `plm.rma` | `core.ticket` with RMA profile |
| `plm.time-entry` | `core.entry` with timesheet profile |
| **Result: 7 custom types** | **Result: 1 custom type** |

**Benefits:**
- ✅ Less code to maintain (reuse existing implementations)
- ✅ AI tools work immediately (already understand core types)
- ✅ Query engine works out-of-box (no custom handlers)
- ✅ Frontend components reusable (standard forms/views)
- ✅ Easier upgrades (core nodes evolve with Rubix)

**When to create a custom type:**
- ✅ **Do create custom** when no core node fits (e.g., `plm.manufacturing-run`)
- ❌ **Don't create custom** when core node + profile works (e.g., use `core.entry` not `plm.time-entry`)

---

## Architecture Summary

V2 leverages core nodes wherever possible, requiring only 1 custom PLM type:

```text
auth.org
  └─ rubix.device
      └─ core.service (with plm profile)
          ├─ core.product (with plm profile)
          │   ├─ core.document (sources: repos, docs, CAD, BOM)
          │   ├─ core.release (firmware, backend, frontend)
          │   ├─ plm.manufacturing-run (custom - ONLY custom type)
          │   │   └─ core.asset (units - serialized hardware)
          │   ├─ core.ticket (work-items: bugs, features, tasks)
          │   │   └─ core.entry (time entries, expenses, logs)
          │   └─ core.ticket (RMAs)
          ├─ core.product
          └─ core.product
```

**Core nodes used:**
- `core.service` - PLM service root (serviceName, status, version - operational fields left empty)
- `core.product` - Product catalog + lifecycle (SKU, specs, pricing, manufacturer)
- `core.document` - Sources (URL, localPath, version, author, documentType)
- `core.release` - Releases (version, buildRef, releaseNotes, compatibility, checksums)
- `core.asset` - Units (serialNumber, hardwareRevision, firmwareVersion, warranty)
- `core.ticket` - Work items + RMAs (priority, status, assignee, dates, resolution)
- `core.entry` - Time entries, expenses, logs (hours, amount, date, userId, billable)

**Custom types (only 1):**
- `plm.manufacturing-run` - Manufacturing-specific (no core equivalent)

**Why this works:**
- **Core nodes first**: Reuse existing schemas instead of creating custom types
- **Identity tags**: Differentiate same-type nodes (e.g., `core.ticket` with `[work-item, bug]` vs `[rma]`)
- **Node profiles**: Add PLM-specific defaults and validation via `config/nodes.yaml`
- **Rich schemas**: Core nodes provide comprehensive field sets out of the box
- **Only 1 custom type**: `plm.manufacturing-run` is the ONLY custom type needed

**Impact: 7 fewer custom nodes to build, test, and maintain!**

Without core node reuse, you'd need custom types for:
- ❌ `plm.product` (now `core.product`)
- ❌ `plm.document` (now `core.document`)
- ❌ `plm.release` (now `core.release`)
- ❌ `plm.unit` (now `core.asset`)
- ❌ `plm.work-item` (now `core.ticket`)
- ❌ `plm.rma` (now `core.ticket`)
- ❌ `plm.time-entry` (now `core.entry`)
- ✅ `plm.manufacturing-run` (truly custom - no core equivalent)

This keeps the hierarchy easy to browse while still allowing cross-links via refs.

### Node Type Mapping Summary

| PLM Concept | Node Type | Why Core Node? |
|-------------|-----------|----------------|
| PLM Service | `core.service` | Service root with identity `["service", "plm"]` - operational fields left empty |
| Products | `core.product` | Perfect fit - catalog data + lifecycle tracking |
| Sources | `core.document` | Repos/docs/CAD/BOM are documents (URL, localPath, version) |
| Releases | `core.release` | Perfect - version, buildRef, releaseNotes, approvals, checksums |
| Manufacturing Runs | `plm.manufacturing-run` (custom) | Manufacturing-specific - no core equivalent - ONLY custom type |
| Units | `core.asset` | Assets with serialNumber, hardwareRevision, warranty |
| Work Items | `core.ticket` | Tickets with priority, status, assignee, dates, resolution |
| RMAs | `core.ticket` | Service tickets - same schema as work items |
| Time Entries | `core.entry` | Granular records - time, expenses, logs (queryable, not JSON arrays) |

**Result: 1 custom type, 7 core nodes with PLM profiles**

---

## Why This Fits Rubix

This design works well because Rubix already provides the hard parts:

- node creation and validation
- parent/child constraints
- refs for cross-tree relationships
- identity tags for discovery and filtering
- query engine for node search
- permissions and team-aware workflows
- AI tools that already create and query nodes

V2 should therefore focus on:

- ~~defining PLM node types~~ → **Use core nodes with profiles**
- ~~defining settings schemas~~ → **Core schemas already exist**
- defining ref patterns (productRef, runRef, unitRef, etc.)
- defining query patterns (identity tags + refs)
- defining UI views for these nodes (plugin frontend)
- defining node profiles (defaults, validation, identity auto-tagging)

**Not on inventing custom node types or a second persistence model.**

---

## How to Use Core Nodes in Your PLM Plugin

**Step 1: Declare core types in `plugin.json`**

```json
{
  "id": "plm",
  "vendor": "nube",
  "name": "plm",
  "displayName": "Product Lifecycle Management",
  "nodeTypes": ["plm.manufacturing-run"],
  "coreNodeTypes": [
    "core.service",
    "core.product",
    "core.document",
    "core.release",
    "core.asset",
    "core.ticket",
    "core.entry"
  ]
}
```

**Step 2: Create profiles in `config/nodes.yaml`**

```yaml
version: 1

# Custom type (only when truly needed)
nodeTypes:
  - type: plm.manufacturing-run
    baseType: core.base
    displayName: Manufacturing Run
    autoIdentity: [manufacturing, plm, run]
    # ... rest of config

# Core node profiles (most of your work)
nodeProfiles:
  # PLM service root
  - nodeType: core.service
    profile: plm-service
    identity: [service, plm]
    defaults:
      serviceName: "PLM Service"
    validation:
      required: [serviceName]

  # Products
  - nodeType: core.product
    profile: plm-product
    identity: [product, plm]
    defaults:
      category: "hardware"
    validation:
      required: [productCode, manufacturer]

  # Work items
  - nodeType: core.ticket
    profile: plm-work-item
    identity: [ticket, work-item, plm]
    defaults:
      ticketType: "task"
      status: "todo"
    validation:
      required: [title, assignee]

  # Time entries
  - nodeType: core.entry
    profile: plm-timesheet
    identity: [entry, timesheet, plm]
    defaults:
      entryType: "timesheet"
      billable: true
    validation:
      required: [hours, date, userId]
      rules:
        hours:
          min: 0.01
          max: 24
```

**Step 3: That's it!**

No Go code needed for core nodes - Rubix handles:
- ✅ Node creation and validation
- ✅ Settings schema validation
- ✅ Port creation
- ✅ Runtime execution
- ✅ Query support
- ✅ AI tool integration

**Only write Go code for:**
- Custom types (`plm.manufacturing-run`)
- Custom business logic
- External integrations (GitHub sync, etc.)

---

## Recommended Node Hierarchy

### Service Root

Use a singleton service root as the PLM domain anchor.

```text
rubix.device
  └─ core.service (with plm profile)
      └─ identity: ["service", "plm"]
```

Recommended constraints:

- `type`: `core.service`
- `identity`: `["service", "plm"]`
- `MaxOneNode`: `true`
- `MustLiveUnderParent`: `true`
- `AllowedParents`: `["rubix.device"]`
- `AllowCascadeDelete`: `true`

### Product As The Main Anchor

Each product should be a first-class child of the PLM service.

```text
core.service
  └─ core.product (with plm profile)
      └─ identity: ["product", "plm"]
```

Recommended constraints:

- `type`: `core.product`
- `identity`: `["product", "plm"]`
- `MaxOneNode`: `false`
- `MustLiveUnderParent`: `true`
- `AllowedParents`: `["plm.service"]`

### Product-Owned Children

Most lifecycle records should live under the product for discoverability and traceability.

```text
core.product
  ├─ core.document (sources)
  │   └─ identity: ["document", "source", "github"]
  ├─ core.release
  │   └─ identity: ["release", "firmware", "plm"]
  ├─ plm.manufacturing-run (custom)
  │   └─ core.asset (units)
  │       └─ identity: ["asset", "unit", "plm"]
  ├─ core.ticket (RMAs)
  │   └─ identity: ["ticket", "rma", "plm"]
  └─ core.ticket (work items)
      └─ identity: ["ticket", "work-item", "bug"]
```

This gives a clean browsing model:

- open product (core.product)
- see all sources as documents (core.document)
- see releases with versions/checksums (core.release)
- see manufacturing history (plm.manufacturing-run)
- see units as assets (core.asset)
- see service/RMA tickets (core.ticket with rma identity)
- see engineering work items (core.ticket with work-item identity)

---

## Node Type Registry

The following is the recommended V2 node model using core nodes with PLM profiles.

### `core.service` (PLM root)

**Type**: Core node with PLM profile

**Purpose**
- Singleton PLM root for the Rubix device/org
- Organizational anchor using core service node

**Identity**
- `["service", "plm"]`

**Parent Constraints**
- Under `rubix.device`
- `MaxOneNode: true`

**Core Settings (from core.service)**

Most operational fields left empty/default:

```json
{
  "serviceName": "Product Lifecycle Management",
  "serviceType": "plm",
  "status": "active",
  "version": "2.0",
  "host": "",
  "port": 0,
  "protocol": "",
  "endpoint": "",
  "authenticated": false,
  "authType": "",
  "healthCheckUrl": "",
  "timeout": 30,
  "tags": "plm,lifecycle",
  "notes": "PLM domain root"
}
```

**PLM Profile Additions**

```json
{
  "githubDefaultOrg": "",
  "defaultLabels": []
}
```

**Refs**
- none required

---

### `core.product` (with PLM profile)

**Type**: Core node with PLM customization

**Purpose**
- Primary anchor for all lifecycle and service data
- Combines product catalog (SKU, specs, pricing) with lifecycle tracking

**Identity**
- `["product", "plm"]`
- optional product family tags may be added later

**Parent Constraints**
- Under `plm.service`

**Core Settings (from core.product)**

```json
{
  "sku": "EDGE-001",
  "productName": "Edge Controller",
  "category": "hardware",
  "manufacturer": "NubeIO",
  "model": "EC-REV-C",
  "price": 450.00,
  "currency": "USD",
  "availability": "in-stock",
  "dimensions": "120x80x40mm",
  "weight": 250,
  "powerRating": "12W",
  "operatingTemp": "-40 to 85°C",
  "ipRating": "IP65",
  "certifications": "CE, FCC, UL",
  "datasheetUrl": "https://...",
  "imageUrl": "https://..."
}
```

**PLM Profile Additions (via defaults)**

```json
{
  "productCode": "EDGE-CTRL",
  "status": "production",
  "productType": "hybrid",
  "description": "Industrial edge controller"
}
```

**Refs**

- `teamRef` (owning team)
- `userRef` (owning user)

---

### `core.document` (sources)

**Type**: Core node with PLM profile

**Purpose**
- Linked source of product context for humans and AI
- Repos, docs, CAD, BOM, QA reports

**Examples**
- GitHub repo
- local repo path
- docs/spec folder
- CAD folder
- BOM source
- QA/test reports

**Identity**
- `["document", "source"]`
- plus subtype tags:
  - `["document", "source", "github", "repo"]`
  - `["document", "source", "docs"]`
  - `["document", "source", "cad"]`
  - `["document", "source", "bom"]`
  - `["document", "source", "qa"]`

**Parent Constraints**
- Under `core.product`

**Core Settings (from core.document)**

```json
{
  "documentType": "repository",
  "title": "Edge Firmware Repository",
  "description": "Firmware source code and build artifacts",
  "url": "https://github.com/company/edge-firmware",
  "localPath": "/repos/edge-firmware",
  "version": "main",
  "author": "Engineering Team",
  "tags": "firmware,source",
  "accessLevel": "internal",
  "format": "git"
}
```

**PLM Profile Additions (via defaults)**

```json
{
  "sourceType": "github_repo",
  "repoOwner": "company",
  "repoName": "edge-firmware",
  "isDefaultIssueTarget": true,
  "issueSyncEnabled": true,
  "defaultLabels": ["firmware", "bug"]
}
```

**Refs**

- `productRef` (parent product)

---

### `core.release`

**Type**: Core node with PLM profile

**Purpose**
- Track software, firmware, config, or release bundle records
- Version management with approvals and checksums

**Identity**
- `["release", "plm"]`
- plus subtype tags:
  - `["release", "firmware", "plm"]`
  - `["release", "backend", "plm"]`
  - `["release", "frontend", "plm"]`
  - `["release", "mobile", "plm"]`
  - `["release", "bundle", "plm"]`

**Parent Constraints**
- Under `core.product`

**Core Settings (from core.release)**

```json
{
  "version": "1.4.2",
  "releaseType": "firmware",
  "status": "approved",
  "releaseDate": "2026-03-20T10:00:00Z",
  "releaseNotes": "Fix OTA crash on rev C hardware",
  "buildRef": "git:abc123def456",
  "compatibility": "rev-c",
  "author": "john.doe",
  "approvedBy": "jane.smith",
  "approvedDate": "2026-03-19T15:30:00Z",
  "downloadUrl": "https://releases.example.com/firmware/1.4.2.bin",
  "checksumSHA256": "a3b5c7..."
}
```

**PLM Profile Additions (optional)**

```json
{
  "compatibilityDetails": {
    "hardwareRevisions": ["rev-c"],
    "minBootloaderVersion": "2.0.0"
  },
  "testingStatus": "qa-approved"
}
```

**Refs**

- `productRef`
- optional `sourceRef`

---

### `plm.manufacturing-run`

**Type**: Custom (no core equivalent)

**Purpose**
- Track the production of a hardware batch
- Manufacturing-specific data (run numbers, serial ranges, QA metrics)

**Identity**
- `["plm", "manufacturing-run"]`

**Parent Constraints**
- Under `core.product`

**Settings**

```json
{
  "runNumber": "2026-014",
  "hardwareRevision": "rev-c",
  "quantity": 100,
  "status": "qa",
  "qaFailures": 3,
  "serialRangeStart": "EC-C-1400",
  "serialRangeEnd": "EC-C-1499",
  "productionDate": "2026-03-15",
  "facilityLocation": "Factory A",
  "batchNotes": "Standard production run"
}
```

**Refs**

- `productRef` (parent product)
- `firmwareReleaseRef` (optional - approved firmware for this run)
- `bundleReleaseRef` (optional - approved release bundle)

---

### `core.asset` (units)

**Type**: Core node with PLM profile

**Purpose**
- Represent a real serialized unit created by a manufacturing run
- Track warranty, installation, firmware versions

**Identity**
- `["asset", "unit", "plm"]`

**Parent Constraints**
- Under `plm.manufacturing-run`

**Core Settings (from core.asset)**

```json
{
  "serialNumber": "EC-C-1402",
  "assetType": "edge-controller",
  "status": "installed",
  "location": "Factory Floor - Zone 3",
  "manufacturer": "NubeIO",
  "model": "EDGE-CTRL",
  "hardwareRevision": "rev-c",
  "firmwareVersion": "1.4.2",
  "warrantyUntil": "2028-03-15",
  "purchaseDate": "2026-03-15",
  "installDate": "2026-03-20",
  "notes": "Installed at customer site"
}
```

**PLM Profile Additions**

```json
{
  "warrantyStatus": "valid",
  "currentFirmwareVersion": "1.4.2",
  "lastMaintenanceDate": "2026-03-20"
}
```

**Refs**

- `productRef` (parent product)
- `runRef` (required - manufacturing run that created this unit)
- `siteRef` (optional - installation site)
- `customerRef` (optional - customer who owns this unit)
- `releaseRef` (optional - current firmware/software release)

---

### `core.ticket` (RMAs)

**Type**: Core node with PLM/RMA profile

**Purpose**
- Service workflow for returned or failed units
- Track RMA lifecycle from receipt to resolution

**Identity**
- `["ticket", "rma", "plm"]`

**Parent Constraints**
- Under `core.product`

**Core Settings (from core.ticket)**

```json
{
  "ticketNumber": "RMA-456",
  "ticketType": "rma",
  "status": "inspection",
  "priority": "high",
  "title": "Unit fails after OTA update",
  "description": "Customer reports crash after firmware 1.4.1 OTA",
  "reporter": "Jane Smith",
  "reporterEmail": "jane@acme.com",
  "assignee": "service.team",
  "createdDate": "2026-03-20T09:00:00Z",
  "dueDate": "2026-03-27T17:00:00Z",
  "resolvedDate": "",
  "resolution": "",
  "category": "firmware",
  "tags": "ota,crash,rev-c"
}
```

**PLM Profile Additions**

```json
{
  "rmaNumber": "RMA-456",
  "warrantyStatus": "valid",
  "customerName": "Acme Corp",
  "rootCause": "",
  "repairAction": "",
  "replacementSerial": ""
}
```

**Refs**

- `productRef` (parent product)
- `unitRef` (required - serialized unit being returned)
- `siteRef` (optional - installation site)
- `customerRef` (optional - customer returning the unit)

---

### `core.ticket` (work items)

**Type**: Core node with PLM/work-item profile

**Purpose**
- Central action object for engineering, manufacturing, service, and PM work
- Bugs, features, tasks, release checklists

**Examples**
- bug
- feature
- task
- release checklist
- manufacturing issue
- RMA follow-up

**Identity**
- `["ticket", "work-item", "plm"]`
- plus subtype tags:
  - `["ticket", "work-item", "bug"]`
  - `["ticket", "work-item", "feature"]`
  - `["ticket", "work-item", "task"]`
  - `["ticket", "work-item", "rma-followup"]`
  - `["ticket", "work-item", "manufacturing"]`

**Parent Constraints**
- Under `core.product`

**Core Settings (from core.ticket)**

```json
{
  "ticketNumber": "WI-128",
  "ticketType": "bug",
  "status": "open",
  "priority": "high",
  "title": "Firmware crash after OTA on rev C units",
  "description": "Detailed description of the crash scenario...",
  "reporter": "john.doe",
  "reporterEmail": "john@company.com",
  "assignee": "firmware.team",
  "createdDate": "2026-03-20T10:00:00Z",
  "dueDate": "2026-03-27T17:00:00Z",
  "resolvedDate": "",
  "resolution": "",
  "category": "firmware",
  "tags": "crash,ota,rev-c"
}
```

**PLM Profile Additions**

```json
{
  "workItemType": "bug",
  "github": {
    "provider": "github",
    "repoOwner": "company",
    "repoName": "edge-firmware",
    "issueNumber": 128,
    "issueUrl": "https://github.com/company/edge-firmware/issues/128",
    "syncStatus": "synced",
    "lastSyncedAt": "2026-03-23T10:30:00Z"
  }
}
```

**Refs**

- `productRef` (parent product)
- `sourceRef` (optional - target repo/doc for this work)
- `releaseRef` (optional - related release)
- `runRef` (optional - related manufacturing run)
- `unitRef` (optional - related unit)
- `rmaRef` (optional - related RMA)
- `assignedTeamRef` (optional - team assigned to this work, overrides product default)
- `assignedUserRef` (optional - user assigned to this work, overrides product default)

---

### `core.entry` (time entries, expenses, logs)

**Type**: Core node for granular record-keeping

**Purpose**
- Track time entries on work items (timesheet entries)
- Log expenses for projects or tasks
- Record maintenance work and labor hours
- Audit trail for inventory adjustments

**Identity**
- `["entry", "timesheet"]` - Time tracking entries
- `["entry", "expense"]` - Expense records
- `["entry", "log"]` - General log entries

**Parent Constraints**
- Under `core.ticket` (work items)
- Under `core.task` (tasks)
- Under `plm.manufacturing-run` (labor logs)

**Core Settings (from core.entry)**

```json
{
  "entryType": "timesheet",
  "date": "2026-03-23",
  "hours": 2.5,
  "amount": 0,
  "quantity": 0,
  "userId": "alice",
  "description": "Fixed firmware crash on rev-c units",
  "category": "dev",
  "billable": true,
  "status": "approved",
  "notes": "Required extensive debugging",
  "tags": "firmware,crash,rev-c"
}
```

**Why Use Child Nodes for Time Entries?**

**❌ Don't do this:**
```json
// Storing time entries in JSON array (not queryable)
{
  "settings": {
    "timeEntries": [
      {"userId": "alice", "date": "2026-03-20", "hours": 2},
      {"userId": "bob", "date": "2026-03-21", "hours": 3}
    ]
  }
}
```

**✅ Do this instead:**
```
core.ticket (work-item)
  ├─ core.entry [alice, 2026-03-20, 2h, "Fixed crash"]
  ├─ core.entry [alice, 2026-03-21, 1.5h, "Testing"]
  └─ core.entry [bob, 2026-03-21, 3h, "Code review"]
```

**Benefits:**
- ✅ **Queryable**: `"workItemRef is 'node_123' and settings.userId is 'alice'"`
- ✅ **Aggregatable**: Sum hours across products/users/dates
- ✅ **Audit trail**: Each entry has `createdAt`, `updatedAt`, `version`
- ✅ **Refs work**: Cross-tree queries via `workItemRef`, `userRef`, `productRef`
- ✅ **Delete cascade**: Delete work-item → entries auto-deleted

**Query Examples:**

```
# All time entries for a work item
workItemRef is 'node_wi_128'

# All dev hours in March for alice
i has ['entry', 'timesheet'] and settings.userId is 'alice' and settings.date >= '2026-03-01'

# Total billable hours on a product
productRef is 'node_prd_edge' and i has 'entry' and settings.billable is true

# All expenses over $100
i has ['entry', 'expense'] and settings.amount > 100
```

**Refs**

- `workItemRef` (required - parent work item or task)
- `userRef` (required - who created this entry)
- `productRef` (optional - for product-level rollups)
- `customerRef` (optional - for customer billing)

---

## Ref Strategy

Refs should do the heavy lifting for cross-links.

### Core PLM Refs

**Product relationships:**
- `productRef` - Link to parent product
- `sourceRef` - Link to source (repo/doc/CAD)
- `releaseRef` - Link to software/firmware release
- `runRef` - Link to manufacturing run (shortened from `manufacturingRunRef`)
- `unitRef` - Link to serialized unit
- `rmaRef` - Link to RMA record

**Team/user relationships:**
- `teamRef` - Owning/primary team (context depends on node type)
- `userRef` - Owning/primary user (context depends on node type)
- `assignedTeamRef` - Assigned team (for work items, overrides product default)
- `assignedUserRef` - Assigned user (for work items, overrides product default)
- `workItemRef` - Link to parent work item or task (for time entries, expenses)
- `taskRef` - Alternative link to parent task (for time entries)

**External relationships:**
- `siteRef` - Link to installation site (reuses existing Rubix ref)
- `customerRef` - Link to customer node
- `firmwareReleaseRef` - Specific firmware release (for manufacturing runs)
- `bundleReleaseRef` - Release bundle (for manufacturing runs)

### Ref Design Rule

Use hierarchy for primary browse paths and refs for relationships that cross lifecycle areas.

Examples:

- `plm.unit` lives under a manufacturing run for traceability
- the same unit can still point to `siteRef` for installation context
- `plm.work-item` lives under the product, but may point to a run, unit, release, or RMA
- `plm.rma` lives under the product, but points to the affected unit
- `core.entry` lives under a work item for hierarchy, but points to `userRef` for filtering by user

This avoids forcing one tree shape to represent every relationship.

---

## Identity Strategy

Identity tags should support fast discovery and useful filtering.

### Base Identities

- `plm`
- `product`
- `source`
- `release`
- `manufacturing-run`
- `unit`
- `rma`
- `work-item`

### Subtype Identities

- `github`
- `repo`
- `docs`
- `cad`
- `bom`
- `qa`
- `firmware`
- `backend`
- `frontend`
- `mobile`
- `bundle`
- `bug`
- `feature`
- `task`
- `manufacturing`
- `rma-followup`

### Example Identity Sets

- product: `["plm", "product"]`
- GitHub source: `["plm", "source", "github", "repo"]`
- firmware release: `["plm", "release", "firmware"]`
- bug work item: `["plm", "work-item", "bug"]`

---

## Node ID Format

**Production node IDs**: Rubix auto-generates UUIDs in the format `node_<random>`:
- Example: `node_a7f3c2`, `node_x9k2p1`, `node_001`

**Documentation convention**: Examples below use **semantically meaningful IDs** for clarity:
- `node_prd_edge` (product), `node_run_2026_014` (manufacturing run), `node_rma_456` (RMA)
- **These are NOT user-settable** - they illustrate the relationship, not the actual ID format

**In production**:
```text
✅ ACTUAL:   productRef is 'node_a7f3c2'
📝 DOCS:     productRef is 'node_prd_edge'  (for readability)
❌ INVALID:  productRef is 'prd_edge_controller'  (no node_ prefix)
```

**DisplayName field**: For human-readable labels, use the ref's `displayName`:
```json
{
  "refName": "productRef",
  "toNodeId": "node_a7f3c2",
  "displayName": "Edge Controller"  ← shown in UI
}
```

---

## Query Patterns

V2 uses core nodes with identity tags for filtering. Here are the essential query patterns:

### Find PLM Service Root

```text
type is 'core.service' and identity contains ['service', 'plm']
```

### Find All PLM Products

```text
type is 'core.product' and identity contains ['plm']
```

### Find All Sources For A Product

```text
productRef is 'node_prd_edge' and identity contains ['document', 'source']
```

### Find All GitHub Sources For A Product

```text
productRef is 'node_prd_edge' and identity contains ['document', 'source', 'github']
```

### Find All Releases For A Product

```text
productRef is 'node_prd_edge' and type is 'core.release'
```

### Find All Firmware Releases For A Product

```text
productRef is 'node_prd_edge' and identity contains ['release', 'firmware']
```

### Find All Manufacturing Runs For A Product

```text
productRef is 'node_prd_edge' and type is 'plm.manufacturing-run'
```

### Find All Units From A Manufacturing Run

```text
runRef is 'node_run_2026_014' and identity contains ['asset', 'unit']
```

### Find All Work Items For A Product

```text
productRef is 'node_prd_edge' and identity contains ['ticket', 'work-item']
```

### Find All Bugs For A Product

```text
productRef is 'node_prd_edge' and identity contains ['ticket', 'work-item', 'bug']
```

### Find All RMAs For A Product

```text
productRef is 'node_prd_edge' and identity contains ['ticket', 'rma']
```

### Find All Work Items Related To An RMA

```text
rmaRef is 'node_rma_456' and identity contains ['ticket', 'work-item']
```

### Find All Work Items Targeting A Source

```text
sourceRef is 'node_src_firmware' and identity contains ['ticket', 'work-item']
```

### Find All Work Items Assigned To A Team

```text
assignedTeamRef is 'node_team_platform' and identity contains ['ticket', 'work-item']
```

### Find All Units Installed At A Site

```text
siteRef is 'node_site_acme' and identity contains ['asset', 'unit']
```

### Query Pattern Notes

**Core nodes + Identity tags:**
- Use `type is 'core.X'` when you want ALL of that core type
- Use `identity contains ['tag1', 'tag2']` to filter by category/subtype
- Combine both for precise queries

**Example reasoning:**
```text
# All products (including non-PLM)
type is 'core.product'

# Only PLM products
type is 'core.product' and identity contains ['plm']

# All tickets (work items + RMAs + others)
type is 'core.ticket'

# Only work items
identity contains ['ticket', 'work-item']

# Only bugs
identity contains ['ticket', 'work-item', 'bug']

# Only RMAs
identity contains ['ticket', 'rma']
```

---

## Working with Production IDs

### The Documentation vs Production Gap

**In these docs**:
- IDs like `node_prd_edge` (semantic, educational)

**In production**:
- IDs like `node_x7k2p1` (random, unique)

### How to Build Real Queries

**Option 1: UI-assisted** (recommended for humans)
1. Navigate to node in Rubix UI
2. Click "Copy ID" or inspect URL: `/nodes/node_x7k2p1`
3. Paste into query builder

**Option 2: Name-based lookup** (recommended for AI/scripts)
```typescript
// AI workflow: resolve name → ID → query
const product = await queryNodes({
  filter: "type is 'plm.product' and name is 'Edge Controller'"
})

const sources = await queryNodes({
  filter: `productRef is '${product[0].id}' and identity contains ['source']`
})
```

**Option 3: Explore from parent** (recommended for discovery)
```typescript
// Navigate hierarchy: service → products → specific product
const service = await queryNodes({ filter: "type is 'plm.service'" })
const products = await getChildren(service[0].id)
const edgeController = products.find(p => p.name === 'Edge Controller')

// Now use the actual ID
const sources = await queryNodes({
  filter: `productRef is '${edgeController.id}' and identity contains ['source']`
})
```

### Why Random IDs?

**Design decision**: Auto-generated UUIDs prevent:
- ❌ Naming collisions ("temp_sensor" created by 2 users)
- ❌ Case sensitivity bugs ("TempSensor" vs "tempsensor")
- ❌ Special character issues ("sensor/unit #1")
- ❌ Security risks (predictable IDs enable enumeration attacks)

**Trade-off**: Queries are less readable, but data is safer and more reliable.

### Query Pattern: type vs identity

Some query examples use `type is 'X'`, others use `identity contains ['X']`. Here's when to use each:

- **type is 'X'**: Exact node type match (fastest, indexed)
  - Example: `type is 'plm.product'`
  - Use when: You know the exact type

- **identity contains ['X']**: Tag-based search (flexible, supports subtypes)
  - Example: `identity contains ['work-item', 'bug']`
  - Use when: Searching by category or multiple tags

**Rule of thumb**: Use `type` for exact matches, `identity` for category searches.

---

## Hierarchy Decision Notes

### Why Runs Under Product

Manufacturing runs should live under the product because:

- they are product lifecycle records
- they are easier to browse from the product
- they naturally group release compatibility, QA, and units

### Why Units Under Run

Units should live under the run because:

- manufacturing traceability is primary
- serial ranges and QA are run-scoped
- units can still reference site/customer/deployment using refs

### Why RMAs Under Product

RMAs should live under the product because:

- the product is the engineering and service anchor
- RMAs often generate product-level bugs and follow-up work
- customer or site relationships can be preserved via refs

### Why Work Items Under Product

Work items should live under the product because:

- the product is the center of planning and delivery
- work items may relate to many other objects at once
- product-level views are easier to reason about than scattering work under runs, units, or RMAs

---

## Settings Vs Refs

Where Rubix relationships matter, prefer refs.

### Prefer Refs For

- team ownership
- user ownership
- product relationships
- source targeting
- release linkage
- run linkage
- unit linkage
- RMA linkage
- site/customer linkage

### Use Settings For

- status
- codes and numbers
- freeform metadata
- integration metadata
- UI defaults
- denormalized display values if needed

### Practical Rule

If another node needs to be queried, navigated, or validated, use a ref.

---

## Validation Rules

V2 should define explicit validation behavior.

### Node ID Validation

**Auto-generation**: All node IDs are auto-generated by Rubix:
- Format: `node_<random>` (e.g., `node_a7f3c2`, `node_001`)
- **User-provided IDs are rejected** - prevents naming conflicts

**Plugin enforcement**:
```go
// Example validation in PLM plugin
if req.NodeID != "" {
    return errors.New("nodeID cannot be user-specified - omit field for auto-generation")
}
```

**Name vs ID**:
- `node.ID`: Auto-generated UUID (used in refs)
- `node.Name`: User-provided display name (shown in UI)

### Recommended Constraints

**Custom types:**

`plm.manufacturing-run`
- must live under `core.product`
- `AllowedParents: ["core.product"]`
- filter to PLM products via identity: `["product", "plm"]`

**Core nodes with PLM profiles:**

`core.service` (PLM root)
- singleton under device
- `MaxOneNode: true`
- `AllowedParents: ["rubix.device"]`
- identity: `["service", "plm"]`

`core.product` (PLM profile)
- must live under `core.service`
- `AllowedParents: ["core.service"]`
- filter to PLM service via identity: `["service", "plm"]`
- identity: `["product", "plm"]`

`core.document` (source profile)
- must live under `core.product`
- `AllowedParents: ["core.product"]`
- identity: `["document", "source"]`

`core.release` (PLM profile)
- must live under `core.product`
- `AllowedParents: ["core.product"]`
- identity: `["release", "plm"]`

`core.asset` (unit profile)
- must live under `plm.manufacturing-run`
- `AllowedParents: ["plm.manufacturing-run"]`
- identity: `["asset", "unit", "plm"]`

`core.ticket` (RMA profile)
- must live under `core.product`
- `AllowedParents: ["core.product"]`
- identity: `["ticket", "rma", "plm"]`

`core.ticket` (work-item profile)
- must live under `core.product`
- `AllowedParents: ["core.product"]`
- identity: `["ticket", "work-item", "plm"]`

### Required Refs

**Units** (`core.asset` with unit profile):
- `runRef` (required - manufacturing run that created this unit)

**RMAs** (`core.ticket` with rma profile):
- `unitRef` (required - unit being returned)

**Work items** (`core.ticket` with work-item profile):
- `productRef` (parent product, auto-set from hierarchy)

### Business Rules

- Only one `plm.source` per product may have `isDefaultIssueTarget = true`
- If GitHub sync is enabled for a work item, `sourceRef` must point to a GitHub-capable source
- Work items inherit team/user from product unless `assignedTeamRef`/`assignedUserRef` is set

### Ref Target Validation

When creating refs, Rubix validates:
- Source node exists (`fromNodeID`)
- Target node exists (`toNodeID`)
- Both nodes are in same org

PLM plugin should additionally validate:
- Ref target is correct type (e.g., `runRef` must point to `plm.manufacturing-run`)
- Required refs are present at node creation

---

## Ref Lifecycle

### Ref Creation

Refs are created using Rubix's `AddOrUpdateRef()` API:

```go
// Example: Link work item to source
refService.AddOrUpdateRef(ctx, orgID, workItemID, "sourceRef", sourceID)
```

Rubix automatically:
- Validates both nodes exist
- Snapshots target node name to `DisplayName`
- Creates or updates the ref
- Publishes `after_ref_create` hook

### Ref Deletion

When nodes are deleted, Rubix CASCADE deletes refs:

**From-side deletion** (correct behavior):
- Deleting a work item → deletes all refs from that work item ✅

**To-side deletion** (important for PLM):
- Deleting a product → deletes all refs pointing to it ✅
- **This also deletes nodes that reference it** (work items, releases, etc.)

**PLM Ref Deletion Policies** ✅ **IMPLEMENTED**:

PLM node types now declare ref constraints with granular deletion policies:

```go
// plm.work-item node type
func (n *WorkItemNode) GetConstraints() nodedeps.NodeConstraints {
    return nodedeps.NodeConstraints{
        RefConstraints: []nodedeps.RefConstraint{
            {
                RefName:        "productRef",
                Required:       true,
                TargetTypes:    []string{"plm.product"},
                OnTargetDelete: nodedeps.RefPolicyProtect, // Block product deletion
            },
            {
                RefName:        "sourceRef",
                Required:       false,
                TargetTypes:    []string{"plm.source"},
                OnTargetDelete: nodedeps.RefPolicyNullify, // Work item survives
            },
            {
                RefName:        "releaseRef",
                Required:       false,
                TargetTypes:    []string{"plm.release"},
                OnTargetDelete: nodedeps.RefPolicyNullify, // Work item survives
            },
        },
    }
}

// plm.unit node type
func (n *UnitNode) GetConstraints() nodedeps.NodeConstraints {
    return nodedeps.NodeConstraints{
        RefConstraints: []nodedeps.RefConstraint{
            {
                RefName:        "runRef",
                Required:       true,
                TargetTypes:    []string{"plm.manufacturing-run"},
                OnTargetDelete: nodedeps.RefPolicyProtect, // Block run deletion
            },
        },
    }
}
```

**Policies:**
- `RefPolicyProtect` - Blocks deletion with clear error message listing dependent nodes
- `RefPolicyNullify` - Clears ref's `toNodeId` (node survives, ref becomes empty)
- `RefPolicyCascade` - Deletes ref (default behavior)

**Benefits:**
- ✅ Prevents accidental data loss (can't delete product with work items)
- ✅ Type-safe refs (productRef can only point to plm.product)
- ✅ Required refs enforced at creation
- ✅ No manual validation needed in plugin code

See [REF-CONSTRAINTS.md](../nodes/REF-CONSTRAINTS.md) for complete documentation.

### Ref Updates

Refs are updated by calling `AddOrUpdateRef()` with same `fromNodeID` + `refName`:

```go
// Change work item's target source
refService.AddOrUpdateRef(ctx, orgID, workItemID, "sourceRef", newSourceID)
```

Rubix automatically updates `DisplayName` snapshot.

---

## GitHub Sync Model

GitHub should be modeled as a source capability plus work-item sync metadata.

### Product Side

A product may have one or more GitHub sources:

- firmware repo
- backend repo
- frontend repo

One of them may be marked as the default issue target.

### Work Item Side

The work item remains the source of truth.

GitHub metadata can be stored on the work item in settings:

```json
{
  "github": {
    "provider": "github",
    "repoOwner": "company",
    "repoName": "edge-firmware",
    "issueNumber": 128,
    "issueUrl": "https://github.com/company/edge-firmware/issues/128",
    "syncStatus": "synced"
  }
}
```

### V2 Sync Direction

Recommended initial direction:

- `PLM -> GitHub`

Meaning:

- create work item in PLM
- optionally sync to GitHub
- save GitHub issue metadata back onto the PLM node

Do not make GitHub the canonical owner of issue state in V2.

---

## AI Integration

AI should operate directly on PLM nodes using existing Rubix query and create patterns.

### AI Read Pattern

For a product, AI can query:

- all sources
- all releases
- recent manufacturing runs
- relevant units
- RMAs
- open work items

### AI Create Pattern

AI can:

- create a `plm.work-item`
- attach refs to source, release, run, unit, or RMA
- optionally trigger GitHub sync

### Why This Matters

This makes AI native to Rubix:

- no custom PLM-specific orchestration layer is required just to model data
- AI can use the same node tools it already uses elsewhere in Rubix

---

## Example Scenarios

### Scenario 1: Manufacturing Failure Creates Bug

```text
Query manufacturing run
-> query units and QA signals
-> create plm.work-item with manufacturingRunRef
-> assign team/user
-> optionally sync to GitHub source
```

### Scenario 2: RMA Creates Firmware Investigation

```text
Create plm.rma under product
-> link unitRef
-> create plm.work-item with rmaRef and unitRef
-> target firmware GitHub source
-> sync if approved
```

### Scenario 3: PM Creates Roadmap Work

```text
Create plm.work-item under product
-> identity includes feature
-> assign to product's default team/user
-> no GitHub sync required yet
```

### Scenario 4: AI Reviews Product Context

```text
AI queries:
- product sources
- firmware releases
- manufacturing failures
- RMAs

AI proposes work items
User approves
PLM nodes are created
Selected items sync to GitHub
```

---

## Frontend Direction

V2 does not require a separate application model, but it will likely require PLM-specific views.

Recommended UI approach:

- keep PLM data in nodes
- add custom node views/widgets for product lifecycle workflows
- reuse existing Rubix node browsing, querying, permissions, and editing patterns where possible

Likely useful views:

- product overview
- sources tab
- releases tab
- manufacturing tab
- units tab
- service tab
- work items tab

---

## V2 Scope Recommendation

### In Scope

**Custom node types (1):**
- `plm.manufacturing-run` (no core equivalent - ONLY custom type)

**Core nodes with PLM profiles:**
- `core.service` (PLM root)
- `core.product` (with plm profile)
- `core.document` (with source profile)
- `core.release` (with plm profile)
- `core.asset` (with unit profile)
- `core.ticket` (with work-item profile)
- `core.ticket` (with rma profile)

**Supporting features:**
- Node profiles configuration (`config/nodes.yaml`)
- Ref definitions for lifecycle linking
- Identity tag conventions
- Query examples
- Validation rules
- Outbound GitHub issue sync metadata

### Out Of Scope For Initial V2

- full bidirectional GitHub mirroring
- per-user GitHub OAuth
- automatic local repo checkout orchestration
- full CAD management platform
- advanced release dependency engine

---

## Summary

V2 defines PLM as a Rubix-native node domain using **core nodes wherever possible**.

The right mental model is:

- **Core nodes first**: Use `core.product`, `core.document`, `core.release`, `core.asset`, `core.ticket`
- **Custom types only when needed**: Only 2 custom types (`plm.service`, `plm.manufacturing-run`)
- **Node profiles for customization**: Add PLM-specific defaults and validation via `config/nodes.yaml`
- **Identity tags for categorization**: Differentiate same-type nodes (e.g., work-items vs RMAs)
- **Refs for relationships**: Connect lifecycle records cleanly across the tree
- **GitHub as optional sync**: Work items live in PLM first, sync to GitHub if needed

**Benefits of this approach:**

1. **Rich schemas out of the box**: Core nodes provide comprehensive field sets
2. **Minimal custom code**: Only 1 custom type instead of 8
3. **Better reusability**: PLM products ARE products, PLM tickets ARE tickets, PLM service IS a service
4. **Consistent queries**: Use identity tags to filter core node types
5. **Future-proof**: New core node features automatically available to PLM
6. **Maximum consistency**: 6 core nodes, 1 custom type - the "Go way" of reusing existing types

This keeps the model aligned with how Rubix already works, makes AI integration natural, and avoids reinventing capabilities that core nodes already provide.
