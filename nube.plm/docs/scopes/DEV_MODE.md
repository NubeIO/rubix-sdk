# Plugin Dev Mode - Hot Reload Development

**Status**: ✅ Implemented (2026-03-20)
**Plugin**: nube.plm (Project Management)
**Framework**: Vite + Module Federation v2

This document explains how to develop plugins with instant hot-reload, eliminating the need to rebuild and copy files after every change.

---

## 🎯 Problem Solved

**Before Dev Mode:**
```bash
# Make a change to ProductTableWidget.tsx
# Build the plugin
cd /home/user/code/go/nube/rubix/nodes/rubix/v2/plugins_manager
./build-plugin.sh plm

# Wait ~5-10 seconds for build
# Refresh browser
# Repeat for every change 😫
```

**With Dev Mode:**
```bash
# Start plugin dev server once
cd /home/user/code/go/nube/rubix-plugin/nube.plm/frontend
pnpm dev

# Make changes → automatic hot-reload ⚡
# No build step, instant feedback
```

---

## 🏗️ Architecture

### Module Federation + Dev Server

The plugin frontend is loaded dynamically at runtime using **Module Federation v2**. Instead of loading from built files, we can point the host (rubix) to a live Vite dev server.

```
┌─────────────────────────────────────────────────────┐
│ Rubix Frontend (Host)                               │
│ http://localhost:3000                               │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ mf-runtime.ts                                 │  │
│  │                                               │  │
│  │  loadPluginComponent('nube.plm', './Widget')  │  │
│  │         ↓                                     │  │
│  │  Check VITE_PLUGIN_DEV_NUBE_PLM env var      │  │
│  │         ↓                                     │  │
│  │  If set: Load from dev server                │  │
│  │  Else:   Load from /api/v1/ext/nube.plm/     │  │
│  └──────────────────────────────────────────────┘  │
│                  ↓                                   │
└──────────────────┼───────────────────────────────────┘
                   │
      ┌────────────┴────────────┐
      │ Dev Mode    │ Production│
      ↓             ↓            ↓
┌──────────────┐  ┌─────────────────────┐
│ Vite Dev     │  │ Built Files         │
│ :5173        │  │ /api/v1/ext/nube.plm│
│              │  │                     │
│ Hot Reload ⚡│  │ Static Assets 📦    │
└──────────────┘  └─────────────────────┘
```

### Key Components

#### 1. Environment Variable Override

**File**: `frontend/.env.local`

```bash
# When set: Load plugin from dev server
VITE_PLUGIN_DEV_NUBE_PLM=http://localhost:5173

# When commented: Load from built files
# VITE_PLUGIN_DEV_NUBE_PLM=http://localhost:5173
```

**Naming Convention**: `VITE_PLUGIN_DEV_{PLUGIN_NAME_UPPER}`
- `nube.plm` → `VITE_PLUGIN_DEV_NUBE_PLM`
- `nube.example` → `VITE_PLUGIN_DEV_NUBE_EXAMPLE`
- Dots replaced with underscores, uppercased

#### 2. Module Federation Runtime Loader

**File**: `frontend/src/lib/mf-runtime.ts`

```typescript
/**
 * Get dev mode URL override for a plugin.
 * Checks environment variable: VITE_PLUGIN_DEV_{PLUGIN_ID_UPPER}
 * Example: VITE_PLUGIN_DEV_NUBE_PLM=http://localhost:5173
 */
function getPluginDevUrl(pluginId: string): string | null {
  if (typeof window === 'undefined') return null;

  const envKey = `VITE_PLUGIN_DEV_${mfName(pluginId).toUpperCase()}`;
  return import.meta.env[envKey] || null;
}

export async function loadPluginComponent(pluginId: string, exposedPath: string) {
  // ...
  const devUrl = getPluginDevUrl(pluginId);
  const entry = devUrl
    ? `${devUrl}/remoteEntry.js`
    : `/api/v1/ext/${pluginId}/remoteEntry.js`;

  if (devUrl) {
    console.log(`[MF] Loading plugin ${pluginId} from dev server: ${entry}`);
  }
  // ...
}
```

**What happens:**
1. Check for `VITE_PLUGIN_DEV_NUBE_PLM` env var
2. If set → Load `remoteEntry.js` from dev server (e.g., `http://localhost:5173/remoteEntry.js`)
3. If not set → Load from production path (`/api/v1/ext/nube.plm/remoteEntry.js`)

#### 3. Plugin Vite Config

**File**: `rubix-plugin/nube.plm/frontend/vite.config.ts`

```typescript
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'nube_plm',
      filename: 'remoteEntry.js',
      exposes: {
        './ProductTableWidget': './src/widgets/ProductTableWidget.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '19.0.0' },
      },
    }),
  ],
  // Dev mode: serve from root (localhost:5173/)
  // Build mode: use production base path
  base: command === 'build' ? '/api/v1/ext/nube.plm/' : '/',
  server: {
    port: 5173,
    cors: true, // Allow cross-origin requests from rubix host
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  build: {
    target: 'esnext',
    outDir: '../dist-frontend',
    emptyOutDir: true,
  },
}));
```

**Key Points:**
- **Conditional `base`**: Dev mode uses `/`, build mode uses `/api/v1/ext/nube.plm/`
- **CORS enabled**: Rubix host (port 3000) can load from plugin dev server (port 5173)
- **Fixed port**: Always 5173 (matches env var)

---

## 🚀 Usage

### Step 1: Start Plugin Dev Server

```bash
cd /home/user/code/go/nube/rubix-plugin/nube.plm/frontend
pnpm dev
```

**Output:**
```
VITE v5.4.21  ready in 342 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### Step 2: Start Rubix Frontend

```bash
cd /home/user/code/go/nube/rubix/frontend
pnpm dev
```

**Verify dev mode is active** (check browser console):
```
[MF] Loading plugin nube.plm from dev server: http://localhost:5173/remoteEntry.js
```

### Step 3: Make Changes & Watch Hot Reload

Edit any file in the plugin:
```bash
# Edit widget code
vim rubix-plugin/nube.plm/frontend/src/widgets/ProductTableWidget.tsx

# Edit SDK components (shared UI)
vim rubix-plugin/frontend-sdk/globals.css

# Changes appear instantly in browser ⚡
```

---

## 🔄 Workflow Examples

### Scenario 1: Add a New Field to Widget

**Goal**: Add "category" field to product table

```bash
# 1. Start dev servers (if not running)
cd rubix-plugin/nube.plm/frontend && pnpm dev
cd rubix/frontend && pnpm dev

# 2. Edit ProductTableWidget.tsx
# Add category column to table

# 3. See changes instantly in browser ⚡
# No build step, no waiting
```

### Scenario 2: Fix a Bug

**Goal**: Fix undefined settings crash (the bug we just fixed)

```bash
# 1. Dev servers running

# 2. Edit ProductTableWidget.tsx
# Change: product.settings.productCode
# To:     product.settings?.productCode

# 3. Save file → Browser refreshes automatically
# 4. Bug fixed, verify in browser
```

### Scenario 3: Style Changes

**Goal**: Update widget styling with Tailwind

```bash
# 1. Dev servers running

# 2. Edit globals.css or component classes
vim rubix-plugin/frontend-sdk/globals.css

# 3. Changes apply instantly (even faster than full reload)
# HMR (Hot Module Replacement) updates styles without refresh
```

---

## 🎛️ Switching Between Modes

### Enable Dev Mode

**Edit**: `rubix/frontend/.env.local`

```bash
# Uncomment this line
VITE_PLUGIN_DEV_NUBE_PLM=http://localhost:5173
```

**Restart rubix frontend** (needed to pick up env var change):
```bash
cd rubix/frontend
# Press Ctrl+C to stop
pnpm dev  # Start again
```

### Disable Dev Mode (Use Built Files)

**Edit**: `rubix/frontend/.env.local`

```bash
# Comment out this line
# VITE_PLUGIN_DEV_NUBE_PLM=http://localhost:5173
```

**Restart rubix frontend** + **build plugin**:
```bash
# Build plugin
cd rubix/nodes/rubix/v2/plugins_manager
./build-plugin.sh plm

# Restart rubix frontend
cd rubix/frontend
pnpm dev
```

---

## 📊 Performance Comparison

| Metric | Dev Mode | Production Mode |
|--------|----------|-----------------|
| **Change → See Result** | < 1 second | ~10 seconds |
| **Build Required** | ❌ No | ✅ Yes |
| **File Copy Required** | ❌ No | ✅ Yes |
| **Hot Module Replacement** | ✅ Yes | ❌ No |
| **Source Maps** | ✅ Full | ⚠️ Limited |
| **Debugging** | ✅ Easy | ⚠️ Harder |
| **Iteration Speed** | 🚀 Very Fast | 🐌 Slow |

**Dev Mode Wins:**
- 10x faster iteration
- Better debugging experience
- No mental context switch (waiting for builds)

**Production Mode Use Cases:**
- Testing final build output
- Verifying production behavior
- Plugin deployment

---

## 🐛 Troubleshooting

### Plugin Not Loading in Dev Mode

**Symptom**: Widget shows "Loading plugin..." forever

**Check:**
1. Is plugin dev server running?
   ```bash
   curl http://localhost:5173/remoteEntry.js
   # Should return JavaScript, not 404
   ```

2. Is env var set correctly?
   ```bash
   cat rubix/frontend/.env.local | grep VITE_PLUGIN_DEV
   # Should show: VITE_PLUGIN_DEV_NUBE_PLM=http://localhost:5173
   ```

3. Did you restart rubix frontend after changing env var?
   ```bash
   # Env vars only loaded at startup
   cd rubix/frontend
   # Ctrl+C
   pnpm dev
   ```

4. Check browser console for errors:
   ```
   [MF] Loading plugin nube.plm from dev server: http://localhost:5173/remoteEntry.js
   Failed to fetch dynamically imported module: http://localhost:5173/remoteEntry.js
   ```
   → Dev server not running or port mismatch

### CORS Errors

**Symptom**: Console shows CORS policy errors

**Solution**: Plugin vite config has CORS enabled, but verify:
```typescript
// rubix-plugin/nube.plm/frontend/vite.config.ts
server: {
  cors: true,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
}
```

### Changes Not Hot Reloading

**Symptom**: Changes require manual refresh

**Possible Causes:**
1. Editing wrong directory (editing `dist-frontend` instead of `src`)
2. TypeScript errors blocking HMR (check terminal output)
3. Editing files outside Vite's watch scope

**Fix:**
```bash
# Verify you're editing src files
pwd
# Should be: .../rubix-plugin/nube.plm/frontend/src/...

# Check Vite terminal for errors
# Look for TypeScript or build errors
```

### Dev Server Port Conflict

**Symptom**: `Error: Port 5173 is already in use`

**Solution:**
```bash
# Kill existing process
lsof -ti:5173 | xargs kill -9

# Or use different port
# Edit vite.config.ts:
server: {
  port: 5174,  // Changed
}

# Update env var:
VITE_PLUGIN_DEV_NUBE_PLM=http://localhost:5174
```

---

## 🔮 Future Enhancements

### Multi-Plugin Dev Mode

**Current**: Only one plugin in dev mode at a time

**Future**: Support multiple plugins simultaneously
```bash
# .env.local
VITE_PLUGIN_DEV_NUBE_PLM=http://localhost:5173
VITE_PLUGIN_DEV_NUBE_EXAMPLE=http://localhost:5174
VITE_PLUGIN_DEV_NUBE_FOO=http://localhost:5175
```

### Auto-Detection

**Idea**: Automatically detect if dev server is running, fallback to production

```typescript
async function getPluginDevUrl(pluginId: string): Promise<string | null> {
  const devUrl = import.meta.env[`VITE_PLUGIN_DEV_${mfName(pluginId).toUpperCase()}`];
  if (!devUrl) return null;

  // Check if dev server is actually running
  try {
    await fetch(`${devUrl}/remoteEntry.js`, { method: 'HEAD' });
    return devUrl;
  } catch {
    console.warn(`[MF] Dev server not reachable: ${devUrl}, falling back to production`);
    return null;
  }
}
```

### Hot Reload Indicator

**Idea**: Visual indicator when plugin is in dev mode

```tsx
{import.meta.env.VITE_PLUGIN_DEV_NUBE_PLM && (
  <Badge variant="warning" className="absolute top-2 right-2">
    🔥 Dev Mode
  </Badge>
)}
```

---

## 📚 Related Documentation

- [OVERVIEW.md](./OVERVIEW.md) - PLM plugin architecture
- [PLM_PLUGIN_STATUS.md](./PLM_PLUGIN_STATUS.md) - Implementation status
- [VISION.md](./VISION.md) - Long-term plugin vision
- [../plugins/MODULE_FEDERATION_V2_MIGRATION.md](../plugins/MODULE_FEDERATION_V2_MIGRATION.md) - MF v2 migration

---

## 🎓 Key Takeaways

1. **Dev mode = 10x faster iteration** - No build step between changes
2. **Environment variables control mode** - Easy to toggle dev/prod
3. **Module Federation makes it possible** - Dynamic runtime loading
4. **CORS is required** - Cross-origin loading from different ports
5. **One-time setup per plugin** - Add env var + configure vite
6. **Works for any Module Federation plugin** - Not just PLM

**Best Practice**: Always develop in dev mode, only build for deployment or testing final output.

---

**Last Updated**: 2026-03-20
**Implemented By**: Claude Code + User
**Tested**: ✅ Working with nube.plm plugin
