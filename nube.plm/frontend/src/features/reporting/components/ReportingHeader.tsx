import { BarChart3, RefreshCw } from 'lucide-react';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { DateRangeFilter, type DateRange } from './DateRangeFilter';

interface ReportingHeaderProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onRefresh: () => void;
  onExportPDF?: () => void;
  loading: boolean;
  hasData?: boolean;
}

export function ReportingHeader({
  dateRange,
  onDateRangeChange,
  onRefresh,
  onExportPDF,
  loading,
  hasData,
}: ReportingHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reporting Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Cross-product analytics and time tracking
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <DateRangeFilter value={dateRange} onChange={onDateRangeChange} />
        {/* @ts-ignore */}
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        {onExportPDF && (
          // @ts-ignore
          <Button variant="outline" size="sm" onClick={onExportPDF} disabled={loading || !hasData}>
            <svg className="h-3.5 w-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export PDF
          </Button>
        )}
      </div>
    </div>
  );
}
