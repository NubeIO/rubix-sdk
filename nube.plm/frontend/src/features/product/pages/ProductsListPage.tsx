/**
 * Products Page - Full page view for product management
 *
 * Accessible via right-click → "Open page" on PLM nodes
 */

import { createRoot, type Root } from 'react-dom/client';
import { useState, useCallback, useEffect } from 'react';
import { Package, ListChecks } from 'lucide-react';
import '@rubix-sdk/frontend/globals.css';
// @ts-ignore - SDK types are resolved at build time
import { Button, Skeleton, Tabs, type Tab } from '@rubix-sdk/frontend/common/ui';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { PlusIcon } from '@shared/components/icons';

import { usePLMHierarchy } from '@shared/hooks/use-plm-hierarchy';
import { ProductsAPI, type CreateProductInput, type UpdateProductInput } from '@features/product/api/product-api';
import { TaskAPI, type UpdateTaskInput } from '@features/task/api/task-api';
import { ProductsListTab } from './products-list-tab';
import { TasksListTab } from './tasks-list-tab';
import { ProductsPageDialogs } from './products-page-dialogs';
import { CreateTaskDialog } from './create-task-dialog';
import { useProductsPageState } from './use-products-page-state';
import type { Task } from '@features/task/types/task.types';
import type { Product } from '@features/product/types/product.types';
import type { CreateTaskInput } from '@features/task/api/task-api';

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

  // Main tabs state
  const [activeMainTab, setActiveMainTab] = useState('products');

  // Create plugin client and APIs
  const client = createPluginClient({ orgId, deviceId, baseUrl, token });
  const productsApi = new ProductsAPI({ orgId, deviceId, baseUrl, token });
  const tasksApi = new TaskAPI({ orgId, deviceId, baseUrl, token });

  // Product CRUD operations (no upfront fetching - lazy loaded by tabs)
  const createProduct = useCallback(async (input: CreateProductInput) => {
    if (!collections.products) {
      throw new Error('Products collection not found - restart plugin');
    }
    await productsApi.createProduct(input);
  }, [collections.products]);

  const updateProduct = useCallback(async (productId: string, input: UpdateProductInput) => {
    await productsApi.updateProduct(productId, input);
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    await productsApi.deleteProduct(productId);
  }, []);

  // Task CRUD operations
  const updateTask = useCallback(async (taskId: string, input: UpdateTaskInput) => {
    await tasksApi.updateTask(taskId, input);
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    await tasksApi.deleteTask(taskId);
  }, []);

  // Fetch all products on mount (needed for task creation dialog)
  useEffect(() => {
    let mounted = true;

    async function fetchProducts() {
      try {
        setProductsLoading(true);

        const url = `${baseUrl}/orgs/${orgId}/devices/${deviceId}/query`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            filter: 'type is "plm.product"',
          }),
        });

        if (!response.ok) {
          console.error('[ProductsPage] Failed to fetch products:', response.statusText);
          return;
        }

        const result = await response.json();

        if (mounted) {
          const loadedProducts = Array.isArray(result) ? result : [];
          console.log('[ProductsPage] Products loaded:', loadedProducts.length);
          setAllProducts(loadedProducts);
        }
      } catch (error) {
        console.error('[ProductsPage] Failed to fetch products:', error);
      } finally {
        if (mounted) {
          setProductsLoading(false);
        }
      }
    }

    if (orgId && deviceId && baseUrl) {
      fetchProducts();
    }

    return () => {
      mounted = false;
    };
  }, [orgId, deviceId, baseUrl, token]);

  const canCreate = !!(orgId && deviceId && baseUrl && collections.products);

  console.log('[ProductsPage] Hierarchy loaded:', {
    collections,
    hierarchyLoading,
    hierarchyError,
    canCreate,
  });

  const productDisplaySettings = {
    showCode: true,
    showType: true,
    showStatus: true,
    showPrice: true,
    compactMode: false,
  };

  const taskDisplaySettings = {
    showStatus: true,
    showPriority: true,
    showProgress: true,
    compactMode: false,
  };

  // Main tabs configuration
  const mainTabs: Tab[] = [
    { value: 'products', label: 'Products', icon: Package },
    { value: 'tasks', label: 'Tasks', icon: ListChecks },
  ];

  // Product dialog states
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

  // Task dialog states
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<{ id: string; name: string } | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);

  const openCreateTaskDialog = useCallback(() => {
    console.log('[ProductsPage] Opening create task dialog, products available:', allProducts.length);
    setCreateTaskDialogOpen(true);
  }, [allProducts]);

  const closeCreateTaskDialog = useCallback(() => {
    setCreateTaskDialogOpen(false);
  }, []);

  const openEditTaskDialog = useCallback((task: Task) => {
    console.log('[ProductsPage] Opening edit task dialog:', task);
    setEditingTask(task);
  }, []);

  const closeEditTaskDialog = useCallback(() => {
    setEditingTask(null);
  }, []);

  const openDeleteTaskDialog = useCallback((taskId: string, taskName: string) => {
    console.log('[ProductsPage] Opening delete task dialog:', { taskId, taskName });
    setDeletingTask({ id: taskId, name: taskName });
  }, []);

  const closeDeleteTaskDialog = useCallback(() => {
    setDeletingTask(null);
  }, []);

  // Create task
  const createTask = useCallback(async (input: CreateTaskInput) => {
    console.log('[ProductsPage] Creating task:', input);
    await tasksApi.createTask(input);
    setTaskRefreshKey((prev) => prev + 1); // Force refresh tasks tab
  }, []);

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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Products & Tasks</h1>
            </div>
            <div className="flex gap-2 items-center">
              {activeMainTab === 'products' ? (
                <Button onClick={openCreateDialog} disabled={!canCreate}>
                  <PlusIcon size={16} />
                  Create Product
                </Button>
              ) : activeMainTab === 'tasks' ? (
                <Button onClick={openCreateTaskDialog}>
                  <PlusIcon size={16} />
                  Create Task
                </Button>
              ) : null}
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs
            tabs={mainTabs}
            value={activeMainTab}
            onValueChange={setActiveMainTab}
          />

          {/* Tab Content - Lazy loaded */}
          <div className="mt-4">
            {activeMainTab === 'products' ? (
              <ProductsListTab
                client={client}
                displaySettings={productDisplaySettings}
                onEdit={openEditDialog}
                onDelete={(productId, productName, productCode) => {
                  console.log('[ProductsPage] Delete product - ID:', productId, 'Name:', productName);
                  openDeleteDialog(productId, productName, productCode);
                }}
              />
            ) : activeMainTab === 'tasks' ? (
              <TasksListTab
                key={taskRefreshKey}
                products={allProducts}
                productsLoading={productsLoading}
                client={client}
                displaySettings={taskDisplaySettings}
                onEdit={openEditTaskDialog}
                onDelete={(taskId, taskName) => {
                  console.log('[ProductsPage] Delete task - ID:', taskId, 'Name:', taskName);
                  openDeleteTaskDialog(taskId, taskName);
                }}
              />
            ) : null}
          </div>
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

      {/* Task Create Dialog */}
      {createTaskDialogOpen && (
        <CreateTaskDialog
          products={allProducts}
          onClose={closeCreateTaskDialog}
          onCreate={async (input) => {
            await createTask(input);
            closeCreateTaskDialog();
          }}
        />
      )}

      {/* Task Edit/Delete dialogs - TODO: Implement similar to products */}
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
