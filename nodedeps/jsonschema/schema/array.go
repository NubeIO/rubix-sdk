package schema

// ArrayBuilder provides array-specific schema building
type ArrayBuilder struct {
	*Builder
}

// Array creates a new array schema builder
func Array() *ArrayBuilder {
	b := New()
	b.Type("array")
	return &ArrayBuilder{Builder: b}
}

// Items sets the schema for array items (single schema for all items)
func (b *ArrayBuilder) Items(schema *Schema) *ArrayBuilder {
	b.schema.Items = schema
	return b
}

// TupleItems sets schemas for tuple validation (positional items)
func (b *ArrayBuilder) TupleItems(schemas ...*Schema) *ArrayBuilder {
	b.schema.Items = schemas
	return b
}

// MinItems sets minimum number of items
func (b *ArrayBuilder) MinItems(min int) *ArrayBuilder {
	b.schema.MinItems = &min
	return b
}

// MaxItems sets maximum number of items
func (b *ArrayBuilder) MaxItems(max int) *ArrayBuilder {
	b.schema.MaxItems = &max
	return b
}

// UniqueItems ensures all items are unique
func (b *ArrayBuilder) UniqueItems() *ArrayBuilder {
	t := true
	b.schema.UniqueItems = &t
	return b
}

// Contains sets a schema that at least one item must match
func (b *ArrayBuilder) Contains(schema *Schema) *ArrayBuilder {
	b.schema.Contains = schema
	return b
}

// NonEmpty ensures array has at least one item
func (b *ArrayBuilder) NonEmpty() *ArrayBuilder {
	one := 1
	b.schema.MinItems = &one
	return b
}

// Override Builder methods to return ArrayBuilder for chaining
func (b *ArrayBuilder) Title(title string) *ArrayBuilder {
	b.Builder.Title(title)
	return b
}

func (b *ArrayBuilder) Description(desc string) *ArrayBuilder {
	b.Builder.Description(desc)
	return b
}

func (b *ArrayBuilder) Default(value interface{}) *ArrayBuilder {
	b.Builder.Default(value)
	return b
}

func (b *ArrayBuilder) Examples(examples ...interface{}) *ArrayBuilder {
	b.Builder.Examples(examples...)
	return b
}
