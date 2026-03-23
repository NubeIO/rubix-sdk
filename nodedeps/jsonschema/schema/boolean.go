package schema

// BooleanBuilder provides boolean-specific schema building
type BooleanBuilder struct {
	*Builder
}

// Boolean creates a new boolean schema builder
func Boolean() *BooleanBuilder {
	b := New()
	b.Type("boolean")
	return &BooleanBuilder{Builder: b}
}

// Override Builder methods to return BooleanBuilder for chaining
func (b *BooleanBuilder) Title(title string) *BooleanBuilder {
	b.Builder.Title(title)
	return b
}

func (b *BooleanBuilder) Description(desc string) *BooleanBuilder {
	b.Builder.Description(desc)
	return b
}

func (b *BooleanBuilder) Default(value interface{}) *BooleanBuilder {
	b.Builder.Default(value)
	return b
}

// NullBuilder provides null-specific schema building
type NullBuilder struct {
	*Builder
}

// Null creates a new null schema builder
func Null() *NullBuilder {
	b := New()
	b.Type("null")
	return &NullBuilder{Builder: b}
}

// Override Builder methods to return NullBuilder for chaining
func (b *NullBuilder) Title(title string) *NullBuilder {
	b.Builder.Title(title)
	return b
}

func (b *NullBuilder) Description(desc string) *NullBuilder {
	b.Builder.Description(desc)
	return b
}
