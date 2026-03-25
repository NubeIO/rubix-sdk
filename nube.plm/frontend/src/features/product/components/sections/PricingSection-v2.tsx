// @ts-ignore - SDK components
import { SettingsSection } from '@rubix-sdk/frontend/common/ui/settings-section';
// @ts-ignore - SDK icons
import { DollarSign } from 'lucide-react';

import type { Product } from '@features/product/types/product.types';

interface PricingSectionProps {
  product: Product;
  bomCost?: number;
  bomComponentCount?: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function PricingSection({
  product,
  bomCost,
  bomComponentCount,
  isExpanded,
  onToggle,
}: PricingSectionProps) {
  return (
    <SettingsSection
      id="pricing"
      title="Pricing"
      description="Product pricing and cost breakdown"
      icon={DollarSign}
      iconBgColor="bg-green-500"
      iconTextColor="text-white"
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Price</label>
          <p className="mt-1 text-2xl font-semibold">
            {product.settings?.price
              ? `$${Number(product.settings.price).toFixed(2)}`
              : '—'}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Currency</label>
          <p className="mt-1 text-base">{product.settings?.currency || 'USD'}</p>
        </div>

        {bomCost !== undefined && bomCost > 0 && (
          <div className="col-span-2">
            <label className="text-sm font-medium text-muted-foreground">
              BOM Cost (Calculated)
            </label>
            <p className="mt-1 text-lg font-semibold">${bomCost.toFixed(2)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Based on {bomComponentCount || 0} component{bomComponentCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </SettingsSection>
  );
}
