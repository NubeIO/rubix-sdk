/**
 * ProductTypeTabs - Tabbed interface for filtering products by type
 *
 * Tabs:
 * - All: Shows all products
 * - Software: Filters to settings.productType is "software"
 * - Hardware: Filters to settings.productType is "hardware"
 */

import { Package, Cpu, HardDrive, FolderKanban } from 'lucide-react';
// @ts-ignore - SDK types are resolved at build time
import { FilteredTableWithTabs, type FilteredTab } from '@rubix-sdk/frontend/components';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';

import type { Product } from '@features/product/types/product.types';
import { ProductTable, type ProductTableDisplaySettings } from '@features/product/components/ProductTable';

const TABS: FilteredTab[] = [
  {
    value: 'all',
    label: 'All',
    icon: Package,
    filter: undefined, // No filter - show all
  },
  {
    value: 'software',
    label: 'Software',
    icon: Cpu,
    filter: 'settings.productType is "software"',
  },
  {
    value: 'hardware',
    label: 'Hardware',
    icon: HardDrive,
    filter: 'settings.productType is "hardware"',
  },
  {
    value: 'project',
    label: 'Projects',
    icon: FolderKanban,
    filter: 'settings.productType is "project"',
  },
];

interface ProductsPageTabsProps {
  client: PluginClient;
  displaySettings: ProductTableDisplaySettings;
  onEdit: (product: Product) => void;
  onDelete: (productId: string, productName: string, productCode?: string) => void;
}

export function ProductsPageTabs({
  client,
  displaySettings,
  onEdit,
  onDelete,
}: ProductsPageTabsProps) {
  return (
    <FilteredTableWithTabs<Product>
      tabs={TABS}
      baseFilter='type is "plm.product"'
      client={client}
      renderTable={(products, isRefreshing) => (
        <div className={isRefreshing ? 'opacity-50 pointer-events-none' : ''}>
          <div className="border rounded-lg">
            <ProductTable
              products={products}
              displaySettings={displaySettings}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      )}
      renderEmpty={() => (
        <div className="border rounded-lg p-12 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">
              No products match the current filter
            </p>
          </div>
        </div>
      )}
    />
  );
}
