/**
 * Tabs Component - Pill-style tabs for consistent navigation
 *
 * Based on Rubix UX guidelines for tabs
 * See: docs/system/v1/ux/TABS.md
 */

import * as React from 'react';
import { cn } from '../utils';

export interface Tab {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

export interface TabsProps {
  tabs: Tab[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onValueChange, className }: TabsProps) {
  return (
    <div className={cn('inline-flex h-auto p-1 bg-muted/50 rounded-md', className)}>
      {tabs.map((tab) => {
        const isActive = value === tab.value;
        const Icon = tab.icon;

        return (
          <button
            key={tab.value}
            onClick={() => onValueChange(tab.value)}
            className={cn(
              'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-sm transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 text-muted-foreground">
                ({tab.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
