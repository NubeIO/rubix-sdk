import { ChevronDown, ChevronRight, type LucideIcon, RefreshCw } from 'lucide-react';
import * as React from 'react';
import { cn } from '../utils/utils';

interface SettingsSectionProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconTextColor?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badgeCount?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function SettingsSection({
  id,
  title,
  description,
  icon: Icon,
  iconBgColor = 'bg-primary',
  iconTextColor = 'text-primary-foreground',
  isExpanded,
  onToggle,
  children,
  badgeCount,
  onRefresh,
  isRefreshing
}: SettingsSectionProps) {
  return (
    <div className="group rounded-lg border bg-card transition-all hover:border-primary/50 hover:shadow-sm">
      <div className="flex w-full items-start gap-4 p-4">
        <button
          onClick={onToggle}
          className="flex flex-1 items-start gap-4 text-left transition-colors hover:bg-muted/30 -m-4 p-4 rounded-lg"
          aria-expanded={isExpanded}
          aria-controls={`section-${id}`}
        >
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-105',
              iconBgColor,
              iconTextColor
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{title}</h3>
              {badgeCount !== undefined && badgeCount > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                  {badgeCount}
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
              {description}
            </p>
          </div>

          <div className="text-muted-foreground shrink-0 pt-1 transition-transform">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </button>

        {onRefresh && isExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            disabled={isRefreshing}
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-2 transition-colors hover:bg-muted/50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </button>
        )}
      </div>

      {isExpanded && (
        <div
          id={`section-${id}`}
          className="animate-in slide-in-from-top-2 border-t px-4 pb-4 pt-3"
        >
          {children}
        </div>
      )}
    </div>
  );
}
