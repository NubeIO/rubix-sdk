import { Button } from '@/ui/button';
// @ts-ignore - SDK types are resolved at build time
import { RefreshButton, Skeleton } from '@rubix-sdk/frontend/common/ui';

import type { Product } from '../common/types';
import { ProductTable, type ProductTableDisplaySettings } from '../components/product-table';
import { PlusIcon } from '../../shared/components/icons';

interface ProductsPageContentProps {
  products: Product[];
  loading: boolean;
  error?: string;
  canCreate: boolean;
  isRefreshing: boolean;
  displaySettings: ProductTableDisplaySettings;
  onRefresh: () => Promise<void>;
  onCreate: () => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string, productName: string, productCode?: string) => void;
}

function ProductsPageLoadingState() {
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

function ProductsPageErrorState({ error }: { error: string }) {
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

function ProductsPageHeader({
  productsCount,
  canCreate,
  isRefreshing,
  onRefresh,
  onCreate,
}: {
  productsCount: number;
  canCreate: boolean;
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  onCreate: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        {productsCount > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {productsCount} product{productsCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      {productsCount > 0 && (
        <div className="flex gap-2 items-center">
          <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} />
          <Button onClick={onCreate} disabled={!canCreate}>
            <PlusIcon size={16} />
            Create Product
          </Button>
        </div>
      )}
    </div>
  );
}

function ProductsPageEmptyState({
  canCreate,
  isRefreshing,
  onRefresh,
  onCreate,
}: {
  canCreate: boolean;
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  onCreate: () => void;
}) {
  return (
    <div className="border rounded-lg p-12 text-center">
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-2">No products yet</h3>
        <p className="text-muted-foreground mb-6">
          Get started by creating your first product
        </p>
        <div className="flex gap-2 justify-center">
          <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} />
          <Button onClick={onCreate} disabled={!canCreate}>
            <PlusIcon size={16} />
            Create Product
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProductsPageContent({
  products,
  loading,
  error,
  canCreate,
  isRefreshing,
  displaySettings,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
}: ProductsPageContentProps) {
  if (loading) {
    return <ProductsPageLoadingState />;
  }

  if (error) {
    return <ProductsPageErrorState error={error} />;
  }

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-7xl mx-auto">
        <ProductsPageHeader
          productsCount={products.length}
          canCreate={canCreate}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          onCreate={onCreate}
        />

        {products.length === 0 ? (
          <ProductsPageEmptyState
            canCreate={canCreate}
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
            onCreate={onCreate}
          />
        ) : (
          <div className="border rounded-lg">
            <ProductTable
              products={products}
              displaySettings={displaySettings}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
}
