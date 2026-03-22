package schema

// StringBuilder provides string-specific schema building
type StringBuilder struct {
	*Builder
}

// String creates a new string schema builder
func String() *StringBuilder {
	b := New()
	b.Type("string")
	return &StringBuilder{Builder: b}
}

// MinLength sets minimum length
func (b *StringBuilder) MinLength(min int) *StringBuilder {
	b.schema.MinLength = &min
	return b
}

// MaxLength sets maximum length
func (b *StringBuilder) MaxLength(max int) *StringBuilder {
	b.schema.MaxLength = &max
	return b
}

// Length sets exact length (min and max)
func (b *StringBuilder) Length(length int) *StringBuilder {
	b.schema.MinLength = &length
	b.schema.MaxLength = &length
	return b
}

// Pattern sets a regex pattern
func (b *StringBuilder) Pattern(pattern string) *StringBuilder {
	b.schema.Pattern = pattern
	return b
}

// Format sets the format
func (b *StringBuilder) Format(format string) *StringBuilder {
	b.schema.Format = format
	return b
}

// Email sets email format validation
func (b *StringBuilder) Email() *StringBuilder {
	b.schema.Format = "email"
	return b
}

// URI sets URI format validation
func (b *StringBuilder) URI() *StringBuilder {
	b.schema.Format = "uri"
	return b
}

// URL is an alias for URI
func (b *StringBuilder) URL() *StringBuilder {
	return b.URI()
}

// Hostname sets hostname format validation
func (b *StringBuilder) Hostname() *StringBuilder {
	b.schema.Format = "hostname"
	return b
}

// IPv4 sets IPv4 format validation
func (b *StringBuilder) IPv4() *StringBuilder {
	b.schema.Format = "ipv4"
	return b
}

// IPv6 sets IPv6 format validation
func (b *StringBuilder) IPv6() *StringBuilder {
	b.schema.Format = "ipv6"
	return b
}

// UUID sets UUID format validation
func (b *StringBuilder) UUID() *StringBuilder {
	b.schema.Format = "uuid"
	return b
}

// Date sets date format validation (YYYY-MM-DD)
func (b *StringBuilder) Date() *StringBuilder {
	b.schema.Format = "date"
	return b
}

// Time sets time format validation (HH:MM:SS)
func (b *StringBuilder) Time() *StringBuilder {
	b.schema.Format = "time"
	return b
}

// DateTime sets date-time format validation (RFC3339)
func (b *StringBuilder) DateTime() *StringBuilder {
	b.schema.Format = "date-time"
	return b
}

// Password sets password UI widget (hides input)
func (b *StringBuilder) Password() *StringBuilder {
	if b.schema.UISchema == nil {
		b.schema.UISchema = make(map[string]interface{})
	}
	b.schema.UISchema["ui:widget"] = "password"
	return b
}

// Textarea sets textarea UI widget
func (b *StringBuilder) Textarea() *StringBuilder {
	if b.schema.UISchema == nil {
		b.schema.UISchema = make(map[string]interface{})
	}
	b.schema.UISchema["ui:widget"] = "textarea"
	return b
}

// Color sets color picker UI widget
func (b *StringBuilder) Color() *StringBuilder {
	b.schema.Format = "color"
	if b.schema.UISchema == nil {
		b.schema.UISchema = make(map[string]interface{})
	}
	b.schema.UISchema["ui:widget"] = "color"
	return b
}

// Override Builder methods to return StringBuilder for chaining
func (b *StringBuilder) Title(title string) *StringBuilder {
	b.Builder.Title(title)
	return b
}

func (b *StringBuilder) Description(desc string) *StringBuilder {
	b.Builder.Description(desc)
	return b
}

func (b *StringBuilder) Default(value interface{}) *StringBuilder {
	b.Builder.Default(value)
	return b
}

func (b *StringBuilder) Examples(examples ...interface{}) *StringBuilder {
	b.Builder.Examples(examples...)
	return b
}

func (b *StringBuilder) Enum(values ...interface{}) *StringBuilder {
	b.Builder.Enum(values...)
	return b
}

func (b *StringBuilder) ReadOnly() *StringBuilder {
	b.Builder.ReadOnly()
	return b
}

func (b *StringBuilder) WriteOnly() *StringBuilder {
	b.Builder.WriteOnly()
	return b
}
