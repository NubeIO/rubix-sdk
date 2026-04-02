import { getWeekStart } from '../hooks/useTimesheetData';

// @ts-ignore - SDK types
import { Button } from '@rubix-sdk/frontend/common/ui';

interface WeekNavigatorProps {
  weekStart: Date;
  onWeekChange: (weekStart: Date) => void;
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = weekStart.toLocaleDateString('en-US', opts);
  const endStr = weekEnd.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `Week of ${startStr} - ${endStr}`;
}

export function WeekNavigator({ weekStart, onWeekChange }: WeekNavigatorProps) {
  const goToPrev = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    onWeekChange(d);
  };

  const goToNext = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    onWeekChange(d);
  };

  const goToThisWeek = () => {
    onWeekChange(getWeekStart(new Date()));
  };

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm" onClick={goToPrev}>
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </Button>
      <Button variant="outline" size="sm" onClick={goToThisWeek}>
        This Week
      </Button>
      <Button variant="outline" size="sm" onClick={goToNext}>
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </Button>
      <span className="text-sm font-medium text-muted-foreground">
        {formatWeekLabel(weekStart)}
      </span>
    </div>
  );
}
