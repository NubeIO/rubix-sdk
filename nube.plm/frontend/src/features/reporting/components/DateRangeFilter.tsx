// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

type Preset = '7d' | '30d' | '90d' | 'all';

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS: { value: Preset; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

function getPresetRange(preset: Preset): DateRange {
  if (preset === 'all') return { from: null, to: null };
  const days = parseInt(preset);
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return { from, to: null };
}

function getActivePreset(range: DateRange): Preset | null {
  if (!range.from && !range.to) return 'all';
  if (!range.from || range.to) return null;
  const now = new Date();
  const diffDays = Math.round((now.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays >= 6 && diffDays <= 8) return '7d';
  if (diffDays >= 29 && diffDays <= 31) return '30d';
  if (diffDays >= 89 && diffDays <= 91) return '90d';
  return null;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const activePreset = getActivePreset(value);

  return (
    <div className="flex items-center gap-1">
      {PRESETS.map((preset) => (
        // @ts-ignore
        <Button
          key={preset.value}
          variant={activePreset === preset.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(getPresetRange(preset.value))}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
