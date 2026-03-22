/**
 * Products Page - Full page view for product management
 *
 * Accessible via right-click → "Open page" on PLM nodes
 */

import { createRoot, type Root } from 'react-dom/client';
import { useState } from 'react';
// Use plugin's own Button to avoid SDK Slot issues
import { Button } from '@/ui/button';
// @ts-ignore - SDK types are resolved at build time
import { Skeleton, RefreshButton } from '@rubix-sdk/frontend/common/ui';
import '@rubix-sdk/frontend/globals.css';

import { Product } from '../common/types';
import { useProducts } from '../common/hooks';
import { PlusIcon } from '../../shared/components/icons';
import { ProductTable } from '../components';
import {
  DeleteProductDialogSDK as DeleteProductDialog,
  CreateProductDialogSDK,
  EditProductDialogSDK,
} from '../dialogs';

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

  // Products CRUD (includes PLM hierarchy initialization)
  const {
    products,
    loading: productsLoading,
    error: productsError,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch,
    productsCollectionId,
    hierarchyLoading,
    hierarchyError,
  } = useProducts({
    orgId,
    deviceId,
    baseUrl,
    token,
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
  });

  console.log('[ProductsPage] useProducts result:', {
    productsCount: products.length,
    products,
    productsLoading,
    productsError,
    hierarchyLoading,
    hierarchyError,
    productsCollectionId,
  });

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<{
    id: string;
    name: string;
    code?: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Computed
  const canCreate = !!(orgId && deviceId && baseUrl && productsCollectionId);
  const loading = hierarchyLoading || productsLoading;
  const error = hierarchyError || productsError;

  // Refresh handler with minimum 500ms animation
  const handleRefresh = async () => {
    setIsRefreshing(true);
    const startTime = Date.now();

    await refetch();

    // Ensure minimum 500ms animation for visual feedback
    const elapsed = Date.now() - startTime;
    if (elapsed < 500) {
      await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
    }

    setIsRefreshing(false);
  };

  // Full page display settings (show all columns)
  const displaySettings = {
    showCode: true,
    showStatus: true,
    showPrice: true,
    compactMode: false,
  };

  // Loading state
  if (loading) {
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
  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <h3 className="font-semibold text-destructive mb-2">Error Loading Products</h3>
            <p className="text-sm text-destructive/90">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - render UI only (dialogs rendered at bottom)
  const emptyStateContent = products.length === 0 ? (
    <div className="border rounded-lg p-12 text-center">
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-2">No products yet</h3>
        <p className="text-muted-foreground mb-6">
          Get started by creating your first product
        </p>
        <div className="flex gap-2 justify-center">
          <RefreshButton
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
          <Button
            onClick={() => {
              console.log('[ProductsPage] Create button clicked (empty state)');
              console.log('[ProductsPage] canCreate:', canCreate);
              setCreateDialogOpen(true);
            }}
            disabled={!canCreate}
          >
            <PlusIcon size={16} />
            Create Product
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  // Main layout - render dialogs regardless of empty/full state
  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Products</h1>
            {products.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {products.length} product{products.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {products.length > 0 && (
            <div className="flex gap-2 items-center">
              <RefreshButton
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
              />
              <Button
                onClick={() => {
                  console.log('[ProductsPage] Create button clicked (main content)');
                  console.log('[ProductsPage] canCreate:', canCreate);
                  setCreateDialogOpen(true);
                }}
                disabled={!canCreate}
              >
                <PlusIcon size={16} />
                Create Product
              </Button>
            </div>
          )}
        </div>

        {/* Content - empty state or table */}
        {products.length === 0 ? (
          emptyStateContent
        ) : (
          <div className="border rounded-lg">
            <ProductTable
              products={products}
              displaySettings={displaySettings}
              onEdit={(product) => setEditingProduct(product)}
              onDelete={(productId, productName, productCode) => {
                console.log('[ProductsPage] Delete clicked - ID:', productId, 'Name:', productName);
                setDeletingProduct({ id: productId, name: productName, code: productCode });
              }}
            />
          </div>
        )}

        {/* Dialogs - always rendered */}
        <CreateProductDialogSDK
          orgId={orgId}
          deviceId={deviceId}
          baseUrl={baseUrl}
          token={token}
          productsCollectionId={productsCollectionId || ''}
          templateNodeId={products[0]?.id} // Use first product as template for schemas
          open={createDialogOpen}
          onClose={() => {
            console.log('[ProductsPage] Create dialog closed');
            setCreateDialogOpen(false);
          }}
          onSubmit={async (data) => {
            console.log('[ProductsPage] Create product submitted:', data);
            await createProduct(data);
            setCreateDialogOpen(false);
          }}
        />

        {/* Edit Product Dialog */}
        {editingProduct && (
          <EditProductDialogSDK
            orgId={orgId}
            deviceId={deviceId}
            baseUrl={baseUrl}
            token={token}
            product={editingProduct}
            open={true}
            onClose={() => setEditingProduct(null)}
            onSubmit={updateProduct}
          />
        )}

        {/* Delete Product Dialog */}
        {deletingProduct && (
          <DeleteProductDialog
            open={true}
            onOpenChange={(open) => {
              if (!open) setDeletingProduct(null);
            }}
            productName={deletingProduct.name}
            onConfirm={async () => {
              await deleteProduct(deletingProduct.id);
              setDeletingProduct(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Export mount/unmount API for Module Federation
export default {
  mount: (container: HTMLElement, props?: ProductsPageProps) => {
    console.log('[ProductsPage] mount() called with props:', props);
    const root = createRoot(container);
    root.render(<ProductsPage {...(props || {})} />);
    return root;
  },

  unmount: (root: Root) => {
    console.log('[ProductsPage] unmount() called');
    root.unmount();
  },
};
