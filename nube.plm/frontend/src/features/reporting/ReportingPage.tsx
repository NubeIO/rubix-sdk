/**
 * Reporting Dashboard - Cross-product analytics page
 *
 * Service-level page that aggregates stats across selected products.
 * Registered in plugin.json as a page on plm.products node type.
 */

import { createRoot, type Root } from 'react-dom/client';
import { useState, useEffect, useMemo } from 'react';
import '@rubix-sdk/frontend/globals.css';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
// @ts-ignore - SDK types
import { Skeleton } from '@rubix-sdk/frontend/common/ui';

import type { Product } from '@features/product/types/product.types';
import { useProductSelector } from './hooks/useProductSelector';
import { useReportingData } from './hooks/useReportingData';
import { ReportingHeader } from './components/ReportingHeader';
import { ProductSelector } from './components/ProductSelector';
import { SummaryCards } from './sections/SummaryCards';
import { TasksReport } from './sections/TasksReport';
import { TicketsReport } from './sections/TicketsReport';
import { TimeEntriesReport } from './sections/TimeEntriesReport';
import { ManufacturingReport } from './sections/ManufacturingReport';
import type { DateRange } from './components/DateRangeFilter';
import { generateReportingPDF } from './utils/pdf-report';

interface ReportingPageProps {
  orgId: string;
  deviceId: string;
  baseUrl: string;
  token?: string;
}

function ReportingDashboard({ orgId, deviceId, baseUrl, token }: ReportingPageProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

  const client = useMemo(
    () => createPluginClient({ orgId, deviceId, baseUrl, token }),
    [orgId, deviceId, baseUrl, token]
  );

  // Fetch all products on mount
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setProductsLoading(true);
        const products = await client.queryNodes({
          filter: 'type is "plm.product"',
        }) as Product[];
        if (mounted) setAllProducts(products);
      } catch (err) {
        console.error('[ReportingPage] Failed to load products:', err);
      } finally {
        if (mounted) setProductsLoading(false);
      }
    }
    if (orgId && deviceId && baseUrl) load();
    return () => { mounted = false; };
  }, [client, orgId, deviceId, baseUrl]);

  const selector = useProductSelector(allProducts);
  const data = useReportingData(client, selector.selectedIds, dateRange);

  const hasHardware = data.products.some((p) => p.settings?.productType === 'hardware');

  const handleExportPDF = () => {
    let label = 'All time';
    if (dateRange.from) {
      const fromStr = dateRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const toStr = dateRange.to
        ? dateRange.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Present';
      label = `${fromStr} — ${toStr}`;
    }
    generateReportingPDF({
      dateRangeLabel: label,
      products: data.products,
      tasks: data.tasks,
      tickets: data.tickets,
      timeEntries: data.timeEntries,
      manufacturingRuns: data.manufacturingRuns,
      units: data.units,
      stats: data.stats,
    });
  };

  if (productsLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <ReportingHeader
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onRefresh={data.refresh}
          onExportPDF={handleExportPDF}
          loading={data.loading}
          hasData={selector.selectedIds.size > 0 && !data.loading && !data.error}
        />

        {/* Product selector */}
        <ProductSelector
          products={allProducts}
          filteredProducts={selector.filteredProducts}
          selectedIds={selector.selectedIds}
          productTypeFilter={selector.productTypeFilter}
          isAllSelected={selector.isAllSelected}
          onToggle={selector.toggleProduct}
          onSelectAll={selector.selectAll}
          onDeselectAll={selector.deselectAll}
          onTypeFilterChange={selector.setProductTypeFilter}
        />

        {selector.selectedIds.size === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              Select one or more products above to view reports.
            </p>
          </div>
        ) : data.loading ? (
          <div className="space-y-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-64" />
          </div>
        ) : data.error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <h3 className="font-semibold text-destructive mb-1">Error Loading Data</h3>
            <p className="text-sm text-destructive/90">{data.error}</p>
          </div>
        ) : (
          <>
            <SummaryCards stats={data.stats} hasHardware={hasHardware} />
            <TasksReport tasks={data.tasks} products={data.products} />
            <TicketsReport tickets={data.tickets} />
            <TimeEntriesReport entries={data.timeEntries} />
            <ManufacturingReport runs={data.manufacturingRuns} units={data.units} />
          </>
        )}
      </div>
    </div>
  );
}

// Module Federation mount/unmount API
export default {
  mount: (container: HTMLElement, props?: ReportingPageProps) => {
    console.log('[ReportingPage] mount() called');
    const root = createRoot(container);
    root.render(
      <ReportingDashboard
        orgId={props?.orgId || ''}
        deviceId={props?.deviceId || ''}
        baseUrl={props?.baseUrl || ''}
        token={props?.token}
      />
    );
    return root;
  },

  unmount: (root: Root) => {
    console.log('[ReportingPage] unmount() called');
    root.unmount();
  },
};
