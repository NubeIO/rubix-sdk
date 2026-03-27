/**
 * ProductsListTab - Extracted products view for tab container
 *
 * Shows products table with filtering (All, Software, Hardware)
 */

import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Product } from '@features/product/types/product.types';
import type { ProductTableDisplaySettings } from '@features/product/components/ProductTable';
import { ProductsPageTabs } from './products-page-tabs';

interface ProductsListTabProps {
  client: PluginClient;
  displaySettings: ProductTableDisplaySettings;
  onEdit: (product: Product) => void;
  onDelete: (productId: string, productName: string, productCode?: string) => void;
}

export function ProductsListTab({
  client,
  displaySettings,
  onEdit,
  onDelete,
}: ProductsListTabProps) {
  return (
    <ProductsPageTabs
      client={client}
      displaySettings={displaySettings}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
