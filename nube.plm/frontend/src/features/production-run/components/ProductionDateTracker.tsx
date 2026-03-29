import { useState } from 'react';
import { Factory } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { ManufacturingRun } from '../types';

interface ProductionDateTrackerProps {
  run: ManufacturingRun;
  onUpdate: (settings: { productionDate?: string; productionFinishDate?: string }) => Promise<void>;
  disabled?: boolean;
}

export function ProductionDateTracker({
  run,
  onUpdate,
  disabled = false,
}: ProductionDateTrackerProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const hasProductionDates = !!(run.settings?.productionDate || run.settings?.productionFinishDate);
  const isTracking = hasProductionDates;

  const handleToggle = async (enabled: boolean) => {
    if (disabled || isUpdating) return;

    try {
      setIsUpdating(true);

      if (!enabled) {
        // Disable tracking - clear dates
        await onUpdate({
          productionDate: undefined,
          productionFinishDate: undefined,
        });
      } else {
        // Enable tracking - set start date to now
        const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        await onUpdate({
          productionDate: now,
          productionFinishDate: undefined,
        });
      }
    } catch (error) {
      console.error('[ProductionDateTracker] Failed to toggle tracking:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDateChange = async (field: 'productionDate' | 'productionFinishDate', value: string) => {
    if (disabled || isUpdating) return;

    try {
      setIsUpdating(true);
      await onUpdate({
        [field]: value || undefined,
      });
    } catch (error) {
      console.error('[ProductionDateTracker] Failed to update date:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Factory className="h-4 w-4 text-slate-600" />
          <span className="text-sm font-medium">Production Tracking</span>
        </div>

        <Switch
          checked={isTracking}
          onCheckedChange={handleToggle}
          disabled={disabled || isUpdating}
        />

        {isTracking && (
          <div className="ml-auto flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="production-start-date" className="text-xs text-slate-600">
                Start Date
              </Label>
              <Input
                id="production-start-date"
                type="date"
                value={run.settings?.productionDate || ''}
                onChange={(e) => handleDateChange('productionDate', e.target.value)}
                disabled={disabled || isUpdating}
                className="h-8 w-[150px]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="production-finish-date" className="text-xs text-slate-600">
                Finish Date
              </Label>
              <Input
                id="production-finish-date"
                type="date"
                value={run.settings?.productionFinishDate || ''}
                onChange={(e) => handleDateChange('productionFinishDate', e.target.value)}
                disabled={disabled || isUpdating}
                className="h-8 w-[150px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
