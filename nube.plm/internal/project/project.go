package project

// Project represents a PLM project node
// This matches the plm.project type defined in plugin.json
type Project struct {
	ID       string            `json:"id"`
	Name     string            `json:"name"`
	Type     string            `json:"type"`
	Settings ProjectSettings   `json:"settings"`
	Metadata map[string]string `json:"metadata,omitempty"`
}

// ProjectSettings holds project-specific settings
// Supports both hardware and software projects via projectType discriminator
type ProjectSettings struct {
	// Common fields (both hardware and software)
	ProjectCode string  `json:"projectCode,omitempty"`
	Description string  `json:"description,omitempty"`
	Status      string  `json:"status,omitempty"` // Design, Prototype, Production, Discontinued
	Price       float64 `json:"price,omitempty"`

	// Project type discriminator
	ProjectType string `json:"projectType,omitempty"` // "hardware", "software", or "project"

	// Hardware-specific fields
	SKU            string              `json:"sku,omitempty"`
	Weight         float64             `json:"weight,omitempty"` // kg
	Dimensions     *ProjectDimensions  `json:"dimensions,omitempty"`
	WarrantyPeriod int                 `json:"warrantyPeriod,omitempty"` // months
	Manufacturer   string              `json:"manufacturer,omitempty"`
	ModelNumber    string              `json:"modelNumber,omitempty"`
	Material       string              `json:"material,omitempty"`

	// Software-specific fields
	Version              string   `json:"version,omitempty"`
	LicenseType          string   `json:"licenseType,omitempty"`
	Platform             string   `json:"platform,omitempty"`
	SupportedOS          []string `json:"supportedOS,omitempty"`
	InstallationType     string   `json:"installationType,omitempty"`
	SupportTier          string   `json:"supportTier,omitempty"`
	MinSystemRequirements string  `json:"minSystemRequirements,omitempty"`
}

// ProjectDimensions holds physical project dimensions
type ProjectDimensions struct {
	Length float64 `json:"length"` // cm
	Width  float64 `json:"width"`  // cm
	Height float64 `json:"height"` // cm
}

// Validate checks if project settings are valid
// Future: Add validation logic here
func (p *Project) Validate() error {
	// Future: Add validation rules
	// - ProjectCode format
	// - Status in allowed values
	// - Price >= 0
	return nil
}

// CalculateCost computes project cost
// Future: Will compute from BOM when Phase 2 is implemented
func (p *Project) CalculateCost() float64 {
	// Phase 1: Just return the price
	return p.Settings.Price

	// Phase 2: Calculate from BOM
	// return sum of (part.unitCost * quantity) for all BOM items
}

// Service provides project business logic
type Service struct {
	// Future: Add dependencies here
	// - NATS client for queries
	// - Cache for project lookups
	// - BOM calculator
}

// NewService creates a new project service
func NewService() *Service {
	return &Service{}
}

// Create creates a new project
// Future: Add custom creation logic here
func (s *Service) Create(project *Project) error {
	// Future: Add pre-creation logic
	// - Generate project code if empty
	// - Set default status
	// - Validate settings

	// For now, just validate
	return project.Validate()
}

// Update updates a project
// Future: Add custom update logic here
func (s *Service) Update(project *Project) error {
	// Future: Add pre-update logic
	// - Recalculate BOM if refs changed
	// - Update version history
	// - Notify subscribers

	return project.Validate()
}

// Delete deletes a project
// Future: Add custom delete logic here
func (s *Service) Delete(projectID string) error {
	// Future: Add pre-delete checks
	// - Check if project has active orders
	// - Check if used in BOMs
	// - Archive instead of hard delete

	return nil
}

// Query queries projects
// Future: Add custom query logic here
func (s *Service) Query(filter string) ([]*Project, error) {
	// Future: Add query helpers
	// - Query by status
	// - Query by price range
	// - Query by project code pattern

	return nil, nil
}
