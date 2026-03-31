# PLM Multi-Settings Implementation Summary

**Date:** 2026-03-21
**Status:** ✅ PHASE 1 COMPLETE - SDK & Plugin Implementation
**Next:** Phase 2 - Rubix Core Protocol Support (see below)

---

## What Was Implemented

### 1. SDK Core Support (✅ COMPLETE)

**File:** `/home/user/code/go/nube/rubix-sdk/nodedeps/settings_schemas.go`

Added core types for multiple settings schemas:

```go
type SettingsSchemaInfo struct {
    Name        string `json:"name"`
    DisplayName string `json:"displayName"`
    Description string `json:"description"`
    IsDefault   bool   `json:"isDefault"`
}

type MultipleSettingsProvider interface {
    ListSettingsSchemas() []SettingsSchemaInfo
    GetSettingsSchema(name string) (map[string]interface{}, error)
}
```

**Impact:** Any external plugin can now implement multiple settings schemas using this interface.

---

### 2. PLM Project Settings (✅ COMPLETE)

**File:** `/home/user/code/go/nube/rubix-sdk/nube.plm/internal/project/project.go`

Extended `ProjectSettings` struct to support both hardware and software projects:

```go
type ProjectSettings struct {
    // Common fields
    ProjectCode string  `json:"projectCode,omitempty"`
    Description string  `json:"description,omitempty"`
    Status      string  `json:"status,omitempty"`
    Price       float64 `json:"price,omitempty"`
    ProjectType string  `json:"projectType,omitempty"` // "hardware" or "software"

    // Hardware-specific
    SKU            string             `json:"sku,omitempty"`
    Weight         float64            `json:"weight,omitempty"` // kg
    Dimensions     *ProjectDimensions `json:"dimensions,omitempty"`
    WarrantyPeriod int                `json:"warrantyPeriod,omitempty"` // months
    Manufacturer   string             `json:"manufacturer,omitempty"`
    ModelNumber    string             `json:"modelNumber,omitempty"`
    Material       string             `json:"material,omitempty"`

    // Software-specific
    Version              string   `json:"version,omitempty"`
    LicenseType          string   `json:"licenseType,omitempty"`
    Platform             string   `json:"platform,omitempty"`
    SupportedOS          []string `json:"supportedOS,omitempty"`
    InstallationType     string   `json:"installationType,omitempty"`
    SupportTier          string   `json:"supportTier,omitempty"`
    MinSystemRequirements string  `json:"minSystemRequirements,omitempty"`
}
```

---

### 3. PLM Schema Builders (✅ COMPLETE)

**File:** `/home/user/code/go/nube/rubix-sdk/nube.plm/internal/nodes/settings_schemas.go`

Implemented `MultipleSettingsProvider` interface:

- **`ListSettingsSchemas()`** - Returns hardware and software schema metadata
- **`GetSettingsSchema(name)`** - Returns specific schema by name
- **`buildHardwareProjectSchema()`** - Hardware project JSON Schema
- **`buildSoftwareProjectSchema()`** - Software project JSON Schema

**Schemas Provided:**
1. `hardware` (default) - SKU, weight, dimensions, warranty, manufacturer, model, material
2. `software` - version, license type, platform, OS support, installation type, support tier

---

### 4. PLM Node Integration (✅ COMPLETE)

**File:** `/home/user/code/go/nube/rubix-sdk/nube.plm/internal/nodes/project_node.go`

- Implements `nodedeps.MultipleSettingsProvider`
- `SettingsSchema()` returns hardware schema as default (backwards compatible)
- ✅ **Build successful** - No compilation errors

---

## Current Status

### ✅ What Works Now

1. **SDK Foundation** - Interface and types defined
2. **PLM Plugin** - Implements multiple settings schemas
3. **Backwards Compatibility** - `SettingsSchema()` still works for single schema
4. **Type Safety** - ProjectSettings supports both project types
5. **Validation** - JSON schemas enforce required fields and constraints

### ⚠️ What Needs Work (Rubix Core)

The **rubix core** needs updates to support external plugin multiple schemas:

#### Problem

External plugins communicate via NATS/Proto. When rubix calls `CreateNode("plm.project")`, it creates a **PluginNode proxy** that forwards RPC calls to the external plugin.

Currently:
- Rubix dispatcher checks: `if node.(shared.MultipleSettingsProvider)` ✅
- For internal nodes: Works directly ✅
- For external plugins: **PluginNode proxy doesn't implement this yet** ❌

#### Solution Required

**Option A: Extend Proto Protocol** (Recommended)

1. Add `schemaName` field to `GetSchemaRequest` proto:
   ```protobuf
   message GetSchemaRequest {
       string nodeType = 1;
       string schemaName = 2;  // NEW: optional, if empty return default
   }
   ```

2. Add new RPC method `ListSchemas`:
   ```protobuf
   message ListSchemasRequest {
       string nodeType = 1;
   }

   message ListSchemasResponse {
       repeated SchemaInfo schemas = 1;
       bool supportsMultiple = 2;
   }
   ```

3. Update `PluginNode` proxy in rubix core to implement `shared.MultipleSettingsProvider`:
   - `ListSettingsSchemas()` → RPC call to plugin
   - `GetSettingsSchema(name)` → RPC call with schema name

4. Update SDK `PluginServer` to handle new RPC methods:
   - Detect if node implements `nodedeps.MultipleSettingsProvider`
   - Forward calls appropriately

**Option B: Simpler Workaround** (Temporary)

Make the plugin return ALL schemas in a single response and let rubix handle the selection logic. This requires less protocol changes but is less clean architecturally.

---

## Testing Plan

### Once Rubix Core Support Added

1. **Schema List API:**
   ```bash
   curl http://localhost:9000/api/v1/orgs/test/devices/dev_123/nodes/{projectId}/settings-schema/list
   ```
   Expected response:
   ```json
   {
     "schemas": [
       {"name": "hardware", "displayName": "Hardware Project", "description": "Physical projects", "isDefault": true},
       {"name": "software", "displayName": "Software Project", "description": "Digital projects", "isDefault": false}
     ],
     "supportsMultiple": true
   }
   ```

2. **Hardware Schema API:**
   ```bash
   curl http://localhost:9000/api/v1/orgs/test/devices/dev_123/nodes/{projectId}/settings-schema/hardware
   ```
   Should return schema with: SKU, weight, dimensions, warranty, etc.

3. **Software Schema API:**
   ```bash
   curl http://localhost:9000/api/v1/orgs/test/devices/dev_123/nodes/{projectId}/settings-schema/software
   ```
   Should return schema with: version, licenseType, platform, supportedOS, etc.

4. **Frontend Flow:**
   - Right-click project → "Edit Settings"
   - Dialog shows: "Hardware Project" vs "Software Project"
   - Select hardware → Form shows hardware fields only
   - Select software → Form shows software fields only
   - Submit → Settings saved with `projectType` field

---

## Files Modified/Created

### SDK (rubix-sdk)

| File | Status | Purpose |
|------|--------|---------|
| `nodedeps/settings_schemas.go` | ✅ CREATED | Core types and interface |

### PLM Plugin (nube.plm)

| File | Status | Purpose |
|------|--------|---------|
| `internal/project/project.go` | ✅ MODIFIED | Extended ProjectSettings struct |
| `internal/nodes/settings_schemas.go` | ✅ CREATED | Schema builders and interface implementation |
| `internal/nodes/project_node.go` | ✅ MODIFIED | Updated SettingsSchema() to use builder |

### Rubix Core (Needs Updates)

| File | Status | Purpose |
|------|--------|---------|
| `proto/plugin/v1/plugin.proto` | ⚠️ TODO | Add schemaName to GetSchemaRequest |
| `nodes/rubix/v2/plugins/plugin_node.go` | ⚠️ TODO | Implement MultipleSettingsProvider |
| `internal/gateway/dispatcher/plugin_manager.go` | ⚠️ TODO | Handle multiple schema RPC calls |
| `rubix-sdk/pluginnode/server.go` | ⚠️ TODO | Detect and forward schema calls |

---

## Next Steps

### For Developer Working on Rubix Core

1. **Update Proto Definition:**
   - Add `schemaName` to `GetSchemaRequest`
   - Add `ListSchemasRequest` and `ListSchemasResponse`
   - Regenerate proto Go code

2. **Update SDK Plugin Server:**
   - Detect if node implements `nodedeps.MultipleSettingsProvider`
   - Handle `ListSchemas` RPC method
   - Handle `GetSchema` with optional schema name parameter

3. **Update Rubix PluginNode Proxy:**
   - Implement `shared.MultipleSettingsProvider`
   - Forward `ListSettingsSchemas()` to plugin via RPC
   - Forward `GetSettingsSchema(name)` to plugin via RPC

4. **Test End-to-End:**
   - Deploy updated rubix + plugin
   - Test schema list API
   - Test schema retrieval by name
   - Test frontend schema selection dialog

### Estimated Effort

- Proto + codegen: 30 min
- SDK server updates: 1 hour
- Rubix proxy updates: 1 hour
- Testing: 1 hour
- **Total: ~3-4 hours**

---

## Benefits Delivered

Once fully implemented:

1. **UX Improvement:** Settings forms show ~50% fewer fields (focused by type)
2. **Data Quality:** Settings match project type (no irrelevant fields)
3. **User Clarity:** Clear distinction between hardware vs software
4. **Extensibility:** Pattern established for other plugins to use
5. **Zero Breaking Changes:** Existing projects continue working

---

## Example Usage

### Creating Hardware Project

```json
{
  "type": "plm.project",
  "name": "Premium Widget",
  "settings": {
    "projectType": "hardware",
    "projectCode": "HW-WIDGET-PRO",
    "description": "Premium aluminum widget",
    "status": "Active",
    "price": 149.99,
    "sku": "WGT-ALU-001",
    "weight": 2.5,
    "dimensions": {"length": 30, "width": 20, "height": 10},
    "warrantyPeriod": 24,
    "manufacturer": "Acme Corp",
    "modelNumber": "WP-2024",
    "material": "Aluminum"
  }
}
```

### Creating Software Project

```json
{
  "type": "plm.project",
  "name": "Analytics Dashboard",
  "settings": {
    "projectType": "software",
    "projectCode": "SW-DASHBOARD",
    "description": "Enterprise analytics dashboard",
    "status": "Active",
    "price": 49.99,
    "version": "2.1.0",
    "licenseType": "Subscription",
    "platform": "Web",
    "supportedOS": ["Windows", "macOS", "Linux"],
    "installationType": "SaaS",
    "supportTier": "Premium",
    "minSystemRequirements": "4GB RAM, Modern browser"
  }
}
```

---

## Questions for Project Owner

Before proceeding with rubix core implementation:

1. **Priority:** Is this feature high priority for the next release?
2. **Timeline:** When do you need this feature delivered?
3. **Scope:** Should we support changing project type after creation, or lock it?
4. **Migration:** Are there existing PLM projects that need migration?
5. **Future:** Are there other project types needed (e.g., services, bundles)?

---

**Implementation Complete:** SDK + PLM Plugin ✅
**Waiting On:** Rubix Core Protocol Extensions ⏳
**Ready for:** Code Review & Testing Plan Approval
