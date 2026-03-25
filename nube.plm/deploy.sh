#!/bin/bash
set -e

# PLM Plugin Deployment Script
# Builds and deploys the PLM plugin to the test org

PLUGIN_NAME="nube.plm"
ORG_ID="${1:-test}"
RUBIX_DIR="${RUBIX_DIR:-/home/user/code/go/nube/rubix}"
PLUGIN_DIR="${RUBIX_DIR}/bin/orgs/${ORG_ID}/plugins/${PLUGIN_NAME}"

echo "🔨 Building PLM plugin..."
cd "$(dirname "$0")"
go build -o bin/${PLUGIN_NAME}

echo "📁 Creating plugin directory: ${PLUGIN_DIR}"
mkdir -p "${PLUGIN_DIR}"

echo "📦 Copying plugin binary..."
# Use rm -f to avoid "Text file busy" error
rm -f "${PLUGIN_DIR}/${PLUGIN_NAME}"
cp bin/${PLUGIN_NAME} "${PLUGIN_DIR}/"
chmod +x "${PLUGIN_DIR}/${PLUGIN_NAME}"

echo "📄 Copying plugin.json..."
cp plugin.json "${PLUGIN_DIR}/"

echo "📄 Copying config directory..."
if [ -d "config" ]; then
  cp -r config "${PLUGIN_DIR}/"
  echo "   ✓ config/nodes.yaml deployed"
fi

echo "🎨 Copying frontend assets..."
if [ -d "dist-frontend" ]; then
  rm -rf "${PLUGIN_DIR}/dist-frontend"
  cp -r dist-frontend "${PLUGIN_DIR}/"
  echo "   ✓ dist-frontend/ deployed ($(ls -1 ${PLUGIN_DIR}/dist-frontend | wc -l) files)"
else
  echo "   ⚠️  dist-frontend/ not found - run 'cd frontend && npm run build' first"
fi

echo "✅ PLM plugin deployed to: ${PLUGIN_DIR}"
echo ""
echo "Next steps:"
echo "  1. Build frontend (if not done): cd frontend && npm run build && cd .."
echo "  2. Redeploy if frontend changed: ./deploy.sh"
echo "  3. Restart rubix server: cd ${RUBIX_DIR} && ./bin/rubix --port 9000"
echo "  4. Check logs for: 'plugin node ID' and 'PLM hierarchy ready'"
echo "  5. Verify DB: sqlite3 ${RUBIX_DIR}/bin/dev/data/db/rubix.db"
echo ""
echo "Database verification:"
echo "  sqlite3 ${RUBIX_DIR}/bin/dev/data/db/rubix.db \\"
echo "    \"SELECT id, name, type, parent_id FROM nodes WHERE type LIKE 'plm.%' OR id = 'plugin_nube.plm';\""
