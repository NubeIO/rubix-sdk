# How to Add More Features to PLM Plugin

**Complete guide for extending the PLM plugin with new nodes, pages, and UI components**

---

## Table of Contents

1. [Overview](#overview)
2. [Adding Nodes](#adding-nodes)
   - [Reusing Core Nodes](#reusing-core-nodes)
   - [Creating Custom Nodes](#creating-custom-nodes)
3. [Adding Pages](#adding-pages)
4. [Using Product Sections Pattern](#using-product-sections-pattern)
5. [Using Frontend SDK Table](#using-frontend-sdk-table)
6. [SDK Overview](#sdk-overview)

---

## Overview

### Plugin Architecture

```
nube.plm/
├── plugin.json              # ← Node types, pages, widgets configuration
├── internal/
│   └── nodes/              # ← Custom Go node implementations (if needed)
│       ├── service.go
│       └── product.go
└── frontend/
    └── src/
        ├── features/       # ← Feature modules (product, task, etc.)
        └── shared/         # ← Shared utilities
```

**Key Principle:** Maximize **core node reuse** before creating custom types.

---

## Adding Nodes

### Decision Tree: Core vs Custom?

```
Need a new node type?
  ├─ Does a core node exist? (core.task, core.ticket, core.entry, etc.)
  │   └─ YES → Use core node with profile (✅ Recommended)
  │
  └─ NO core node fits?
      └─ Create custom node type (only when necessary)
```

See full documentation for detailed examples.

---

**Last Updated:** 2026-03-25
