/**
 * Products Page - Full page view for product management
 *
 * Accessible via right-click → "Open page" on PLM nodes
 */

import { createRoot, type Root } from 'react-dom/client';
import { useState, useCallback } from 'react';
import '@rubix-sdk/frontend/globals.css';
// @ts-ignore - SDK types are resolved at build time
import { Button, Skeleton } from '@rubix-sdk/frontend/common/ui';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { PlusIcon } from '@shared/components/icons';

import { usePLMHierarchy } from '@shared/hooks/use-plm-hierarchy';
import { ProductsAPI, type CreateProductInput, type UpdateProductInput } from '@features/product/api/product-api';
import { ProductsPageTabs } from './products-page-tabs';
import { ProductsPageDialogs } from './products-page-dialogs';
import { useProductsPageState } from './use-products-page-state';

export interface ProductsPageProps {
  orgId: string;
  deviceId: string;
  baseUrl: string;
  token?: string;
}

function ProductsPage({
  orgId,
  deviceId,
  baseUrl,
  token,
}: ProductsPageProps) {
  console.log('[ProductsPage] Render with props:', {
    orgId,
    deviceId,
    baseUrl,
    hasToken: !!token,
  });

  // PLM hierarchy (for productsCollectionId)
  const { collections, loading: hierarchyLoading, error: hierarchyError } = usePLMHierarchy(
    orgId,
    deviceId,
    baseUrl,
    token
  );

  // Create plugin client and API
  const client = createPluginClient({ orgId, deviceId, baseUrl, token });
  const api = new ProductsAPI({ orgId, deviceId, baseUrl, token });

  // CRUD operations (no upfront fetching - lazy loaded by tabs)
  const createProduct = useCallback(async (input: CreateProductInput) => {
    if (!collections.products) {
      throw new Error('Products collection not found - restart plugin');
    }
    await api.createProduct(input);
  }, [collections.products]);

  const updateProduct = useCallback(async (productId: string, input: UpdateProductInput) => {
    await api.updateProduct(productId, input);
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    await api.deleteProduct(productId);
  }, []);

  const canCreate = !!(orgId && deviceId && baseUrl && collections.products);

  console.log('[ProductsPage] Hierarchy loaded:', {
    collections,
    hierarchyLoading,
    hierarchyError,
    canCreate,
  });

  const displaySettings = {
    showCode: true,
    showType: true,
    showStatus: true,
    showPrice: true,
    compactMode: false,
  };

  const {
    createDialogOpen,
    editingProduct,
    deletingProduct,
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
    openDeleteDialog,
    closeDeleteDialog,
  } = useProductsPageState({
    onRefresh: async () => {
      // No-op: tabs handle their own refresh
    },
  });

  // Loading state
  if (hierarchyLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (hierarchyError) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <h3 className="font-semibold text-destructive mb-2">Error Loading Products</h3>
            <p className="text-sm text-destructive/90">{hierarchyError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-8 h-full overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Products</h1>
            </div>
            <div className="flex gap-2 items-center">
              <Button onClick={openCreateDialog} disabled={!canCreate}>
                <PlusIcon size={16} />
                Create Product
              </Button>
            </div>
          </div>

          {/* Tabbed Table */}
          <ProductsPageTabs
            client={client}
            displaySettings={displaySettings}
            onEdit={openEditDialog}
            onDelete={(productId, productName, productCode) => {
              console.log('[ProductsPage] Delete clicked - ID:', productId, 'Name:', productName);
              openDeleteDialog(productId, productName, productCode);
            }}
          />
        </div>
      </div>

      <ProductsPageDialogs
        orgId={orgId}
        deviceId={deviceId}
        baseUrl={baseUrl}
        token={token}
        productsCollectionId={collections.products}
        templateNodeId={undefined}
        createDialogOpen={createDialogOpen}
        editingProduct={editingProduct}
        deletingProduct={deletingProduct}
        onCloseCreate={() => {
          console.log('[ProductsPage] Create dialog closed');
          closeCreateDialog();
        }}
        onCreate={async (data) => {
          console.log('[ProductsPage] Create product submitted:', data);
          await createProduct(data);
          closeCreateDialog();
        }}
        onCloseEdit={closeEditDialog}
        onEdit={updateProduct}
        onCloseDelete={closeDeleteDialog}
        onDelete={deleteProduct}
      />
    </>
  );
}

// Export mount/unmount API for Module Federation
export default {
  mount: (container: HTMLElement, props?: ProductsPageProps) => {
    console.log('[ProductsPage] mount() called with props:', props);
    const root = createRoot(container);
    root.render(
      <ProductsPage
        orgId={props?.orgId || ''}
        deviceId={props?.deviceId || ''}
        baseUrl={props?.baseUrl || ''}
        token={props?.token}
      />
    );
    return root;
  },

  unmount: (root: Root) => {
    console.log('[ProductsPage] unmount() called');
    root.unmount();
  },
};
