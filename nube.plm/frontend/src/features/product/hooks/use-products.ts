/**
 * Product-specific hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@features/product/types/product.types';
import { ProductsAPI, PLMClientConfig, CreateProductInput, UpdateProductInput } from '@features/product/api/product-api';
import { usePLMHierarchy } from '@shared/hooks/use-plm-hierarchy';

export interface UseProductsConfig extends PLMClientConfig {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  createProduct: (input: CreateProductInput) => Promise<void>;
  updateProduct: (productId: string, input: UpdateProductInput) => Promise<void>;
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
      console.log('[useProducts] Creating ProductsAPI...');
      const api = new ProductsAPI(config);
      console.log('[useProducts] Calling queryProducts...');
      const products = await api.queryProducts();
      console.log('[useProducts] Got products:', {
        count: products.length,
        products: products,
      });
      setProducts(products);
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
  }, [config.orgId, config.deviceId, config.baseUrl, config.token]);

  const createProduct = useCallback(
    async (input: CreateProductInput) => {
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

      const api = new ProductsAPI(config);
      await api.createProduct(input);
      await fetchProducts();
    },
    [collections.products, config.orgId, config.deviceId, config.baseUrl, config.token, fetchProducts, products]
  );

  const updateProduct = useCallback(
    async (productId: string, input: UpdateProductInput) => {
      const api = new ProductsAPI(config);
      await api.updateProduct(productId, input);
      await fetchProducts();
    },
    [config.orgId, config.deviceId, config.baseUrl, config.token, fetchProducts]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      const api = new ProductsAPI(config);
      await api.deleteProduct(productId);
      await fetchProducts();
    },
    [config.orgId, config.deviceId, config.baseUrl, config.token, fetchProducts]
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
