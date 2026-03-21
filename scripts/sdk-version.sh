#!/bin/bash

# SDK Version Management Script
# Manages switching between local and released SDK versions

set -e

SDK_PATH="/home/user/code/go/nube/rubix-sdk"
RUBIX_PATH="/home/user/code/go/nube/rubix"
STATE_FILE="$SDK_PATH/.sdk-state"
RUBIX_GO_MOD="$RUBIX_PATH/go.mod"
CHANGELOG="$SDK_PATH/CHANGELOG.md"

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

# Get current SDK version from go.mod
get_current_version() {
    cd "$SDK_PATH"
    git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0"
}

# Get latest version from rubix go.mod
get_rubix_sdk_version() {
    grep "github.com/NubeIO/rubix-sdk" "$RUBIX_GO_MOD" | grep -v replace | awk '{print $2}' || echo ""
}

# Check if using local replace
is_using_local() {
    grep -q "^replace github.com/NubeIO/rubix-sdk =>" "$RUBIX_GO_MOD"
}

# Save current state
save_state() {
    local version="$1"
    echo "$version" > "$STATE_FILE"
    info "Saved state: $version"
}

# Load saved state
load_state() {
    if [ -f "$STATE_FILE" ]; then
        cat "$STATE_FILE"
    else
        echo ""
    fi
}

# Switch to local development
switch_to_local() {
    info "Switching rubix to use local SDK..."

    if is_using_local; then
        warn "Already using local SDK"
        return
    fi

    # Save current version
    current_version=$(get_rubix_sdk_version)
    save_state "$current_version"

    # Add replace directive
    cd "$RUBIX_PATH"
    if ! grep -q "^replace github.com/NubeIO/rubix-sdk" go.mod; then
        echo "" >> go.mod
        echo "replace github.com/NubeIO/rubix-sdk => $SDK_PATH" >> go.mod
    fi

    go mod tidy
    success "Switched to local SDK at $SDK_PATH"
    success "Previous version $current_version saved"
}

# Switch back to released version
switch_to_release() {
    info "Switching rubix to use released SDK..."

    if ! is_using_local; then
        warn "Already using released SDK"
        return
    fi

    # Load saved state
    saved_version=$(load_state)
    if [ -z "$saved_version" ]; then
        saved_version=$(get_current_version)
        info "No saved version found, using current tag: $saved_version"
    else
        info "Restoring to version: $saved_version"
    fi

    # Update version in go.mod
    cd "$RUBIX_PATH"
    sed -i "s|github.com/NubeIO/rubix-sdk.*|github.com/NubeIO/rubix-sdk $saved_version|g" go.mod

    # Remove replace directive and trailing empty lines
    sed -i '/^replace github.com\/NubeIO\/rubix-sdk/d' go.mod
    sed -i -e :a -e '/^\s*$/d;N;ba' go.mod

    export GOPRIVATE=github.com/NubeIO/*
    go mod tidy

    success "Switched to released SDK version $saved_version"
    rm -f "$STATE_FILE"
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

# Update changelog
update_changelog() {
    local version=$1
    local date=$(date +%Y-%m-%d)

    # Create temporary file with new entry
    local temp_file=$(mktemp)

    # Add new version section after the title
    {
        head -n 2 "$CHANGELOG"
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
        tail -n +3 "$CHANGELOG"
    } > "$temp_file"

    mv "$temp_file" "$CHANGELOG"
    success "Updated CHANGELOG.md with version $version"
}

# Create new release
create_release() {
    local bump_type=${1:-patch}

    info "Creating new SDK release..."

    # Make sure we're in SDK directory
    cd "$SDK_PATH"

    # Check if working directory is clean
    if ! git diff-index --quiet HEAD --; then
        error "Working directory is not clean. Commit or stash changes first."
    fi

    # Get current version and increment
    current_version=$(get_current_version)
    new_version=$(increment_version "$current_version" "$bump_type")

    info "Current version: $current_version"
    info "New version: $new_version"

    # Update changelog
    update_changelog "$new_version"

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
        --notes-file <(sed -n "/## $new_version/,/^---$/p" "$CHANGELOG" | sed '1d;$d')

    success "GitHub release created: https://github.com/NubeIO/rubix-sdk/releases/tag/$new_version"

    # Update rubix go.mod if not using local
    if ! is_using_local; then
        info "Updating rubix go.mod to use $new_version..."
        cd "$RUBIX_PATH"
        sed -i "s|github.com/NubeIO/rubix-sdk.*|github.com/NubeIO/rubix-sdk $new_version|g" go.mod
        export GOPRIVATE=github.com/NubeIO/*
        go mod tidy
        success "Updated rubix to use $new_version"
    else
        warn "Rubix is using local SDK, skipping go.mod update"
        info "Run 'make sdk-unswitch' to use the released version"
    fi

    success "Release $new_version completed!"
}

# Show status
show_status() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  SDK Version Status"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    cd "$SDK_PATH"
    local current_tag=$(get_current_version)
    echo "SDK Latest Tag:     $current_tag"

    cd "$RUBIX_PATH"
    local rubix_version=$(get_rubix_sdk_version)
    echo "Rubix SDK Version:  $rubix_version"

    if is_using_local; then
        echo -e "Mode:               ${YELLOW}LOCAL${NC} (using replace directive)"
        local saved=$(load_state)
        if [ -n "$saved" ]; then
            echo "Saved Version:      $saved"
        fi
    else
        echo -e "Mode:               ${GREEN}RELEASED${NC}"
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Main command handler
case "${1:-}" in
    switch)
        switch_to_local
        ;;
    unswitch)
        switch_to_release
        ;;
    release)
        create_release "${2:-patch}"
        ;;
    status)
        show_status
        ;;
    *)
        echo "SDK Version Management"
        echo ""
        echo "Usage: $0 <command> [args]"
        echo ""
        echo "Commands:"
        echo "  switch              Switch rubix to use local SDK (for development)"
        echo "  unswitch            Switch rubix back to released SDK version"
        echo "  release [type]      Create new release (type: major|minor|patch, default: patch)"
        echo "  status              Show current SDK version status"
        echo ""
        echo "Examples:"
        echo "  $0 switch           # Start local development"
        echo "  $0 unswitch         # Return to released version"
        echo "  $0 release patch    # Create v0.0.2 from v0.0.1"
        echo "  $0 release minor    # Create v0.1.0 from v0.0.1"
        echo "  $0 status           # Show current state"
        echo ""
        exit 1
        ;;
esac
