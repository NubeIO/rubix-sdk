/**
 * Product Detail View - Main component with tabs
 * Shows Overview, BOM, and other tabs based on product type
 * Matches Rubix frontend tab style
 */

import { useMemo, useState } from 'react';

// @ts-ignore - SDK components
import { Tabs } from '@rubix-sdk/frontend/common/ui';
// @ts-ignore - SDK icons
import { Package, ListTree } from 'lucide-react';

import type { Product } from '@features/product/types/product.types';
import { ProductOverviewTab } from './product-overview-tab';
import { ProductBOMTab } from './product-bom-tab';

interface ProductDetailViewProps {
  product: Product;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  onProductUpdated?: (product: Product) => void;
}

export function ProductDetailView({
  product,
  orgId,
  deviceId,
  baseUrl,
  token,
  onProductUpdated,
}: ProductDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Determine which tabs to show based on product category
  const isHardware = product.settings?.category === 'hardware';

  // Build tabs array
  const tabs = useMemo(() => {
    const baseTabs = [
      {
        value: 'overview',
        label: 'Overview',
        icon: Package,
      },
    ];

    if (isHardware) {
      baseTabs.push({
        value: 'bom',
        label: 'BOM',
        icon: ListTree,
      });
    }

    return baseTabs;
  }, [isHardware]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{product.name}</h2>
        </div>
        {product.settings?.productCode && (
          <p className="mt-1 text-sm text-muted-foreground">
            Product Code: {product.settings.productCode}
          </p>
        )}
      </div>

      {/* Tab bar - matches Rubix frontend style */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <Tabs tabs={tabs} value={activeTab} onValueChange={setActiveTab} />
      </div>

      {/* Tab content - scrollable */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'overview' && (
          <div className="h-full overflow-auto p-4">
            <ProductOverviewTab
              product={product}
              orgId={orgId}
              deviceId={deviceId}
              baseUrl={baseUrl}
              token={token}
              onProductUpdated={onProductUpdated}
            />
          </div>
        )}

        {activeTab === 'bom' && isHardware && (
          <div className="h-full overflow-auto p-4">
            <ProductBOMTab
              product={product}
              orgId={orgId}
              deviceId={deviceId}
              baseUrl={baseUrl}
              token={token}
            />
          </div>
        )}
      </div>
    </div>
  );
}
