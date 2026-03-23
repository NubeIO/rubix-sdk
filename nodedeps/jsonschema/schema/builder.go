package schema

// Builder provides a fluent API for building JSON Schemas
type Builder struct {
	schema *Schema
}

// New creates a new schema builder
func New() *Builder {
	return &Builder{
		schema: &Schema{},
	}
}

// NewRoot creates a new root schema builder with JSON Schema Draft 7
func NewRoot() *RootSchema {
	return &RootSchema{
		Schema:        &Schema{},
		SchemaVersion: "http://json-schema.org/draft-07/schema#",
	}
}

// Build returns the built schema
func (b *Builder) Build() *Schema {
	return b.schema
}

// Type sets the schema type
func (b *Builder) Type(t string) *Builder {
	b.schema.Type = t
	return b
}

// Types sets multiple types
func (b *Builder) Types(types ...string) *Builder {
	b.schema.Type = types
	return b
}

// Title sets the title
func (b *Builder) Title(title string) *Builder {
	b.schema.Title = title
	return b
}

// Description sets the description
func (b *Builder) Description(desc string) *Builder {
	b.schema.Description = desc
	return b
}

// Default sets the default value
func (b *Builder) Default(value interface{}) *Builder {
	b.schema.Default = value
	return b
}

// Examples sets example values
func (b *Builder) Examples(examples ...interface{}) *Builder {
	b.schema.Examples = examples
	return b
}

// Enum sets allowed enum values
func (b *Builder) Enum(values ...interface{}) *Builder {
	b.schema.Enum = values
	return b
}

// Const sets a constant value
func (b *Builder) Const(value interface{}) *Builder {
	b.schema.Const = value
	return b
}

// ReadOnly marks the field as read-only
func (b *Builder) ReadOnly() *Builder {
	t := true
	b.schema.ReadOnly = &t
	return b
}

// WriteOnly marks the field as write-only
func (b *Builder) WriteOnly() *Builder {
	t := true
	b.schema.WriteOnly = &t
	return b
}

// Deprecated marks the field as deprecated
func (b *Builder) Deprecated() *Builder {
	t := true
	b.schema.Deprecated = &t
	return b
}

// UIWidget sets the UI widget hint for react-jsonschema-form
func (b *Builder) UIWidget(widget string) *Builder {
	if b.schema.UISchema == nil {
		b.schema.UISchema = make(map[string]interface{})
	}
	b.schema.UISchema["ui:widget"] = widget
	return b
}

// UIOptions sets UI options
func (b *Builder) UIOptions(options map[string]interface{}) *Builder {
	if b.schema.UISchema == nil {
		b.schema.UISchema = make(map[string]interface{})
	}
	b.schema.UISchema["ui:options"] = options
	return b
}
