package schema

import "encoding/json"

// Schema represents a JSON Schema
type Schema struct {
	Type        interface{}   `json:"type,omitempty"`
	Title       string        `json:"title,omitempty"`
	Description string        `json:"description,omitempty"`
	Default     interface{}   `json:"default,omitempty"`
	Examples    []interface{} `json:"examples,omitempty"`
	Enum        []interface{} `json:"enum,omitempty"`
	Const       interface{}   `json:"const,omitempty"`

	// String validations
	MinLength *int   `json:"minLength,omitempty"`
	MaxLength *int   `json:"maxLength,omitempty"`
	Pattern   string `json:"pattern,omitempty"`
	Format    string `json:"format,omitempty"`

	// Number validations
	Minimum          *float64 `json:"minimum,omitempty"`
	Maximum          *float64 `json:"maximum,omitempty"`
	ExclusiveMinimum *float64 `json:"exclusiveMinimum,omitempty"`
	ExclusiveMaximum *float64 `json:"exclusiveMaximum,omitempty"`
	MultipleOf       *float64 `json:"multipleOf,omitempty"`

	// Array validations
	Items       interface{} `json:"items,omitempty"`
	MinItems    *int        `json:"minItems,omitempty"`
	MaxItems    *int        `json:"maxItems,omitempty"`
	UniqueItems *bool       `json:"uniqueItems,omitempty"`
	Contains    *Schema     `json:"contains,omitempty"`

	// Object validations
	Properties           map[string]*Schema     `json:"properties,omitempty"`
	Required             []string               `json:"required,omitempty"`
	AdditionalProperties interface{}            `json:"additionalProperties,omitempty"`
	PatternProperties    map[string]*Schema     `json:"patternProperties,omitempty"`
	MinProperties        *int                   `json:"minProperties,omitempty"`
	MaxProperties        *int                   `json:"maxProperties,omitempty"`
	Dependencies         map[string]interface{} `json:"dependencies,omitempty"`

	// Conditional schemas
	If   *Schema `json:"if,omitempty"`
	Then *Schema `json:"then,omitempty"`
	Else *Schema `json:"else,omitempty"`

	// Combinators
	AllOf []*Schema `json:"allOf,omitempty"`
	AnyOf []*Schema `json:"anyOf,omitempty"`
	OneOf []*Schema `json:"oneOf,omitempty"`
	Not   *Schema   `json:"not,omitempty"`

	// Meta
	ReadOnly   *bool `json:"readOnly,omitempty"`
	WriteOnly  *bool `json:"writeOnly,omitempty"`
	Deprecated *bool `json:"deprecated,omitempty"`

	// UI hints (for react-jsonschema-form)
	UISchema map[string]interface{} `json:"ui:schema,omitempty"`
}

// RootSchema represents the root JSON Schema with metadata
type RootSchema struct {
	*Schema
	SchemaVersion string             `json:"$schema,omitempty"`
	ID            string             `json:"$id,omitempty"`
	Definitions   map[string]*Schema `json:"definitions,omitempty"`
}

// ToJSON converts the schema to JSON
func (s *Schema) ToJSON() ([]byte, error) {
	return json.MarshalIndent(s, "", "  ")
}

// ToMap converts the schema to a map[string]interface{}
func ToMap(s *Schema) map[string]interface{} {
	bytes, _ := json.Marshal(s)
	var result map[string]interface{}
	json.Unmarshal(bytes, &result)
	return result
}

// ToJSONString converts the schema to a JSON string
func (s *Schema) ToJSONString() (string, error) {
	bytes, err := s.ToJSON()
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// ToJSON converts the root schema to JSON
func (r *RootSchema) ToJSON() ([]byte, error) {
	return json.MarshalIndent(r, "", "  ")
}

// ToJSONString converts the root schema to a JSON string
func (r *RootSchema) ToJSONString() (string, error) {
	bytes, err := r.ToJSON()
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}
