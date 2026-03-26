/**
 * Stat Card - Reusable card for displaying metrics
 */

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  iconBgColor?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconBgColor = 'bg-blue-500',
  trend,
}: StatCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-6">
        {/* Icon */}
        <div className="mb-4 flex items-start justify-between">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', iconBgColor)}>
            <Icon className="h-6 w-6 text-white" />
          </div>

          {trend && (
            <div
              className={cn(
                'rounded-md px-2 py-0.5 text-xs font-semibold',
                trend.positive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              )}
            >
              {trend.value}
            </div>
          )}
        </div>

        {/* Title */}
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </div>

        {/* Value */}
        <div className="mb-2 text-3xl font-bold tracking-tight">
          {value}
        </div>

        {/* Description */}
        <div className="text-xs text-muted-foreground">
          {description}
        </div>
      </CardContent>
    </Card>
  );
}
