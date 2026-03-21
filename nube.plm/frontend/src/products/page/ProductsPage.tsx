/**
 * Products Page - Full page view for product management
 *
 * Accessible via right-click → "Open page" on PLM nodes
 */

import { useState } from 'react';
// Use plugin's own Button to avoid SDK Slot issues
import { Button } from '@/ui/button';
// @ts-ignore - SDK types are resolved at build time
import { Skeleton } from '@rubix-sdk/frontend/common/ui';
import '@rubix-sdk/frontend/globals.css';

import { Product } from '../common/types';
import { useProducts } from '../common/hooks';
import { PlusIcon } from '../../shared/components/icons';
import { ProductTable } from '../components';
import { CreateProductDialog, EditProductDialog, DeleteProductDialog } from '../dialogs';

export interface ProductsPageProps {
  orgId: string;
  deviceId: string;
  baseUrl: string;
  token?: string;
}

export default function ProductsPage({
  orgId,
  deviceId,
  baseUrl,
  token,
}: ProductsPageProps) {
  // Products CRUD (includes PLM hierarchy initialization)
  const {
    products,
    loading: productsLoading,
    error: productsError,
    createProduct,
    updateProduct,
    deleteProduct,
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

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<{
    id: string;
    name: string;
    code?: string;
  } | null>(null);

  // Computed
  const canCreate = !!(orgId && deviceId && baseUrl && productsCollectionId);
  const loading = hierarchyLoading || productsLoading;
  const error = hierarchyError || productsError;

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

  // Empty state
  if (products.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Products</h1>
          </div>

          <div className="border rounded-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first product
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} disabled={!canCreate}>
                <PlusIcon size={16} />
                Create Product
              </Button>
            </div>
          </div>

          <CreateProductDialog
            open={createDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
            onSubmit={createProduct}
          />
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {products.length} product{products.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} disabled={!canCreate}>
            <PlusIcon size={16} />
            Create Product
          </Button>
        </div>

        {/* Table */}
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

        {/* Dialogs */}
        <CreateProductDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={createProduct}
        />

        {editingProduct && (
          <EditProductDialog
            open={true}
            product={editingProduct}
            onClose={() => setEditingProduct(null)}
            onSubmit={updateProduct}
          />
        )}

        {deletingProduct && (
          <DeleteProductDialog
            open={true}
            productId={deletingProduct.id}
            productName={deletingProduct.name}
            productCode={deletingProduct.code}
            onClose={() => setDeletingProduct(null)}
            onConfirm={deleteProduct}
          />
        )}
      </div>
    </div>
  );
}
