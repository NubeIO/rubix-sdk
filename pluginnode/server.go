package pluginnode

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/NubeIO/rubix-sdk/converters"
	"github.com/NubeIO/rubix-sdk/natslib"
	"github.com/NubeIO/rubix-sdk/nodedeps"
	pluginv1 "github.com/NubeIO/rubix-sdk/proto/go/plugin/v1"
	"github.com/nats-io/nats.go"
	"github.com/rs/zerolog"
	"google.golang.org/protobuf/proto"
)

// ============================================================
// Node interfaces — implement these in your plugin
// ============================================================

// PluginNode is the interface every plugin node type must satisfy.
type PluginNode interface {
	// Init is called once when the node is placed on a wiresheet.
	// Spec contains the node ID, type, and user-configured settings.
	Init(spec NodeSpec) error

	// Close is called when the node is removed from the wiresheet.
	Close() error

	// GetPorts returns the input and output port definitions.
	GetPorts() (inputs []NodePort, outputs []NodePort)

	// OnInputUpdated is an optional notification hook (called before Process).
	OnInputUpdated(portID string, val PortValue)

	// Process is called when an upstream value changes.
	// Return only the ports whose values have changed.
	Process(ctx context.Context, inputs map[string]PortValue) (map[string]PortValue, error)
}

// EmittingNode is an optional interface for nodes that push values autonomously
// (timers, pollers, webhooks, etc.) without waiting to be triggered by Process.
type EmittingNode interface {
	PluginNode
	StartEmitting(ctx EmitContext) error
	StopEmitting() error
}

// SettingsSchemaProvider is an optional interface for nodes that provide a
// JSON Schema describing their settings (for dynamic form rendering in the UI).
type SettingsSchemaProvider interface {
	PluginNode
	SettingsSchema() map[string]interface{}
}

// NodeFactory creates a node instance for a given node type string.
// Return nil for unknown types (rubix will report an init error).
type NodeFactory func(nodeType string) PluginNode

// EmitContext is passed to StartEmitting — call Emit to push values autonomously.
type EmitContext struct {
	NodeID string
	Emit   func(portHandle string, value PortValue) error
	Logger zerolog.Logger
}

// ============================================================
// PluginServer
// ============================================================

// ServerConfig is the old config type kept for backwards compatibility.
// New code should use PluginServerConfig.
type ServerConfig = PluginServerConfig

// PluginServerConfig configures a PluginServer.
type PluginServerConfig struct {
	NATSClient     *natslib.Client
	Prefix         string // e.g. "rubix.v1.local"
	OrgID          string
	DeviceID       string
	Vendor         string
	PluginName     string
	Version        string
	Factory        NodeFactory // nil = app-only plugin (no node types)
	Logger         zerolog.Logger
	AutoStartNodes bool // call StartEmitting right after Init
}

// PluginServer subscribes to NATS and routes rubix RPC calls to plugin nodes.
// For app-only plugins (Factory == nil) it handles health + control only.
// For node plugins it also handles the full node RPC lifecycle.
type PluginServer struct {
	nc  *natslib.Client
	sb  *SubjectBuilder
	cfg PluginServerConfig
	log zerolog.Logger

	// node registry
	nodes         map[string]PluginNode
	emittingNodes map[string]EmittingNode
	nodeStates    map[string]string // "running" | "stopped"
	mu            sync.RWMutex

	// plugin-level state
	pluginState string
	startTime   time.Time

	// NATS subscriptions
	rpcSub      *nats.Subscription
	healthSub   *nats.Subscription
	controlSub  *nats.Subscription
	nodeCtrlSub *nats.Subscription
}

// NewPluginServer creates and starts the plugin server.
func NewPluginServer(cfg PluginServerConfig) (*PluginServer, error) {
	sb := NewSubjectBuilder(cfg.Prefix, cfg.OrgID, cfg.DeviceID, cfg.Vendor, cfg.PluginName)

	ps := &PluginServer{
		nc:            cfg.NATSClient,
		sb:            sb,
		cfg:           cfg,
		log:           cfg.Logger.With().Str("comp", "plugin_server").Str("plugin", cfg.PluginName).Logger(),
		nodes:         make(map[string]PluginNode),
		emittingNodes: make(map[string]EmittingNode),
		nodeStates:    make(map[string]string),
		pluginState:   "running",
		startTime:     time.Now(),
	}

	var err error

	// health
	ps.healthSub, err = cfg.NATSClient.SubscribeMsg(sb.Health(), ps.handleHealth)
	if err != nil {
		return nil, fmt.Errorf("subscribe health: %w", err)
	}
	ps.log.Info().Str("subject", sb.Health()).Msg("subscribed to health checks")

	// plugin-level control
	ps.controlSub, err = cfg.NATSClient.SubscribeMsg(sb.PluginControl(), ps.handlePluginControl)
	if err != nil {
		return nil, fmt.Errorf("subscribe control: %w", err)
	}
	ps.log.Info().Str("subject", sb.PluginControl()).Msg("subscribed to plugin control")

	// node RPC + node control (only when Factory is provided)
	if cfg.Factory != nil {
		ps.rpcSub, err = cfg.NATSClient.SubscribeMsg(sb.RPCWildcard(), ps.handleRPC)
		if err != nil {
			return nil, fmt.Errorf("subscribe rpc: %w", err)
		}
		ps.log.Info().Str("subject", sb.RPCWildcard()).Msg("subscribed to node RPC")

		ps.nodeCtrlSub, err = cfg.NATSClient.SubscribeMsg(sb.NodeControlWildcard(), ps.handleNodeControl)
		if err != nil {
			return nil, fmt.Errorf("subscribe node control: %w", err)
		}
		ps.log.Info().Str("subject", sb.NodeControlWildcard()).Msg("subscribed to node control")
	}

	ps.log.Info().Msg("plugin server started")
	return ps, nil
}

// Close stops all nodes and unsubscribes from NATS.
func (ps *PluginServer) Close() {
	for _, sub := range []*nats.Subscription{ps.rpcSub, ps.healthSub, ps.controlSub, ps.nodeCtrlSub} {
		if sub != nil {
			sub.Unsubscribe()
		}
	}
	ps.mu.Lock()
	for nodeID, n := range ps.emittingNodes {
		if err := n.StopEmitting(); err != nil {
			ps.log.Warn().Err(err).Str("nodeId", nodeID).Msg("stop emitting")
		}
	}
	ps.mu.Unlock()
	for nodeID, n := range ps.nodes {
		if err := n.Close(); err != nil {
			ps.log.Warn().Err(err).Str("nodeId", nodeID).Msg("close node")
		}
	}
	ps.log.Info().Msg("plugin server stopped")
}

// Emit publishes an autonomous value emission from a node port.
func (ps *PluginServer) Emit(nodeID, portHandle string, value PortValue) error {
	event := EmitEvent{
		NodeID:     nodeID,
		PortHandle: portHandle,
		Value:      value,
		Timestamp:  time.Now().UTC().Format(time.RFC3339),
	}
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal emit: %w", err)
	}
	subject := ps.sb.Emit(nodeID, portHandle)
	if err := ps.nc.Publish(subject, data); err != nil {
		return fmt.Errorf("publish emit: %w", err)
	}
	ps.log.Debug().Str("nodeId", nodeID).Str("port", portHandle).Msg("→ emitted")
	return nil
}

// ============================================================
// Node RPC handler
// ============================================================

func (ps *PluginServer) handleRPC(msg *nats.Msg) {
	// Unmarshal proto RPC request envelope
	var protoReq pluginv1.RPCRequest
	if err := proto.Unmarshal(msg.Data, &protoReq); err != nil {
		ps.replyProtoError(msg, fmt.Errorf("parse proto request: %w", err))
		return
	}
	ps.log.Debug().Str("method", protoReq.Method).Str("nodeId", protoReq.NodeId).Msg("← proto RPC")

	var (
		respData []byte
		err      error
	)

	switch RPCMethod(protoReq.Method) {
	case MethodProcess:
		respData, err = ps.handleProcessProto(&protoReq)
	case MethodGetSchema:
		respData, err = ps.handleGetSchemaProto(&protoReq)
	case MethodListSchemas:
		respData, err = ps.handleListSchemasProto(&protoReq)
	case MethodInit:
		respData, err = ps.handleInitProto(&protoReq)
	case MethodClose:
		respData, err = ps.handleCloseProto(&protoReq)
	case MethodPing:
		respData, err = ps.handlePingProto(&protoReq)
	default:
		err = fmt.Errorf("unknown method: %s", protoReq.Method)
	}

	if err != nil {
		ps.replyProtoError(msg, err)
		return
	}

	// Build proto RPC response envelope
	protoResp := &pluginv1.RPCResponse{
		Success:   true,
		Data:      respData,
		RequestId: protoReq.RequestId,
	}

	respBytes, _ := proto.Marshal(protoResp)
	msg.Respond(respBytes)
}

func (ps *PluginServer) handleInit(req RPCRequest) (RPCResponse, error) {
	var initReq InitRequest
	if err := remarshal(req.Payload, &initReq); err != nil {
		return RPCResponse{}, fmt.Errorf("parse init payload: %w", err)
	}

	node := ps.cfg.Factory(initReq.Spec.Type)
	if node == nil {
		return RPCResponse{}, fmt.Errorf("unknown node type: %s", initReq.Spec.Type)
	}
	if err := node.Init(initReq.Spec); err != nil {
		return RPCResponse{}, fmt.Errorf("node init: %w", err)
	}
	ps.nodes[req.NodeID] = node

	// autonomous emission support
	if en, ok := node.(EmittingNode); ok {
		ps.mu.Lock()
		ps.emittingNodes[req.NodeID] = en
		ps.nodeStates[req.NodeID] = "stopped"
		ps.mu.Unlock()

		if ps.cfg.AutoStartNodes {
			nodeID := req.NodeID
			ec := EmitContext{
				NodeID: nodeID,
				Emit: func(port string, val PortValue) error {
					return ps.Emit(nodeID, port, val)
				},
				Logger: ps.log,
			}
			if err := en.StartEmitting(ec); err != nil {
				ps.log.Warn().Err(err).Str("nodeId", nodeID).Msg("auto-start emit failed")
			} else {
				ps.mu.Lock()
				ps.nodeStates[nodeID] = "running"
				ps.mu.Unlock()
				ps.log.Info().Str("nodeId", nodeID).Msg("auto-started emitting node")
			}
		}
	}

	inputs, outputs := node.GetPorts()
	var schema map[string]interface{}
	if sp, ok := node.(SettingsSchemaProvider); ok {
		schema = sp.SettingsSchema()
	}
	return RPCResponse{Success: true, Data: InitResponse{
		Inputs:         inputs,
		Outputs:        outputs,
		SettingsSchema: schema,
	}}, nil
}

func (ps *PluginServer) handleGetSchema(req RPCRequest) (RPCResponse, error) {
	var schemaReq GetSchemaRequest
	if err := remarshal(req.Payload, &schemaReq); err != nil {
		return RPCResponse{}, fmt.Errorf("parse getSchema payload: %w", err)
	}

	// Create temporary node instance just to get schema (don't call Init)
	node := ps.cfg.Factory(schemaReq.NodeType)
	if node == nil {
		return RPCResponse{}, fmt.Errorf("unknown node type: %s", schemaReq.NodeType)
	}

	// Extract schema if the node provides one
	var schema map[string]interface{}
	if sp, ok := node.(SettingsSchemaProvider); ok {
		schema = sp.SettingsSchema()
	}

	return RPCResponse{Success: true, Data: GetSchemaResponse{
		SettingsSchema: schema,
	}}, nil
}

func (ps *PluginServer) handleProcess(req RPCRequest) (RPCResponse, error) {
	node, ok := ps.nodes[req.NodeID]
	if !ok {
		return RPCResponse{}, fmt.Errorf("node not found: %s", req.NodeID)
	}
	var procReq ProcessRequest
	if err := remarshal(req.Payload, &procReq); err != nil {
		return RPCResponse{}, fmt.Errorf("parse process payload: %w", err)
	}
	outputs, err := node.Process(context.Background(), procReq.Inputs)
	if err != nil {
		return RPCResponse{}, fmt.Errorf("process: %w", err)
	}
	return RPCResponse{Success: true, Data: ProcessResponse{Outputs: outputs}}, nil
}

func (ps *PluginServer) handleClose(req RPCRequest) (RPCResponse, error) {
	node, ok := ps.nodes[req.NodeID]
	if !ok {
		return RPCResponse{}, fmt.Errorf("node not found: %s", req.NodeID)
	}
	if en, ok := ps.emittingNodes[req.NodeID]; ok {
		en.StopEmitting()
		ps.mu.Lock()
		delete(ps.emittingNodes, req.NodeID)
		delete(ps.nodeStates, req.NodeID)
		ps.mu.Unlock()
	}
	if err := node.Close(); err != nil {
		return RPCResponse{}, fmt.Errorf("close: %w", err)
	}
	delete(ps.nodes, req.NodeID)
	return RPCResponse{Success: true}, nil
}

// ============================================================
// Proto RPC handlers
// ============================================================

func (ps *PluginServer) handleProcessProto(rpcReq *pluginv1.RPCRequest) ([]byte, error) {
	// Unmarshal ProcessRequest from payload
	var processReq pluginv1.ProcessRequest
	if err := proto.Unmarshal(rpcReq.Payload, &processReq); err != nil {
		return nil, fmt.Errorf("unmarshal ProcessRequest: %w", err)
	}

	// Get node instance
	node, ok := ps.nodes[rpcReq.NodeId]
	if !ok {
		return nil, fmt.Errorf("node not found: %s", rpcReq.NodeId)
	}

	// Convert proto inputs to map[string]PortValue
	inputMap := converters.ProtoValuesToMap(processReq.Inputs)
	inputs := make(map[string]PortValue, len(inputMap))
	for k, v := range inputMap {
		pv, err := interfaceToPortValue(v)
		if err != nil {
			return nil, fmt.Errorf("convert input %s: %w", k, err)
		}
		inputs[k] = pv
	}

	// Call user's Process() function
	outputs, err := node.Process(context.Background(), inputs)
	if err != nil {
		// Return error in proto response (not as RPC error)
		processResp := &pluginv1.ProcessResponse{
			Outputs: nil,
			Error:   err.Error(),
		}
		return proto.Marshal(processResp)
	}

	// Convert outputs to proto
	outputMap := make(map[string]interface{}, len(outputs))
	for k, v := range outputs {
		outputMap[k] = portValueToInterface(v)
	}
	protoOutputs, err := converters.MapToProtoValues(outputMap)
	if err != nil {
		return nil, fmt.Errorf("convert outputs to proto: %w", err)
	}

	// Build proto ProcessResponse
	processResp := &pluginv1.ProcessResponse{
		Outputs: protoOutputs,
	}

	// Marshal and return
	return proto.Marshal(processResp)
}

// interfaceToPortValue converts interface{} to PortValue
func interfaceToPortValue(v interface{}) (PortValue, error) {
	if v == nil {
		return PortValue{}, nil
	}

	switch val := v.(type) {
	case float64:
		return NumVal(val), nil
	case float32:
		return NumVal(float64(val)), nil
	case int:
		return NumVal(float64(val)), nil
	case int64:
		return NumVal(float64(val)), nil
	case string:
		return StrVal(val), nil
	case bool:
		return BoolVal(val), nil
	default:
		return PortValue{}, fmt.Errorf("unsupported type for PortValue: %T", v)
	}
}

// portValueToInterface extracts the value from PortValue as interface{}
func portValueToInterface(pv PortValue) interface{} {
	if pv.ValueNum != nil {
		return *pv.ValueNum
	}
	if pv.ValueStr != nil {
		return *pv.ValueStr
	}
	if pv.ValueBool != nil {
		return *pv.ValueBool
	}
	if pv.ValueJSON != nil {
		return pv.ValueJSON
	}
	return nil
}

func (ps *PluginServer) handleGetSchemaProto(rpcReq *pluginv1.RPCRequest) ([]byte, error) {
	ps.log.Debug().
		Int("payloadSize", len(rpcReq.Payload)).
		Msg("← SERVER: received GetSchema proto request")

	// Parse GetSchemaRequest from proto payload
	var protoSchemaReq pluginv1.GetSchemaRequest
	if len(rpcReq.Payload) > 0 {
		if err := proto.Unmarshal(rpcReq.Payload, &protoSchemaReq); err != nil {
			ps.log.Error().Err(err).Msg("← SERVER: failed to unmarshal GetSchemaRequest proto")
			return nil, fmt.Errorf("unmarshal GetSchemaRequest proto: %w", err)
		}
	} else {
		ps.log.Error().Msg("← SERVER: GetSchema missing payload")
		return nil, fmt.Errorf("getSchema requires payload with nodeType")
	}

	nodeType := protoSchemaReq.NodeType
	schemaName := protoSchemaReq.SchemaName

	ps.log.Debug().
		Str("nodeType", nodeType).
		Str("schemaName", schemaName).
		Msg("← SERVER: creating node for schema extraction")

	// Create temporary node instance to get schema (don't call Init)
	node := ps.cfg.Factory(nodeType)
	if node == nil {
		ps.log.Error().
			Str("nodeType", nodeType).
			Msg("← SERVER: unknown node type")
		return nil, fmt.Errorf("unknown node type: %s", nodeType)
	}

	// Extract schema - check for MultipleSettingsProvider first
	var schemaMap map[string]interface{}
	var err error

	// Import nodedeps for MultipleSettingsProvider
	if msp, ok := node.(interface {
		GetSettingsSchema(name string) (map[string]interface{}, error)
	}); ok && schemaName != "" {
		// Node supports multiple schemas and a specific schema was requested
		schemaMap, err = msp.GetSettingsSchema(schemaName)
		if err != nil {
			ps.log.Error().Err(err).Str("schemaName", schemaName).Msg("← SERVER: failed to get named schema")
			return nil, fmt.Errorf("get schema %s: %w", schemaName, err)
		}
		ps.log.Debug().
			Str("schemaName", schemaName).
			Int("schemaKeys", len(schemaMap)).
			Msg("← SERVER: extracted named schema from node")
	} else if sp, ok := node.(SettingsSchemaProvider); ok {
		// Fall back to default schema
		schemaMap = sp.SettingsSchema()
		ps.log.Debug().
			Int("schemaKeys", len(schemaMap)).
			Msg("← SERVER: extracted default schema from node")
	} else {
		ps.log.Debug().Msg("← SERVER: node does not implement SettingsSchemaProvider")
	}

	// Convert to proto
	protoSchemaResp, err := converters.GetSchemaResponseToProto(schemaMap)
	if err != nil {
		ps.log.Error().Err(err).Msg("← SERVER: failed to convert schema to proto")
		return nil, fmt.Errorf("convert schema to proto: %w", err)
	}

	// Marshal proto response
	schemaProto, err := proto.Marshal(protoSchemaResp)
	if err != nil {
		ps.log.Error().Err(err).Msg("← SERVER: failed to marshal schema proto")
		return nil, fmt.Errorf("marshal schema proto: %w", err)
	}

	ps.log.Debug().
		Int("schemaProtoSize", len(schemaProto)).
		Msg("→ SERVER: returning GetSchema proto response")

	return schemaProto, nil
}

func (ps *PluginServer) handleListSchemasProto(rpcReq *pluginv1.RPCRequest) ([]byte, error) {
	ps.log.Debug().
		Int("payloadSize", len(rpcReq.Payload)).
		Msg("← SERVER: received ListSchemas proto request")

	// Parse ListSchemasRequest from proto payload
	var protoListReq pluginv1.ListSchemasRequest
	if len(rpcReq.Payload) > 0 {
		if err := proto.Unmarshal(rpcReq.Payload, &protoListReq); err != nil {
			ps.log.Error().Err(err).Msg("← SERVER: failed to unmarshal ListSchemasRequest proto")
			return nil, fmt.Errorf("unmarshal ListSchemasRequest proto: %w", err)
		}
	} else {
		ps.log.Error().Msg("← SERVER: ListSchemas missing payload")
		return nil, fmt.Errorf("listSchemas requires payload with nodeType")
	}

	nodeType := protoListReq.NodeType

	ps.log.Debug().
		Str("nodeType", nodeType).
		Msg("← SERVER: creating node for schema list extraction")

	// Create temporary node instance (don't call Init)
	node := ps.cfg.Factory(nodeType)
	if node == nil {
		ps.log.Error().
			Str("nodeType", nodeType).
			Msg("← SERVER: unknown node type")
		return nil, fmt.Errorf("unknown node type: %s", nodeType)
	}

	// Check if node supports multiple schemas
	var schemaInfos []*pluginv1.SchemaInfo
	supportsMultiple := false

	// Try to call ListSettingsSchemas via duck typing
	type MultipleSchemaProvider interface {
		ListSettingsSchemas() []nodedeps.SettingsSchemaInfo
	}

	if msp, ok := node.(MultipleSchemaProvider); ok {
		// Node implements MultipleSettingsProvider
		supportsMultiple = true
		schemas := msp.ListSettingsSchemas()
		schemaInfos = make([]*pluginv1.SchemaInfo, len(schemas))
		for i, s := range schemas {
			schemaInfos[i] = &pluginv1.SchemaInfo{
				Name:        s.Name,
				DisplayName: s.DisplayName,
				Description: s.Description,
				IsDefault:   s.IsDefault,
			}
		}
		ps.log.Debug().
			Int("schemaCount", len(schemas)).
			Msg("← SERVER: node supports multiple schemas")
	} else {
		// Node only supports single schema - return default entry
		schemaInfos = []*pluginv1.SchemaInfo{
			{
				Name:        "default",
				DisplayName: "Default Settings",
				Description: "Default settings schema",
				IsDefault:   true,
			},
		}
		ps.log.Debug().Msg("← SERVER: node supports single schema only")
	}

	// Build proto response
	protoListResp := &pluginv1.ListSchemasResponse{
		Schemas:          schemaInfos,
		SupportsMultiple: supportsMultiple,
	}

	// Marshal proto response
	listProto, err := proto.Marshal(protoListResp)
	if err != nil {
		ps.log.Error().Err(err).Msg("← SERVER: failed to marshal ListSchemas proto")
		return nil, fmt.Errorf("marshal ListSchemas proto: %w", err)
	}

	ps.log.Debug().
		Int("listProtoSize", len(listProto)).
		Bool("supportsMultiple", supportsMultiple).
		Msg("→ SERVER: returning ListSchemas proto response")

	return listProto, nil
}

func (ps *PluginServer) handleInitProto(rpcReq *pluginv1.RPCRequest) ([]byte, error) {
	ps.log.Debug().
		Int("payloadSize", len(rpcReq.Payload)).
		Str("nodeId", rpcReq.NodeId).
		Msg("← SERVER: received Init proto request")

	// Parse InitRequest from proto payload
	var protoInitReq pluginv1.InitRequest
	if len(rpcReq.Payload) > 0 {
		if err := proto.Unmarshal(rpcReq.Payload, &protoInitReq); err != nil {
			ps.log.Error().Err(err).Msg("← SERVER: failed to unmarshal InitRequest proto")
			return nil, fmt.Errorf("unmarshal InitRequest proto: %w", err)
		}
	} else {
		ps.log.Error().Msg("← SERVER: Init missing payload")
		return nil, fmt.Errorf("init requires payload with NodeSpec")
	}

	// Convert proto to internal spec map
	specMap, err := converters.ProtoToInitRequest(&protoInitReq)
	if err != nil {
		ps.log.Error().Err(err).Msg("← SERVER: failed to convert proto init request")
		return nil, fmt.Errorf("convert proto init request: %w", err)
	}

	// Build NodeSpec from map
	initReq := InitRequest{
		Spec: NodeSpec{
			ID:       specMap["id"].(string),
			Type:     specMap["type"].(string),
			Settings: specMap["settings"].(map[string]interface{}),
		},
	}

	ps.log.Debug().
		Str("nodeType", initReq.Spec.Type).
		Str("nodeId", rpcReq.NodeId).
		Msg("← SERVER: creating and initializing node")

	// Create node instance
	node := ps.cfg.Factory(initReq.Spec.Type)
	if node == nil {
		ps.log.Error().
			Str("nodeType", initReq.Spec.Type).
			Msg("← SERVER: unknown node type")
		return nil, fmt.Errorf("unknown node type: %s", initReq.Spec.Type)
	}

	// Initialize the node
	if err := node.Init(initReq.Spec); err != nil {
		ps.log.Error().Err(err).
			Str("nodeType", initReq.Spec.Type).
			Msg("← SERVER: node Init() failed")
		return nil, fmt.Errorf("node init: %w", err)
	}

	// Store node in registry
	ps.nodes[rpcReq.NodeId] = node

	ps.log.Debug().
		Str("nodeId", rpcReq.NodeId).
		Msg("← SERVER: node initialized, checking for autonomous emission")

	// Handle autonomous emission support
	if en, ok := node.(EmittingNode); ok {
		ps.mu.Lock()
		ps.emittingNodes[rpcReq.NodeId] = en
		ps.nodeStates[rpcReq.NodeId] = "stopped"
		ps.mu.Unlock()

		if ps.cfg.AutoStartNodes {
			nodeID := rpcReq.NodeId
			ec := EmitContext{
				NodeID: nodeID,
				Emit: func(port string, val PortValue) error {
					return ps.Emit(nodeID, port, val)
				},
				Logger: ps.log,
			}
			if err := en.StartEmitting(ec); err != nil {
				ps.log.Warn().Err(err).Str("nodeId", nodeID).Msg("auto-start emit failed")
			} else {
				ps.mu.Lock()
				ps.nodeStates[nodeID] = "running"
				ps.mu.Unlock()
				ps.log.Info().Str("nodeId", nodeID).Msg("auto-started emitting node")
			}
		}
	}

	// Get ports from the initialized node
	inputs, outputs := node.GetPorts()

	ps.log.Debug().
		Int("inputs", len(inputs)).
		Int("outputs", len(outputs)).
		Msg("← SERVER: extracted ports from node")

	// Get schema if available
	var schema map[string]interface{}
	if sp, ok := node.(SettingsSchemaProvider); ok {
		schema = sp.SettingsSchema()
		ps.log.Debug().
			Int("schemaKeys", len(schema)).
			Msg("← SERVER: extracted schema from node")
	}

	// Convert ports to interface{} slices for converter
	inputsInterface := make([]interface{}, len(inputs))
	for i, p := range inputs {
		inputsInterface[i] = map[string]interface{}{
			"handle":  p.Handle,
			"name":    p.Name,
			"type":    p.Type,
			"kind":    p.Kind,
			"persist": p.Persist,
		}
	}

	outputsInterface := make([]interface{}, len(outputs))
	for i, p := range outputs {
		outputsInterface[i] = map[string]interface{}{
			"handle":  p.Handle,
			"name":    p.Name,
			"type":    p.Type,
			"kind":    p.Kind,
			"persist": p.Persist,
		}
	}

	// Convert to proto
	protoInitResp, err := converters.InitResponseToProto(inputsInterface, outputsInterface, schema)
	if err != nil {
		ps.log.Error().Err(err).Msg("← SERVER: failed to convert init response to proto")
		return nil, fmt.Errorf("convert init response to proto: %w", err)
	}

	// Marshal proto response
	initProto, err := proto.Marshal(protoInitResp)
	if err != nil {
		ps.log.Error().Err(err).Msg("← SERVER: failed to marshal init proto response")
		return nil, fmt.Errorf("marshal init proto response: %w", err)
	}

	ps.log.Debug().
		Int("initProtoSize", len(initProto)).
		Msg("→ SERVER: returning Init proto response")

	return initProto, nil
}

func (ps *PluginServer) handleCloseProto(rpcReq *pluginv1.RPCRequest) ([]byte, error) {
	ps.log.Debug().
		Str("nodeId", rpcReq.NodeId).
		Msg("← SERVER: received Close proto request")

	// Get node from registry
	node, ok := ps.nodes[rpcReq.NodeId]
	if !ok {
		ps.log.Error().
			Str("nodeId", rpcReq.NodeId).
			Msg("← SERVER: node not found")
		return nil, fmt.Errorf("node not found: %s", rpcReq.NodeId)
	}

	// Stop emitting if this is an emitting node
	if en, ok := ps.emittingNodes[rpcReq.NodeId]; ok {
		ps.log.Debug().
			Str("nodeId", rpcReq.NodeId).
			Msg("← SERVER: stopping emitting node")
		en.StopEmitting()
		ps.mu.Lock()
		delete(ps.emittingNodes, rpcReq.NodeId)
		delete(ps.nodeStates, rpcReq.NodeId)
		ps.mu.Unlock()
	}

	// Call node's Close method
	if err := node.Close(); err != nil {
		ps.log.Error().Err(err).
			Str("nodeId", rpcReq.NodeId).
			Msg("← SERVER: node Close() failed")
		return nil, fmt.Errorf("close: %w", err)
	}

	// Remove from registry
	delete(ps.nodes, rpcReq.NodeId)

	ps.log.Debug().
		Str("nodeId", rpcReq.NodeId).
		Msg("→ SERVER: node closed successfully")

	// Close has no response data (return empty bytes)
	return []byte{}, nil
}

func (ps *PluginServer) handlePingProto(rpcReq *pluginv1.RPCRequest) ([]byte, error) {
	ps.log.Debug().
		Str("nodeId", rpcReq.NodeId).
		Msg("← SERVER: received Ping proto request")

	// Get node from registry (if nodeId is provided)
	var status string
	if rpcReq.NodeId != "" && rpcReq.NodeId != "__ping__" {
		if _, ok := ps.nodes[rpcReq.NodeId]; ok {
			status = "running"
		} else {
			status = "not_found"
		}
	} else {
		// General plugin ping (not node-specific)
		status = "running"
	}

	// Convert to proto
	protoPingResp := converters.PingResponseToProto(rpcReq.NodeId, status, ps.cfg.Version)

	// Marshal proto response
	pingProto, err := proto.Marshal(protoPingResp)
	if err != nil {
		ps.log.Error().Err(err).Msg("← SERVER: failed to marshal ping proto")
		return nil, fmt.Errorf("marshal ping proto: %w", err)
	}

	ps.log.Debug().
		Str("status", status).
		Msg("→ SERVER: returning Ping proto response")

	return pingProto, nil
}

// ============================================================
// Health handler
// ============================================================

func (ps *PluginServer) handleHealth(msg *nats.Msg) {
	ps.log.Debug().Msg("← health check")
	resp := RPCResponse{
		Success: true,
		Data:    PingResponse{Status: "running", Version: ps.cfg.Version},
	}
	data, _ := json.Marshal(resp)
	msg.Respond(data)
}

// ============================================================
// Plugin-level control handler
// ============================================================

func (ps *PluginServer) handlePluginControl(msg *nats.Msg) {
	var cmd PluginControlCommand
	if err := json.Unmarshal(msg.Data, &cmd); err != nil {
		ps.replyControlError(msg, err)
		return
	}
	ps.log.Info().Str("command", cmd.Command).Msg("← plugin control")

	ps.mu.RLock()
	nodeCount := len(ps.nodes)
	uptime := int(time.Since(ps.startTime).Seconds())
	state := ps.pluginState
	ps.mu.RUnlock()

	resp := PluginControlResponse{
		Command:   cmd.Command,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	switch cmd.Command {
	case "ping", "getStatus":
		resp.Success = true
		resp.State = state
		resp.NodeCount = nodeCount
		resp.Uptime = uptime
		resp.Message = fmt.Sprintf("plugin running with %d nodes", nodeCount)

	case "stop":
		ps.mu.Lock()
		for id, en := range ps.emittingNodes {
			en.StopEmitting()
			ps.nodeStates[id] = "stopped"
		}
		ps.pluginState = "stopped"
		ps.mu.Unlock()
		resp.Success = true
		resp.State = "stopped"
		resp.Message = "plugin stopped"

	case "start":
		ps.mu.Lock()
		for id, en := range ps.emittingNodes {
			if ps.nodeStates[id] == "stopped" {
				nodeID := id
				ec := EmitContext{NodeID: nodeID, Emit: func(port string, val PortValue) error {
					return ps.Emit(nodeID, port, val)
				}, Logger: ps.log}
				if err := en.StartEmitting(ec); err == nil {
					ps.nodeStates[id] = "running"
				}
			}
		}
		ps.pluginState = "running"
		ps.mu.Unlock()
		resp.Success = true
		resp.State = "running"
		resp.Message = "plugin started"

	case "restart":
		ps.mu.Lock()
		for id, en := range ps.emittingNodes {
			en.StopEmitting()
			ps.nodeStates[id] = "stopped"
		}
		ps.mu.Unlock()
		time.Sleep(100 * time.Millisecond)
		ps.mu.Lock()
		for id, en := range ps.emittingNodes {
			nodeID := id
			ec := EmitContext{NodeID: nodeID, Emit: func(port string, val PortValue) error {
				return ps.Emit(nodeID, port, val)
			}, Logger: ps.log}
			if err := en.StartEmitting(ec); err == nil {
				ps.nodeStates[id] = "running"
			}
		}
		ps.pluginState = "running"
		ps.mu.Unlock()
		resp.Success = true
		resp.State = "running"
		resp.Message = "plugin restarted"

	default:
		resp.Success = false
		resp.State = state
		resp.Error = fmt.Sprintf("unknown command: %s", cmd.Command)
	}

	data, _ := json.Marshal(resp)
	msg.Respond(data)
}

// ============================================================
// Node-level control handler
// ============================================================

func (ps *PluginServer) handleNodeControl(msg *nats.Msg) {
	var cmd NodeControlCommand
	if err := json.Unmarshal(msg.Data, &cmd); err != nil {
		ps.replyControlError(msg, err)
		return
	}
	ps.log.Info().Str("command", cmd.Command).Str("nodeId", cmd.NodeID).Msg("← node control")

	resp := NodeControlResponse{
		Command:   cmd.Command,
		NodeID:    cmd.NodeID,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	ps.mu.RLock()
	en, isEmitting := ps.emittingNodes[cmd.NodeID]
	curState := ps.nodeStates[cmd.NodeID]
	ps.mu.RUnlock()

	if !isEmitting {
		resp.Success = false
		resp.State = "unknown"
		resp.Error = fmt.Sprintf("node is not an emitting node: %s", cmd.NodeID)
		data, _ := json.Marshal(resp)
		msg.Respond(data)
		return
	}

	switch cmd.Command {
	case "start":
		if curState == "running" {
			resp.Success = true
			resp.State = "running"
			resp.Message = "already running"
		} else {
			nodeID := cmd.NodeID
			ec := EmitContext{NodeID: nodeID, Emit: func(port string, val PortValue) error {
				return ps.Emit(nodeID, port, val)
			}, Logger: ps.log}
			if err := en.StartEmitting(ec); err != nil {
				resp.Success = false
				resp.State = "stopped"
				resp.Error = err.Error()
			} else {
				ps.mu.Lock()
				ps.nodeStates[cmd.NodeID] = "running"
				ps.mu.Unlock()
				resp.Success = true
				resp.State = "running"
				resp.Message = "node started"
			}
		}
	case "stop":
		if curState == "stopped" {
			resp.Success = true
			resp.State = "stopped"
			resp.Message = "already stopped"
		} else {
			if err := en.StopEmitting(); err != nil {
				resp.Success = false
				resp.State = "running"
				resp.Error = err.Error()
			} else {
				ps.mu.Lock()
				ps.nodeStates[cmd.NodeID] = "stopped"
				ps.mu.Unlock()
				resp.Success = true
				resp.State = "stopped"
				resp.Message = "node stopped"
			}
		}
	default:
		resp.Success = false
		resp.State = curState
		resp.Error = fmt.Sprintf("unknown command: %s", cmd.Command)
	}

	data, _ := json.Marshal(resp)
	msg.Respond(data)
}

// ============================================================
// Helpers
// ============================================================

func (ps *PluginServer) replyError(msg *nats.Msg, err error) {
	ps.log.Error().Err(err).Msg("RPC error")
	data, _ := json.Marshal(RPCResponse{Success: false, Error: err.Error()})
	msg.Respond(data)
}

func (ps *PluginServer) replyProtoError(msg *nats.Msg, err error) {
	ps.log.Error().Err(err).Msg("proto RPC error")
	protoResp := &pluginv1.RPCResponse{
		Success: false,
		Error:   err.Error(),
	}
	data, _ := proto.Marshal(protoResp)
	msg.Respond(data)
}

func (ps *PluginServer) replyControlError(msg *nats.Msg, err error) {
	ps.log.Error().Err(err).Msg("control error")
	data, _ := json.Marshal(PluginControlResponse{
		Success:   false,
		Error:     err.Error(),
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
	msg.Respond(data)
}

// remarshal round-trips through JSON to convert any→typed struct.
func remarshal(src any, dst any) error {
	b, err := json.Marshal(src)
	if err != nil {
		return err
	}
	return json.Unmarshal(b, dst)
}
