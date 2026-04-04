package codegen

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

// RAS represents the Routing API Specification
type RAS struct {
	Version   int                    `yaml:"version"`
	Prefix    Prefix                 `yaml:"prefix"`
	Resources map[string]Resource    `yaml:"resources"`
	Schemas   map[string]interface{} `yaml:"schemas"`
}

type Prefix struct {
	Rest       string `yaml:"rest"`
	NatsLocal  string `yaml:"natsLocal"`
	NatsGlobal string `yaml:"natsGlobal"`
}

type Resource struct {
	Actions map[string]Action `yaml:"actions"`
}

type Action struct {
	Rest        Rest     `yaml:"rest"`
	Custom      bool     `yaml:"custom,omitempty"`
	Description string   `yaml:"description,omitempty"`
	Args        []Arg    `yaml:"args"`
	Body        Body     `yaml:"body,omitempty"`
	Response    Response `yaml:"response,omitempty"`
	Handler     string   `yaml:"handler,omitempty"`
}

type Rest struct {
	Method string `yaml:"method"`
	Path   string `yaml:"path"`
}

type Arg struct {
	Name        string      `yaml:"name"`
	In          string      `yaml:"in"`
	Type        string      `yaml:"type"`
	Required    bool        `yaml:"required"`
	Default     interface{} `yaml:"default,omitempty"`
	Enum        []string    `yaml:"enum,omitempty"`
	Description string      `yaml:"description,omitempty"`
}

type Body struct {
	SchemaRef  string                 `yaml:"schemaRef,omitempty"`
	Ref        string                 `yaml:"$ref,omitempty"`
	Type       string                 `yaml:"type,omitempty"`
	Properties map[string]interface{} `yaml:"properties,omitempty"`
}

type Response struct {
	SchemaRef  string                 `yaml:"schemaRef,omitempty"`
	Ref        string                 `yaml:"$ref,omitempty"`
	Type       string                 `yaml:"type,omitempty"`
	Properties map[string]interface{} `yaml:"properties,omitempty"`
	Items      *Items                 `yaml:"items,omitempty"`
}

type Items struct {
	SchemaRef string `yaml:"schemaRef,omitempty"`
	Ref       string `yaml:"$ref,omitempty"`
	Type      string `yaml:"type,omitempty"`
}

// LoadRAS loads the RAS from a YAML file or directory
func LoadRAS(path string) (*RAS, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf("stat RAS path: %w", err)
	}

	var ras RAS

	if info.IsDir() {
		ras, err = loadRASFromDirectory(path)
		if err != nil {
			return nil, err
		}
	} else {
		data, err := os.ReadFile(path)
		if err != nil {
			return nil, err
		}

		if err := yaml.Unmarshal(data, &ras); err != nil {
			return nil, err
		}
	}

	return &ras, nil
}

func loadRASFromDirectory(dir string) (RAS, error) {
	ras := RAS{
		Resources: make(map[string]Resource),
		Schemas:   make(map[string]interface{}),
	}

	files, err := filepath.Glob(filepath.Join(dir, "*.yaml"))
	if err != nil {
		return ras, fmt.Errorf("glob YAML files: %w", err)
	}

	if len(files) == 0 {
		return ras, fmt.Errorf("no YAML files found in directory: %s", dir)
	}

	for _, file := range files {
		data, err := os.ReadFile(file)
		if err != nil {
			return ras, fmt.Errorf("read file %s: %w", file, err)
		}

		var fileRAS RAS
		if err := yaml.Unmarshal(data, &fileRAS); err != nil {
			return ras, fmt.Errorf("parse file %s: %w", file, err)
		}

		if fileRAS.Version != 0 {
			ras.Version = fileRAS.Version
		}

		if fileRAS.Prefix.Rest != "" {
			ras.Prefix.Rest = fileRAS.Prefix.Rest
		}
		if fileRAS.Prefix.NatsLocal != "" {
			ras.Prefix.NatsLocal = fileRAS.Prefix.NatsLocal
		}
		if fileRAS.Prefix.NatsGlobal != "" {
			ras.Prefix.NatsGlobal = fileRAS.Prefix.NatsGlobal
		}

		for resourceName, resource := range fileRAS.Resources {
			if _, exists := ras.Resources[resourceName]; exists {
				return ras, fmt.Errorf("duplicate resource '%s' found in file %s", resourceName, filepath.Base(file))
			}
			ras.Resources[resourceName] = resource
		}

		for schemaName, schema := range fileRAS.Schemas {
			if _, exists := ras.Schemas[schemaName]; exists {
				return ras, fmt.Errorf("duplicate schema '%s' found in file %s", schemaName, filepath.Base(file))
			}
			ras.Schemas[schemaName] = schema
		}
	}

	schemasDir := filepath.Join(dir, "schemas")
	if info, err := os.Stat(schemasDir); err == nil && info.IsDir() {
		schemaFiles, err := filepath.Glob(filepath.Join(schemasDir, "*.yaml"))
		if err != nil {
			return ras, fmt.Errorf("glob schema files: %w", err)
		}

		for _, file := range schemaFiles {
			data, err := os.ReadFile(file)
			if err != nil {
				return ras, fmt.Errorf("read schema file %s: %w", file, err)
			}

			var fileRAS RAS
			if err := yaml.Unmarshal(data, &fileRAS); err != nil {
				return ras, fmt.Errorf("parse schema file %s: %w", file, err)
			}

			for schemaName, schema := range fileRAS.Schemas {
				if _, exists := ras.Schemas[schemaName]; exists {
					return ras, fmt.Errorf("duplicate schema '%s' found in schemas/%s", schemaName, filepath.Base(file))
				}
				ras.Schemas[schemaName] = schema
			}
		}
	}

	return ras, nil
}
