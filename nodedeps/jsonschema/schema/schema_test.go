package schema

import (
	"encoding/json"
	"testing"
)

func TestStringSchema(t *testing.T) {
	schema := String().
		Title("Test String").
		MinLength(3).
		MaxLength(50).
		Build()

	if schema.Type != "string" {
		t.Errorf("Expected type 'string', got %v", schema.Type)
	}
	if schema.Title != "Test String" {
		t.Errorf("Expected title 'Test String', got %s", schema.Title)
	}
	if *schema.MinLength != 3 {
		t.Errorf("Expected minLength 3, got %d", *schema.MinLength)
	}
	if *schema.MaxLength != 50 {
		t.Errorf("Expected maxLength 50, got %d", *schema.MaxLength)
	}
}

func TestEmailSchema(t *testing.T) {
	schema := String().Email().Build()

	if schema.Format != "email" {
		t.Errorf("Expected format 'email', got %s", schema.Format)
	}
}

func TestNumberSchema(t *testing.T) {
	schema := Integer().
		Minimum(1).
		Maximum(100).
		Build()

	if schema.Type != "integer" {
		t.Errorf("Expected type 'integer', got %v", schema.Type)
	}
	if *schema.Minimum != 1 {
		t.Errorf("Expected minimum 1, got %f", *schema.Minimum)
	}
	if *schema.Maximum != 100 {
		t.Errorf("Expected maximum 100, got %f", *schema.Maximum)
	}
}

func TestObjectSchema(t *testing.T) {
	schema := Object().
		Title("Test Object").
		Property("name", String().Build()).
		Property("age", Integer().Build()).
		Required("name").
		Build()

	if schema.Type != "object" {
		t.Errorf("Expected type 'object', got %v", schema.Type)
	}
	if len(schema.Properties) != 2 {
		t.Errorf("Expected 2 properties, got %d", len(schema.Properties))
	}
	if len(schema.Required) != 1 {
		t.Errorf("Expected 1 required field, got %d", len(schema.Required))
	}
	if schema.Required[0] != "name" {
		t.Errorf("Expected required field 'name', got %s", schema.Required[0])
	}
}

func TestArraySchema(t *testing.T) {
	schema := Array().
		Items(String().Build()).
		MinItems(1).
		MaxItems(10).
		Build()

	if schema.Type != "array" {
		t.Errorf("Expected type 'array', got %v", schema.Type)
	}
	if *schema.MinItems != 1 {
		t.Errorf("Expected minItems 1, got %d", *schema.MinItems)
	}
	if *schema.MaxItems != 10 {
		t.Errorf("Expected maxItems 10, got %d", *schema.MaxItems)
	}
}

func TestEnumSchema(t *testing.T) {
	schema := String().
		Enum("small", "medium", "large").
		Default("medium").
		Build()

	if len(schema.Enum) != 3 {
		t.Errorf("Expected 3 enum values, got %d", len(schema.Enum))
	}
	if schema.Default != "medium" {
		t.Errorf("Expected default 'medium', got %v", schema.Default)
	}
}

func TestJSONSerialization(t *testing.T) {
	schema := Object().
		Title("User").
		Property("email", String().Email().Build()).
		Property("age", Integer().Minimum(0).Build()).
		Required("email").
		Build()

	jsonBytes, err := schema.ToJSON()
	if err != nil {
		t.Fatalf("Failed to serialize to JSON: %v", err)
	}

	// Verify it's valid JSON
	var result map[string]interface{}
	if err := json.Unmarshal(jsonBytes, &result); err != nil {
		t.Fatalf("Invalid JSON output: %v", err)
	}

	// Check some basic fields
	if result["type"] != "object" {
		t.Errorf("Expected type 'object' in JSON, got %v", result["type"])
	}
	if result["title"] != "User" {
		t.Errorf("Expected title 'User' in JSON, got %v", result["title"])
	}
}

func TestConditionalSchema(t *testing.T) {
	schema := Object().
		Property("country", String().Build()).
		Build()

	schema.If = Object().
		Property("country", String().Const("US").Build()).
		Build()
	schema.Then = Object().
		Property("zipCode", String().Pattern(`^\d{5}$`).Build()).
		Build()

	if schema.If == nil {
		t.Error("Expected If condition to be set")
	}
	if schema.Then == nil {
		t.Error("Expected Then clause to be set")
	}

	// Verify JSON serialization includes conditionals
	jsonBytes, err := schema.ToJSON()
	if err != nil {
		t.Fatalf("Failed to serialize conditional schema: %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(jsonBytes, &result); err != nil {
		t.Fatalf("Invalid JSON output: %v", err)
	}

	if result["if"] == nil {
		t.Error("Expected 'if' field in JSON output")
	}
	if result["then"] == nil {
		t.Error("Expected 'then' field in JSON output")
	}
}

func TestPatternValidation(t *testing.T) {
	schema := String().
		Pattern(`^[A-Z]{3}-\d{6}$`).
		Build()

	if schema.Pattern != `^[A-Z]{3}-\d{6}$` {
		t.Errorf("Expected pattern '^[A-Z]{3}-\\d{6}$', got %s", schema.Pattern)
	}
}

func TestMultipleTypes(t *testing.T) {
	b := New()
	b.Types("string", "null")
	schema := b.Build()

	types, ok := schema.Type.([]string)
	if !ok {
		t.Fatalf("Expected Type to be []string, got %T", schema.Type)
	}
	if len(types) != 2 {
		t.Errorf("Expected 2 types, got %d", len(types))
	}
}
