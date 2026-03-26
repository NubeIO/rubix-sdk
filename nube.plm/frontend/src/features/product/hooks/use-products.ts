/**
 * Product-specific hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { Product, ProductSettings } from '@features/product/types/product.types';
import { usePLMHierarchy } from '@shared/hooks/use-plm-hierarchy';

export interface UseProductsConfig {
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  createProduct: (input: { name: string; parentId: string; settings: ProductSettings }) => Promise<void>;
  updateProduct: (productId: string, input: { name?: string; settings: ProductSettings }) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  refetch: () => Promise<void>;
  productsCollectionId: string | null;
  hierarchyLoading: boolean;
  hierarchyError: string | null;
}

export function useProducts(config: UseProductsConfig): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create plugin client - use SDK directly!
  const client = createPluginClient({
    orgId: config.orgId,
    deviceId: config.deviceId,
    baseUrl: config.baseUrl,
    token: config.token,
  });

  // Get PLM hierarchy (products collection ID)
  const { collections, loading: hierarchyLoading, error: hierarchyError } = usePLMHierarchy(
    config.orgId,
    config.deviceId,
    config.baseUrl,
    config.token
  );

  console.log('[useProducts] Hierarchy state:', {
    collections,
    hierarchyLoading,
    hierarchyError,
  });

  const fetchProducts = useCallback(async () => {
    console.log('[useProducts] fetchProducts called', {
      orgId: config.orgId,
      deviceId: config.deviceId,
      baseUrl: config.baseUrl,
      hasToken: !!config.token,
    });

    if (!config.orgId || !config.deviceId) {
      console.warn('[useProducts] Missing orgId or deviceId');
      setLoading(false);
      return;
    }

    try {
      console.log('[useProducts] Fetching products with SDK...');

      // Use products collection as parent filter (if available)
      const parentId = collections.products || undefined;
      const filter = parentId
        ? `parent.id is "${parentId}" and type is "plm.product"`
        : 'type is "plm.product"';

      console.log('[useProducts] Calling SDK queryNodes with filter:', filter);
      const fetchedProducts = await client.queryNodes({ filter });
      console.log('[useProducts] Got products:', {
        count: fetchedProducts.length,
        products: fetchedProducts,
      });
      setProducts(fetchedProducts as Product[]);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMsg);
      console.error('[useProducts] Fetch error:', {
        error: err,
        message: errorMsg,
        stack: err instanceof Error ? err.stack : undefined,
      });
    } finally {
      console.log('[useProducts] Setting loading=false');
      setLoading(false);
    }
  }, [config.orgId, config.deviceId, config.baseUrl, config.token, collections.products]);

  const createProduct = useCallback(
    async (input: { name: string; parentId: string; settings: ProductSettings }) => {
      if (!collections.products) {
        throw new Error('Products collection not found - restart plugin');
      }

      const newProductCode = typeof input.settings?.productCode === 'string'
        ? input.settings.productCode
        : '';
      if (newProductCode && products.some((product) => (
        product.settings?.productCode === newProductCode
      ))) {
        throw new Error(`Product code '${input.settings?.productCode}' already exists`);
      }

      // Use SDK createNode instead of ProductsAPI
      await client.createNode({
        type: 'plm.product',
        name: input.name,
        parentId: input.parentId,
        settings: input.settings,
      });
      await fetchProducts();
    },
    [client, collections.products, fetchProducts, products]
  );

  const updateProduct = useCallback(
    async (productId: string, input: { name?: string; settings: ProductSettings }) => {
      // Use SDK updateNode instead of ProductsAPI
      await client.updateNode(productId, {
        name: input.name,
        settings: input.settings,
      });
      await fetchProducts();
    },
    [client, fetchProducts]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      // Use SDK deleteNode instead of ProductsAPI
      await client.deleteNode(productId);
      await fetchProducts();
    },
    [client, fetchProducts]
  );

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Auto-refresh
  useEffect(() => {
    if (!config.autoRefresh || !config.refreshInterval) return;

    const intervalId = setInterval(fetchProducts, config.refreshInterval);
    return () => clearInterval(intervalId);
  }, [config.autoRefresh, config.refreshInterval, fetchProducts]);

  const result = {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
    productsCollectionId: collections.products || null,
    hierarchyLoading,
    hierarchyError,
  };

  console.log('[useProducts] Returning result:', {
    productsCount: products.length,
    loading,
    error,
    productsCollectionId: collections.products || null,
    hierarchyLoading,
    hierarchyError,
  });

  return result;
}
