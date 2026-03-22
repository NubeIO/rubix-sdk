package validators

import "github.com/NubeIO/rubix/internal/libs/jsonschema/schema"

// Common regex patterns for validation
const (
	// Email pattern (basic)
	EmailPattern = `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`

	// Password patterns
	PasswordMinPattern        = `^.{8,}$`         // At least 8 characters
	PasswordWithNumberPattern = `^(?=.*\d).{8,}$` // At least 8 chars with number
	PasswordStrongPattern     = `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$`

	// IP patterns
	IPv4Pattern = `^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$`
	IPv6Pattern = `^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$`

	// Port pattern
	PortPattern = `^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$`

	// IP:Port patterns
	IPv4PortPattern = `^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}:([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$`

	// URL pattern
	URLPattern = `^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$`

	// Hostname pattern
	HostnamePattern = `^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$`

	// UUID pattern
	UUIDPattern = `^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`

	// Alphanumeric
	AlphanumericPattern = `^[a-zA-Z0-9]+$`

	// Slug pattern
	SlugPattern = `^[a-z0-9]+(?:-[a-z0-9]+)*$`
)

// Email creates an email validation schema
func Email() *schema.Schema {
	return schema.String().
		Email().
		Title("Email").
		Description("Valid email address").
		Build()
}

// Password creates a password schema with minimum requirements
func Password(minLength int) *schema.Schema {
	return schema.String().
		Password().
		MinLength(minLength).
		Title("Password").
		Description("Password field").
		Build()
}

// StrongPassword creates a strong password schema
// Requires: min 8 chars, uppercase, lowercase, number, special char
func StrongPassword() *schema.Schema {
	return schema.String().
		Password().
		MinLength(8).
		Pattern(PasswordStrongPattern).
		Title("Strong Password").
		Description("Must contain uppercase, lowercase, number, and special character").
		Build()
}

// IPv4Address creates an IPv4 validation schema
func IPv4Address() *schema.Schema {
	return schema.String().
		IPv4().
		Title("IPv4 Address").
		Description("Valid IPv4 address").
		Build()
}

// IPv6Address creates an IPv6 validation schema
func IPv6Address() *schema.Schema {
	return schema.String().
		IPv6().
		Title("IPv6 Address").
		Description("Valid IPv6 address").
		Build()
}

// IPAddress creates a schema that accepts both IPv4 and IPv6
func IPAddress() *schema.Schema {
	return &schema.Schema{
		Type:        "string",
		Title:       "IP Address",
		Description: "Valid IPv4 or IPv6 address",
		AnyOf: []*schema.Schema{
			IPv4Address(),
			IPv6Address(),
		},
	}
}

// Port creates a port number schema
func Port() *schema.Schema {
	return schema.Integer().
		Minimum(1).
		Maximum(65535).
		Title("Port").
		Description("Valid port number (1-65535)").
		Build()
}

// PortString creates a port validation schema as string
func PortString() *schema.Schema {
	return schema.String().
		Pattern(PortPattern).
		Title("Port").
		Description("Valid port number as string (1-65535)").
		Build()
}

// IPv4Port creates an IPv4:port validation schema
func IPv4Port() *schema.Schema {
	return schema.String().
		Pattern(IPv4PortPattern).
		Title("IPv4:Port").
		Description("IPv4 address with port (e.g., 192.168.1.1:8080)").
		Build()
}

// URL creates a URL validation schema
func URL() *schema.Schema {
	return schema.String().
		URL().
		Title("URL").
		Description("Valid URL").
		Build()
}

// Hostname creates a hostname validation schema
func Hostname() *schema.Schema {
	return schema.String().
		Hostname().
		Title("Hostname").
		Description("Valid hostname").
		Build()
}

// UUID creates a UUID validation schema
func UUID() *schema.Schema {
	return schema.String().
		UUID().
		Title("UUID").
		Description("Valid UUID").
		Build()
}

// Slug creates a slug validation schema
func Slug() *schema.Schema {
	return schema.String().
		Pattern(SlugPattern).
		Title("Slug").
		Description("URL-friendly slug (lowercase, alphanumeric, hyphens)").
		Build()
}

// Alphanumeric creates an alphanumeric validation schema
func Alphanumeric() *schema.Schema {
	return schema.String().
		Pattern(AlphanumericPattern).
		Title("Alphanumeric").
		Description("Only letters and numbers").
		Build()
}

// PhoneNumber creates a phone number validation schema (E.164 format)
func PhoneNumber() *schema.Schema {
	return schema.String().
		Pattern(`^\+[1-9]\d{1,14}$`).
		Title("Phone Number").
		Description("Phone number in E.164 format (e.g., +1234567890)").
		Build()
}

// CreditCard creates a credit card number validation schema
func CreditCard() *schema.Schema {
	return schema.String().
		Pattern(`^[0-9]{13,19}$`).
		Title("Credit Card").
		Description("Credit card number").
		Build()
}

// HexColor creates a hex color validation schema
func HexColor() *schema.Schema {
	return schema.String().
		Pattern(`^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$`).
		Color().
		Title("Hex Color").
		Description("Hex color code (e.g., #FF5733)").
		Build()
}

// DateString creates a date string validation schema
func DateString() *schema.Schema {
	return schema.String().
		Date().
		Title("Date").
		Description("Date in YYYY-MM-DD format").
		Build()
}

// TimeString creates a time string validation schema
func TimeString() *schema.Schema {
	return schema.String().
		Time().
		Title("Time").
		Description("Time in HH:MM:SS format").
		Build()
}

// DateTimeString creates a date-time string validation schema
func DateTimeString() *schema.Schema {
	return schema.String().
		DateTime().
		Title("Date Time").
		Description("Date and time in RFC3339 format").
		Build()
}
