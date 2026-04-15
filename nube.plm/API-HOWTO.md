# PLM Program Dashboard — API Guide

Complete API reference for managing the Program Dashboard via the Rubix REST API. Covers products, tasks, tickets, notes, and user assignment.

---

## Authentication

All endpoints require a JWT token obtained from login.

```bash
curl -s -X POST https://<host>/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@rubix.io", "password": "admin@rubix.io"}'
```

**Response:**
```json
{
  "data": {
    "token": "eyJhbGc...",
    "orgId": "test",
    "deviceId": "dev_96E89476A44A"
  }
}
```

All subsequent examples use these variables:

```
BASE = https://<host>/api/v1
ORG  = test
DEV  = dev_96E89476A44A
AUTH = Authorization: Bearer <token>
```

The standard endpoint pattern is:

```
POST   /api/v1/orgs/{orgId}/devices/{deviceId}/nodes          # create
GET    /api/v1/orgs/{orgId}/devices/{deviceId}/nodes/{id}      # read
PUT    /api/v1/orgs/{orgId}/devices/{deviceId}/nodes/{id}      # update
DELETE /api/v1/orgs/{orgId}/devices/{deviceId}/nodes/{id}      # delete
POST   /api/v1/orgs/{orgId}/devices/{deviceId}/query           # search
```

---

## Node Hierarchy

```
plm.service                       ← PLM root (singleton, auto-created by plugin)
└── plm.products                  ← Products container (singleton)
    └── plm.product               ← A product/project
        ├── plm.task              ← Task under a product
        │   ├── plm.ticket        ← Ticket under a task
        │   └── core.note         ← Activity note on a task
        └── plm.ticket            ← Ticket directly under a product (optional)
```

Each node stores its parent via a `parentRef` reference and the `parentId` field.

---

## Node Types & Settings

### plm.product

A product or project in the development pipeline.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Product name |
| `productCode` | string | yes | Unique code (min 3 chars, immutable after creation) |
| `category` | string | no | `hardware`, `software`, `hybrid`, `firmware`, or `bundle` |
| `status` | string | no | `Design`, `Prototype`, `Production`, or `Discontinued` |
| `icon` | string | no | Lucide icon name (e.g. `Cpu`, `Radio`, `LayoutDashboard`) |
| `iconColor` | string | no | Hex colour (e.g. `#3b82f6`) |
| `price` | number | no | Must be >= 0 |
| `currency` | string | no | Currency code (e.g. `USD`) |

**Validation rules:**
- `productCode` is required, min 3 characters, must be unique, cannot be changed after creation
- `status` must be one of: `Design`, `Prototype`, `Production`, `Discontinued`
- A `Discontinued` product cannot be reactivated
- `price` cannot be negative

### plm.task

A task belonging to a product.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Task name |
| `parentId` | string | yes | Must be a `plm.product` node ID |
| `category` | string | no | `hardware`, `firmware`, `software`, `cloud`, etc. |
| `status` | string | no | `pending`, `in-progress`, `blocked`, `review`, `completed`, `cancelled` |
| `priority` | string | no | `Low`, `Medium`, `High`, `Critical` |
| `tags` | string | no | Comma-separated. Gate stored as `gate:g3` |
| `startDate` | string | no | `YYYY-MM-DD` |
| `dueDate` | string | no | `YYYY-MM-DD` |
| `progress` | number | no | 0–100 |
| `autoProgress` | boolean | no | If true, progress is derived from ticket completion |

**Validation rules:**
- Must have a `parentId` pointing to a `plm.product`
- Tasks cannot be moved between products after creation

### plm.ticket

A sub-item under a task (bug, feature, chore).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Ticket name |
| `parentId` | string | yes | A `plm.task` or `plm.product` node ID |
| `ticketType` | string | no | `task`, `bug`, `feature`, or `chore` |
| `status` | string | no | Same statuses as tasks |
| `priority` | string | no | `Low`, `Medium`, `High`, `Critical` |

### core.note

Activity notes attached to a task.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Short label (max ~80 chars) |
| `parentId` | string | yes | The task node ID |
| `settings.text` | string | no | Full note text |
| `settings.type` | string | no | `comment` |
| `settings.author` | string | no | Author display name |

---

## Gate System

Tasks are assigned to gates via their `tags` setting using the format `gate:<id>`.

| Gate ID | Name | Purpose |
|---------|------|---------|
| `g1` | Executive Summary | Problem definition, strategic alignment |
| `g2` | Proof of Concept | Validate concept, technical viability |
| `g3` | MVP (Build) | End-to-end working version |
| `g4` | Client Acceptance | Live deployment, real-world validation |
| `g5` | Product Refinement | Bug fixes, performance, design lock |
| `g6` | Production Ready | Manufacturing and compliance readiness |
| `g7` | Go-To-Market | Launch prep, sales enablement |
| `g8` | Scale & Support | Operations, support, iteration |

To assign a task to gate G3, set `settings.tags` to `"gate:g3"`.

---

## API Operations

### Find the Products Container

Before creating products, find the `plm.products` container node:

```bash
curl -s -X POST "$BASE/orgs/$ORG/devices/$DEV/query" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"filter": "type is \"plm.products\""}'
```

Save the returned `data[0].id` — use it as the parent for product creation.

---

### Create a Product

```bash
curl -s -X POST "$BASE/orgs/$ORG/devices/$DEV/nodes" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "plm.product",
    "name": "RC7 Nube IoT Gateway",
    "parentId": "<plm.products node ID>",
    "identity": ["product", "plm"],
    "settings": {
      "category": "hardware",
      "status": "Prototype",
      "productCode": "RC7-GW",
      "icon": "Cpu",
      "iconColor": "#3b82f6"
    },
    "refs": [
      {"refName": "parentRef", "toNodeId": "<plm.products node ID>"}
    ]
  }'
```

---

### Create a Task

```bash
curl -s -X POST "$BASE/orgs/$ORG/devices/$DEV/nodes" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "plm.task",
    "name": "PCB Layout Review",
    "parentId": "<product node ID>",
    "identity": ["task", "plm"],
    "settings": {
      "category": "hardware",
      "status": "in-progress",
      "priority": "High",
      "tags": "gate:g3",
      "startDate": "2026-03-15",
      "dueDate": "2026-05-01",
      "progress": 60
    },
    "refs": [
      {"refName": "parentRef", "toNodeId": "<product node ID>"}
    ]
  }'
```

> **Important:** Both `parentId` and the `parentRef` in `refs` must be provided.

---

### Create a Ticket

```bash
curl -s -X POST "$BASE/orgs/$ORG/devices/$DEV/nodes" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "plm.ticket",
    "name": "Route IO header pins",
    "parentId": "<task node ID>",
    "identity": ["ticket", "plm"],
    "settings": {
      "ticketType": "task",
      "status": "in-progress",
      "priority": "Medium"
    },
    "refs": [
      {"refName": "parentRef", "toNodeId": "<task node ID>"}
    ]
  }'
```

---

### Create a Note

```bash
curl -s -X POST "$BASE/orgs/$ORG/devices/$DEV/nodes" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "core.note",
    "name": "Reviewed schematic with team",
    "parentId": "<task node ID>",
    "identity": ["note"],
    "settings": {
      "text": "Reviewed schematic with team. Power rail needs rework.",
      "type": "comment",
      "author": "Aidan P"
    },
    "refs": [
      {"refName": "parentRef", "toNodeId": "<task node ID>"}
    ]
  }'
```

---

### Update a Node

Only include the fields you want to change — settings are merged.

```bash
# Update name
curl -s -X PUT "$BASE/orgs/$ORG/devices/$DEV/nodes/<nodeId>" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Task Name"}'

# Update settings
curl -s -X PUT "$BASE/orgs/$ORG/devices/$DEV/nodes/<nodeId>" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"settings": {"status": "completed", "progress": 100}}'
```

---

### Delete a Node

```bash
curl -s -X DELETE "$BASE/orgs/$ORG/devices/$DEV/nodes/<nodeId>" \
  -H "$AUTH"
```

---

### Query Nodes

```bash
# All products
{"filter": "type is \"plm.product\""}

# Tasks under a product
{"filter": "type is \"plm.task\" and parent.id is \"<product ID>\""}

# Tickets under a task
{"filter": "type is \"plm.ticket\" and parent.id is \"<task ID>\""}

# Notes on a task
{"filter": "type is \"core.note\" and parent.id is \"<task ID>\""}

# Find by name
{"filter": "name contains \"PCB\""}

# All blocked tasks
{"filter": "type is \"plm.task\" and settings.status is \"blocked\""}

# Paginate
{"filter": "type is \"plm.task\"", "limit": 20, "offset": 0}
```

---

## User Assignment

Users are assigned to tasks and tickets via `assignedUserRef` references. This supports multiple assignees per node.

### List Assigned Users

```bash
curl -s "$BASE/orgs/$ORG/devices/$DEV/nodes/<nodeId>/refs" \
  -H "$AUTH"
```

Filter the response for `refName === "assignedUserRef"`. Each has:
- `toNodeId` — user node ID
- `displayName` — user name

### Assign a User

```bash
curl -s -X POST "$BASE/orgs/$ORG/devices/$DEV/nodes/<nodeId>/refs" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"refName": "assignedUserRef", "toNodeId": "<user node ID>"}'
```

### Remove All Assignments

```bash
curl -s -X DELETE "$BASE/orgs/$ORG/devices/$DEV/nodes/<nodeId>/refs/assignedUserRef" \
  -H "$AUTH"
```

### Replace All Assignees

Delete existing refs, then create new ones:

```bash
# 1. Delete existing
curl -s -X DELETE "$BASE/orgs/$ORG/devices/$DEV/nodes/<nodeId>/refs/assignedUserRef" \
  -H "$AUTH"

# 2. Add each user
curl -s -X POST "$BASE/orgs/$ORG/devices/$DEV/nodes/<nodeId>/refs" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"refName": "assignedUserRef", "toNodeId": "<user1 ID>"}'

curl -s -X POST "$BASE/orgs/$ORG/devices/$DEV/nodes/<nodeId>/refs" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"refName": "assignedUserRef", "toNodeId": "<user2 ID>"}'
```

### List Org Users

```bash
curl -s "$BASE/orgs/$ORG/devices/$DEV/nodes?type=auth.user" \
  -H "$AUTH"
```

---

## Common Workflows

### Seed a Full Project

```bash
# 1. Find products container
PARENT=$(curl -s -X POST "$BASE/orgs/$ORG/devices/$DEV/query" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"filter": "type is \"plm.products\""}' | jq -r '.data[0].id')

# 2. Create product
PRODUCT=$(curl -s -X POST "$BASE/orgs/$ORG/devices/$DEV/nodes" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{
    \"type\": \"plm.product\",
    \"name\": \"My Product\",
    \"parentId\": \"$PARENT\",
    \"identity\": [\"product\", \"plm\"],
    \"settings\": {\"category\": \"software\", \"status\": \"Design\", \"productCode\": \"MY-PROD\"},
    \"refs\": [{\"refName\": \"parentRef\", \"toNodeId\": \"$PARENT\"}]
  }" | jq -r '.data.id')

# 3. Create task
TASK=$(curl -s -X POST "$BASE/orgs/$ORG/devices/$DEV/nodes" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{
    \"type\": \"plm.task\",
    \"name\": \"Backend API\",
    \"parentId\": \"$PRODUCT\",
    \"identity\": [\"task\", \"plm\"],
    \"settings\": {\"status\": \"in-progress\", \"priority\": \"High\", \"tags\": \"gate:g3\"},
    \"refs\": [{\"refName\": \"parentRef\", \"toNodeId\": \"$PRODUCT\"}]
  }" | jq -r '.data.id')

# 4. Create ticket
curl -s -X POST "$BASE/orgs/$ORG/devices/$DEV/nodes" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{
    \"type\": \"plm.ticket\",
    \"name\": \"Implement auth endpoints\",
    \"parentId\": \"$TASK\",
    \"identity\": [\"ticket\", \"plm\"],
    \"settings\": {\"ticketType\": \"feature\", \"status\": \"completed\", \"priority\": \"High\"},
    \"refs\": [{\"refName\": \"parentRef\", \"toNodeId\": \"$TASK\"}]
  }"
```

### Move a Task to a Different Gate

```bash
curl -s -X PUT "$BASE/orgs/$ORG/devices/$DEV/nodes/<taskId>" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"settings": {"tags": "gate:g4"}}'
```

### Complete a Task

```bash
curl -s -X PUT "$BASE/orgs/$ORG/devices/$DEV/nodes/<taskId>" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"settings": {"status": "completed", "progress": 100}}'
```

---

## Auto-Progress Calculation

When a task has `autoProgress: true`, the dashboard calculates progress from its tickets:

```
progress = completedTickets / activeTickets * 100
```

- **Completed** = tickets where `status === "completed"`
- **Active** = all tickets except `status === "cancelled"`
- Cancelled tickets are excluded entirely

This is a frontend-only calculation — the server does not auto-update the stored `progress` value.

---

## Error Responses

```json
{
  "field": "plugin_validation",
  "message": "plm.task must have a parent project"
}
```

| Error | Cause |
|-------|-------|
| `productCode is required` | Missing or empty `productCode` |
| `productCode must be at least 3 characters` | Code too short |
| `productCode 'X' already exists` | Duplicate product code |
| `plm.task must have a parent project` | Missing `parentId` on task |
| `tasks cannot be moved between projects` | Tried to change `parentId` on update |
| `cannot reactivate a discontinued product` | Changed status from `Discontinued` |
| `productCode cannot be changed after creation` | Modified immutable field |
| `price cannot be negative` | Negative price value |
