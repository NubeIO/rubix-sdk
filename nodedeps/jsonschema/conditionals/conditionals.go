package conditionals

import "github.com/NubeIO/rubix/internal/libs/jsonschema/schema"

// ConditionalBuilder provides conditional schema building
type ConditionalBuilder struct {
	schema *schema.Schema
}

// NewConditional creates a new conditional builder
func NewConditional() *ConditionalBuilder {
	return &ConditionalBuilder{
		schema: &schema.Schema{},
	}
}

// If sets the condition schema
func (b *ConditionalBuilder) If(condition *schema.Schema) *ConditionalBuilder {
	b.schema.If = condition
	return b
}

// Then sets the schema to apply if condition is true
func (b *ConditionalBuilder) Then(thenSchema *schema.Schema) *ConditionalBuilder {
	b.schema.Then = thenSchema
	return b
}

// Else sets the schema to apply if condition is false
func (b *ConditionalBuilder) Else(elseSchema *schema.Schema) *ConditionalBuilder {
	b.schema.Else = elseSchema
	return b
}

// Build returns the built conditional schema
func (b *ConditionalBuilder) Build() *schema.Schema {
	return b.schema
}

// AnyOf creates a schema that matches any of the provided schemas
func AnyOf(schemas ...*schema.Schema) *schema.Schema {
	return &schema.Schema{
		AnyOf: schemas,
	}
}

// OneOf creates a schema that matches exactly one of the provided schemas
func OneOf(schemas ...*schema.Schema) *schema.Schema {
	return &schema.Schema{
		OneOf: schemas,
	}
}

// AllOf creates a schema that matches all of the provided schemas
func AllOf(schemas ...*schema.Schema) *schema.Schema {
	return &schema.Schema{
		AllOf: schemas,
	}
}

// Not creates a schema that matches anything except the provided schema
func Not(notSchema *schema.Schema) *schema.Schema {
	return &schema.Schema{
		Not: notSchema,
	}
}

// IfThenElse is a helper to create conditional schemas
func IfThenElse(condition, thenSchema, elseSchema *schema.Schema) *schema.Schema {
	return &schema.Schema{
		If:   condition,
		Then: thenSchema,
		Else: elseSchema,
	}
}

// IfThen is a helper to create conditional schemas without else
func IfThen(condition, thenSchema *schema.Schema) *schema.Schema {
	return &schema.Schema{
		If:   condition,
		Then: thenSchema,
	}
}
