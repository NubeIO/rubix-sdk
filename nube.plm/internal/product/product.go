package product

// Product represents a PLM product node
// This matches the plm.product type defined in plugin.json
type Product struct {
	ID       string            `json:"id"`
	Name     string            `json:"name"`
	Type     string            `json:"type"`
	Settings ProductSettings   `json:"settings"`
	Metadata map[string]string `json:"metadata,omitempty"`
}

// ProductSettings holds product-specific settings
// Supports both hardware and software products via productType discriminator
type ProductSettings struct {
	// Common fields (both hardware and software)
	ProductCode string  `json:"productCode,omitempty"`
	Description string  `json:"description,omitempty"`
	Status      string  `json:"status,omitempty"` // Design, Prototype, Production, Discontinued
	Price       float64 `json:"price,omitempty"`

	// Product type discriminator
	ProductType string `json:"productType,omitempty"` // "hardware" or "software"

	// Hardware-specific fields
	SKU            string              `json:"sku,omitempty"`
	Weight         float64             `json:"weight,omitempty"` // kg
	Dimensions     *ProductDimensions  `json:"dimensions,omitempty"`
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

// ProductDimensions holds physical product dimensions
type ProductDimensions struct {
	Length float64 `json:"length"` // cm
	Width  float64 `json:"width"`  // cm
	Height float64 `json:"height"` // cm
}

// Validate checks if product settings are valid
// Future: Add validation logic here
func (p *Product) Validate() error {
	// Future: Add validation rules
	// - ProductCode format
	// - Status in allowed values
	// - Price >= 0
	return nil
}

// CalculateCost computes product cost
// Future: Will compute from BOM when Phase 2 is implemented
func (p *Product) CalculateCost() float64 {
	// Phase 1: Just return the price
	return p.Settings.Price

	// Phase 2: Calculate from BOM
	// return sum of (part.unitCost * quantity) for all BOM items
}

// Service provides product business logic
type Service struct {
	// Future: Add dependencies here
	// - NATS client for queries
	// - Cache for product lookups
	// - BOM calculator
}

// NewService creates a new product service
func NewService() *Service {
	return &Service{}
}

// Create creates a new product
// Future: Add custom creation logic here
func (s *Service) Create(product *Product) error {
	// Future: Add pre-creation logic
	// - Generate product code if empty
	// - Set default status
	// - Validate settings

	// For now, just validate
	return product.Validate()
}

// Update updates a product
// Future: Add custom update logic here
func (s *Service) Update(product *Product) error {
	// Future: Add pre-update logic
	// - Recalculate BOM if refs changed
	// - Update version history
	// - Notify subscribers

	return product.Validate()
}

// Delete deletes a product
// Future: Add custom delete logic here
func (s *Service) Delete(productID string) error {
	// Future: Add pre-delete checks
	// - Check if product has active orders
	// - Check if used in BOMs
	// - Archive instead of hard delete

	return nil
}

// Query queries products
// Future: Add custom query logic here
func (s *Service) Query(filter string) ([]*Product, error) {
	// Future: Add query helpers
	// - Query by status
	// - Query by price range
	// - Query by product code pattern

	return nil, nil
}
