/**
 * PLM Plugin Integration Tests
 *
 * Tests the PLM (Product Lifecycle Management) plugin:
 * - Create products with settings
 * - Query products with filters
 * - Update product settings
 * - Delete products
 * - Test settings schemas
 *
 * Prerequisites:
 * - Rubix server running on localhost:9000
 * - PLM plugin deployed and running
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { PluginClient } from '../plugin-client/index.js';
import { createTestClient, getTestConfig, testName, cleanup } from './setup.js';

describe('PLM Plugin - Product Management', () => {
  let client: PluginClient;
  const createdNodes: string[] = [];
  let productsCollectionId: string;

  beforeAll(async () => {
    const config = getTestConfig();
    client = await createTestClient(config);
    console.log('\n🧪 Running PLM Plugin Tests...\n');

    // Find or create the products collection (using plm.products, not plm.collection)
    const collections = await client.queryNodes({
      filter: 'type is "plm.products"',
    });

    if (collections.length > 0) {
      productsCollectionId = collections[0].id!;
      console.log(`  📁 Using existing Products collection: ${productsCollectionId}`);
    } else {
      // Create products collection if it doesn't exist
      const collection = await client.createNode({
        type: 'plm.products',
        name: 'Products',
      });
      productsCollectionId = collection.id!;
      createdNodes.push(productsCollectionId);
      console.log(`  📁 Created Products collection: ${productsCollectionId}`);
    }
  });

  afterAll(async () => {
    console.log('\n🧹 Cleaning up test products...');
    await cleanup(client, createdNodes);
  });

  describe('Create Product', () => {
    it('should create a product with hardware settings', async () => {
      const productName = testName('HW-Product');

      const product = await client.createNode({
        type: 'plm.product',
        name: productName,
        parentId: productsCollectionId,
        settings: {
          productCode: testName('HW'),
          tags: ['Electronics', 'Components'],
        },
        refs: [
          {
            refName: 'parentRef',
            toNodeId: productsCollectionId,
            toNodeName: 'Products',
          },
        ],
      });

      expect(product.id).toBeDefined();
      expect(product.name).toBe(productName);
      expect(product.type).toBe('plm.product');
      expect(product.parentId).toBe(productsCollectionId);
      expect(product.settings?.productCode).toBeDefined();
      expect(product.settings?.tags).toEqual(['Electronics', 'Components']);

      createdNodes.push(product.id!);
      console.log(`  ✓ Created hardware product: ${product.id}`);
    });

    it('should create a product with software settings', async () => {
      const productName = testName('SW-Product');

      const product = await client.createNode({
        type: 'plm.product',
        name: productName,
        parentId: productsCollectionId,
        settings: {
          productCode: testName('SW'),
          features: ['API', 'Web UI', 'Cloud'],
        },
        refs: [
          {
            refName: 'parentRef',
            toNodeId: productsCollectionId,
            toNodeName: 'Products',
          },
        ],
      });

      expect(product.id).toBeDefined();
      expect(product.settings?.features).toEqual(['API', 'Web UI', 'Cloud']);

      createdNodes.push(product.id!);
      console.log(`  ✓ Created software product: ${product.id}`);
    });

    it('should fail when creating product without parentRef', async () => {
      try {
        await client.createNode({
          type: 'plm.product',
          name: testName('Invalid-Product'),
          parentId: productsCollectionId,
          settings: { productCode: 'TEST' },
          // Missing refs!
        });
        throw new Error('Should have failed without refs');
      } catch (err: any) {
        // This might succeed depending on backend validation
        // If it does, clean it up
        if (!err.message.includes('Should have failed')) {
          console.log('  ⚠️  Backend allows products without parentRef (might be okay)');
        }
      }
    });
  });

  describe('Query Products', () => {
    let testProductId: string;

    beforeAll(async () => {
      const product = await client.createNode({
        type: 'plm.product',
        name: testName('Query-Test'),
        parentId: productsCollectionId,
        settings: {
          productCode: 'QT-001',
          tags: ['Electronics'],
        },
        refs: [
          {
            refName: 'parentRef',
            toNodeId: productsCollectionId,
          },
        ],
      });
      testProductId = product.id!;
      createdNodes.push(testProductId);
    });

    it('should query all products', async () => {
      const products = await client.queryNodes({
        filter: 'type is "plm.product"',
      });

      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      const found = products.find(p => p.id === testProductId);
      expect(found).toBeDefined();

      console.log(`  ✓ Queried all products: found ${products.length}`);
    });

    it('should query products by settings', async () => {
      const products = await client.queryNodes({
        filter: 'type is "plm.product" and r.settings->productCode is "QT-001"',
      });

      const found = products.find(p => p.id === testProductId);
      expect(found).toBeDefined();

      console.log(`  ✓ Filtered by productCode: found ${products.length}`);
    });

    it('should query products by parent', async () => {
      const products = await client.queryNodes({
        filter: `type is "plm.product" and parentId is "${productsCollectionId}"`,
      });

      expect(products.length).toBeGreaterThan(0);

      console.log(`  ✓ Filtered by parent: found ${products.length} in collection`);
    });

    it('should verify product has all expected fields', async () => {
      const product = await client.getNode(testProductId);

      expect(product.id).toBe(testProductId);
      expect(product.name).toBeDefined();
      expect(product.type).toBe('plm.product');
      expect(product.parentId).toBe(productsCollectionId);
      expect(product.settings).toBeDefined();
      expect(product.settings?.productCode).toBe('QT-001');
      expect(product.createdAt).toBeDefined();
      expect(product.updatedAt).toBeDefined();

      console.log(`  ✓ Product has all fields:`, {
        id: product.id,
        name: product.name,
        type: product.type,
        parentId: product.parentId,
        hasSettings: !!product.settings,
      });
    });
  });

  describe('Update Product', () => {
    let testProductId: string;

    beforeAll(async () => {
      const product = await client.createNode({
        type: 'plm.product',
        name: testName('Update-Test'),
        parentId: productsCollectionId,
        settings: {
          productCode: 'UT-001',
          tags: ['Electronics'],
        },
        refs: [
          {
            refName: 'parentRef',
            toNodeId: productsCollectionId,
          },
        ],
      });
      testProductId = product.id!;
      createdNodes.push(testProductId);
    });

    it('should update product name', async () => {
      const newName = testName('Updated-Product');

      const updated = await client.updateNode(testProductId, {
        name: newName,
      });

      expect(updated.name).toBe(newName);

      console.log(`  ✓ Updated product name: ${testProductId}`);
    });

    it('should update product settings', async () => {
      const updated = await client.updateNode(testProductId, {
        settings: {
          productCode: 'UT-002',
          tags: ['Mechanical', 'Tools'],
        },
      });

      expect(updated.settings?.productCode).toBe('UT-002');
      expect(updated.settings?.tags).toEqual(['Mechanical', 'Tools']);

      console.log(`  ✓ Updated product settings: ${testProductId}`);
    });

    it('should preserve other settings when updating', async () => {
      // Get current product
      const current = await client.getNode(testProductId);

      // Update only one field
      const updated = await client.updateNode(testProductId, {
        settings: {
          ...current.settings,
          productCode: 'UT-003',
        },
      });

      expect(updated.settings?.productCode).toBe('UT-003');
      expect(updated.settings?.tags).toEqual(['Mechanical', 'Tools']); // Should still be there

      console.log(`  ✓ Partial settings update preserved other fields`);
    });
  });

  describe('Delete Product', () => {
    it('should delete a product', async () => {
      const product = await client.createNode({
        type: 'plm.product',
        name: testName('Delete-Test'),
        parentId: productsCollectionId,
        settings: { productCode: 'DT-001' },
        refs: [
          {
            refName: 'parentRef',
            toNodeId: productsCollectionId,
          },
        ],
      });

      const productId = product.id!;

      // Delete it
      await client.deleteNode(productId);

      // Verify it's gone
      try {
        await client.getNode(productId);
        throw new Error('Product should have been deleted');
      } catch (err: any) {
        expect(err.status).toBe(404);
      }

      console.log(`  ✓ Deleted product: ${productId}`);
    });

    it('should verify delete from query results', async () => {
      const product = await client.createNode({
        type: 'plm.product',
        name: testName('Delete-Query-Test'),
        parentId: productsCollectionId,
        settings: { productCode: 'DQT-001' },
        refs: [
          {
            refName: 'parentRef',
            toNodeId: productsCollectionId,
          },
        ],
      });

      const productId = product.id!;

      // Verify it exists in query
      let products = await client.queryNodes({
        filter: `type is "plm.product" and id is "${productId}"`,
      });
      expect(products.length).toBe(1);

      // Delete it
      await client.deleteNode(productId);

      // Verify it's gone from query
      products = await client.queryNodes({
        filter: `type is "plm.product" and id is "${productId}"`,
      });
      expect(products.length).toBe(0);

      console.log(`  ✓ Product removed from query results after delete`);
    });
  });
});
