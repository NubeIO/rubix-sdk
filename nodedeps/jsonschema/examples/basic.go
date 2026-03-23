package main

import (
	"fmt"
	"log"

	"github.com/NubeIO/rubix/internal/libs/jsonschema/conditionals"
	"github.com/NubeIO/rubix/internal/libs/jsonschema/schema"
	"github.com/NubeIO/rubix/internal/libs/jsonschema/validators"
)

func main() {
	// Example 1: Simple User Registration Form
	fmt.Println("=== Example 1: User Registration ===")
	userSchema := schema.Object().
		Title("User Registration").
		Description("User registration form").
		Property("email", validators.Email()).
		Property("password", validators.StrongPassword()).
		Property("confirmPassword", schema.String().
			Password().
			Title("Confirm Password").
			Build()).
		Property("age", schema.Integer().
			Minimum(18).
			Maximum(120).
			Title("Age").
			Build()).
		Property("agreeToTerms", schema.Boolean().
			Title("Agree to Terms").
			Const(true). // Must be true
			Build()).
		Required("email", "password", "confirmPassword", "agreeToTerms").
		Build()

	printSchema(userSchema)

	// Example 2: Server Configuration with Conditional Logic
	fmt.Println("\n=== Example 2: Server Config with Conditionals ===")
	serverSchema := schema.Object().
		Title("Server Configuration").
		Property("serverType", schema.String().
			Enum("http", "https", "tcp").
			Title("Server Type").
			Build()).
		Property("host", validators.IPv4Address()).
		Property("port", validators.Port()).
		// Conditional: if serverType is "https", require sslCertificate
		Build()

	// Add conditional logic
	serverSchema.If = schema.Object().
		Property("serverType", schema.String().Const("https").Build()).
		Build()
	serverSchema.Then = schema.Object().
		Property("sslCertificate", schema.String().
			Title("SSL Certificate Path").
			Build()).
		Property("sslKey", schema.String().
			Title("SSL Key Path").
			Build()).
		Required("sslCertificate", "sslKey").
		Build()

	printSchema(serverSchema)

	// Example 3: Network Configuration with Multiple Formats
	fmt.Println("\n=== Example 3: Network Configuration ===")
	networkSchema := schema.Object().
		Title("Network Configuration").
		Property("ipAddress", validators.IPv4Address()).
		Property("gateway", validators.IPv4Address()).
		Property("dnsServer", validators.IPAddress()). // IPv4 or IPv6
		Property("proxyUrl", validators.URL()).
		Property("proxyPort", validators.Port()).
		Property("endpoint", validators.IPv4Port()). // IP:Port format
		Required("ipAddress", "gateway").
		Build()

	printSchema(networkSchema)

	// Example 4: Using AnyOf for Multiple Valid Types
	fmt.Println("\n=== Example 4: Contact Information (AnyOf) ===")
	contactSchema := schema.Object().
		Title("Contact Information").
		Property("contact", conditionals.AnyOf(
			schema.String().Email().Title("Email").Build(),
			validators.PhoneNumber(),
			validators.URL(),
		)).
		Required("contact").
		Build()

	printSchema(contactSchema)

	// Example 5: Product Schema with OneOf for Payment
	fmt.Println("\n=== Example 5: Payment Method (OneOf) ===")
	paymentSchema := schema.Object().
		Title("Payment").
		Property("paymentMethod", conditionals.OneOf(
			schema.Object().
				Title("Credit Card").
				Property("type", schema.String().Const("creditCard").Build()).
				Property("cardNumber", validators.CreditCard()).
				Property("cvv", schema.String().Pattern(`^\d{3,4}$`).Build()).
				Required("type", "cardNumber", "cvv").
				Build(),
			schema.Object().
				Title("PayPal").
				Property("type", schema.String().Const("paypal").Build()).
				Property("email", validators.Email()).
				Required("type", "email").
				Build(),
			schema.Object().
				Title("Bank Transfer").
				Property("type", schema.String().Const("bank").Build()).
				Property("iban", schema.String().Pattern(`^[A-Z]{2}\d{2}[A-Z0-9]+$`).Build()).
				Required("type", "iban").
				Build(),
		)).
		Required("paymentMethod").
		Build()

	printSchema(paymentSchema)

	// Example 6: Array of Items
	fmt.Println("\n=== Example 6: Todo List ===")
	todoSchema := schema.Object().
		Title("Todo List").
		Property("todos", schema.Array().
			Title("Tasks").
			Items(schema.Object().
				Property("id", validators.UUID()).
				Property("title", schema.String().
					MinLength(1).
					MaxLength(200).
					Build()).
				Property("completed", schema.Boolean().Default(false).Build()).
				Property("priority", schema.String().
					Enum("low", "medium", "high").
					Default("medium").
					Build()).
				Required("id", "title").
				Build()).
			MinItems(0).
			Build()).
		Build()

	printSchema(todoSchema)

	// Example 7: Complex Nested Object with AllOf
	fmt.Println("\n=== Example 7: Employee (AllOf) ===")

	basePerson := schema.Object().
		Property("firstName", schema.String().MinLength(1).Build()).
		Property("lastName", schema.String().MinLength(1).Build()).
		Property("email", validators.Email()).
		Required("firstName", "lastName", "email").
		Build()

	employeeDetails := schema.Object().
		Property("employeeId", schema.String().Pattern(`^EMP\d{6}$`).Build()).
		Property("department", schema.String().
			Enum("engineering", "sales", "hr", "marketing").
			Build()).
		Property("salary", schema.Number().
			Minimum(0).
			Build()).
		Required("employeeId", "department").
		Build()

	employeeSchema := conditionals.AllOf(basePerson, employeeDetails)
	employeeSchema.Title = "Employee"
	employeeSchema.Description = "Employee combining person and employment details"

	printSchema(employeeSchema)

	// Example 8: Advanced Validation Patterns
	fmt.Println("\n=== Example 8: Advanced Validations ===")
	advancedSchema := schema.Object().
		Title("Advanced Validations").
		Property("username", schema.String().
			Pattern(`^[a-zA-Z0-9_]{3,20}$`).
			Title("Username").
			Description("3-20 characters, alphanumeric and underscore only").
			Build()).
		Property("website", validators.URL()).
		Property("hexColor", validators.HexColor()).
		Property("slug", validators.Slug()).
		Property("createdAt", validators.DateTimeString()).
		Build()

	printSchema(advancedSchema)
}

func printSchema(s *schema.Schema) {
	jsonStr, err := s.ToJSONString()
	if err != nil {
		log.Fatalf("Error converting to JSON: %v", err)
	}
	fmt.Println(jsonStr)
	fmt.Println()
}
