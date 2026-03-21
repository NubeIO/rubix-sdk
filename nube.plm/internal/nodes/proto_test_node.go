package nodes

import (
	"context"
	"fmt"
	"time"

	"github.com/NubeIO/rubix-sdk/nodedeps"
	"github.com/NubeIO/rubix-sdk/pluginnode"
)

// ProtoTestNode is a test node for verifying proto RPC functionality
// It has inputs/outputs for all value types: string, number, bool, timestamp
type ProtoTestNode struct {
	NodeID   string
	Settings map[string]interface{}

	// Settings
	prefix string
	multiplier float64
	invert bool
}

// Init initializes the test node
func (n *ProtoTestNode) Init(spec pluginnode.NodeSpec) error {
	n.NodeID = spec.ID
	n.Settings = spec.Settings

	// Extract settings
	if val, ok := spec.Settings["prefix"].(string); ok {
		n.prefix = val
	} else {
		n.prefix = "test"
	}

	if val, ok := spec.Settings["multiplier"].(float64); ok {
		n.multiplier = val
	} else {
		n.multiplier = 2.0
	}

	if val, ok := spec.Settings["invert"].(bool); ok {
		n.invert = val
	} else {
		n.invert = false
	}

	return nil
}

// Close cleans up resources
func (n *ProtoTestNode) Close() error {
	return nil
}

// GetPorts returns the input and output port definitions
func (n *ProtoTestNode) GetPorts() (inputs []pluginnode.NodePort, outputs []pluginnode.NodePort) {
	inputs = []pluginnode.NodePort{
		{
			Handle: "stringIn",
			Name:   "String Input",
			Type:   "string",
			Kind:   "input",
		},
		{
			Handle: "numberIn",
			Name:   "Number Input",
			Type:   "number",
			Kind:   "input",
		},
		{
			Handle: "boolIn",
			Name:   "Boolean Input",
			Type:   "bool",
			Kind:   "input",
		},
		{
			Handle: "timestampIn",
			Name:   "Timestamp Input",
			Type:   "string",
			Kind:   "input",
		},
	}

	outputs = []pluginnode.NodePort{
		{
			Handle: "stringOut",
			Name:   "String Output",
			Type:   "string",
			Kind:   "output",
		},
		{
			Handle: "numberOut",
			Name:   "Number Output",
			Type:   "number",
			Kind:   "output",
		},
		{
			Handle: "boolOut",
			Name:   "Boolean Output",
			Type:   "bool",
			Kind:   "output",
		},
		{
			Handle: "timestampOut",
			Name:   "Timestamp Output",
			Type:   "string",
			Kind:   "output",
		},
	}

	return inputs, outputs
}

// OnInputUpdated is called when an input port is updated
func (n *ProtoTestNode) OnInputUpdated(portID string, val pluginnode.PortValue) {
	// Not used in this simple test
}

// Process is called when an upstream value changes
// This tests all value type conversions through proto
func (n *ProtoTestNode) Process(ctx context.Context, inputs map[string]pluginnode.PortValue) (map[string]pluginnode.PortValue, error) {
	outputs := make(map[string]pluginnode.PortValue)

	// String: Add prefix from settings
	if stringIn, ok := inputs["stringIn"]; ok && stringIn.ValueStr != nil {
		result := fmt.Sprintf("%s_%s", n.prefix, *stringIn.ValueStr)
		outputs["stringOut"] = pluginnode.StrVal(result)
	}

	// Number: Multiply by setting
	if numberIn, ok := inputs["numberIn"]; ok && numberIn.ValueNum != nil {
		result := *numberIn.ValueNum * n.multiplier
		outputs["numberOut"] = pluginnode.NumVal(result)
	}

	// Boolean: Invert if setting is true
	if boolIn, ok := inputs["boolIn"]; ok && boolIn.ValueBool != nil {
		result := *boolIn.ValueBool
		if n.invert {
			result = !result
		}
		outputs["boolOut"] = pluginnode.BoolVal(result)
	}

	// Timestamp: Pass through and add current time if not present
	if timestampIn, ok := inputs["timestampIn"]; ok && timestampIn.ValueStr != nil {
		outputs["timestampOut"] = pluginnode.StrVal(*timestampIn.ValueStr)
	} else {
		// Generate timestamp if not provided
		outputs["timestampOut"] = pluginnode.StrVal(time.Now().UTC().Format(time.RFC3339))
	}

	return outputs, nil
}

// GetConstraints defines test node constraints
func (n *ProtoTestNode) GetConstraints() nodedeps.NodeConstraints {
	return nodedeps.NodeConstraints{
		MaxOneNode:          false, // Multiple test nodes allowed
		DeletionProhibited:  false,
		AllowCascadeDelete:  false,
		MustLiveUnderParent: false, // Can be placed anywhere
		AllowedParents:      []string{}, // No parent restrictions
	}
}

// SettingsSchema returns the JSON Schema for test node settings
func (n *ProtoTestNode) SettingsSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"prefix": map[string]interface{}{
				"type":        "string",
				"title":       "String Prefix",
				"description": "Prefix to add to string input",
				"default":     "test",
			},
			"multiplier": map[string]interface{}{
				"type":        "number",
				"title":       "Number Multiplier",
				"description": "Multiply number input by this value",
				"default":     2.0,
				"minimum":     0,
			},
			"invert": map[string]interface{}{
				"type":        "boolean",
				"title":       "Invert Boolean",
				"description": "If true, invert the boolean input",
				"default":     false,
			},
		},
	}
}
