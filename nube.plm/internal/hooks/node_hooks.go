package hooks

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/NubeIO/rubix-sdk/bootstrap"
	"github.com/NubeIO/rubix-sdk/nodehooks"
	"github.com/rs/zerolog/log"
)

// PLMNodeHooks implements the nodehooks.NodeHooks interface for PLM plugin
// This controls CRUD operations on PLM node types (plm.project, plm.task)
type PLMNodeHooks struct {
	nodehooks.NoOpHooks // Embed default implementations
	client              *bootstrap.Client
}

// NewPLMNodeHooks creates a new PLM node hooks handler
func NewPLMNodeHooks(client *bootstrap.Client) *PLMNodeHooks {
	return &PLMNodeHooks{client: client}
}

// BeforeCreate validates a node before creation
func (h *PLMNodeHooks) BeforeCreate(ctx context.Context, req *nodehooks.BeforeCreateRequest) (*nodehooks.BeforeCreateResponse, error) {
	switch req.Node.Type {
	case "plm.project":
		return h.validateProjectCreate(ctx, req)
	case "plm.manufacturing-run":
		return h.validateManufacturingRunCreate(ctx, req)
	case "plm.task":
		return h.validateTaskCreate(ctx, req)
	default:
		// Unknown type, allow (should not happen if plugin.json is correct)
		return &nodehooks.BeforeCreateResponse{Allow: true}, nil
	}
}

// AfterCreate logs node creation
func (h *PLMNodeHooks) AfterCreate(ctx context.Context, req *nodehooks.AfterCreateRequest) (*nodehooks.AfterCreateResponse, error) {
	log.Info().
		Str("nodeId", req.Node.ID).
		Str("type", req.Node.Type).
		Str("name", req.Node.Name).
		Str("orgId", req.OrgID).
		Msg("PLM node created")

	// Future: Send notifications, update search index, etc.

	return &nodehooks.AfterCreateResponse{}, nil
}

// BeforeUpdate validates a node before update
func (h *PLMNodeHooks) BeforeUpdate(ctx context.Context, req *nodehooks.BeforeUpdateRequest) (*nodehooks.BeforeUpdateResponse, error) {
	switch req.NewNode.Type {
	case "plm.project":
		return h.validateProjectUpdate(ctx, req)
	case "plm.manufacturing-run":
		return h.validateManufacturingRunUpdate(ctx, req)
	case "plm.task":
		return h.validateTaskUpdate(ctx, req)
	default:
		return &nodehooks.BeforeUpdateResponse{Allow: true}, nil
	}
}

// AfterUpdate logs node updates
func (h *PLMNodeHooks) AfterUpdate(ctx context.Context, req *nodehooks.AfterUpdateRequest) (*nodehooks.AfterUpdateResponse, error) {
	log.Info().
		Str("nodeId", req.NewNode.ID).
		Str("type", req.NewNode.Type).
		Str("orgId", req.OrgID).
		Msg("PLM node updated")

	return &nodehooks.AfterUpdateResponse{}, nil
}

// BeforeDelete validates a node before deletion
func (h *PLMNodeHooks) BeforeDelete(ctx context.Context, req *nodehooks.BeforeDeleteRequest) (*nodehooks.BeforeDeleteResponse, error) {
	// Example: Could check if project has active orders, projects have tasks, etc.
	log.Debug().
		Str("nodeId", req.Node.ID).
		Str("type", req.Node.Type).
		Msg("PLM node deletion requested")

	return &nodehooks.BeforeDeleteResponse{Allow: true}, nil
}

// AfterDelete logs node deletion
func (h *PLMNodeHooks) AfterDelete(ctx context.Context, req *nodehooks.AfterDeleteRequest) (*nodehooks.AfterDeleteResponse, error) {
	log.Info().
		Str("nodeId", req.Node.ID).
		Str("type", req.Node.Type).
		Str("orgId", req.OrgID).
		Msg("PLM node deleted")

	return &nodehooks.AfterDeleteResponse{}, nil
}

// ============================================================================
// Project Validation
// ============================================================================

func (h *PLMNodeHooks) validateProjectCreate(ctx context.Context, req *nodehooks.BeforeCreateRequest) (*nodehooks.BeforeCreateResponse, error) {
	// Validate required fields
	projectCode, ok := req.Node.Settings["projectCode"].(string)
	if !ok || projectCode == "" {
		return &nodehooks.BeforeCreateResponse{
			Allow:  false,
			Reason: "projectCode is required for plm.project nodes",
		}, nil
	}

	// Validate project code format (example: must start with letters)
	if len(projectCode) < 3 {
		return &nodehooks.BeforeCreateResponse{
			Allow:  false,
			Reason: "projectCode must be at least 3 characters",
		}, nil
	}

	// Validate status enum
	status, ok := req.Node.Settings["status"].(string)
	if ok && !isValidProjectStatus(status) {
		return &nodehooks.BeforeCreateResponse{
			Allow:  false,
			Reason: fmt.Sprintf("invalid status '%s'. Must be: Design, Prototype, Production, or Discontinued", status),
		}, nil
	}

	// Validate price if provided
	if price, ok := req.Node.Settings["price"].(float64); ok {
		if price < 0 {
			return &nodehooks.BeforeCreateResponse{
				Allow:  false,
				Reason: "price cannot be negative",
			}, nil
		}
	}

	duplicateExists, err := h.projectCodeExists(ctx, projectCode)
	if err != nil {
		return nil, err
	}
	if duplicateExists {
		return &nodehooks.BeforeCreateResponse{
			Allow:  false,
			Reason: fmt.Sprintf("projectCode '%s' already exists", projectCode),
		}, nil
	}

	warnings := []string{}
	if status == "" {
		warnings = append(warnings, "status not set, will default to 'Design'")
	}

	return &nodehooks.BeforeCreateResponse{
		Allow:    true,
		Warnings: warnings,
	}, nil
}

func (h *PLMNodeHooks) validateProjectUpdate(ctx context.Context, req *nodehooks.BeforeUpdateRequest) (*nodehooks.BeforeUpdateResponse, error) {
	// Don't allow changing projectCode after creation (immutable)
	oldCode, _ := req.OldNode.Settings["projectCode"].(string)
	newCode, _ := req.NewNode.Settings["projectCode"].(string)

	if oldCode != "" && newCode != oldCode {
		return &nodehooks.BeforeUpdateResponse{
			Allow:  false,
			Reason: "projectCode cannot be changed after creation",
		}, nil
	}

	// Validate status transitions
	oldStatus, _ := req.OldNode.Settings["status"].(string)
	newStatus, _ := req.NewNode.Settings["status"].(string)

	if oldStatus == "Discontinued" && newStatus != "Discontinued" {
		return &nodehooks.BeforeUpdateResponse{
			Allow:  false,
			Reason: "cannot reactivate a discontinued project",
		}, nil
	}

	// Validate new status if changed
	if newStatus != "" && !isValidProjectStatus(newStatus) {
		return &nodehooks.BeforeUpdateResponse{
			Allow:  false,
			Reason: fmt.Sprintf("invalid status '%s'", newStatus),
		}, nil
	}

	// Validate price
	if price, ok := req.NewNode.Settings["price"].(float64); ok && price < 0 {
		return &nodehooks.BeforeUpdateResponse{
			Allow:  false,
			Reason: "price cannot be negative",
		}, nil
	}

	return &nodehooks.BeforeUpdateResponse{Allow: true}, nil
}

// ============================================================================
// Manufacturing Run Validation
// ============================================================================

func (h *PLMNodeHooks) validateManufacturingRunCreate(ctx context.Context, req *nodehooks.BeforeCreateRequest) (*nodehooks.BeforeCreateResponse, error) {
	_ = ctx

	hardwareVersion, _ := req.Node.Settings["hardwareVersion"].(string)
	if strings.TrimSpace(hardwareVersion) == "" {
		return &nodehooks.BeforeCreateResponse{
			Allow:  false,
			Reason: "hardwareVersion is required for plm.manufacturing-run nodes",
		}, nil
	}

	targetQuantity, ok := extractNumericValue(req.Node.Settings["targetQuantity"])
	if !ok || targetQuantity < 1 {
		return &nodehooks.BeforeCreateResponse{
			Allow:  false,
			Reason: "targetQuantity must be at least 1",
		}, nil
	}

	status, _ := req.Node.Settings["status"].(string)
	if status == "" {
		status = "planned"
	}
	if !isValidManufacturingRunStatus(status) {
		return &nodehooks.BeforeCreateResponse{
			Allow:  false,
			Reason: fmt.Sprintf("invalid manufacturing run status '%s'", status),
		}, nil
	}

	modified := req.Node
	if modified.Settings == nil {
		modified.Settings = map[string]any{}
	}

	if runNumber, _ := modified.Settings["runNumber"].(string); strings.TrimSpace(runNumber) == "" {
		modified.Settings["runNumber"] = time.Now().Format(`MR-2006:01:02-15:04`)
	}
	if _, exists := modified.Settings["producedCount"]; !exists {
		modified.Settings["producedCount"] = 0
	}
	if _, exists := modified.Settings["qaFailures"]; !exists {
		modified.Settings["qaFailures"] = 0
	}
	modified.Settings["status"] = status

	return &nodehooks.BeforeCreateResponse{
		Allow:    true,
		Modified: &modified,
	}, nil
}

func (h *PLMNodeHooks) validateManufacturingRunUpdate(ctx context.Context, req *nodehooks.BeforeUpdateRequest) (*nodehooks.BeforeUpdateResponse, error) {
	_ = ctx

	oldStatus, _ := req.OldNode.Settings["status"].(string)
	newStatus, _ := req.NewNode.Settings["status"].(string)
	if newStatus != "" && !isValidManufacturingRunStatus(newStatus) {
		return &nodehooks.BeforeUpdateResponse{
			Allow:  false,
			Reason: fmt.Sprintf("invalid manufacturing run status '%s'", newStatus),
		}, nil
	}

	if oldStatus == "completed" && newStatus != "" && newStatus != "completed" {
		return &nodehooks.BeforeUpdateResponse{
			Allow:  false,
			Reason: "completed manufacturing runs cannot move back to another status",
		}, nil
	}

	if targetQuantity, ok := extractNumericValue(req.NewNode.Settings["targetQuantity"]); ok && targetQuantity < 1 {
		return &nodehooks.BeforeUpdateResponse{
			Allow:  false,
			Reason: "targetQuantity must be at least 1",
		}, nil
	}

	return &nodehooks.BeforeUpdateResponse{Allow: true}, nil
}

// ============================================================================
// Task Validation
// ============================================================================

func (h *PLMNodeHooks) validateTaskCreate(ctx context.Context, req *nodehooks.BeforeCreateRequest) (*nodehooks.BeforeCreateResponse, error) {
	// Example: Tasks must have a parent project
	if req.Node.ParentID == "" {
		return &nodehooks.BeforeCreateResponse{
			Allow:  false,
			Reason: "plm.task must have a parent project",
		}, nil
	}

	return &nodehooks.BeforeCreateResponse{Allow: true}, nil
}

func (h *PLMNodeHooks) validateTaskUpdate(ctx context.Context, req *nodehooks.BeforeUpdateRequest) (*nodehooks.BeforeUpdateResponse, error) {
	// Example: Don't allow moving tasks to different projects
	if req.OldNode.ParentID != req.NewNode.ParentID {
		return &nodehooks.BeforeUpdateResponse{
			Allow:  false,
			Reason: "tasks cannot be moved between projects",
		}, nil
	}

	return &nodehooks.BeforeUpdateResponse{Allow: true}, nil
}

// ============================================================================
// Helpers
// ============================================================================

func isValidProjectStatus(status string) bool {
	validStatuses := map[string]bool{
		// Hardware/software project statuses
		"Design":       true,
		"Prototype":    true,
		"Production":   true,
		"Discontinued": true,
		// Project-type statuses
		"planned":   true,
		"active":    true,
		"on_hold":   true,
		"completed": true,
		"cancelled": true,
	}
	return validStatuses[status]
}

func isValidManufacturingRunStatus(status string) bool {
	validStatuses := map[string]bool{
		"planned":     true,
		"in-progress": true,
		"qa":          true,
		"completed":   true,
		"cancelled":   true,
	}
	return validStatuses[status]
}

func extractNumericValue(value any) (float64, bool) {
	switch typed := value.(type) {
	case float64:
		return typed, true
	case float32:
		return float64(typed), true
	case int:
		return float64(typed), true
	case int32:
		return float64(typed), true
	case int64:
		return float64(typed), true
	default:
		return 0, false
	}
}

func (h *PLMNodeHooks) projectCodeExists(ctx context.Context, projectCode string) (bool, error) {
	if h.client == nil {
		return false, nil
	}

	if projectCode == "" {
		return false, nil
	}

	filter := fmt.Sprintf(`type is 'plm.project' and settings.projectCode is "%s"`, escapeHaystackString(projectCode))
	nodes, err := bootstrap.QueryNodes(ctx, h.client, filter)
	if err != nil {
		return false, fmt.Errorf("query existing projects by projectCode: %w", err)
	}

	return len(nodes) > 0, nil
}

func escapeHaystackString(value string) string {
	return strings.ReplaceAll(value, `"`, `\"`)
}
