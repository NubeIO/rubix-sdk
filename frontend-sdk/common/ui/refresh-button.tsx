/**
 * RefreshButton Component
 * Standardized icon-only refresh button with smooth animation
 *
 * Features:
 * - Icon-only design (no text)
 * - Smooth spin animation when refreshing
 * - Consistent styling across the app
 * - Accessible with title attribute
 *
 * @example
 * <RefreshButton onRefresh={handleRefresh} isRefreshing={isLoading} />
 */

import { RefreshCw } from 'lucide-react';
import * as React from 'react';

import { cn } from '../utils';

export interface RefreshButtonProps {
  /** Callback when refresh is triggered */
  onRefresh: () => void;
  /** Whether refresh is in progress */
  isRefreshing?: boolean;
  /** Additional class names */
  className?: string;
  /** Custom title for accessibility (default: "Refresh") */
  title?: string;
  /** Button size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'p-1',
  md: 'p-2',
  lg: 'p-3'
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
};

export function RefreshButton({
  onRefresh,
  isRefreshing = false,
  className,
  title = 'Refresh',
  size = 'md'
}: RefreshButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRefresh();
      }}
      disabled={isRefreshing}
      className={cn(
        'text-muted-foreground hover:text-foreground shrink-0 rounded-md transition-colors hover:bg-muted/50 disabled:opacity-50',
        sizeClasses[size],
        className
      )}
      title={title}
      type="button"
      aria-label={title}
    >
      <RefreshCw
        className={cn(iconSizeClasses[size], isRefreshing && 'animate-spin')}
      />
    </button>
  );
}
