package schema

// ObjectBuilder provides object-specific schema building
type ObjectBuilder struct {
	*Builder
}

// Object creates a new object schema builder
func Object() *ObjectBuilder {
	b := New()
	b.Type("object")
	b.schema.Properties = make(map[string]*Schema)
	return &ObjectBuilder{Builder: b}
}

// Property adds a property to the object
func (b *ObjectBuilder) Property(name string, schema *Schema) *ObjectBuilder {
	if b.schema.Properties == nil {
		b.schema.Properties = make(map[string]*Schema)
	}
	b.schema.Properties[name] = schema
	return b
}

// Properties adds multiple properties at once
func (b *ObjectBuilder) Properties(props map[string]*Schema) *ObjectBuilder {
	if b.schema.Properties == nil {
		b.schema.Properties = make(map[string]*Schema)
	}
	for name, schema := range props {
		b.schema.Properties[name] = schema
	}
	return b
}

// Required marks fields as required
func (b *ObjectBuilder) Required(fields ...string) *ObjectBuilder {
	b.schema.Required = append(b.schema.Required, fields...)
	return b
}

// AdditionalProperties sets whether additional properties are allowed
func (b *ObjectBuilder) AdditionalProperties(allowed bool) *ObjectBuilder {
	b.schema.AdditionalProperties = allowed
	return b
}

// AdditionalPropertiesSchema sets a schema for additional properties
func (b *ObjectBuilder) AdditionalPropertiesSchema(schema *Schema) *ObjectBuilder {
	b.schema.AdditionalProperties = schema
	return b
}

// PatternProperty adds a pattern property
func (b *ObjectBuilder) PatternProperty(pattern string, schema *Schema) *ObjectBuilder {
	if b.schema.PatternProperties == nil {
		b.schema.PatternProperties = make(map[string]*Schema)
	}
	b.schema.PatternProperties[pattern] = schema
	return b
}

// MinProperties sets minimum number of properties
func (b *ObjectBuilder) MinProperties(min int) *ObjectBuilder {
	b.schema.MinProperties = &min
	return b
}

// MaxProperties sets maximum number of properties
func (b *ObjectBuilder) MaxProperties(max int) *ObjectBuilder {
	b.schema.MaxProperties = &max
	return b
}

// PropertyNames sets a schema for property names
func (b *ObjectBuilder) PropertyNames(schema *Schema) *ObjectBuilder {
	// Note: This would require extending the Schema struct
	// For now, we'll skip this advanced feature
	return b
}

// Dependency adds a property dependency
func (b *ObjectBuilder) Dependency(property string, dependencies ...string) *ObjectBuilder {
	if b.schema.Dependencies == nil {
		b.schema.Dependencies = make(map[string]interface{})
	}
	b.schema.Dependencies[property] = dependencies
	return b
}

// DependencySchema adds a schema dependency
func (b *ObjectBuilder) DependencySchema(property string, schema *Schema) *ObjectBuilder {
	if b.schema.Dependencies == nil {
		b.schema.Dependencies = make(map[string]interface{})
	}
	b.schema.Dependencies[property] = schema
	return b
}

// Override Builder methods to return ObjectBuilder for chaining
func (b *ObjectBuilder) Title(title string) *ObjectBuilder {
	b.Builder.Title(title)
	return b
}

func (b *ObjectBuilder) Description(desc string) *ObjectBuilder {
	b.Builder.Description(desc)
	return b
}

func (b *ObjectBuilder) Default(value interface{}) *ObjectBuilder {
	b.Builder.Default(value)
	return b
}

func (b *ObjectBuilder) Examples(examples ...interface{}) *ObjectBuilder {
	b.Builder.Examples(examples...)
	return b
}
