package nodes

import (
	"context"

	"github.com/NubeIO/rubix-sdk/nodedeps"
	"github.com/NubeIO/rubix-sdk/pluginnode"
)

type passiveNode struct {
	NodeID   string
	Settings map[string]interface{}
}

func (n *passiveNode) Init(spec pluginnode.NodeSpec) error {
	n.NodeID = spec.ID
	n.Settings = spec.Settings
	return nil
}

func (n *passiveNode) Close() error {
	return nil
}

func (n *passiveNode) GetPorts() ([]pluginnode.NodePort, []pluginnode.NodePort) {
	return nil, nil
}

func (n *passiveNode) OnInputUpdated(string, pluginnode.PortValue) {}

func (n *passiveNode) Process(context.Context, map[string]pluginnode.PortValue) (map[string]pluginnode.PortValue, error) {
	return nil, nil
}

func accountRefConstraint() nodedeps.RefConstraint {
	return nodedeps.RefConstraint{
		RefName:        "accountRef",
		Required:       true,
		TargetTypes:    []string{"github.account"},
		OnTargetDelete: nodedeps.RefPolicyProtect,
	}
}
