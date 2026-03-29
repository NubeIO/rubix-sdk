/**
 * Reusable Task Filters Component
 * Used by both TasksDataTable and TasksGanttView
 */

import { Filter, X, Search, Table2, CalendarRange } from 'lucide-react';
// @ts-ignore - SDK types are resolved at build time
import { Button } from '@rubix-sdk/frontend/common/ui';
import { Input } from '@/components/ui/input';
import type { Product } from '@features/product/types/product.types';

export interface TaskFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  productFilter: string;
  onProductFilterChange: (productId: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  products: Product[];
  showSearch?: boolean;
  resultCount?: number;
  totalCount?: number;
  view?: 'table' | 'gantt';
  onViewChange?: (view: 'table' | 'gantt') => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function TaskFilters({
  statusFilter,
  onStatusFilterChange,
  productFilter,
  onProductFilterChange,
  searchQuery,
  onSearchQueryChange,
  products,
  showSearch = false,
  resultCount,
  totalCount,
  view,
  onViewChange,
}: TaskFiltersProps) {
  const hasActiveFilters = statusFilter !== 'all' || productFilter !== 'all';

  const clearFilters = () => {
    onStatusFilterChange('all');
    onProductFilterChange('all');
  };

  return (
    <div className="space-y-3">
      {/* Search and Count */}
      {showSearch && onSearchQueryChange && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery ?? ''}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-9"
            />
          </div>
          {resultCount !== undefined && totalCount !== undefined && (
            <div className="text-sm text-muted-foreground">
              {resultCount} of {totalCount} task(s)
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View Toggle */}
        {view && onViewChange && (
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 mr-2">
            <Button
              variant={view === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('table')}
              className="h-7 px-2"
            >
              <Table2 className="h-4 w-4" />
              <span className="ml-1.5">Table</span>
            </Button>
            <Button
              variant={view === 'gantt' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('gantt')}
              className="h-7 px-2"
            >
              <CalendarRange className="h-4 w-4" />
              <span className="ml-1.5">Gantt</span>
            </Button>
          </div>
        )}

        <Filter className="h-4 w-4 text-muted-foreground" />

        {/* Status Filter Chips */}
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={statusFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusFilterChange(option.value)}
              className="h-7"
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Product Filter Dropdown */}
        <select
          value={productFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onProductFilterChange(e.target.value)}
          className="h-7 px-3 text-sm border rounded-md bg-background"
        >
          <option value="all">All Products</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
