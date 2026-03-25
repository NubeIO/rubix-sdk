import { useState } from 'react';

// @ts-ignore - SDK components
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@rubix-sdk/frontend/common/ui/collapsible';
// @ts-ignore - SDK icons
import { ChevronDown, Activity } from 'lucide-react';

import type { Product } from '@features/product/types/product.types';

interface SoftwareDetailsSectionProps {
  product: Product;
  defaultOpen?: boolean;
}

export function SoftwareDetailsSection({
  product,
  defaultOpen = true,
}: SoftwareDetailsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

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
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 border-b px-6 py-3 hover:bg-muted/50">
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
        <Activity className="h-4 w-4" />
        <span className="font-semibold">Software Details</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-b px-6 py-4">
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
      </CollapsibleContent>
    </Collapsible>
  );
}
