// @ts-ignore - SDK components
import { SettingsSection } from '@rubix-sdk/frontend/common/ui/settings-section';
// @ts-ignore - SDK icons
import { Activity } from 'lucide-react';

import type { Product } from '@features/product/types/product.types';

interface SoftwareDetailsSectionProps {
  product: Product;
  isExpanded: boolean;
  onToggle: () => void;
}

export function SoftwareDetailsSection({
  product,
  isExpanded,
  onToggle,
}: SoftwareDetailsSectionProps) {
  if (product.settings?.category !== 'software') {
    return null;
  }

  const hasAnySoftwareField =
    product.settings?.version ||
    product.settings?.licenseType ||
    product.settings?.platform;

  if (!hasAnySoftwareField) {
    return null;
  }

  return (
    <SettingsSection
      id="software"
      title="Software Details"
      description="Version, license, and platform information"
      icon={Activity}
      iconBgColor="bg-purple-500"
      iconTextColor="text-white"
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {product.settings?.version && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Version</label>
            <p className="mt-1 font-mono text-base">{product.settings.version}</p>
          </div>
        )}

        {product.settings?.licenseType && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">License Type</label>
            <p className="mt-1 text-base capitalize">{product.settings.licenseType}</p>
          </div>
        )}

        {product.settings?.platform && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Platform</label>
            <p className="mt-1 text-base">{product.settings.platform}</p>
          </div>
        )}
      </div>
    </SettingsSection>
  );
}
