package converters

import (
	"fmt"
	common "github.com/NubeIO/rubix-sdk/proto/go/common/v1"
)

// InterfaceToProtoValue converts Go interface{} to proto Value
func InterfaceToProtoValue(v interface{}) (*common.Value, error) {
	if v == nil {
		return nil, nil // Omit from map
	}

	switch val := v.(type) {
	case float64:
		return &common.Value{Kind: &common.Value_FloatValue{FloatValue: val}}, nil
	case float32:
		return &common.Value{Kind: &common.Value_FloatValue{FloatValue: float64(val)}}, nil
	case int:
		return &common.Value{Kind: &common.Value_FloatValue{FloatValue: float64(val)}}, nil
	case int64:
		return &common.Value{Kind: &common.Value_FloatValue{FloatValue: float64(val)}}, nil
	case string:
		return &common.Value{Kind: &common.Value_StringValue{StringValue: val}}, nil
	case bool:
		return &common.Value{Kind: &common.Value_BoolValue{BoolValue: val}}, nil
	default:
		return nil, fmt.Errorf("unsupported type: %T", v)
	}
}

// ProtoValueToInterface converts proto Value to Go interface{}
func ProtoValueToInterface(v *common.Value) interface{} {
	if v == nil {
		return nil
	}

	switch kind := v.Kind.(type) {
	case *common.Value_FloatValue:
		return kind.FloatValue
	case *common.Value_StringValue:
		return kind.StringValue
	case *common.Value_BoolValue:
		return kind.BoolValue
	default:
		return nil
	}
}

// MapToProtoValues converts map[string]interface{} to map[string]*common.Value
func MapToProtoValues(m map[string]interface{}) (map[string]*common.Value, error) {
	if m == nil {
		return nil, nil
	}

	result := make(map[string]*common.Value, len(m))
	for k, v := range m {
		if v == nil {
			continue // Omit nil values from proto map
		}
		protoVal, err := InterfaceToProtoValue(v)
		if err != nil {
			return nil, fmt.Errorf("key %s: %w", k, err)
		}
		if protoVal != nil {
			result[k] = protoVal
		}
	}
	return result, nil
}

// ProtoValuesToMap converts map[string]*common.Value to map[string]interface{}
func ProtoValuesToMap(m map[string]*common.Value) map[string]interface{} {
	if m == nil {
		return nil
	}

	result := make(map[string]interface{}, len(m))
	for k, v := range m {
		result[k] = ProtoValueToInterface(v)
	}
	return result
}
