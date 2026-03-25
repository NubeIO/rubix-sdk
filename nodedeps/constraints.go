package nodedeps

// NodeConstraints defines the lifecycle constraints that node developers can set.
// This is the PUBLIC API - both rubix core and external plugins can use this.
//
// Embed this in your node implementation to declare constraints:
//
//	func (n *MyNode) GetConstraints() nodedeps.NodeConstraints {
//	    return nodedeps.NodeConstraints{
//	        MaxOneNode: true,
//	        AllowedParents: []string{"parent.type"},
//	    }
//	}
type NodeConstraints struct {
	// Lifecycle constraints
	MaxOneNode         bool `json:"maxOneNode"`         // Only one node of this type per flow
	DeletionProhibited bool `json:"deletionProhibited"` // Cannot be deleted by user
	AllowCascadeDelete bool `json:"allowCascadeDelete"` // Delete children when this node deleted
	MustLiveUnderParent bool `json:"mustLiveUnderParent"` // Must have a parent (enforced on create)
	HideFromPalette    bool `json:"hideFromPalette"`    // Hide this node type from palette API (still registered and functional)

	// Parent constraints
	AllowedParents []string `json:"allowedParents"` // List of allowed parent types (empty = any)

	// Child dependencies
	RequiredChildren []ChildDependency `json:"requiredChildren"` // Children that must exist

	// Ref constraints (deletion policies, required refs, target type validation)
	RefConstraints []RefConstraint `json:"refConstraints"` // Ref integrity rules

	// Ownership support (framework-level team access control)
	SupportsOwnership bool `json:"supportsOwnership"` // Auto-injects teamRef constraint (optional ref to auth.team)
}

// ChildDependency defines a required child node
type ChildDependency struct {
	Type        string `json:"type"`        // Child node type (e.g., "rubix.services")
	AutoAdd     bool   `json:"autoAdd"`     // Auto-create if missing
	MinCount    int    `json:"minCount"`    // Minimum number required (0 = optional)
	MaxCount    int    `json:"maxCount"`    // Maximum number allowed (-1 = unlimited)
	DeleteProof bool   `json:"deleteProof"` // Child cannot be deleted by user
}

// RefConstraint defines validation and deletion policies for node refs.
// This allows plugins to enforce referential integrity and prevent data loss.
//
// Example: PLM unit node that MUST reference a manufacturing run:
//
//	RefConstraint{
//	    RefName: "runRef",
//	    Required: true,
//	    TargetTypes: []string{"plm.manufacturing-run"},
//	    OnTargetDelete: RefPolicyProtect, // Block run deletion if units exist
//	}
type RefConstraint struct {
	RefName        string   `json:"refName"`        // e.g., "runRef", "productRef", "siteRef"
	Required       bool     `json:"required"`       // Must exist at node creation
	TargetTypes    []string `json:"targetTypes"`    // Allowed target node types (empty = any)
	OnTargetDelete string   `json:"onTargetDelete"` // RefPolicyCascade | RefPolicyProtect | RefPolicyNullify
}

// Ref deletion policy constants
const (
	RefPolicyCascade = "cascade" // Delete ref when target deleted (default)
	RefPolicyProtect = "protect" // Block target deletion if refs exist
	RefPolicyNullify = "nullify" // Clear ref ToNodeID when target deleted (ref survives)
)

// ConstrainedNode is the interface that nodes implement to declare constraints.
// If a node implements this interface, rubix will enforce the constraints during CRUD operations.
type ConstrainedNode interface {
	GetConstraints() NodeConstraints
}

// DefaultConstraints returns the default constraints (no restrictions).
// Use this as a base for your custom constraints:
//
//	func (n *MyNode) GetConstraints() nodedeps.NodeConstraints {
//	    constraints := nodedeps.DefaultConstraints()
//	    constraints.MaxOneNode = true
//	    return constraints
//	}
func DefaultConstraints() NodeConstraints {
	return NodeConstraints{
		MaxOneNode:          false,
		DeletionProhibited:  false,
		AllowCascadeDelete:  true, // Default to cascade delete
		MustLiveUnderParent: false,
		HideFromPalette:     false,
		AllowedParents:      []string{}, // Any parent allowed
		RequiredChildren:    []ChildDependency{},
		RefConstraints:      []RefConstraint{},
	}
}

// SystemNodeConstraints returns constraints for system nodes (singleton, cannot delete).
// Use this for core system nodes that should only have one instance:
//
//	func (n *ServicesNode) GetConstraints() nodedeps.NodeConstraints {
//	    return nodedeps.SystemNodeConstraints(
//	        []string{"rubix.device"}, // Must be under device
//	        []nodedeps.ChildDependency{},
//	    )
//	}
func SystemNodeConstraints(allowedParents []string, requiredChildren []ChildDependency) NodeConstraints {
	return NodeConstraints{
		MaxOneNode:          true,
		DeletionProhibited:  true,
		AllowCascadeDelete:  true,
		MustLiveUnderParent: len(allowedParents) > 0,
		HideFromPalette:     true, // System nodes usually hidden from palette
		AllowedParents:      allowedParents,
		RequiredChildren:    requiredChildren,
	}
}

// ServiceNodeConstraints returns constraints for service/manager nodes (singleton, deletable).
// Use this for plugin services and managers:
//
//	func (n *PLMServiceNode) GetConstraints() nodedeps.NodeConstraints {
//	    return nodedeps.ServiceNodeConstraints()
//	}
func ServiceNodeConstraints() NodeConstraints {
	return NodeConstraints{
		MaxOneNode:          true,  // Only one instance
		DeletionProhibited:  false, // User can delete (not core system)
		AllowCascadeDelete:  true,  // Delete children when deleted
		MustLiveUnderParent: false, // Can be anywhere
		HideFromPalette:     true,  // Usually created programmatically
		AllowedParents:      []string{},
		RequiredChildren:    []ChildDependency{},
	}
}
