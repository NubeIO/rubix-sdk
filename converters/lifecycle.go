package converters

import (
	"fmt"

	pluginv1 "github.com/NubeIO/rubix-sdk/proto/go/plugin/v1"
	"google.golang.org/protobuf/types/known/structpb"
)

// ============================================================
// Init converters (for rubix-sdk server side)
// ============================================================

// ProtoToInitRequest converts proto InitRequest to internal map (for server)
func ProtoToInitRequest(proto *pluginv1.InitRequest) (map[string]interface{}, error) {
	if proto == nil || proto.Spec == nil {
		return nil, fmt.Errorf("nil init request or spec")
	}

	spec := map[string]interface{}{
		"id":   proto.Spec.Id,
		"type": proto.Spec.Type,
	}

	if proto.Spec.Settings != nil {
		spec["settings"] = proto.Spec.Settings.AsMap()
	}

	return spec, nil
}

// InitResponseToProto converts internal response to proto (for server)
func InitResponseToProto(inputs, outputs []interface{}, schema map[string]interface{}) (*pluginv1.InitResponse, error) {
	// Convert inputs
	protoInputs := make([]*pluginv1.NodePort, len(inputs))
	for i, inp := range inputs {
		portMap, ok := inp.(map[string]interface{})
		if !ok {
			continue
		}

		port := &pluginv1.NodePort{}
		if handle, ok := portMap["handle"].(string); ok {
			port.Handle = handle
		}
		if name, ok := portMap["name"].(string); ok {
			port.Name = name
		}
		if typ, ok := portMap["type"].(string); ok {
			port.Type = typ
		}
		if kind, ok := portMap["kind"].(string); ok {
			port.Kind = kind
		}
		if persist, ok := portMap["persist"].(bool); ok {
			port.Persist = persist
		}

		protoInputs[i] = port
	}

	// Convert outputs
	protoOutputs := make([]*pluginv1.NodePort, len(outputs))
	for i, out := range outputs {
		portMap, ok := out.(map[string]interface{})
		if !ok {
			continue
		}

		port := &pluginv1.NodePort{}
		if handle, ok := portMap["handle"].(string); ok {
			port.Handle = handle
		}
		if name, ok := portMap["name"].(string); ok {
			port.Name = name
		}
		if typ, ok := portMap["type"].(string); ok {
			port.Type = typ
		}
		if kind, ok := portMap["kind"].(string); ok {
			port.Kind = kind
		}
		if persist, ok := portMap["persist"].(bool); ok {
			port.Persist = persist
		}

		protoOutputs[i] = port
	}

	// Convert schema
	var schemaStruct *structpb.Struct
	if schema != nil {
		var err error
		schemaStruct, err = structpb.NewStruct(schema)
		if err != nil {
			return nil, fmt.Errorf("convert schema to proto struct: %w", err)
		}
	}

	return &pluginv1.InitResponse{
		Inputs:         protoInputs,
		Outputs:        protoOutputs,
		SettingsSchema: schemaStruct,
	}, nil
}

// ============================================================
// GetSchema converters
// ============================================================

// ProtoToGetSchemaRequest converts proto GetSchemaRequest to nodeType string
func ProtoToGetSchemaRequest(proto *pluginv1.GetSchemaRequest) string {
	if proto == nil {
		return ""
	}
	return proto.NodeType
}

// GetSchemaResponseToProto converts schema map to proto
func GetSchemaResponseToProto(schema map[string]interface{}) (*pluginv1.GetSchemaResponse, error) {
	var schemaStruct *structpb.Struct
	if schema != nil {
		var err error
		schemaStruct, err = structpb.NewStruct(schema)
		if err != nil {
			return nil, fmt.Errorf("convert schema to proto struct: %w", err)
		}
	}

	return &pluginv1.GetSchemaResponse{
		SettingsSchema: schemaStruct,
	}, nil
}

// ============================================================
// Ping converters
// ============================================================

// PingResponseToProto converts ping response fields to proto
func PingResponseToProto(nodeID, status, version string) *pluginv1.PingResponse {
	return &pluginv1.PingResponse{
		NodeId:  nodeID,
		Status:  status,
		Version: version,
	}
}
