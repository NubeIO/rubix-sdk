// @ts-ignore - SDK components
import { SettingsSection } from '@rubix-sdk/frontend/common/ui/settings-section';
// @ts-ignore - SDK icons
import { Info } from 'lucide-react';

import type { Product } from '@features/product/types/product.types';

interface SystemInfoSectionProps {
  product: Product;
  isExpanded: boolean;
  onToggle: () => void;
}

export function SystemInfoSection({ product, isExpanded, onToggle }: SystemInfoSectionProps) {
  return (
    <SettingsSection
      id="system"
      title="System Information"
      description="Node metadata and timestamps"
      icon={Info}
      iconBgColor="bg-gray-500"
      iconTextColor="text-white"
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Node ID</label>
          <p className="mt-1 font-mono text-sm">{product.id}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Node Type</label>
          <p className="mt-1 font-mono text-sm">{product.type}</p>
        </div>

        {product.createdAt && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Created</label>
            <p className="mt-1 text-sm">
              {new Date(product.createdAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {product.updatedAt && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Modified</label>
            <p className="mt-1 text-sm">
              {new Date(product.updatedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </SettingsSection>
  );
}
