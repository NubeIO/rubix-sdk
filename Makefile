.PHONY: demo-gen demo-build sdk-switch sdk-unswitch sdk-release-patch sdk-release-minor sdk-release-major sdk-status proto-switch proto-unswitch proto-release-patch proto-release-minor proto-release-major proto-status proto-init paths generate-proto test verify new-branch help
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
	@echo "Proto Version Management:"
	@echo "  make proto-status        Check current Proto version and mode"
	@echo "  make proto-switch        Switch to local Proto (development)"
	@echo "  make proto-unswitch      Switch back to released version"
	@echo "  make proto-release-patch Release patch version (v0.0.1 → v0.0.2)"
	@echo "  make proto-release-minor Release minor version (v0.0.1 → v0.1.0)"
	@echo "  make proto-release-major Release major version (v0.0.1 → v1.0.0)"
	@echo "  make proto-init          Initialize Proto CHANGELOG.md"
	@echo ""
	@echo "Demo/Development:"
	@echo "  make demo-gen            Run fake plugin generator demo"
	@echo "  make demo-build          Build fake plugin generator"
	@echo ""
	@echo "Configuration:"
	@echo "  make paths               Show configured repository paths"
	@echo ""
	@echo "Branch Management:"
	@echo "  make new-branch BRANCH=feature-name              Create branch in SDK only"
	@echo "  make new-branch BRANCH=feature-name PROTO=yes    Create branch in SDK + Proto"
	@echo "  make new-branch BRANCH=feature-name RUBIX=yes    Create branch in SDK + Rubix"
	@echo "  make new-branch BRANCH=name PROTO=yes RUBIX=yes  Create branch in all repos"
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

# Proto Version Management
# =========================

proto-status: ## Show current Proto version and mode
	@./scripts/sdk-version.sh status --repo=proto

proto-switch: ## Switch rubix to use local Proto for development
	@./scripts/sdk-version.sh switch --repo=proto

proto-unswitch: ## Switch rubix back to released Proto version
	@./scripts/sdk-version.sh unswitch --repo=proto

proto-release-patch: ## Create Proto patch release (v0.0.1 → v0.0.2)
	@./scripts/sdk-version.sh release patch --repo=proto

proto-release-minor: ## Create Proto minor release (v0.0.1 → v0.1.0)
	@./scripts/sdk-version.sh release minor --repo=proto

proto-release-major: ## Create Proto major release (v0.0.1 → v1.0.0)
	@./scripts/sdk-version.sh release major --repo=proto

proto-init: ## Initialize Proto CHANGELOG.md
	@./scripts/sdk-version.sh init-changelog --repo=proto

# Configuration
# ==============

paths: ## Show configured repository paths
	@./scripts/sdk-version.sh paths

# Branch Management
# ==================

BRANCH ?=
PROTO ?= no
RUBIX ?= no

new-branch: ## Create new branch across repositories (BRANCH=name PROTO=yes RUBIX=yes)
	@if [ -z "$(BRANCH)" ]; then \
		echo "❌ ERROR: BRANCH parameter is required"; \
		echo ""; \
		echo "Usage:"; \
		echo "  make new-branch BRANCH=feature-name              # SDK only"; \
		echo "  make new-branch BRANCH=feature-name PROTO=yes    # SDK + Proto"; \
		echo "  make new-branch BRANCH=feature-name RUBIX=yes    # SDK + Rubix"; \
		echo "  make new-branch BRANCH=name PROTO=yes RUBIX=yes  # All repos"; \
		echo ""; \
		exit 1; \
	fi
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  Creating Branch: $(BRANCH)"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "📦 SDK Repository..."
	@if git show-ref --verify --quiet refs/heads/$(BRANCH); then \
		echo "  ⚠️  Branch '$(BRANCH)' already exists in SDK"; \
		git checkout $(BRANCH); \
	else \
		git checkout -b $(BRANCH); \
		echo "  ✅ Created and checked out branch '$(BRANCH)' in SDK"; \
	fi
	@echo ""
	@if [ "$(PROTO)" = "yes" ]; then \
		echo "📦 Proto Repository..."; \
		cd $$(./scripts/sdk-version.sh paths | grep "Proto Path:" | awk '{print $$3}') && \
		if git show-ref --verify --quiet refs/heads/$(BRANCH); then \
			echo "  ⚠️  Branch '$(BRANCH)' already exists in Proto"; \
			git checkout $(BRANCH); \
		else \
			git checkout -b $(BRANCH); \
			echo "  ✅ Created and checked out branch '$(BRANCH)' in Proto"; \
		fi; \
		echo ""; \
	fi
	@if [ "$(RUBIX)" = "yes" ]; then \
		echo "📦 Rubix Repository..."; \
		cd $$(./scripts/sdk-version.sh paths | grep "Rubix Path:" | awk '{print $$3}') && \
		if git show-ref --verify --quiet refs/heads/$(BRANCH); then \
			echo "  ⚠️  Branch '$(BRANCH)' already exists in Rubix"; \
			git checkout $(BRANCH); \
		else \
			git checkout -b $(BRANCH); \
			echo "  ✅ Created and checked out branch '$(BRANCH)' in Rubix"; \
		fi; \
		echo ""; \
	fi
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  ✅ Branch Creation Complete!"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "Summary:"
	@echo "  SDK:   $(BRANCH) ✅"
	@if [ "$(PROTO)" = "yes" ]; then echo "  Proto: $(BRANCH) ✅"; fi
	@if [ "$(RUBIX)" = "yes" ]; then echo "  Rubix: $(BRANCH) ✅"; fi
	@echo ""

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