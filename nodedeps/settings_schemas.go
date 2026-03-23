package nodedeps

// SettingsSchemaInfo describes a named settings schema variant.
// Nodes can expose multiple settings schemas for different use cases.
//
// Example: A product node could provide different schemas for:
//   - "hardware" - Physical product settings (SKU, weight, dimensions)
//   - "software" - Digital product settings (version, license, platform)
type SettingsSchemaInfo struct {
	Name        string `json:"name"`        // Unique identifier (e.g., "hardware", "software")
	DisplayName string `json:"displayName"` // Human-readable name (e.g., "Hardware Product")
	Description string `json:"description"` // Brief description of the schema's purpose
	IsDefault   bool   `json:"isDefault"`   // Whether this is the default schema
}

// MultipleSettingsProvider is an optional interface that plugin nodes can implement
// to support multiple settings schemas for different use cases.
//
// If a plugin node implements this interface, rubix will expose:
//   - GET /nodes/{id}/settings-schema/list - list all available schemas
//   - GET /nodes/{id}/settings-schema/{name} - get a specific schema
//   - GET /nodes/{id}/settings-schema - get default schema (backwards compatible)
//
// Example implementation:
//
//	func (n *ProductNode) ListSettingsSchemas() []nodedeps.SettingsSchemaInfo {
//	    return []nodedeps.SettingsSchemaInfo{
//	        {Name: "hardware", DisplayName: "Hardware Product", Description: "Physical products", IsDefault: true},
//	        {Name: "software", DisplayName: "Software Product", Description: "Digital products", IsDefault: false},
//	    }
//	}
//
//	func (n *ProductNode) GetSettingsSchema(name string) (map[string]interface{}, error) {
//	    switch name {
//	    case "hardware":
//	        return buildHardwareSchema(), nil
//	    case "software":
//	        return buildSoftwareSchema(), nil
//	    default:
//	        return nil, fmt.Errorf("unknown schema: %s", name)
//	    }
//	}
type MultipleSettingsProvider interface {
	// ListSettingsSchemas returns metadata about all available settings schemas
	ListSettingsSchemas() []SettingsSchemaInfo

	// GetSettingsSchema returns a named settings schema as a JSON Schema object
	// Returns an error if the schema name is not found
	GetSettingsSchema(name string) (map[string]interface{}, error)
}
