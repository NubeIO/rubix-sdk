.PHONY: demo-gen demo-build sdk-switch sdk-unswitch sdk-release-patch sdk-release-minor sdk-release-major sdk-status generate-proto test verify help
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  Rubix SDK - Makefile Commands"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "SDK Version Management:"
	@echo "  make sdk-status          Check current SDK version and mode"
	@echo "  make sdk-switch          Switch to local SDK (development)"
	@echo "  make sdk-unswitch        Switch back to released version"
	@echo "  make sdk-release-patch   Release patch version (v0.0.1 → v0.0.2)"
	@echo "  make sdk-release-minor   Release minor version (v0.0.1 → v0.1.0)"
	@echo "  make sdk-release-major   Release major version (v0.0.1 → v1.0.0)"
	@echo ""
	@echo "Demo/Development:"
	@echo "  make demo-gen            Run fake plugin generator demo"
	@echo "  make demo-build          Build fake plugin generator"
	@echo ""
	@echo "Proto/Testing:"
	@echo "  make generate-proto      Regenerate proto code from rubix-proto"
	@echo "  make test               Run all tests"
	@echo "  make verify             Run tests and verify proto is up to date"
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "See SDK_VERSION_MANAGEMENT.md for detailed workflow"
	@echo ""

demo-gen: ## Run fake plugin generator demo
	go run ./cmd/fake-plugin-generator

demo-build: ## Build fake plugin generator
	go build ./cmd/fake-plugin-generator

# SDK Version Management
# =======================

sdk-status: ## Show current SDK version and mode
	@./scripts/sdk-version.sh status

sdk-switch: ## Switch rubix to use local SDK for development
	@./scripts/sdk-version.sh switch

sdk-unswitch: ## Switch rubix back to released SDK version
	@./scripts/sdk-version.sh unswitch

sdk-release-patch: ## Create patch release (v0.0.1 → v0.0.2)
	@./scripts/sdk-version.sh release patch

sdk-release-minor: ## Create minor release (v0.0.1 → v0.1.0)
	@./scripts/sdk-version.sh release minor

sdk-release-major: ## Create major release (v0.0.1 → v1.0.0)
	@./scripts/sdk-version.sh release major

# Proto Generation & Testing
# ===========================

generate-proto: ## Regenerate proto code from rubix-proto
	@echo "🔧 Regenerating proto from rubix-proto..."
	@cd ../rubix-proto && make generate-go
	@echo "✅ Proto regenerated"

test: ## Run all tests
	@echo "🧪 Running tests..."
	@go test ./... -v

verify: test ## Run tests and verify proto is up to date
	@echo "🔍 Verifying proto is up to date..."
	@cd ../rubix-proto && make verify-go