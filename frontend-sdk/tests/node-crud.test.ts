/**
 * Node CRUD Integration Tests
 *
 * Tests basic node operations against the real Rubix backend:
 * - Create nodes with refs
 * - Read nodes (query, get by ID)
 * - Update nodes (name, settings)
 * - Delete nodes
 *
 * Prerequisites:
 * - Rubix server running on localhost:9000
 * - Test user credentials configured
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { PluginClient } from '../plugin-client/index.js';
import { createTestClient, getTestConfig, testName, cleanup } from './setup.js';

describe('Node CRUD Operations', () => {
  let client: PluginClient;
  const createdNodes: string[] = [];

  beforeAll(async () => {
    const config = getTestConfig();
    client = await createTestClient(config);
    console.log('\n🧪 Running Node CRUD Tests...\n');
  });

  afterAll(async () => {
    console.log('\n🧹 Cleaning up test nodes...');
    await cleanup(client, createdNodes);
  });

  describe('Create Node', () => {
    it('should create a node with basic fields', async () => {
      const name = testName('test-node');

      const node = await client.createNode(undefined, {
        type: 'core.folder',
        name,
        position: { x: 100, y: 200 },
      });

      expect(node.id).toBeDefined();
      expect(node.name).toBe(name);
      expect(node.type).toBe('core.folder');
      expect(node.position).toEqual({ x: 100, y: 200 });

      createdNodes.push(node.id!);
      console.log(`  ✓ Created node: ${node.id}`);
    });

    it('should create a node with settings', async () => {
      const name = testName('test-counter');

      const node = await client.createNode(undefined, {
        type: 'core.counter',
        name,
        settings: {
          initialValue: 0,
          step: 1,
          max: 100,
        },
      });

      expect(node.id).toBeDefined();
      expect(node.settings).toBeDefined();
      expect(node.settings?.initialValue).toBe(0);
      expect(node.settings?.step).toBe(1);

      createdNodes.push(node.id!);
      console.log(`  ✓ Created node with settings: ${node.id}`);
    });

    it('should create a child node with parentRef', async () => {
      // Create parent
      const parentName = testName('parent-folder');
      const parent = await client.createNode(undefined, {
        type: 'core.folder',
        name: parentName,
      });
      createdNodes.push(parent.id!);

      // Create child and let the SDK add parentRef automatically
      const childName = testName('child-node');
      const child = await client.createNode(parent.id, {
        type: 'core.counter',
        name: childName,
      });

      expect(child.id).toBeDefined();
      expect(child.parentId).toBe(parent.id);
      const refs = await client.listRefs(child.id!);
      expect(refs.some((ref) => ref.refName === 'parentRef' && ref.toNodeId === parent.id)).toBe(true);

      createdNodes.push(child.id!);
      console.log(`  ✓ Created child with auto parentRef: ${child.id} → ${parent.id}`);
    });
  });

  describe('Read Node', () => {
    let testNodeId: string;

    beforeAll(async () => {
      const node = await client.createNode(undefined, {
        type: 'core.folder',
        name: testName('read-test'),
        settings: { color: 'blue' },
      });
      testNodeId = node.id!;
      createdNodes.push(testNodeId);
    });

    it('should get node by ID', async () => {
      const node = await client.getNode(testNodeId);

      expect(node.id).toBe(testNodeId);
      expect(node.type).toBe('core.folder');
      expect(node.settings?.color).toBe('blue');

      console.log(`  ✓ Retrieved node by ID: ${node.id}`);
    });

    it('should query nodes by type', async () => {
      const nodes = await client.queryNodes({
        filter: 'type is "core.folder"',
      });

      expect(Array.isArray(nodes)).toBe(true);
      expect(nodes.length).toBeGreaterThan(0);

      const found = nodes.find(n => n.id === testNodeId);
      expect(found).toBeDefined();

      console.log(`  ✓ Queried nodes: found ${nodes.length} folders`);
    });

    it('should query nodes with settings filter', async () => {
      const nodes = await client.queryNodes({
        filter: 'type is "core.folder" and r.settings->color is "blue"',
      });

      const found = nodes.find(n => n.id === testNodeId);
      expect(found).toBeDefined();

      console.log(`  ✓ Filtered by settings: found ${nodes.length} blue folders`);
    });
  });

  describe('Update Node', () => {
    let testNodeId: string;

    beforeAll(async () => {
      const node = await client.createNode(undefined, {
        type: 'core.counter',
        name: testName('update-test'),
        settings: { initialValue: 0 },
      });
      testNodeId = node.id!;
      createdNodes.push(testNodeId);
    });

    it('should update node name', async () => {
      const newName = testName('updated-name');

      const updated = await client.updateNode(testNodeId, {
        name: newName,
      });

      expect(updated.name).toBe(newName);

      console.log(`  ✓ Updated node name: ${testNodeId}`);
    });

    it('should update node settings', async () => {
      const updated = await client.updateNode(testNodeId, {
        settings: {
          initialValue: 10,
          step: 5,
        },
      });

      expect(updated.settings?.initialValue).toBe(10);
      expect(updated.settings?.step).toBe(5);

      console.log(`  ✓ Updated node settings: ${testNodeId}`);
    });

    it('should update node position', async () => {
      const updated = await client.updateNode(testNodeId, {
        position: { x: 300, y: 400 },
      });

      expect(updated.position).toEqual({ x: 300, y: 400 });

      console.log(`  ✓ Updated node position: ${testNodeId}`);
    });
  });

  describe('Delete Node', () => {
    it('should delete a node', async () => {
      const node = await client.createNode(undefined, {
        type: 'core.folder',
        name: testName('delete-test'),
      });

      const nodeId = node.id!;

      await client.deleteNode(nodeId);

      // Verify it's gone
      try {
        await client.getNode(nodeId);
        throw new Error('Node should have been deleted');
      } catch (err: any) {
        expect(err.status).toBe(404);
      }

      console.log(`  ✓ Deleted node: ${nodeId}`);
    });

    it('should return 404 when deleting non-existent node', async () => {
      const fakeId = 'nod_DOESNOTEXIST';

      try {
        await client.deleteNode(fakeId);
        throw new Error('Should have thrown error');
      } catch (err: any) {
        expect(err.status).toBe(404);
        expect(err.message).toContain('not found');
      }

      console.log(`  ✓ Correctly handled non-existent node delete`);
    });
  });
});
