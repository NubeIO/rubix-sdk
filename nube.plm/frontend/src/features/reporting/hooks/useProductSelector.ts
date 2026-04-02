import { useState, useCallback, useMemo } from 'react';
import type { Product } from '@features/product/types/product.types';

export type ProductTypeFilter = 'all' | 'software' | 'hardware' | 'project';

export interface UseProductSelectorResult {
  selectedIds: Set<string>;
  productTypeFilter: ProductTypeFilter;
  filteredProducts: Product[];
  toggleProduct: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setProductTypeFilter: (filter: ProductTypeFilter) => void;
  isAllSelected: boolean;
}

export function useProductSelector(products: Product[]): UseProductSelectorResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [productTypeFilter, setProductTypeFilter] = useState<ProductTypeFilter>('all');

  const filteredProducts = useMemo(() => {
    if (productTypeFilter === 'all') return products;
    return products.filter((p) => p.settings?.productType === productTypeFilter);
  }, [products, productTypeFilter]);

  const toggleProduct = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
  }, [filteredProducts]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected =
    filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id));

  return {
    selectedIds,
    productTypeFilter,
    filteredProducts,
    toggleProduct,
    selectAll,
    deselectAll,
    setProductTypeFilter,
    isAllSelected,
  };
}
