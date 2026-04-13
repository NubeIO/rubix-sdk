# Builder — ONE place for all rubix release builds.
#
# Browser = bios + rubix + frontend (no desktop window)
# Desktop = browser + Tauri desktop app (double-click and run)
#
# See EXAMPLE.md for copy-paste recipes.

BIN := ../../bin/builder
SRC := ./...

# ── Rubix project root (sibling repo) ────────────────────────────────
RUBIX_ROOT ?= $(shell cd ../../../rubix && pwd 2>/dev/null || echo "../../../rubix")
DIST_DIR   ?= $(CURDIR)/dist

# ── Flags ─────────────────────────────────────────────────────────────
EXCLUDE ?=
REUSE   ?=
ZIP     ?= 0
KEEP    ?=

BUILDER_FLAGS :=
ifneq ($(EXCLUDE),)
BUILDER_FLAGS += --exclude $(EXCLUDE)
endif
ifneq ($(REUSE),)
BUILDER_FLAGS += --reuse $(REUSE)
endif
ifeq ($(ZIP),1)
BUILDER_FLAGS += --zip
endif
ifneq ($(KEEP),)
BUILDER_FLAGS += --keep $(KEEP)
endif

# Browser builds always exclude desktop
comma := ,
BROWSER_EXCLUDE := $(if $(EXCLUDE),desktop$(comma)$(EXCLUDE),desktop)

BROWSER_FLAGS := --exclude $(BROWSER_EXCLUDE)
ifneq ($(REUSE),)
BROWSER_FLAGS += --reuse $(REUSE)
endif
ifeq ($(ZIP),1)
BROWSER_FLAGS += --zip
endif
ifneq ($(KEEP),)
BROWSER_FLAGS += --keep $(KEEP)
endif

.PHONY: help build clean test \
        browser-linux browser-windows browser-pi browser-pi32 browser-all \
        desktop-linux desktop-windows desktop-pi desktop-pi32 desktop-all \
        rubix-package flutter-web plm-package \
        cache-list cache-clean

help:
	@echo "Builder — build, cache, and assemble rubix releases"
	@echo ""
	@echo "  Setup (one-time):"
	@echo "    make build                      Build the builder binary"
	@echo ""
	@echo "  Browser (bios + rubix + frontend, no desktop window):"
	@echo "    make browser-linux              Linux x86_64"
	@echo "    make browser-windows            Windows x86_64"
	@echo "    make browser-pi                 Raspberry Pi arm64"
	@echo "    make browser-pi32               Raspberry Pi armv7"
	@echo "    make browser-all                All platforms"
	@echo ""
	@echo "  Desktop (browser + Tauri app, double-click and run):"
	@echo "    make desktop-linux              Linux x86_64"
	@echo "    make desktop-windows            Windows x86_64"
	@echo "    make desktop-all                All platforms"
	@echo ""
	@echo "  Flags:"
	@echo "    ZIP=1                           Archive output (.tar.gz / .zip)"
	@echo "    EXCLUDE=x,y                     Skip components (frontend,bacnet,bios,rubix,configs)"
	@echo "    REUSE=x:latest                  Reuse most recent cached build"
	@echo "    REUSE=x:YYMMDD-HHmmss          Reuse specific cached build"
	@echo "    KEEP=db                         Preserve database across rebuilds"
	@echo "    KEEP=config                     Preserve app.yaml + server.yaml"
	@echo "    KEEP=all                        Preserve db + config"
	@echo "    RUBIX_ROOT=/path/to/rubix       Override rubix project path"
	@echo ""
	@echo "  Upgrade zip (upload to bios):"
	@echo "    make rubix-package VERSION=1.3.0  Build + package rubix upgrade zip"
	@echo ""
	@echo "  Flutter web app (static, upload to bios):"
	@echo "    make flutter-web VERSION=1.0.0    Build Flutter web + package as static app"
	@echo "    FLUTTER_ROOT=/path/to/rubix-app   Override Flutter project path"
	@echo ""
	@echo "  Plugin zips (upload to rubix):"
	@echo "    make plm-package                  Build + package PLM plugin zip"
	@echo "    make plm-package PLM_VERSION=1.1.0  With custom version"
	@echo ""
	@echo "  Cache:"
	@echo "    make cache-list                 Show cached builds"
	@echo "    make cache-prune                Delete old caches, keep latest per component"
	@echo "    make cache-clean                Delete ALL cached builds"
	@echo ""
	@echo "  See EXAMPLE.md for copy-paste recipes."

# ── Build the builder ─────────────────────────────────────────────────

build:
	@go build -o $(BIN) .
	@echo "✅ builder built"

clean:
	rm -f $(BIN)

test:
	go test $(SRC)

# ── Browser targets (no desktop) ─────────────────────────────────────

browser-linux: build
	@$(BIN) release --manifest release.yaml --target linux \
		--output $(DIST_DIR)/browser-linux --root $(RUBIX_ROOT) $(BROWSER_FLAGS)

browser-windows: build
	@$(BIN) release --manifest release.yaml --target windows \
		--output $(DIST_DIR)/browser-windows --root $(RUBIX_ROOT) $(BROWSER_FLAGS)

browser-pi: build
	@$(BIN) release --manifest release.yaml --target pi \
		--output $(DIST_DIR)/browser-pi --root $(RUBIX_ROOT) $(BROWSER_FLAGS)

browser-pi32: build
	@$(BIN) release --manifest release.yaml --target pi32 \
		--output $(DIST_DIR)/browser-pi32 --root $(RUBIX_ROOT) $(BROWSER_FLAGS)

browser-all: build
	@$(MAKE) browser-linux
	@$(MAKE) browser-windows
	@$(MAKE) browser-pi
	@$(MAKE) browser-pi32
	@echo ""
	@echo "  ✅ All browser builds ready in $(DIST_DIR)/"

# ── Desktop targets (includes Tauri binary) ──────────────────────────

desktop-linux: build
	@$(BIN) release --manifest release.yaml --target linux \
		--output $(DIST_DIR)/desktop-linux --root $(RUBIX_ROOT) $(BUILDER_FLAGS)

desktop-windows: build
	@$(BIN) release --manifest release.yaml --target windows \
		--output $(DIST_DIR)/desktop-windows --root $(RUBIX_ROOT) $(BUILDER_FLAGS)

desktop-pi: build
	@$(BIN) release --manifest release.yaml --target pi \
		--output $(DIST_DIR)/desktop-pi --root $(RUBIX_ROOT) $(BUILDER_FLAGS)

desktop-pi32: build
	@$(BIN) release --manifest release.yaml --target pi32 \
		--output $(DIST_DIR)/desktop-pi32 --root $(RUBIX_ROOT) $(BUILDER_FLAGS)

desktop-all: build
	@$(MAKE) desktop-linux
	@$(MAKE) desktop-windows
	@$(MAKE) desktop-pi
	@$(MAKE) desktop-pi32
	@echo ""
	@echo "  ✅ All desktop builds ready in $(DIST_DIR)/"

# ── Package rubix upgrade zip (for bios upload) ─────────────────────

VERSION ?=
ARCH    ?= amd64

rubix-package: build browser-linux
	@if [ -z "$(VERSION)" ]; then echo "ERROR: VERSION is required. Usage: make rubix-package VERSION=1.3.0"; exit 1; fi
	@$(BIN) app package \
		--name rubix \
		--version $(VERSION) \
		--arch $(ARCH) \
		--binary $(DIST_DIR)/browser-linux/apps/rubix/rubix \
		--dir $(DIST_DIR)/browser-linux/frontend \
		--file $(DIST_DIR)/browser-linux/apps/rubix/server.yaml \
		--port 9000 \
		--health "http://localhost:9000/healthz" \
		--args "--addr,:9000,--server-config,server.yaml" \
		--output $(DIST_DIR)
	@echo ""
	@echo "  ✅ Upload $(DIST_DIR)/rubix-$(VERSION)-$(ARCH).zip to bios"

# ── Package Flutter web app (static, for bios upload) ────────────────

FLUTTER_ROOT ?= $(shell cd $(HOME)/code/flutter/rubix-app && pwd 2>/dev/null || echo "$(HOME)/code/flutter/rubix-app")
FLUTTER_VERSION ?= $(VERSION)

flutter-web: build
	@if [ -z "$(FLUTTER_VERSION)" ]; then echo "ERROR: VERSION is required. Usage: make flutter-web VERSION=1.0.0"; exit 1; fi
	@echo "Building Flutter web (RUNTIME_MODE=none)..."
	@cd $(FLUTTER_ROOT) && flutter build web --release --dart-define=RUNTIME_MODE=none
	@echo "Packaging as static bios app..."
	@$(BIN) app package \
		--name rubix-app \
		--version $(FLUTTER_VERSION) \
		--arch amd64 \
		--static \
		--static-dir web \
		--dir $(FLUTTER_ROOT)/build/web \
		--port 8080 \
		--output $(DIST_DIR)
	@echo ""
	@echo "  ✅ Upload $(DIST_DIR)/rubix-app-$(FLUTTER_VERSION)-amd64.zip to bios"

# ── Package plugin zips (for rubix upload) ───────────────────────────

PLM_ROOT ?= $(CURDIR)/../../nube.plm
PLM_VERSION ?= 1.0.0

plm-package: build
	@echo "Building PLM plugin..."
	@cd $(PLM_ROOT) && go build -o nube.plm .
	@$(BIN) plugin package \
		--name nube.plm \
		--version $(PLM_VERSION) \
		--arch $(ARCH) \
		--binary $(PLM_ROOT)/nube.plm \
		--plugin-json $(PLM_ROOT)/plugin.json \
		--dir $(PLM_ROOT)/dist-frontend \
		--dir $(PLM_ROOT)/config \
		--output $(DIST_DIR)
	@echo ""
	@echo "  ✅ Upload $(DIST_DIR)/nube.plm-$(PLM_VERSION)-$(ARCH).zip to rubix"

# ── Cache management ──────────────────────────────────────────────────

cache-list:
	@echo "Cached builds:"
	@echo ""
	@for target_dir in $(DIST_DIR)/cache/*/; do \
		if [ -d "$$target_dir" ]; then \
			echo "  $$(basename $$target_dir):"; \
			for comp_dir in $$target_dir*/; do \
				if [ -d "$$comp_dir" ]; then \
					echo "    $$(basename $$comp_dir)"; \
				fi; \
			done; \
			echo ""; \
		fi; \
	done
	@if [ ! -d "$(DIST_DIR)/cache" ]; then echo "  (no cache yet — run a build first)"; fi

cache-clean:
	@echo "Cleaning cache..."
	@rm -rf $(DIST_DIR)/cache
	@echo "✅ Cache cleared"

# cache-prune: remove all cached builds except the latest per component
cache-prune:
	@echo "Pruning cache (keeping latest per component)..."
	@if [ ! -d "$(DIST_DIR)/cache" ]; then echo "  (no cache)"; exit 0; fi
	@for target_dir in $(DIST_DIR)/cache/*/; do \
		[ -d "$$target_dir" ] || continue; \
		for comp in $$(ls "$$target_dir" | sed 's/-[0-9]*-[0-9]*$$//' | sort -u); do \
			latest=$$(ls -d "$$target_dir$$comp"-* 2>/dev/null | sort | tail -1); \
			for dir in $$(ls -d "$$target_dir$$comp"-* 2>/dev/null | sort); do \
				if [ "$$dir" != "$$latest" ]; then \
					echo "  rm: $$(basename $$dir)"; \
					rm -rf "$$dir"; \
				fi; \
			done; \
		done; \
	done
	@echo "✅ Cache pruned (latest kept)"

.DEFAULT_GOAL := help
