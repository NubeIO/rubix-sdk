#!/bin/bash

# SDK and Proto Version Management Script
# Manages switching between local and released SDK/Proto versions

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PATH_CONFIG="$SCRIPT_DIR/path.yaml"

# Function to read YAML config
read_yaml_path() {
    local key=$1
    local default=$2
    if [ -f "$PATH_CONFIG" ]; then
        # Simple YAML parsing for our specific format
        local value=$(grep "^${key}:" "$PATH_CONFIG" | sed 's/^[^:]*:[[:space:]]*//' | tr -d '\r')
        if [ -n "$value" ]; then
            echo "$value"
        else
            echo "$default"
        fi
    else
        echo "$default"
    fi
}

# Load paths from config file with defaults
SDK_PATH=$(read_yaml_path "sdk_path" "/home/user/code/go/nube/rubix-sdk")
PROTO_PATH=$(read_yaml_path "proto_path" "/home/user/code/go/nube/rubix-proto")
RUBIX_PATH=$(read_yaml_path "rubix_path" "/home/user/code/go/nube/rubix")
BIOS_PATH=$(read_yaml_path "bios_path" "/home/user/code/go/nube/bios")

# Expand tilde in paths
SDK_PATH="${SDK_PATH/#\~/$HOME}"
PROTO_PATH="${PROTO_PATH/#\~/$HOME}"
RUBIX_PATH="${RUBIX_PATH/#\~/$HOME}"
BIOS_PATH="${BIOS_PATH/#\~/$HOME}"

SDK_STATE_FILE="$SDK_PATH/.sdk-state"
PROTO_STATE_FILE="$PROTO_PATH/.proto-state"
RUBIX_GO_MOD="$RUBIX_PATH/go.mod"
BIOS_GO_MOD="$BIOS_PATH/go.mod"
SDK_CHANGELOG="$SDK_PATH/CHANGELOG.md"
PROTO_CHANGELOG="$PROTO_PATH/CHANGELOG.md"

# Repository selection (default: sdk)
REPO_TARGET="${REPO_TARGET:-sdk}"

# Target application (which go.mod to modify, default: rubix)
APP_TARGET="${APP_TARGET:-rubix}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

# Get target app go.mod and path based on APP_TARGET
get_target_go_mod() {
    case "$APP_TARGET" in
        rubix)
            echo "$RUBIX_GO_MOD"
            ;;
        bios)
            echo "$BIOS_GO_MOD"
            ;;
        *)
            error "Invalid target app: $APP_TARGET (use rubix or bios)"
            ;;
    esac
}

get_target_path() {
    case "$APP_TARGET" in
        rubix)
            echo "$RUBIX_PATH"
            ;;
        bios)
            echo "$BIOS_PATH"
            ;;
        *)
            error "Invalid target app: $APP_TARGET (use rubix or bios)"
            ;;
    esac
}

# Get repository path based on target
get_repo_path() {
    local target="${1:-$REPO_TARGET}"
    case "$target" in
        sdk)
            echo "$SDK_PATH"
            ;;
        proto)
            echo "$PROTO_PATH"
            ;;
        *)
            error "Invalid repository target: $target (use sdk or proto)"
            ;;
    esac
}

# Get repository name based on target
get_repo_name() {
    local target="${1:-$REPO_TARGET}"
    case "$target" in
        sdk)
            echo "rubix-sdk"
            ;;
        proto)
            echo "rubix-proto"
            ;;
        *)
            error "Invalid repository target: $target"
            ;;
    esac
}

# Get state file based on target
get_state_file() {
    local target="${1:-$REPO_TARGET}"
    case "$target" in
        sdk)
            echo "$SDK_STATE_FILE"
            ;;
        proto)
            echo "$PROTO_STATE_FILE"
            ;;
        *)
            error "Invalid repository target: $target"
            ;;
    esac
}

# Get changelog file based on target
get_changelog() {
    local target="${1:-$REPO_TARGET}"
    case "$target" in
        sdk)
            echo "$SDK_CHANGELOG"
            ;;
        proto)
            echo "$PROTO_CHANGELOG"
            ;;
        *)
            error "Invalid repository target: $target"
            ;;
    esac
}

# Get current version from git tags
get_current_version() {
    local target="${1:-$REPO_TARGET}"
    local repo_path=$(get_repo_path "$target")
    cd "$repo_path"
    git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0"
}

# Get latest version from target go.mod
get_rubix_version() {
    local target="${1:-$REPO_TARGET}"
    local repo_name=$(get_repo_name "$target")
    local go_mod=$(get_target_go_mod)
    grep "github.com/NubeIO/$repo_name" "$go_mod" | grep -v replace | awk '{print $2}' || echo ""
}

# Check if using local replace
is_using_local() {
    local target="${1:-$REPO_TARGET}"
    local repo_name=$(get_repo_name "$target")
    local go_mod=$(get_target_go_mod)
    grep -q "^replace github.com/NubeIO/$repo_name =>" "$go_mod"
}

# Save current state
save_state() {
    local version="$1"
    local target="${2:-$REPO_TARGET}"
    local state_file=$(get_state_file "$target")
    echo "$version" > "$state_file"
    info "Saved state: $version"
}

# Load saved state
load_state() {
    local target="${1:-$REPO_TARGET}"
    local state_file=$(get_state_file "$target")
    if [ -f "$state_file" ]; then
        cat "$state_file"
    else
        echo ""
    fi
}

# Switch to local development
switch_to_local() {
    local target="${1:-$REPO_TARGET}"
    local repo_name=$(get_repo_name "$target")
    local repo_path=$(get_repo_path "$target")
    local display_name=$(echo "$repo_name" | sed 's/rubix-//')
    local target_path=$(get_target_path)
    local target_go_mod=$(get_target_go_mod)

    info "Switching $APP_TARGET to use local $display_name..."

    if is_using_local "$target"; then
        warn "Already using local $display_name"
        return
    fi

    # Save current version
    current_version=$(get_rubix_version "$target")
    save_state "$current_version" "$target"

    # Add replace directive
    cd "$target_path"
    if ! grep -q "^replace github.com/NubeIO/$repo_name" go.mod; then
        echo "" >> go.mod
        echo "replace github.com/NubeIO/$repo_name => $repo_path" >> go.mod
    fi

    go mod tidy
    success "Switched to local $display_name at $repo_path"
    success "Previous version $current_version saved"
}

# Switch back to released version
switch_to_release() {
    local target="${1:-$REPO_TARGET}"
    local repo_name=$(get_repo_name "$target")
    local state_file=$(get_state_file "$target")
    local display_name=$(echo "$repo_name" | sed 's/rubix-//')
    local target_path=$(get_target_path)

    info "Switching $APP_TARGET to use released $display_name..."

    if ! is_using_local "$target"; then
        warn "Already using released $display_name"
        return
    fi

    # Load saved state
    saved_version=$(load_state "$target")
    if [ -z "$saved_version" ]; then
        saved_version=$(get_current_version "$target")
        info "No saved version found, using current tag: $saved_version"
    else
        info "Restoring to version: $saved_version"
    fi

    # Update version in go.mod
    cd "$target_path"
    sed -i "s|github.com/NubeIO/$repo_name.*|github.com/NubeIO/$repo_name $saved_version|g" go.mod

    # Remove replace directive and trailing empty lines
    sed -i "/^replace github.com\/NubeIO\/$repo_name/d" go.mod
    sed -i -e :a -e '/^\s*$/d;N;ba' go.mod

    export GOPRIVATE=github.com/NubeIO/*
    go mod tidy

    success "Switched to released $display_name version $saved_version"
    rm -f "$state_file"
}

# Increment version
increment_version() {
    local version=$1
    local bump_type=${2:-patch}

    # Remove 'v' prefix
    version=${version#v}

    IFS='.' read -r major minor patch <<< "$version"

    case $bump_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            error "Invalid bump type: $bump_type (use major, minor, or patch)"
            ;;
    esac

    echo "v$major.$minor.$patch"
}

# Initialize changelog if it doesn't exist
init_changelog() {
    local target="${1:-$REPO_TARGET}"
    local changelog=$(get_changelog "$target")
    local repo_name=$(get_repo_name "$target")

    if [ ! -f "$changelog" ]; then
        info "Creating CHANGELOG.md for $repo_name..."
        cat > "$changelog" << 'EOF'
# Changelog

All notable changes to this project will be documented in this file.

EOF
        success "Created CHANGELOG.md"
    fi
}

# Update changelog
update_changelog() {
    local version=$1
    local target="${2:-$REPO_TARGET}"
    local changelog=$(get_changelog "$target")
    local date=$(date +%Y-%m-%d)

    # Ensure changelog exists
    init_changelog "$target"

    # Create temporary file with new entry
    local temp_file=$(mktemp)

    # Add new version section after the title
    {
        head -n 2 "$changelog"
        echo ""
        echo "## $version - $date"
        echo ""
        echo "### Added"
        echo "- "
        echo ""
        echo "### Changed"
        echo "- "
        echo ""
        echo "### Fixed"
        echo "- "
        echo ""
        echo "---"
        echo ""
        tail -n +3 "$changelog"
    } > "$temp_file"

    mv "$temp_file" "$changelog"
    success "Updated CHANGELOG.md with version $version"
}

# Create new release
create_release() {
    local bump_type=${1:-patch}
    local target="${2:-$REPO_TARGET}"
    local repo_path=$(get_repo_path "$target")
    local repo_name=$(get_repo_name "$target")
    local changelog=$(get_changelog "$target")
    local display_name=$(echo "$repo_name" | sed 's/rubix-//')

    info "Creating new $display_name release..."

    # Make sure we're in the correct directory
    cd "$repo_path"

    # Check if working directory is clean
    if ! git diff-index --quiet HEAD --; then
        error "Working directory is not clean. Commit or stash changes first."
    fi

    # Get current version and increment
    current_version=$(get_current_version "$target")
    new_version=$(increment_version "$current_version" "$bump_type")

    info "Current version: $current_version"
    info "New version: $new_version"

    # Update changelog
    update_changelog "$new_version" "$target"

    # Commit changelog
    git add CHANGELOG.md
    git commit -m "Update CHANGELOG for $new_version

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

    # Create and push tag
    info "Creating git tag $new_version..."
    git tag -a "$new_version" -m "Release $new_version"
    git push origin master
    git push origin "$new_version"
    success "Tag $new_version created and pushed"

    # Create GitHub release
    info "Creating GitHub release..."
    gh release create "$new_version" \
        --title "$new_version" \
        --notes-file <(sed -n "/## $new_version/,/^---$/p" "$changelog" | sed '1d;$d')

    success "GitHub release created: https://github.com/NubeIO/$repo_name/releases/tag/$new_version"

    # Update target app go.mod if not using local
    local target_path=$(get_target_path)
    if ! is_using_local "$target"; then
        info "Updating $APP_TARGET go.mod to use $new_version..."
        cd "$target_path"

        # Check if repo is already in go.mod
        if grep -q "github.com/NubeIO/$repo_name" go.mod; then
            # Update existing entry
            sed -i "s|github.com/NubeIO/$repo_name.*|github.com/NubeIO/$repo_name $new_version|g" go.mod
        else
            # Add new require entry
            info "Adding $repo_name to go.mod require section..."
            # Find the require block and add the new dependency
            awk -v repo="github.com/NubeIO/$repo_name" -v ver="$new_version" '
                /^require \(/ { in_require=1; print; next }
                in_require && /^\)/ {
                    print "\t" repo " " ver
                    in_require=0
                }
                { print }
            ' go.mod > go.mod.tmp && mv go.mod.tmp go.mod
        fi

        export GOPRIVATE=github.com/NubeIO/*
        go mod tidy
        success "Updated $APP_TARGET to use $new_version"
    else
        warn "$APP_TARGET is using local $display_name, skipping go.mod update"
        info "Run 'make sdk-unswitch --repo=$target' to use the released version"
    fi

    success "Release $new_version completed!"
}

# Show status for a specific repo
show_repo_status() {
    local target="$1"
    local repo_name=$(get_repo_name "$target")
    local repo_path=$(get_repo_path "$target")
    local display_name=$(echo "$repo_name" | sed 's/rubix-//' | tr '[:lower:]' '[:upper:]')

    cd "$repo_path"
    local current_tag=$(get_current_version "$target")
    echo "$display_name Latest Tag:     $current_tag"

    local target_path=$(get_target_path)
    cd "$target_path"
    local rubix_version=$(get_rubix_version "$target")
    local app_label=$(echo "$APP_TARGET" | sed 's/./\U&/' )
    if [ -n "$rubix_version" ]; then
        echo "$app_label $display_name Version:  $rubix_version"
    else
        echo -e "$app_label $display_name Version:  ${YELLOW}Not in go.mod${NC}"
    fi

    if is_using_local "$target"; then
        echo -e "Mode:               ${YELLOW}LOCAL${NC} (using replace directive)"
        local saved=$(load_state "$target")
        if [ -n "$saved" ]; then
            echo "Saved Version:      $saved"
        fi
    else
        echo -e "Mode:               ${GREEN}RELEASED${NC}"
    fi
}

# Show status
show_status() {
    local target="${1:-all}"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Version Status"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    if [ "$target" = "all" ] || [ "$target" = "sdk" ]; then
        show_repo_status "sdk"
        echo ""
    fi

    if [ "$target" = "all" ] || [ "$target" = "proto" ]; then
        if [ "$target" = "all" ]; then
            echo "---"
            echo ""
        fi
        show_repo_status "proto"
        echo ""
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Parse command line arguments
parse_args() {
    COMMAND=""
    BUMP_TYPE="patch"
    REPO_TARGET=""  # Will be set based on command

    while [[ $# -gt 0 ]]; do
        case $1 in
            --target=*|-t=*)
                APP_TARGET="${1#*=}"
                shift
                ;;
            --target|-t)
                APP_TARGET="$2"
                shift 2
                ;;
            --repo=*|-r=*)
                REPO_TARGET="${1#*=}"
                shift
                ;;
            --repo|-r)
                REPO_TARGET="$2"
                shift 2
                ;;
            switch|unswitch|release|status|init-changelog|paths)
                COMMAND="$1"
                shift
                ;;
            major|minor|patch)
                BUMP_TYPE="$1"
                shift
                ;;
            *)
                if [ -z "$COMMAND" ]; then
                    COMMAND="$1"
                fi
                shift
                ;;
        esac
    done

    # Set default repo target based on command if not specified
    if [ -z "$REPO_TARGET" ]; then
        case "$COMMAND" in
            status|paths)
                REPO_TARGET="all"
                ;;
            *)
                REPO_TARGET="sdk"
                ;;
        esac
    fi

    # Validate repo target
    if [ "$REPO_TARGET" != "sdk" ] && [ "$REPO_TARGET" != "proto" ] && [ "$REPO_TARGET" != "all" ]; then
        error "Invalid --repo value: $REPO_TARGET (use sdk, proto, or all)"
    fi

    # Validate app target
    if [ "$APP_TARGET" != "rubix" ] && [ "$APP_TARGET" != "bios" ]; then
        error "Invalid --target value: $APP_TARGET (use rubix or bios)"
    fi
}

# Show configured paths
show_paths() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Configured Paths"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Config File:    $PATH_CONFIG"
    if [ -f "$PATH_CONFIG" ]; then
        echo -e "Status:         ${GREEN}Found${NC}"
    else
        echo -e "Status:         ${YELLOW}Not found (using defaults)${NC}"
    fi
    echo ""
    echo "SDK Path:       $SDK_PATH"
    echo "Proto Path:     $PROTO_PATH"
    echo "Rubix Path:     $RUBIX_PATH"
    echo "Bios Path:      $BIOS_PATH"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Show help
show_help() {
    echo "SDK and Proto Version Management"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  switch              Switch rubix to use local repository (for development)"
    echo "  unswitch            Switch rubix back to released version"
    echo "  release [type]      Create new release (type: major|minor|patch, default: patch)"
    echo "  status              Show current version status"
    echo "  init-changelog      Initialize CHANGELOG.md if it doesn't exist"
    echo "  paths               Show configured repository paths"
    echo ""
    echo "Options:"
    echo "  --repo, -r <repo>       Target repository: sdk, proto, or all (default: sdk)"
    echo "  --target, -t <app>      Target application go.mod: rubix or bios (default: rubix)"
    echo ""
    echo "Examples:"
    echo "  $0 switch --repo=sdk                    # Switch rubix to local SDK"
    echo "  $0 switch --repo=proto                  # Switch rubix to local Proto"
    echo "  $0 switch --repo=sdk --target=bios      # Switch bios to local SDK"
    echo "  $0 unswitch --repo=sdk                  # Return rubix to released SDK"
    echo "  $0 unswitch --repo=sdk --target=bios    # Return bios to released SDK"
    echo "  $0 release patch --repo=sdk             # Release SDK v0.0.2 from v0.0.1"
    echo "  $0 release minor --repo=proto           # Release Proto v0.1.0 from v0.0.1"
    echo "  $0 status                               # Show status for all repos"
    echo "  $0 status --repo=sdk                    # Show status for SDK only"
    echo "  $0 status --target=bios                 # Show status in bios go.mod"
    echo "  $0 init-changelog --repo=proto          # Create CHANGELOG.md for proto"
    echo "  $0 paths                                # Show configured paths"
    echo ""
    echo "Path Configuration:"
    echo "  Copy scripts/path-example.yaml to scripts/path.yaml and customize"
    echo ""
}

# Main command handler
parse_args "$@"

case "${COMMAND:-}" in
    switch)
        if [ "$REPO_TARGET" = "all" ]; then
            switch_to_local "sdk"
            switch_to_local "proto"
        else
            switch_to_local "$REPO_TARGET"
        fi
        ;;
    unswitch)
        if [ "$REPO_TARGET" = "all" ]; then
            switch_to_release "sdk"
            switch_to_release "proto"
        else
            switch_to_release "$REPO_TARGET"
        fi
        ;;
    release)
        if [ "$REPO_TARGET" = "all" ]; then
            error "Cannot release both repositories at once. Use --repo=sdk or --repo=proto"
        fi
        create_release "$BUMP_TYPE" "$REPO_TARGET"
        ;;
    status)
        show_status "$REPO_TARGET"
        ;;
    init-changelog)
        if [ "$REPO_TARGET" = "all" ]; then
            init_changelog "sdk"
            init_changelog "proto"
        else
            init_changelog "$REPO_TARGET"
        fi
        ;;
    paths)
        show_paths
        ;;
    *)
        show_help
        exit 1
        ;;
esac
