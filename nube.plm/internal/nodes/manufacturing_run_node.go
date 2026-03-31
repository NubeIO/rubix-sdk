package nodes

import (
	"context"

	"github.com/NubeIO/rubix-sdk/nodedeps"
	"github.com/NubeIO/rubix-sdk/pluginnode"
)

// ManufacturingRunNode represents a production batch
type ManufacturingRunNode struct {
	NodeID   string
	Settings map[string]interface{}
}

func (n *ManufacturingRunNode) Init(spec pluginnode.NodeSpec) error {
	n.NodeID = spec.ID
	n.Settings = spec.Settings
	return nil
}

func (n *ManufacturingRunNode) Close() error {
	return nil
}

func (n *ManufacturingRunNode) GetPorts() ([]pluginnode.NodePort, []pluginnode.NodePort) {
	return nil, nil // No ports - data model node
}

func (n *ManufacturingRunNode) OnInputUpdated(portID string, val pluginnode.PortValue) {}

func (n *ManufacturingRunNode) Process(ctx context.Context, inputs map[string]pluginnode.PortValue) (map[string]pluginnode.PortValue, error) {
	return nil, nil
}

// GetConstraints defines manufacturing run constraints
func (n *ManufacturingRunNode) GetConstraints() nodedeps.NodeConstraints {
	return nodedeps.NodeConstraints{
		AllowedParents: []string{"plm.project", "core.project"},
		// AllowedChildren: []string{"core.asset"},
		SupportsOwnership: true,
	}
}
