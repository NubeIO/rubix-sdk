# JSON Schema Builder for Go

A powerful, type-safe, and easy-to-use Go library for building JSON Schemas programmatically. Perfect for creating validation schemas for APIs, configuration files, and form validation (including react-jsonschema-form).

## Features

- ✅ **Fluent API** - Chainable methods for intuitive schema building
- ✅ **Type-Safe** - Leverage Go's type system
- ✅ **Comprehensive** - Full JSON Schema Draft 7 support
- ✅ **Modular Design** - Clean package structure for easy maintenance
- ✅ **Zero Dependencies** - Pure Go implementation
- ✅ **Built-in Validators** - Common patterns (email, URL, IP, phone, etc.)
- ✅ **Conditional Logic** - if/then/else, anyOf, oneOf, allOf support
- ✅ **React RJSF Compatible** - UI hints for react-jsonschema-form

\

## Quick Start

```go
package main


func main() {
    // Create a simple user registration schema
    userSchema := schema.Object().
        Title("User Registration").
        Property("email", validators.Email()).
        Property("password", validators.StrongPassword()).
        Property("age", schema.Integer().
            Minimum(18).
            Maximum(120).
            Build()).
        Required("email", "password").
        Build()

    // Convert to JSON
    json, _ := userSchema.ToJSONString()
    fmt.Println(json)
}
```

## Package Structure

```
jsonschema-builder/
├── schema/           # Core schema types and builders
│   ├── types.go      # Schema struct definitions
│   ├── builder.go    # Base builder with common methods
│   ├── string.go     # String schema builder
│   ├── number.go     # Number/integer schema builder
│   ├── object.go     # Object schema builder
│   ├── array.go      # Array schema builder
│   └── boolean.go    # Boolean/null schema builders
├── validators/       # Pre-built validation schemas
│   └── validators.go # Email, URL, IP, phone, etc.
├── conditionals/     # Conditional logic helpers
│   └── conditionals.go # if/then/else, anyOf, oneOf, allOf
└── examples/         # Usage examples
    ├── basic.go      # Basic examples
    └── advanced.go   # Real-world examples
```

## Core Concepts

### 1. String Schemas

```go
// Basic string
schema.String().
    MinLength(3).
    MaxLength(50).
    Build()

// Email with format validation
schema.String().
    Email().
    Title("User Email").
    Build()

// Password field (hidden input)
schema.String().
    Password().
    MinLength(8).
    Pattern(`^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$`).
    Build()

// URL validation
schema.String().
    URL().
    Build()

// Custom pattern
schema.String().
    Pattern(`^[A-Z]{3}-\d{6}$`).
    Build()
```

### 2. Number Schemas

```go
// Integer with range
schema.Integer().
    Minimum(1).
    Maximum(100).
    Build()

// Positive number
schema.Number().
    Positive().
    Build()

// Multiple of constraint
schema.Number().
    MultipleOf(0.01).  // For currency
    Build()
```

### 3. Object Schemas

```go
schema.Object().
    Title("User").
    Property("name", schema.String().MinLength(1).Build()).
    Property("age", schema.Integer().Minimum(0).Build()).
    Property("email", validators.Email()).
    Required("name", "email").
    AdditionalProperties(false).
    Build()
```

### 4. Array Schemas

```go
// Array of strings
schema.Array().
    Items(schema.String().Build()).
    MinItems(1).
    MaxItems(10).
    UniqueItems().
    Build()

// Tuple validation (different types per position)
schema.Array().
    TupleItems(
        schema.String().Build(),
        schema.Number().Build(),
        schema.Boolean().Build(),
    ).
    Build()
```

### 5. Boolean Schemas

```go
schema.Boolean().
    Title("Accept Terms").
    Default(false).
    Build()
```

## Built-in Validators

The `validators` package provides ready-to-use schemas for common patterns:

```go
import "github.com/yourusername/jsonschema-builder/validators"

// Email validation
validators.Email()

// Strong password (uppercase, lowercase, number, special char)
validators.StrongPassword()

// IP addresses
validators.IPv4Address()
validators.IPv6Address()
validators.IPAddress()  // IPv4 or IPv6

// Network
validators.Port()
validators.IPv4Port()   // Format: 192.168.1.1:8080
validators.URL()
validators.Hostname()

// Identifiers
validators.UUID()
validators.Slug()       // URL-friendly slugs
validators.Alphanumeric()

// Phone and dates
validators.PhoneNumber()  // E.164 format
validators.DateString()
validators.TimeString()
validators.DateTimeString()

// Other
validators.CreditCard()
validators.HexColor()
```

## Conditional Logic

### if/then/else

```go
import "github.com/yourusername/jsonschema-builder/conditionals"

schema := schema.Object().
    Property("country", schema.String().Build()).
    Property("postalCode", schema.String().Build()).
    Build()

// If country is "US", require 5-digit postal code
schema.If = schema.Object().
    Property("country", schema.String().Const("US").Build()).
    Build()
schema.Then = schema.Object().
    Property("postalCode", schema.String().
        Pattern(`^\d{5}$`).
        Build()).
    Build()
```

### anyOf (match any)

```go
// Accept email OR phone number
conditionals.AnyOf(
    validators.Email(),
    validators.PhoneNumber(),
)
```

### oneOf (match exactly one)

```go
// Payment method: credit card OR paypal OR bank transfer
conditionals.OneOf(
    schema.Object().
        Property("type", schema.String().Const("creditCard").Build()).
        Property("cardNumber", validators.CreditCard()).
        Required("type", "cardNumber").
        Build(),
    schema.Object().
        Property("type", schema.String().Const("paypal").Build()).
        Property("email", validators.Email()).
        Required("type", "email").
        Build(),
)
```

### allOf (match all)

```go
// Combine multiple schemas
conditionals.AllOf(
    personSchema,
    employeeSchema,
)
```

## Real-World Examples

### API Endpoint Configuration

```go
schema.Object().
    Title("API Endpoint").
    Property("name", schema.String().MinLength(1).Build()).
    Property("url", validators.URL()).
    Property("method", schema.String().
        Enum("GET", "POST", "PUT", "DELETE").
        Build()).
    Property("timeout", schema.Integer().
        Minimum(1).
        Maximum(300).
        Default(30).
        Build()).
    Required("name", "url", "method").
    Build()
```

### Database Configuration

```go
schema.Object().
    Title("Database Config").
    Property("host", validators.IPv4Address()).
    Property("port", validators.Port()).
    Property("username", schema.String().Build()).
    Property("password", schema.String().Password().Build()).
    Property("database", schema.String().Build()).
    Property("ssl", schema.Boolean().Default(true).Build()).
    Required("host", "port", "username", "password", "database").
    Build()
```

### User Profile with Conditional Fields

```go
profileSchema := schema.Object().
    Property("userType", schema.String().
        Enum("personal", "business").
        Build()).
    Property("name", schema.String().Build()).
    Build()

// If business, require company info
profileSchema.If = schema.Object().
    Property("userType", schema.String().Const("business").Build()).
    Build()
profileSchema.Then = schema.Object().
    Property("companyName", schema.String().Build()).
    Property("taxId", schema.String().Build()).
    Required("companyName", "taxId").
    Build()
```

## UI Hints (react-jsonschema-form)

```go
// Password field (renders as password input)
schema.String().
    Password().
    Build()

// Textarea widget
schema.String().
    Textarea().
    Build()

// Color picker
schema.String().
    Color().
    Build()

// Custom UI widget
schema.String().
    UIWidget("myCustomWidget").
    Build()

// UI options
schema.String().
    UIOptions(map[string]interface{}{
        "rows": 10,
        "placeholder": "Enter description...",
    }).
    Build()
```

## Advanced Features

### Enums

```go
schema.String().
    Enum("small", "medium", "large").
    Default("medium").
    Build()
```

### Constants

```go
schema.Boolean().
    Const(true).  // Must be true
    Build()
```

### Examples

```go
schema.String().
    Examples("john@example.com", "jane@example.com").
    Build()
```

### Read-only and Write-only

```go
// Read-only (returned by API, not accepted in requests)
schema.String().
    ReadOnly().
    Build()

// Write-only (accepted in requests, not returned by API)
schema.String().
    WriteOnly().
    Build()
```

### Dependencies

```go
schema.Object().
    Property("creditCard", schema.Boolean().Build()).
    Property("cardNumber", schema.String().Build()).
    // If creditCard is present, require cardNumber
    Dependency("creditCard", "cardNumber").
    Build()
```

## Converting to JSON

```go
schema := schema.String().Email().Build()

// Get JSON bytes
jsonBytes, err := schema.ToJSON()

// Get JSON string
jsonString, err := schema.ToJSONString()
```

## Testing Your Schemas

You can validate your schemas using online tools:
- [JSON Schema Validator](https://www.jsonschemavalidator.net/)
- [react-jsonschema-form Playground](https://rjsf-team.github.io/react-jsonschema-form/)

## Best Practices

1. **Use Built-in Validators**: Leverage the `validators` package for common patterns
2. **Keep It DRY**: Extract reusable schemas into functions
3. **Add Descriptions**: Help users understand the purpose of each field
4. **Set Defaults**: Provide sensible default values where appropriate
5. **Use Enums**: Limit values to a known set when possible
6. **Required Fields**: Always specify which fields are required
7. **Min/Max Constraints**: Set reasonable bounds for strings, numbers, and arrays

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/yourusername/jsonschema-builder).
