package main

import (
	"fmt"
	"log"

	"github.com/NubeIO/rubix/internal/libs/jsonschema/conditionals"
	"github.com/NubeIO/rubix/internal/libs/jsonschema/formats"
	"github.com/NubeIO/rubix/internal/libs/jsonschema/schema"
	"github.com/NubeIO/rubix/internal/libs/jsonschema/validators"
)

// This example shows a production-ready REST API schema
// for a SaaS application with users, organizations, and billing

func main() {
	// Create complete API schemas
	schemas := map[string]*schema.Schema{
		"CreateUser":         CreateUserSchema(),
		"UpdateUser":         UpdateUserSchema(),
		"UserResponse":       UserResponseSchema(),
		"CreateOrganization": CreateOrganizationSchema(),
		"BillingInformation": BillingInformationSchema(),
		"APIKey":             APIKeySchema(),
		"Webhook":            WebhookSchema(),
	}

	for name, s := range schemas {
		fmt.Printf("\n======== %s Schema ========\n", name)
		jsonStr, err := s.ToJSONString()
		if err != nil {
			log.Fatalf("Error converting %s: %v", name, err)
		}
		fmt.Println(jsonStr)
	}
}

// CreateUserSchema - POST /api/users
func CreateUserSchema() *schema.Schema {
	return schema.Object().
		Title("Create User").
		Description("Schema for creating a new user account").
		Property("email", validators.Email()).
		Property("password", validators.StrongPassword()).
		Property("firstName", schema.String().
			MinLength(1).
			MaxLength(50).
			Title("First Name").
			Build()).
		Property("lastName", schema.String().
			MinLength(1).
			MaxLength(50).
			Title("Last Name").
			Build()).
		Property("phoneNumber", validators.PhoneNumber()).
		Property("country", formats.CountryCode2()).
		Property("timezone", formats.Timezone()).
		Property("role", schema.String().
			Enum("admin", "member", "viewer").
			Default("member").
			Title("User Role").
			Build()).
		Property("preferences", schema.Object().
			Title("User Preferences").
			Property("language", formats.LanguageCode()).
			Property("theme", schema.String().
				Enum("light", "dark", "auto").
				Default("auto").
				Build()).
			Property("notifications", schema.Object().
				Property("email", schema.Boolean().Default(true).Build()).
				Property("push", schema.Boolean().Default(true).Build()).
				Property("sms", schema.Boolean().Default(false).Build()).
				Build()).
			Build()).
		Property("metadata", schema.Object().
			Title("Custom Metadata").
			Description("Key-value pairs for custom user data").
			AdditionalPropertiesSchema(schema.String().Build()).
			Build()).
		Required("email", "password", "firstName", "lastName").
		AdditionalProperties(false).
		Build()
}

// UpdateUserSchema - PATCH /api/users/:id
func UpdateUserSchema() *schema.Schema {
	return schema.Object().
		Title("Update User").
		Description("Schema for updating user information (all fields optional)").
		Property("firstName", schema.String().MinLength(1).MaxLength(50).Build()).
		Property("lastName", schema.String().MinLength(1).MaxLength(50).Build()).
		Property("phoneNumber", validators.PhoneNumber()).
		Property("country", formats.CountryCode2()).
		Property("timezone", formats.Timezone()).
		Property("preferences", schema.Object().
			Property("language", formats.LanguageCode()).
			Property("theme", schema.String().Enum("light", "dark", "auto").Build()).
			Property("notifications", schema.Object().
				Property("email", schema.Boolean().Build()).
				Property("push", schema.Boolean().Build()).
				Property("sms", schema.Boolean().Build()).
				Build()).
			Build()).
		AdditionalProperties(false).
		Build()
}

// UserResponseSchema - GET /api/users/:id response
func UserResponseSchema() *schema.Schema {
	return schema.Object().
		Title("User Response").
		Description("Schema for user data returned by the API").
		Property("id", validators.UUID()).
		Property("email", validators.Email()).
		Property("firstName", schema.String().Build()).
		Property("lastName", schema.String().Build()).
		Property("phoneNumber", validators.PhoneNumber()).
		Property("country", formats.CountryCode2()).
		Property("timezone", formats.Timezone()).
		Property("role", schema.String().
			Enum("admin", "member", "viewer").
			Build()).
		Property("isActive", schema.Boolean().Build()).
		Property("isEmailVerified", schema.Boolean().Build()).
		Property("lastLoginAt", validators.DateTimeString()).
		Property("createdAt", validators.DateTimeString()).
		Property("updatedAt", validators.DateTimeString()).
		Property("preferences", schema.Object().
			Property("language", formats.LanguageCode()).
			Property("theme", schema.String().Build()).
			Property("notifications", schema.Object().Build()).
			Build()).
		Required("id", "email", "firstName", "lastName", "role", "createdAt", "updatedAt").
		AdditionalProperties(false).
		Build()
}

// CreateOrganizationSchema - POST /api/organizations
func CreateOrganizationSchema() *schema.Schema {
	return schema.Object().
		Title("Create Organization").
		Description("Schema for creating a new organization").
		Property("name", schema.String().
			MinLength(2).
			MaxLength(100).
			Title("Organization Name").
			Build()).
		Property("slug", validators.Slug()).
		Property("description", schema.String().
			MaxLength(500).
			Build()).
		Property("website", validators.URL()).
		Property("industry", schema.String().
			Enum(
				"technology",
				"healthcare",
				"finance",
				"education",
				"retail",
				"manufacturing",
				"other",
			).
			Title("Industry").
			Build()).
		Property("size", schema.String().
			Enum("1-10", "11-50", "51-200", "201-500", "501-1000", "1000+").
			Title("Company Size").
			Build()).
		Property("address", schema.Object().
			Title("Organization Address").
			Property("street", schema.String().Build()).
			Property("city", schema.String().Build()).
			Property("state", schema.String().Build()).
			Property("postalCode", schema.String().Build()).
			Property("country", formats.CountryCode2()).
			Required("street", "city", "country").
			Build()).
		Property("settings", schema.Object().
			Title("Organization Settings").
			Property("allowMemberInvites", schema.Boolean().Default(true).Build()).
			Property("requireTwoFactor", schema.Boolean().Default(false).Build()).
			Property("sessionTimeout", schema.Integer().
				Minimum(5).
				Maximum(1440).
				Default(60).
				Title("Session Timeout (minutes)").
				Build()).
			Build()).
		Required("name", "slug").
		AdditionalProperties(false).
		Build()
}

// BillingInformationSchema - POST /api/billing
func BillingInformationSchema() *schema.Schema {
	s := schema.Object().
		Title("Billing Information").
		Description("Schema for billing and payment information").
		Property("billingEmail", validators.Email()).
		Property("paymentMethod", schema.String().
			Enum("credit_card", "bank_transfer", "paypal").
			Title("Payment Method").
			Build()).
		Property("billingAddress", schema.Object().
			Property("street", schema.String().Build()).
			Property("city", schema.String().Build()).
			Property("state", schema.String().Build()).
			Property("postalCode", schema.String().Build()).
			Property("country", formats.CountryCode2()).
			Required("street", "city", "country").
			Build()).
		Property("taxId", schema.String().
			Title("Tax ID / VAT Number").
			Pattern(`^[A-Z]{2}[0-9A-Z]+$`).
			Build()).
		Required("billingEmail", "paymentMethod", "billingAddress").
		Build()

	// Conditional: if payment method is credit_card, require card details
	s.If = schema.Object().
		Property("paymentMethod", schema.String().Const("credit_card").Build()).
		Build()
	s.Then = schema.Object().
		Property("cardDetails", schema.Object().
			Property("cardholderName", schema.String().MinLength(1).Build()).
			Property("cardNumber", validators.CreditCard()).
			Property("expiryMonth", schema.Integer().Minimum(1).Maximum(12).Build()).
			Property("expiryYear", schema.Integer().Minimum(2024).Build()).
			Property("cvv", schema.String().Pattern(`^\d{3,4}$`).Build()).
			Required("cardholderName", "cardNumber", "expiryMonth", "expiryYear", "cvv").
			Build()).
		Required("cardDetails").
		Build()

	return s
}

// APIKeySchema - POST /api/keys
func APIKeySchema() *schema.Schema {
	return schema.Object().
		Title("API Key").
		Description("Schema for creating API keys").
		Property("name", schema.String().
			MinLength(1).
			MaxLength(100).
			Title("Key Name").
			Description("Descriptive name for the API key").
			Build()).
		Property("scopes", schema.Array().
			Title("Permissions").
			Description("List of permissions granted to this key").
			Items(schema.String().
				Enum(
					"users:read",
					"users:write",
					"orgs:read",
					"orgs:write",
					"billing:read",
					"billing:write",
					"webhooks:read",
					"webhooks:write",
				).
				Build()).
			MinItems(1).
			UniqueItems().
			Build()).
		Property("expiresAt", validators.DateTimeString()).
		Property("ipWhitelist", schema.Array().
			Title("IP Whitelist").
			Description("List of allowed IP addresses or CIDR ranges").
			Items(conditionals.AnyOf(
				validators.IPv4Address(),
				formats.CIDRNotation(),
			)).
			Build()).
		Property("rateLimit", schema.Object().
			Title("Rate Limiting").
			Property("requestsPerMinute", schema.Integer().
				Minimum(1).
				Maximum(10000).
				Default(100).
				Build()).
			Property("requestsPerHour", schema.Integer().
				Minimum(1).
				Maximum(100000).
				Default(5000).
				Build()).
			Build()).
		Required("name", "scopes").
		AdditionalProperties(false).
		Build()
}

// WebhookSchema - POST /api/webhooks
func WebhookSchema() *schema.Schema {
	return schema.Object().
		Title("Webhook").
		Description("Schema for webhook configuration").
		Property("name", schema.String().
			MinLength(1).
			MaxLength(100).
			Title("Webhook Name").
			Build()).
		Property("url", validators.URL()).
		Property("events", schema.Array().
			Title("Events").
			Description("List of events that trigger this webhook").
			Items(schema.String().
				Enum(
					"user.created",
					"user.updated",
					"user.deleted",
					"organization.created",
					"organization.updated",
					"organization.deleted",
					"payment.succeeded",
					"payment.failed",
				).
				Build()).
			MinItems(1).
			UniqueItems().
			Build()).
		Property("secret", schema.String().
			MinLength(32).
			Title("Webhook Secret").
			Description("Secret used to sign webhook payloads").
			WriteOnly().
			Build()).
		Property("active", schema.Boolean().
			Default(true).
			Title("Active").
			Description("Whether the webhook is active").
			Build()).
		Property("headers", schema.Object().
			Title("Custom Headers").
			Description("Additional headers to include in webhook requests").
			AdditionalPropertiesSchema(schema.String().Build()).
			Build()).
		Property("retryPolicy", schema.Object().
			Title("Retry Policy").
			Property("maxAttempts", schema.Integer().
				Minimum(0).
				Maximum(10).
				Default(3).
				Build()).
			Property("backoffMultiplier", schema.Number().
				Minimum(1).
				Maximum(10).
				Default(2).
				Build()).
			Build()).
		Required("name", "url", "events", "secret").
		AdditionalProperties(false).
		Build()
}
