/**
 * Product Detail View - Main component with tabs
 * Shows Overview, BOM, and other tabs based on product type
 */

import { useState } from 'react';

// @ts-ignore - SDK icons
import { Package, ListTree } from 'lucide-react';

import type { Product } from '../common/types';
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Determine which tabs to show based on product category
  const isHardware = product.settings?.category === 'hardware';
  const isSoftware = product.settings?.category === 'software';

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
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

      {/* Tab Navigation */}
      <div className="border-b px-6">
        <div className="flex gap-1">
          <button
            onClick={() => handleTabChange('overview')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="h-4 w-4" />
            Overview
          </button>

          {isHardware && (
            <button
              onClick={() => handleTabChange('bom')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'bom'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListTree className="h-4 w-4" />
              BOM
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'overview' && (
          <ProductOverviewTab
            product={product}
            orgId={orgId}
            deviceId={deviceId}
            baseUrl={baseUrl}
            token={token}
            onProductUpdated={onProductUpdated}
          />
        )}

        {activeTab === 'bom' && isHardware && (
          <ProductBOMTab
            product={product}
            orgId={orgId}
            deviceId={deviceId}
            baseUrl={baseUrl}
            token={token}
          />
        )}
      </div>
    </div>
  );
}
