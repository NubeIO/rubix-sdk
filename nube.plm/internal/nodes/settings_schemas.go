package nodes

import (
	"fmt"

	"github.com/NubeIO/rubix-sdk/nodedeps"
	"github.com/NubeIO/rubix-sdk/nodedeps/jsonschema/schema"
)

// Ensure ProductNode implements MultipleSettingsProvider
var _ nodedeps.MultipleSettingsProvider = (*ProductNode)(nil)

// ListSettingsSchemas returns metadata about all available settings schemas
func (n *ProductNode) ListSettingsSchemas() []nodedeps.SettingsSchemaInfo {
	return []nodedeps.SettingsSchemaInfo{
		{
			Name:        "hardware",
			DisplayName: "Hardware Product",
			Description: "Physical products (widgets, equipment, devices)",
			IsDefault:   true,
		},
		{
			Name:        "software",
			DisplayName: "Software Product",
			Description: "Digital products (applications, licenses, SaaS)",
			IsDefault:   false,
		},
	}
}

// GetSettingsSchema returns a named settings schema
func (n *ProductNode) GetSettingsSchema(name string) (map[string]interface{}, error) {
	switch name {
	case "hardware":
		return buildHardwareProductSchema(), nil
	case "software":
		return buildSoftwareProductSchema(), nil
	default:
		return nil, fmt.Errorf("unknown schema: %s", name)
	}
}

// buildHardwareProductSchema returns the JSON Schema for hardware products
func buildHardwareProductSchema() map[string]interface{} {
	s := schema.Object().
		Title("Hardware Product Settings").
		Property("productCode", schema.String().
			Title("Product Code").
			Description("Unique identifier for the hardware product").
			MinLength(1).
			Build()).
		Property("tags", schema.Array().
			Title("Tags").
			Description("Product categories").
			Items(schema.String().
				Enum("Electronics", "Mechanical", "Tools", "Components").
				Build()).
			UniqueItems().
			Build()).
		Required("productCode").
		Build()

	return schema.ToMap(s)
}

// buildSoftwareProductSchema returns the JSON Schema for software products
func buildSoftwareProductSchema() map[string]interface{} {
	s := schema.Object().
		Title("Software Product Settings").
		Property("productCode", schema.String().
			Title("Product Code").
			Description("Unique identifier for the software product").
			MinLength(1).
			Build()).
		Property("features", schema.Array().
			Title("Features").
			Description("Key features").
			Items(schema.String().
				Enum("API", "Web UI", "Mobile", "Desktop", "Cloud").
				Build()).
			UniqueItems().
			Build()).
		Required("productCode").
		Build()

	return schema.ToMap(s)
}
