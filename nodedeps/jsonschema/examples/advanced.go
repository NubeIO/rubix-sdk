package main

import (
	"fmt"
	"log"

	"github.com/NubeIO/rubix/internal/libs/jsonschema/conditionals"
	"github.com/NubeIO/rubix/internal/libs/jsonschema/schema"
	"github.com/NubeIO/rubix/internal/libs/jsonschema/validators"
)

// Example: Real-world API endpoint configuration
func ApiEndpointSchema() *schema.Schema {
	return schema.Object().
		Title("API Endpoint Configuration").
		Description("Configuration for external API endpoints").
		Property("name", schema.String().
			MinLength(1).
			MaxLength(100).
			Title("Endpoint Name").
			Build()).
		Property("baseUrl", validators.URL()).
		Property("authentication", conditionals.OneOf(
			schema.Object().
				Title("API Key").
				Property("type", schema.String().Const("apiKey").Build()).
				Property("key", schema.String().
					MinLength(1).
					Title("API Key").
					Build()).
				Property("header", schema.String().
					Default("X-API-Key").
					Title("Header Name").
					Build()).
				Required("type", "key").
				Build(),
			schema.Object().
				Title("OAuth2").
				Property("type", schema.String().Const("oauth2").Build()).
				Property("clientId", schema.String().Build()).
				Property("clientSecret", schema.String().Build()).
				Property("tokenUrl", validators.URL()).
				Required("type", "clientId", "clientSecret", "tokenUrl").
				Build(),
			schema.Object().
				Title("Basic Auth").
				Property("type", schema.String().Const("basic").Build()).
				Property("username", schema.String().Build()).
				Property("password", schema.String().Build()).
				Required("type", "username", "password").
				Build(),
		)).
		Property("timeout", schema.Integer().
			Minimum(1).
			Maximum(300).
			Default(30).
			Title("Timeout (seconds)").
			Build()).
		Property("retryAttempts", schema.Integer().
			Minimum(0).
			Maximum(10).
			Default(3).
			Build()).
		Property("headers", schema.Object().
			Title("Custom Headers").
			AdditionalPropertiesSchema(schema.String().Build()).
			Build()).
		Required("name", "baseUrl", "authentication").
		Build()
}

// Example: Database connection with conditionals
func DatabaseConfigSchema() *schema.Schema {
	s := schema.Object().
		Title("Database Configuration").
		Property("type", schema.String().
			Enum("postgres", "mysql", "mongodb", "redis").
			Title("Database Type").
			Build()).
		Property("host", conditionals.AnyOf(
			validators.Hostname(),
			validators.IPv4Address(),
		)).
		Property("port", validators.Port()).
		Property("username", schema.String().Build()).
		Property("password", schema.String().Password().Build()).
		Property("database", schema.String().Build()).
		Property("ssl", schema.Boolean().Default(true).Build()).
		Required("type", "host", "port", "username", "password").
		Build()

	// Conditional: If type is postgres or mysql, require database name
	s.If = schema.Object().
		Property("type", conditionals.AnyOf(
			schema.String().Const("postgres").Build(),
			schema.String().Const("mysql").Build(),
		)).
		Build()
	s.Then = schema.Object().
		Required("database").
		Build()

	return s
}

// Example: Cloud provider configuration
func CloudProviderSchema() *schema.Schema {
	return schema.Object().
		Title("Cloud Provider Configuration").
		Property("provider", schema.String().
			Enum("aws", "gcp", "azure").
			Title("Cloud Provider").
			Build()).
		Property("region", schema.String().
			Title("Region").
			Build()).
		Property("credentials", conditionals.OneOf(
			schema.Object().
				Title("AWS Credentials").
				Property("provider", schema.String().Const("aws").Build()).
				Property("accessKeyId", schema.String().Build()).
				Property("secretAccessKey", schema.String().Build()).
				Property("sessionToken", schema.String().Build()).
				Required("provider", "accessKeyId", "secretAccessKey").
				Build(),
			schema.Object().
				Title("GCP Credentials").
				Property("provider", schema.String().Const("gcp").Build()).
				Property("projectId", schema.String().Build()).
				Property("serviceAccountKey", schema.String().Build()).
				Required("provider", "projectId", "serviceAccountKey").
				Build(),
			schema.Object().
				Title("Azure Credentials").
				Property("provider", schema.String().Const("azure").Build()).
				Property("subscriptionId", schema.String().Build()).
				Property("tenantId", schema.String().Build()).
				Property("clientId", schema.String().Build()).
				Property("clientSecret", schema.String().Build()).
				Required("provider", "subscriptionId", "tenantId", "clientId", "clientSecret").
				Build(),
		)).
		Required("provider", "region", "credentials").
		Build()
}

// Example: Kubernetes-style resource configuration
func KubernetesResourceSchema() *schema.Schema {
	return schema.Object().
		Title("Kubernetes Resource").
		Property("apiVersion", schema.String().
			Pattern(`^[a-z0-9]+(/[a-z0-9]+)?$`).
			Examples("v1", "apps/v1", "batch/v1").
			Build()).
		Property("kind", schema.String().
			Enum("Pod", "Deployment", "Service", "ConfigMap", "Secret").
			Build()).
		Property("metadata", schema.Object().
			Property("name", schema.String().
				Pattern(`^[a-z0-9]([-a-z0-9]*[a-z0-9])?$`).
				Title("Name").
				Build()).
			Property("namespace", schema.String().
				Default("default").
				Build()).
			Property("labels", schema.Object().
				AdditionalPropertiesSchema(schema.String().Build()).
				Build()).
			Property("annotations", schema.Object().
				AdditionalPropertiesSchema(schema.String().Build()).
				Build()).
			Required("name").
			Build()).
		Property("spec", schema.Object().
			Title("Specification").
			Description("Resource specification").
			Build()).
		Required("apiVersion", "kind", "metadata").
		Build()
}

// Example: E-commerce product schema
func ProductSchema() *schema.Schema {
	return schema.Object().
		Title("Product").
		Property("id", validators.UUID()).
		Property("sku", schema.String().
			Pattern(`^[A-Z]{3}-\d{6}$`).
			Title("SKU").
			Examples("PRD-123456").
			Build()).
		Property("name", schema.String().
			MinLength(3).
			MaxLength(200).
			Build()).
		Property("description", schema.String().
			MaxLength(2000).
			Build()).
		Property("price", schema.Number().
			Minimum(0).
			MultipleOf(0.01).
			Title("Price").
			Build()).
		Property("currency", schema.String().
			Pattern(`^[A-Z]{3}$`).
			Default("USD").
			Examples("USD", "EUR", "GBP").
			Build()).
		Property("category", schema.String().
			Enum("electronics", "clothing", "books", "food", "toys").
			Build()).
		Property("inStock", schema.Boolean().
			Default(true).
			Build()).
		Property("stockQuantity", schema.Integer().
			NonNegative().
			Build()).
		Property("images", schema.Array().
			Items(validators.URL()).
			MinItems(1).
			MaxItems(10).
			Build()).
		Property("tags", schema.Array().
			Items(schema.String().Build()).
			UniqueItems().
			Build()).
		Property("dimensions", schema.Object().
			Property("weight", schema.Number().Positive().Build()).
			Property("length", schema.Number().Positive().Build()).
			Property("width", schema.Number().Positive().Build()).
			Property("height", schema.Number().Positive().Build()).
			Property("unit", schema.String().
				Enum("cm", "in", "mm").
				Default("cm").
				Build()).
			Build()).
		Required("id", "sku", "name", "price", "category").
		Build()
}

// Example: Form with complex dependencies
func ApplicationFormSchema() *schema.Schema {
	s := schema.Object().
		Title("Job Application Form").
		Property("personalInfo", schema.Object().
			Property("firstName", schema.String().MinLength(1).Build()).
			Property("lastName", schema.String().MinLength(1).Build()).
			Property("email", validators.Email()).
			Property("phone", validators.PhoneNumber()).
			Property("dateOfBirth", validators.DateString()).
			Required("firstName", "lastName", "email").
			Build()).
		Property("hasWorkExperience", schema.Boolean().
			Title("Do you have work experience?").
			Build()).
		Property("hasEducation", schema.Boolean().
			Title("Do you have formal education?").
			Default(true).
			Build()).
		Required("personalInfo", "hasWorkExperience", "hasEducation").
		Build()

	// If hasWorkExperience is true, require workExperience array
	s.If = schema.Object().
		Property("hasWorkExperience", schema.Boolean().Const(true).Build()).
		Build()
	s.Then = schema.Object().
		Property("workExperience", schema.Array().
			Items(schema.Object().
				Property("company", schema.String().Build()).
				Property("position", schema.String().Build()).
				Property("startDate", validators.DateString()).
				Property("endDate", validators.DateString()).
				Property("description", schema.String().Build()).
				Required("company", "position", "startDate").
				Build()).
			MinItems(1).
			Build()).
		Required("workExperience").
		Build()

	return s
}

func main() {
	examples := map[string]*schema.Schema{
		"API Endpoint":        ApiEndpointSchema(),
		"Database Config":     DatabaseConfigSchema(),
		"Cloud Provider":      CloudProviderSchema(),
		"Kubernetes Resource": KubernetesResourceSchema(),
		"Product":             ProductSchema(),
		"Application Form":    ApplicationFormSchema(),
	}

	for name, s := range examples {
		fmt.Printf("\n=== %s ===\n", name)
		jsonStr, err := s.ToJSONString()
		if err != nil {
			log.Fatalf("Error converting %s to JSON: %v", name, err)
		}
		fmt.Println(jsonStr)
	}
}
