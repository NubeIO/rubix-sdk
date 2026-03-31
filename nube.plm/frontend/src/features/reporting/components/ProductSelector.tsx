import { Package, Cpu, HardDrive, FolderKanban, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import type { Product } from '@features/product/types/product.types';
import type { ProductTypeFilter } from '../hooks/useProductSelector';

interface ProductSelectorProps {
  products: Product[];
  filteredProducts: Product[];
  selectedIds: Set<string>;
  productTypeFilter: ProductTypeFilter;
  isAllSelected: boolean;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onTypeFilterChange: (filter: ProductTypeFilter) => void;
}

const TYPE_FILTERS: { value: ProductTypeFilter; label: string; icon: typeof Package }[] = [
  { value: 'all', label: 'All', icon: Package },
  { value: 'software', label: 'Software', icon: Cpu },
  { value: 'hardware', label: 'Hardware', icon: HardDrive },
  { value: 'project', label: 'Projects', icon: FolderKanban },
];

export function ProductSelector({
  products,
  filteredProducts,
  selectedIds,
  productTypeFilter,
  isAllSelected,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onTypeFilterChange,
}: ProductSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Select Products</CardTitle>
          <div className="flex items-center gap-2">
            {/* @ts-ignore */}
            <Button
              variant="ghost"
              size="sm"
              onClick={isAllSelected ? onDeselectAll : onSelectAll}
            >
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </div>
        <div className="flex gap-1 mt-2">
          {TYPE_FILTERS.map((f) => {
            const Icon = f.icon;
            return (
              // @ts-ignore
              <Button
                key={f.value}
                variant={productTypeFilter === f.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTypeFilterChange(f.value)}
              >
                <Icon className="h-3.5 w-3.5 mr-1" />
                {f.label}
              </Button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent>
        {filteredProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No {productTypeFilter !== 'all' ? productTypeFilter : ''} products found
          </p>
        ) : (
          <div className="grid gap-2 max-h-[240px] overflow-y-auto">
            {filteredProducts.map((product) => {
              const selected = selectedIds.has(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onToggle(product.id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                    }`}
                  >
                    {selected && <Check className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{product.name}</div>
                    {product.settings?.productCode && (
                      <div className="text-xs text-muted-foreground">{product.settings.productCode}</div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {product.settings?.productType || 'unknown'}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-3 text-xs text-muted-foreground">
          {selectedIds.size} of {products.length} products selected
        </div>
      </CardContent>
    </Card>
  );
}
