import { useState } from 'react';

import type { Product } from '@features/product/types/product.types';

interface UseProductsPageStateOptions {
  onRefresh: () => Promise<void>;
}

export function useProductsPageState({
  onRefresh,
}: UseProductsPageStateOptions) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<{
    id: string;
    name: string;
    code?: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const startTime = Date.now();

    await onRefresh();

    const elapsed = Date.now() - startTime;
    if (elapsed < 500) {
      await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
    }

    setIsRefreshing(false);
  };

  return {
    createDialogOpen,
    editingProduct,
    deletingProduct,
    isRefreshing,
    openCreateDialog: () => setCreateDialogOpen(true),
    closeCreateDialog: () => setCreateDialogOpen(false),
    openEditDialog: (product: Product) => setEditingProduct(product),
    closeEditDialog: () => setEditingProduct(null),
    openDeleteDialog: (productId: string, productName: string, productCode?: string) =>
      setDeletingProduct({ id: productId, name: productName, code: productCode }),
    closeDeleteDialog: () => setDeletingProduct(null),
    handleRefresh,
  };
}
