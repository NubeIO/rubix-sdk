package natslib

import (
	"github.com/NubeIO/rubix-sdk/natssubject"
)

// PluginClient combines a NATS client with a subject builder for convenience
type PluginClient struct {
	*Client
	Subject *natssubject.Builder
}

// NewPluginClient creates a plugin client with NATS connection and subject builder.
// prefix is typically "rubix.v1.local" or "rubix.v1.global".
// Deprecated: Use NewPluginClientWithOptions for authenticated connections.
func NewPluginClient(natsURL, prefix, orgID, deviceID, flowID string) (*PluginClient, error) {
	return NewPluginClientWithOptions(ConnectOptions{URL: natsURL}, prefix, orgID, deviceID, flowID)
}

// NewPluginClientWithOptions creates a plugin client with full auth support.
// Pass NKeyFile/InboxPrefix in opts for scoped authentication.
func NewPluginClientWithOptions(opts ConnectOptions, prefix, orgID, deviceID, flowID string) (*PluginClient, error) {
	if opts.Name == "" {
		opts.Name = "rubix-plugin"
	}
	client, err := ConnectWithOptions(&opts)
	if err != nil {
		return nil, err
	}

	sb := natssubject.NewBuilder(prefix, orgID, deviceID, flowID)

	return &PluginClient{
		Client:  client,
		Subject: sb,
	}, nil
}
