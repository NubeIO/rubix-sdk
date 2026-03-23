package schema

// NumberBuilder provides number-specific schema building
type NumberBuilder struct {
	*Builder
}

// Number creates a new number schema builder
func Number() *NumberBuilder {
	b := New()
	b.Type("number")
	return &NumberBuilder{Builder: b}
}

// Integer creates a new integer schema builder
func Integer() *NumberBuilder {
	b := New()
	b.Type("integer")
	return &NumberBuilder{Builder: b}
}

// Minimum sets the minimum value (inclusive)
func (b *NumberBuilder) Minimum(min float64) *NumberBuilder {
	b.schema.Minimum = &min
	return b
}

// Maximum sets the maximum value (inclusive)
func (b *NumberBuilder) Maximum(max float64) *NumberBuilder {
	b.schema.Maximum = &max
	return b
}

// ExclusiveMinimum sets the exclusive minimum value
func (b *NumberBuilder) ExclusiveMinimum(min float64) *NumberBuilder {
	b.schema.ExclusiveMinimum = &min
	return b
}

// ExclusiveMaximum sets the exclusive maximum value
func (b *NumberBuilder) ExclusiveMaximum(max float64) *NumberBuilder {
	b.schema.ExclusiveMaximum = &max
	return b
}

// Range sets both minimum and maximum (inclusive)
func (b *NumberBuilder) Range(min, max float64) *NumberBuilder {
	b.schema.Minimum = &min
	b.schema.Maximum = &max
	return b
}

// MultipleOf sets the multipleOf constraint
func (b *NumberBuilder) MultipleOf(value float64) *NumberBuilder {
	b.schema.MultipleOf = &value
	return b
}

// Positive ensures the number is positive (> 0)
func (b *NumberBuilder) Positive() *NumberBuilder {
	zero := 0.0
	b.schema.ExclusiveMinimum = &zero
	return b
}

// NonNegative ensures the number is non-negative (>= 0)
func (b *NumberBuilder) NonNegative() *NumberBuilder {
	zero := 0.0
	b.schema.Minimum = &zero
	return b
}

// Negative ensures the number is negative (< 0)
func (b *NumberBuilder) Negative() *NumberBuilder {
	zero := 0.0
	b.schema.ExclusiveMaximum = &zero
	return b
}

// Override Builder methods to return NumberBuilder for chaining
func (b *NumberBuilder) Title(title string) *NumberBuilder {
	b.Builder.Title(title)
	return b
}

func (b *NumberBuilder) Description(desc string) *NumberBuilder {
	b.Builder.Description(desc)
	return b
}

func (b *NumberBuilder) Default(value interface{}) *NumberBuilder {
	b.Builder.Default(value)
	return b
}

func (b *NumberBuilder) Examples(examples ...interface{}) *NumberBuilder {
	b.Builder.Examples(examples...)
	return b
}

func (b *NumberBuilder) Enum(values ...interface{}) *NumberBuilder {
	b.Builder.Enum(values...)
	return b
}

func (b *NumberBuilder) ReadOnly() *NumberBuilder {
	b.Builder.ReadOnly()
	return b
}
