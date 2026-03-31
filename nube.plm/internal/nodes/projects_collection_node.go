package nodes

import (
	"context"

	"github.com/NubeIO/rubix-sdk/nodedeps"
	"github.com/NubeIO/rubix-sdk/pluginnode"
)

// ProjectsCollectionNode is the projects container (singleton under service)
// Acts as a "table" that contains all project "rows"
type ProjectsCollectionNode struct {
	NodeID   string
	Settings map[string]interface{}
}

func (n *ProjectsCollectionNode) Init(spec pluginnode.NodeSpec) error {
	n.NodeID = spec.ID
	n.Settings = spec.Settings
	return nil
}

func (n *ProjectsCollectionNode) Close() error {
	return nil
}

func (n *ProjectsCollectionNode) GetPorts() ([]pluginnode.NodePort, []pluginnode.NodePort) {
	return nil, nil // No ports - organizational node
}

func (n *ProjectsCollectionNode) OnInputUpdated(portID string, val pluginnode.PortValue) {}

func (n *ProjectsCollectionNode) Process(ctx context.Context, inputs map[string]pluginnode.PortValue) (map[string]pluginnode.PortValue, error) {
	return nil, nil
}

// GetConstraints defines projects collection as singleton under service
func (n *ProjectsCollectionNode) GetConstraints() nodedeps.NodeConstraints {
	return nodedeps.NodeConstraints{
		MaxOneNode:          true, // Only one projects collection
		DeletionProhibited:  false,
		AllowCascadeDelete:  true, // Delete all child projects
		MustLiveUnderParent: true,
		AllowedParents:      []string{"plm.service"},
	}
}
