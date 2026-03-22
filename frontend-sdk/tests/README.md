# Rubix SDK Integration Tests

Real integration tests that call the actual Go backend running on `localhost:9000`.

## What These Tests Do

✅ **Real API calls** - Tests hit the actual Rubix backend, no mocks
✅ **Real database** - Creates actual nodes in SQLite (`bin/dev/data/db/rubix.db`)
✅ **Real authentication** - Login with JWT tokens
✅ **Complete CRUD** - Tests all node operations: create, read, update, delete
✅ **Refs testing** - Tests parent-child relationships
✅ **Auto cleanup** - Deletes test nodes after each test suite

## Test Suites

### 1. Node CRUD Tests (`node-crud.test.ts`)
- Create nodes with basic fields, settings, and position
- Create child nodes with `parentRef`
- Read nodes by ID and query with filters
- Update node name, settings, and position
- Delete nodes and verify deletion

### 2. PLM Plugin Tests (`plm-plugin.test.ts`)
- Create products with hardware/software settings
- Query products by type, settings, and parent
- Update product name and settings
- Delete products and verify removal
- Test settings validation

## Prerequisites

### 1. Start the Rubix Backend

The tests require the Go backend running:

```bash
cd /home/user/code/go/nube/rubix
make dev
```

Server should be running on **http://localhost:9000**

Verify it's running:
```bash
curl http://localhost:9000/healthz
```

### 2. Install Test Dependencies

```bash
cd /home/user/code/go/nube/rubix-sdk/frontend-sdk
pnpm install
```

## Running Tests

### Run All Tests

```bash
pnpm test
```

### Run Specific Test Suite

```bash
# Node CRUD only
pnpm test node-crud

# PLM Plugin only
pnpm test plm-plugin
```

### Run Tests Once (No Watch Mode)

```bash
pnpm test:run
```

### Run with Verbose Output

```bash
pnpm test -- --reporter=verbose
```

## Test Output

Successful test output looks like:

```
🧪 Running Node CRUD Tests...

✅ Logged in: { orgId: 'test', deviceId: 'dev_ABC123', role: 'org-admin' }

 ✓ tests/node-crud.test.ts (12)
   ✓ Create Node (3)
     ✓ should create a node with basic fields
       ✓ Created node: nod_XYZ789
     ✓ should create a node with settings
       ✓ Created node with settings: nod_ABC123
     ✓ should create a child node with parentRef
       ✓ Created child with parentRef: nod_CHILD → nod_PARENT

   ✓ Read Node (3)
     ✓ should get node by ID
     ✓ should query nodes by type
     ✓ should query nodes with settings filter

   ✓ Update Node (3)
     ✓ should update node name
     ✓ should update node settings
     ✓ should update node position

   ✓ Delete Node (2)
     ✓ should delete a node
     ✓ should return 404 when deleting non-existent node

🧹 Cleaning up test nodes...
  🗑️  Deleted test node: nod_XYZ789
  🗑️  Deleted test node: nod_ABC123
```

## Configuration

Default configuration:
- Base URL: `http://localhost:9000/api/v1`
- Email: `admin@rubix.io`
- Password: `admin@rubix.io`
- Org ID: `test`

To override, create `.env.test.local`:

```bash
BASE_URL=http://localhost:9000/api/v1
EMAIL=your-email@example.com
PASSWORD=your-password
ORG_ID=your-org
```

## Troubleshooting

### Tests Failing with Connection Errors

**Problem:** `ECONNREFUSED` or `fetch failed`

**Solution:** Make sure the Rubix backend is running:
```bash
cd /home/user/code/go/nube/rubix
make dev
```

### Tests Failing with 401 Unauthorized

**Problem:** Login failed or token expired

**Solution:** Verify credentials in `.env.test` or check backend logs

### Tests Failing with 404 Not Found

**Problem:** Node ID doesn't exist

**Possible causes:**
- Node was already deleted
- Wrong org/device context
- Database was reset

**Solution:** Run tests again (they create fresh nodes)

### PLM Tests Failing

**Problem:** PLM plugin not running

**Solution:** Deploy the PLM plugin:
```bash
cd /home/user/code/go/nube/rubix-sdk/nube.plm
bash deploy.sh
# Restart Rubix server
```

## Viewing Test Data in Database

You can inspect the test data in SQLite:

```bash
sqlite3 /home/user/code/go/nube/rubix/bin/dev/data/db/rubix.db

# View all nodes
SELECT id, name, type, parent_id FROM nodes ORDER BY created_at DESC LIMIT 10;

# View test nodes (contain timestamp in name)
SELECT id, name, type FROM nodes WHERE name LIKE '%_1%' ORDER BY created_at DESC;

# Exit
.quit
```

## Adding New Tests

See the existing test files for patterns:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient, getTestConfig, testName, cleanup } from './setup.js';

describe('My Test Suite', () => {
  let client: PluginClient;
  const createdNodes: string[] = [];

  beforeAll(async () => {
    const config = getTestConfig();
    client = await createTestClient(config);
  });

  afterAll(async () => {
    await cleanup(client, createdNodes);
  });

  it('should do something', async () => {
    const node = await client.createNode({
      type: 'my.type',
      name: testName('test'),
    });

    createdNodes.push(node.id!);

    expect(node.id).toBeDefined();
  });
});
```

## CI/CD Integration

These tests can run in CI/CD by:

1. Starting Rubix backend in background
2. Waiting for server to be ready
3. Running tests
4. Stopping backend

Example GitHub Actions:

```yaml
- name: Start Rubix Backend
  run: |
    cd /path/to/rubix
    make dev &
    sleep 5

- name: Run Tests
  run: |
    cd /path/to/rubix-sdk/frontend-sdk
    pnpm test:run

- name: Stop Backend
  run: pkill -f rubix
```
