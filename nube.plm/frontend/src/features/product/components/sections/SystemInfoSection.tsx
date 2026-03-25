import { useState } from 'react';

// @ts-ignore - SDK components
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@rubix-sdk/frontend/common/ui/collapsible';
// @ts-ignore - SDK icons
import { ChevronDown, Info } from 'lucide-react';

import type { Product } from '@features/product/types/product.types';

interface SystemInfoSectionProps {
  product: Product;
  defaultOpen?: boolean;
}

export function SystemInfoSection({ product, defaultOpen = false }: SystemInfoSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 border-b px-6 py-3 hover:bg-muted/50">
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
        <Info className="h-4 w-4" />
        <span className="font-semibold">System Information</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-b px-6 py-4">
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
      </CollapsibleContent>
    </Collapsible>
  );
}
