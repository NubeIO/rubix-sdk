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
	@echo "  Cache:"
	@echo "    make cache-list                 Show cached builds"
	@echo "    make cache-clean                Delete all cached builds"
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

.DEFAULT_GOAL := help
