/**
 * Products Page - Full page view for product management
 *
 * Accessible via right-click → "Open page" on PLM nodes
 */

import { createRoot, type Root } from 'react-dom/client';
import '@rubix-sdk/frontend/globals.css';

import { useProducts } from '../common/hooks';
import { ProductsPageContent } from './products-page-content';
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

  const canCreate = !!(orgId && deviceId && baseUrl && productsCollectionId);
  const loading = hierarchyLoading || productsLoading;
  const error = hierarchyError || productsError;

  const displaySettings = {
    showCode: true,
    showStatus: true,
    showPrice: true,
    compactMode: false,
  };

  const {
    createDialogOpen,
    editingProduct,
    deletingProduct,
    isRefreshing,
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
    openDeleteDialog,
    closeDeleteDialog,
    handleRefresh,
  } = useProductsPageState({
    onRefresh: refetch,
  });

  return (
    <>
      <ProductsPageContent
        products={products}
        loading={loading}
        error={error || undefined}
        canCreate={canCreate}
        isRefreshing={isRefreshing}
        displaySettings={displaySettings}
        onRefresh={handleRefresh}
        onCreate={() => {
          console.log('[ProductsPage] Create button clicked');
          console.log('[ProductsPage] canCreate:', canCreate);
          openCreateDialog();
        }}
        onEdit={openEditDialog}
        onDelete={(productId, productName, productCode) => {
          console.log('[ProductsPage] Delete clicked - ID:', productId, 'Name:', productName);
          openDeleteDialog(productId, productName, productCode);
        }}
      />

      <ProductsPageDialogs
        orgId={orgId}
        deviceId={deviceId}
        baseUrl={baseUrl}
        token={token}
        productsCollectionId={productsCollectionId}
        templateNodeId={products[0]?.id || undefined}
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
