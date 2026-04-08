package pluginnode

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/NubeIO/rubix-sdk/natslib"
	"github.com/rs/zerolog"
)

// PluginNATSConfig is the JSON structure written by the rubix server into
// each plugin's directory as nats-config.json. It contains everything a
// plugin needs to connect to NATS with the correct identity and permissions.
type PluginNATSConfig struct {
	NatsURL    string `json:"natsURL"`
	OrgID      string `json:"orgID"`
	DeviceID   string `json:"deviceID"`
	Prefix     string `json:"prefix"`
	Vendor     string `json:"vendor"`
	PluginName string `json:"pluginName"`
	Username   string `json:"username,omitempty"`
	Password   string `json:"password,omitempty"`
}

// LoadConfig reads a PluginNATSConfig from a JSON file.
// Typical usage: pluginnode.LoadConfig("nats-config.json")
func LoadConfig(path string) (*PluginNATSConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read plugin nats config %s: %w", path, err)
	}
	var cfg PluginNATSConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parse plugin nats config: %w", err)
	}
	if cfg.NatsURL == "" {
		return nil, fmt.Errorf("plugin nats config: natsURL is required")
	}
	if cfg.Vendor == "" || cfg.PluginName == "" {
		return nil, fmt.Errorf("plugin nats config: vendor and pluginName are required")
	}
	return &cfg, nil
}

// Connect creates a NATS client using the config. If Username/Password are set,
// the connection authenticates via the auth callout service.
func (c *PluginNATSConfig) Connect() (*natslib.Client, error) {
	opts := &natslib.ConnectOptions{
		URL:             c.NatsURL,
		Name:            fmt.Sprintf("%s.%s", c.Vendor, c.PluginName),
		User:            c.Username,
		Password:        c.Password,
		EnableJetStream: true,
	}

	client, err := natslib.ConnectWithOptions(opts)
	if err != nil {
		return nil, fmt.Errorf("plugin nats connect: %w", err)
	}
	return client, nil
}

// ToServerConfig converts the NATS config into a PluginServerConfig ready
// for NewPluginServer. Pass in the connected client, your NodeFactory
// (nil for app-only plugins), and a logger.
func (c *PluginNATSConfig) ToServerConfig(client *natslib.Client, factory NodeFactory, logger zerolog.Logger) PluginServerConfig {
	return PluginServerConfig{
		NATSClient:     client,
		Prefix:         c.Prefix,
		OrgID:          c.OrgID,
		DeviceID:       c.DeviceID,
		Vendor:         c.Vendor,
		PluginName:     c.PluginName,
		Factory:        factory,
		Logger:         logger,
		AutoStartNodes: true,
	}
}
