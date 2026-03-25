import { useState } from 'react';

// @ts-ignore - SDK components
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@rubix-sdk/frontend/common/ui/collapsible';
// @ts-ignore - SDK icons
import { ChevronDown, DollarSign } from 'lucide-react';

import type { Product } from '@features/product/types/product.types';

interface PricingSectionProps {
  product: Product;
  bomCost?: number;
  bomComponentCount?: number;
  defaultOpen?: boolean;
}

export function PricingSection({
  product,
  bomCost,
  bomComponentCount,
  defaultOpen = true,
}: PricingSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 border-b px-6 py-3 hover:bg-muted/50">
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
        <DollarSign className="h-4 w-4" />
        <span className="font-semibold">Pricing</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-b px-6 py-4">
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
      </CollapsibleContent>
    </Collapsible>
  );
}
