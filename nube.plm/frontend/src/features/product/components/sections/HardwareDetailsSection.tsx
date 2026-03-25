import { useState } from 'react';

// @ts-ignore - SDK components
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@rubix-sdk/frontend/common/ui/collapsible';
// @ts-ignore - SDK icons
import { ChevronDown, Tag } from 'lucide-react';

import type { Product } from '@features/product/types/product.types';

interface HardwareDetailsSectionProps {
  product: Product;
  defaultOpen?: boolean;
}

export function HardwareDetailsSection({
  product,
  defaultOpen = true,
}: HardwareDetailsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

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
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 border-b px-6 py-3 hover:bg-muted/50">
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
        <Tag className="h-4 w-4" />
        <span className="font-semibold">Hardware Details</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-b px-6 py-4">
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
      </CollapsibleContent>
    </Collapsible>
  );
}
