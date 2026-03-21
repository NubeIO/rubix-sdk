package converters

import (
	"testing"

	common "github.com/NubeIO/rubix-sdk/proto/go/common/v1"
)

func TestInterfaceToProtoValue(t *testing.T) {
	tests := []struct {
		name    string
		input   interface{}
		wantNil bool
		wantErr bool
	}{
		{"nil", nil, true, false},
		{"float64", 42.5, false, false},
		{"float32", float32(42.5), false, false},
		{"int", 42, false, false},
		{"int64", int64(42), false, false},
		{"string", "hello", false, false},
		{"bool true", true, false, false},
		{"bool false", false, false, false},
		{"unsupported type", []int{1, 2}, false, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := InterfaceToProtoValue(tt.input)

			if tt.wantErr {
				if err == nil {
					t.Errorf("InterfaceToProtoValue() expected error, got nil")
				}
				return
			}

			if err != nil {
				t.Errorf("InterfaceToProtoValue() unexpected error: %v", err)
				return
			}

			if tt.wantNil {
				if got != nil {
					t.Errorf("InterfaceToProtoValue() = %v, want nil", got)
				}
				return
			}

			if got == nil {
				t.Errorf("InterfaceToProtoValue() = nil, want non-nil")
			}
		})
	}
}

func TestProtoValueToInterface(t *testing.T) {
	tests := []struct {
		name  string
		input *common.Value
		want  interface{}
	}{
		{"nil", nil, nil},
		{"float", &common.Value{Kind: &common.Value_FloatValue{FloatValue: 42.5}}, 42.5},
		{"string", &common.Value{Kind: &common.Value_StringValue{StringValue: "hello"}}, "hello"},
		{"bool", &common.Value{Kind: &common.Value_BoolValue{BoolValue: true}}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ProtoValueToInterface(tt.input)
			if got != tt.want {
				t.Errorf("ProtoValueToInterface() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestMapToProtoValues(t *testing.T) {
	tests := []struct {
		name    string
		input   map[string]interface{}
		wantNil bool
		wantErr bool
		wantLen int
	}{
		{"nil map", nil, true, false, 0},
		{"empty map", map[string]interface{}{}, false, false, 0},
		{"valid map", map[string]interface{}{"temp": 42.5, "name": "test"}, false, false, 2},
		{"map with nil values", map[string]interface{}{"temp": 42.5, "null": nil}, false, false, 1},
		{"map with unsupported type", map[string]interface{}{"bad": []int{1, 2}}, false, true, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := MapToProtoValues(tt.input)

			if tt.wantErr {
				if err == nil {
					t.Errorf("MapToProtoValues() expected error, got nil")
				}
				return
			}

			if err != nil {
				t.Errorf("MapToProtoValues() unexpected error: %v", err)
				return
			}

			if tt.wantNil {
				if got != nil {
					t.Errorf("MapToProtoValues() = %v, want nil", got)
				}
				return
			}

			if len(got) != tt.wantLen {
				t.Errorf("MapToProtoValues() length = %d, want %d", len(got), tt.wantLen)
			}
		})
	}
}

func TestProtoValuesToMap(t *testing.T) {
	tests := []struct {
		name    string
		input   map[string]*common.Value
		wantNil bool
		wantLen int
	}{
		{"nil map", nil, true, 0},
		{"empty map", map[string]*common.Value{}, false, 0},
		{
			"valid map",
			map[string]*common.Value{
				"temp": {Kind: &common.Value_FloatValue{FloatValue: 42.5}},
				"name": {Kind: &common.Value_StringValue{StringValue: "test"}},
			},
			false,
			2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ProtoValuesToMap(tt.input)

			if tt.wantNil {
				if got != nil {
					t.Errorf("ProtoValuesToMap() = %v, want nil", got)
				}
				return
			}

			if len(got) != tt.wantLen {
				t.Errorf("ProtoValuesToMap() length = %d, want %d", len(got), tt.wantLen)
			}
		})
	}
}

// Test round-trip conversion
func TestRoundTripConversion(t *testing.T) {
	original := map[string]interface{}{
		"temperature": 72.5,
		"sensor_name": "temp_sensor_01",
		"enabled":     true,
	}

	// Convert to proto
	protoMap, err := MapToProtoValues(original)
	if err != nil {
		t.Fatalf("MapToProtoValues() error: %v", err)
	}

	// Convert back to interface
	result := ProtoValuesToMap(protoMap)

	// Compare
	if len(result) != len(original) {
		t.Errorf("Round-trip conversion length mismatch: got %d, want %d", len(result), len(original))
	}

	for k, v := range original {
		if result[k] != v {
			t.Errorf("Round-trip conversion mismatch for key %s: got %v, want %v", k, result[k], v)
		}
	}
}
