package nodes

import (
	"fmt"

	"github.com/NubeIO/rubix-sdk/nodedeps"
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
	return map[string]interface{}{
		"type":  "object",
		"title": "Hardware Product Settings",
		"properties": map[string]interface{}{
			// Common fields
			"productCode": map[string]interface{}{
				"type":        "string",
				"title":       "Product Code",
				"description": "Unique product identifier",
				"minLength":   1,
				"maxLength":   50,
			},
			"description": map[string]interface{}{
				"type":        "string",
				"title":       "Description",
				"description": "Product description",
				"maxLength":   500,
			},
			"status": map[string]interface{}{
				"type":    "string",
				"title":   "Status",
				"enum":    []interface{}{"Design", "Prototype", "Production", "Discontinued"},
				"default": "Design",
			},
			"price": map[string]interface{}{
				"type":    "number",
				"title":   "Price ($)",
				"minimum": 0,
				"default": 0.0,
			},

			// Hardware-specific fields
			"sku": map[string]interface{}{
				"type":        "string",
				"title":       "SKU",
				"description": "Stock Keeping Unit",
				"maxLength":   50,
			},
			"weight": map[string]interface{}{
				"type":    "number",
				"title":   "Weight (kg)",
				"minimum": 0,
			},
			"dimensions": map[string]interface{}{
				"type":  "object",
				"title": "Dimensions (cm)",
				"properties": map[string]interface{}{
					"length": map[string]interface{}{
						"type":    "number",
						"title":   "Length",
						"minimum": 0,
					},
					"width": map[string]interface{}{
						"type":    "number",
						"title":   "Width",
						"minimum": 0,
					},
					"height": map[string]interface{}{
						"type":    "number",
						"title":   "Height",
						"minimum": 0,
					},
				},
			},
			"warrantyPeriod": map[string]interface{}{
				"type":    "integer",
				"title":   "Warranty Period (months)",
				"minimum": 0,
				"maximum": 120,
				"default": 12,
			},
			"manufacturer": map[string]interface{}{
				"type":      "string",
				"title":     "Manufacturer",
				"maxLength": 100,
			},
			"modelNumber": map[string]interface{}{
				"type":      "string",
				"title":     "Model Number",
				"maxLength": 50,
			},
			"material": map[string]interface{}{
				"type":        "string",
				"title":       "Material",
				"description": "Primary material (e.g., Aluminum, Plastic, Steel)",
				"maxLength":   50,
			},

			// Hidden field to store product type
			"productType": map[string]interface{}{
				"type":    "string",
				"default": "hardware",
			},
		},
		"required": []interface{}{"productCode", "status"},
	}
}

// buildSoftwareProductSchema returns the JSON Schema for software products
func buildSoftwareProductSchema() map[string]interface{} {
	return map[string]interface{}{
		"type":  "object",
		"title": "Software Product Settings",
		"properties": map[string]interface{}{
			// Common fields
			"productCode": map[string]interface{}{
				"type":        "string",
				"title":       "Product Code",
				"description": "Unique product identifier",
				"minLength":   1,
				"maxLength":   50,
			},
			"description": map[string]interface{}{
				"type":        "string",
				"title":       "Description",
				"description": "Product description",
				"maxLength":   500,
			},
			"status": map[string]interface{}{
				"type":    "string",
				"title":   "Status",
				"enum":    []interface{}{"Design", "Prototype", "Production", "Discontinued"},
				"default": "Design",
			},
			"price": map[string]interface{}{
				"type":    "number",
				"title":   "Price ($)",
				"minimum": 0,
				"default": 0.0,
			},

			// Software-specific fields
			"version": map[string]interface{}{
				"type":        "string",
				"title":       "Version",
				"description": "Semantic version (e.g., 1.2.3)",
				"pattern":     `^\d+\.\d+\.\d+$`,
				"default":     "1.0.0",
			},
			"licenseType": map[string]interface{}{
				"type":    "string",
				"title":   "License Type",
				"enum":    []interface{}{"Subscription", "Perpetual", "Free", "Trial"},
				"default": "Subscription",
			},
			"platform": map[string]interface{}{
				"type":    "string",
				"title":   "Platform",
				"enum":    []interface{}{"Web", "Desktop", "Mobile", "API"},
				"default": "Web",
			},
			"supportedOS": map[string]interface{}{
				"type":  "array",
				"title": "Supported OS",
				"items": map[string]interface{}{
					"type": "string",
					"enum": []interface{}{"Windows", "macOS", "Linux", "Cloud"},
				},
				"uniqueItems": true,
			},
			"installationType": map[string]interface{}{
				"type":    "string",
				"title":   "Installation Type",
				"enum":    []interface{}{"SaaS", "On-Premise", "Hybrid"},
				"default": "SaaS",
			},
			"supportTier": map[string]interface{}{
				"type":    "string",
				"title":   "Support Tier",
				"enum":    []interface{}{"Basic", "Standard", "Premium", "Enterprise"},
				"default": "Standard",
			},
			"minSystemRequirements": map[string]interface{}{
				"type":      "string",
				"title":     "Minimum System Requirements",
				"maxLength": 500,
			},

			// Hidden field to store product type
			"productType": map[string]interface{}{
				"type":    "string",
				"default": "software",
			},
		},
		"required": []interface{}{"productCode", "status", "version"},
	}
}
