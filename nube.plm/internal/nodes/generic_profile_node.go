package nodes

import (
	"context"

	"github.com/NubeIO/rubix-sdk/pluginnode"
)

// ManufacturingUnitNode handles plm.manufacturing-unit nodes
// Simple example: testOutput = testInput + 100
type ManufacturingUnitNode struct {
	NodeID   string
	Settings map[string]interface{}
}

func (n *ManufacturingUnitNode) Init(spec pluginnode.NodeSpec) error {
	n.NodeID = spec.ID
	n.Settings = spec.Settings
	return nil
}

func (n *ManufacturingUnitNode) Close() error {
	return nil
}

func (n *ManufacturingUnitNode) GetPorts() ([]pluginnode.NodePort, []pluginnode.NodePort) {
	// Ports defined in config/nodes.yaml
	return nil, nil
}

func (n *ManufacturingUnitNode) OnInputUpdated(portID string, val pluginnode.PortValue) {
}

func (n *ManufacturingUnitNode) Process(ctx context.Context, inputs map[string]pluginnode.PortValue) (map[string]pluginnode.PortValue, error) {
	outputs := make(map[string]pluginnode.PortValue)

	// ✅ testOutput = testInput + 100
	if testInput, ok := inputs["testInput"]; ok && testInput.ValueNum != nil {
		result := *testInput.ValueNum + 100
		outputs["testOutput"] = pluginnode.NumVal(result)
	}

	return outputs, nil
}
