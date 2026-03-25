import { useState } from 'react';

// @ts-ignore - SDK components
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@rubix-sdk/frontend/common/ui/collapsible';
// @ts-ignore - SDK icons
import { ChevronDown, Package } from 'lucide-react';

import type { Product } from '@features/product/types/product.types';
import { ProductStatusBadge } from '@features/product/components/ProductStatusBadge';

interface BasicInfoSectionProps {
  product: Product;
  defaultOpen?: boolean;
}

export function BasicInfoSection({ product, defaultOpen = true }: BasicInfoSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 border-b px-6 py-3 hover:bg-muted/50">
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
        <Package className="h-4 w-4" />
        <span className="font-semibold">Basic Information</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-b px-6 py-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Product Name</label>
            <p className="mt-1 text-base">{product.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Product Code</label>
            <p className="mt-1 font-mono text-base">
              {product.settings?.productCode || '—'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Category</label>
            <p className="mt-1 text-base capitalize">
              {product.settings?.category || '—'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <div className="mt-1">
              <ProductStatusBadge status={product.settings?.status} />
            </div>
          </div>

          {product.settings?.description && (
            <div className="col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="mt-1 text-base text-muted-foreground">
                {product.settings.description}
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
