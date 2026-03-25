// @ts-ignore - SDK components
import { SettingsSection } from '@rubix-sdk/frontend/common/ui/settings-section';
// @ts-ignore - SDK icons
import { Package } from 'lucide-react';

import type { Product } from '@features/product/types/product.types';

interface BasicInfoSectionProps {
  product: Product;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit?: () => void;
}

export function BasicInfoSection({ product, isExpanded, onToggle }: BasicInfoSectionProps) {
  return (
    <SettingsSection
      id="basic-info"
      title="Basic Information"
      description="Product name, description, and classification details"
      icon={Package}
      iconBgColor="bg-blue-500"
      iconTextColor="text-white"
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        {product.settings?.description && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <p className="mt-1 text-base text-muted-foreground">
              {product.settings.description}
            </p>
          </div>
        )}
      </div>
    </SettingsSection>
  );
}
