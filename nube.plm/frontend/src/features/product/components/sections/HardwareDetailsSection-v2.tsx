// @ts-ignore - SDK components
import { SettingsSection } from '@rubix-sdk/frontend/common/ui/settings-section';
// @ts-ignore - SDK icons
import { Tag } from 'lucide-react';

import type { Product } from '@features/product/types/product.types';

interface HardwareDetailsSectionProps {
  product: Product;
  isExpanded: boolean;
  onToggle: () => void;
}

export function HardwareDetailsSection({
  product,
  isExpanded,
  onToggle,
}: HardwareDetailsSectionProps) {
  if (product.settings?.category !== 'hardware') {
    return null;
  }

  const hasAnyHardwareField =
    product.settings?.sku ||
    product.settings?.manufacturer ||
    product.settings?.modelNumber ||
    product.settings?.weight;

  if (!hasAnyHardwareField) {
    return null;
  }

  return (
    <SettingsSection
      id="hardware"
      title="Hardware Details"
      description="SKU, manufacturer, and physical specifications"
      icon={Tag}
      iconBgColor="bg-orange-500"
      iconTextColor="text-white"
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {product.settings?.sku && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">SKU</label>
            <p className="mt-1 font-mono text-base">{product.settings.sku}</p>
          </div>
        )}

        {product.settings?.manufacturer && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Manufacturer</label>
            <p className="mt-1 text-base">{product.settings.manufacturer}</p>
          </div>
        )}

        {product.settings?.modelNumber && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Model Number</label>
            <p className="mt-1 font-mono text-base">{product.settings.modelNumber}</p>
          </div>
        )}

        {product.settings?.weight && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Weight</label>
            <p className="mt-1 text-base">{product.settings.weight} kg</p>
          </div>
        )}
      </div>
    </SettingsSection>
  );
}
