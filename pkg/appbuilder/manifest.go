package appbuilder

import "gopkg.in/yaml.v3"

// AppManifest is the app.yaml structure written into the zip.
type AppManifest struct {
	Name      string   `yaml:"name"`
	Version   string   `yaml:"version"`
	Exec      string   `yaml:"exec"`
	Args      []string `yaml:"args,omitempty"`
	Port      int      `yaml:"port,omitempty"`
	HealthURL string   `yaml:"health_url,omitempty"`
}

// WriteAppYAML renders an AppManifest to YAML bytes.
func WriteAppYAML(m AppManifest) ([]byte, error) {
	return yaml.Marshal(m)
}
