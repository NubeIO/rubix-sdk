/**
 * FilteredTableWithTabs - Reusable tabbed table with query filtering
 *
 * Features:
 * - Multiple tabs with independent filters
 * - Lazy loading (only active tab fetches data)
 * - Refresh button per tab
 * - Customizable table rendering
 *
 * @example
 * ```tsx
 * <FilteredTableWithTabs
 *   tabs={[
 *     { value: 'all', label: 'All', filter: '' },
 *     { value: 'software', label: 'Software', filter: 'settings.productType is "software"' },
 *   ]}
 *   baseFilter='type is "plm.product"'
 *   renderTable={(data) => <MyTable items={data} />}
 *   client={pluginClient}
 * />
 * ```
 */

import * as React from 'react';
import type { PluginClient } from '../../plugin-client';
import type { Node } from '../../ras/types';
import { Tabs, type Tab } from '../../common/ui/tabs';
import { RefreshButton } from '../../common/ui/refresh-button';
import { Skeleton } from '../../common/ui/skeleton';

export interface FilteredTab extends Tab {
  /** Query filter for this tab (combined with baseFilter using AND) */
  filter?: string;
}

export interface FilteredTableWithTabsProps<T = Node> {
  /** Tabs with optional filters */
  tabs: FilteredTab[];

  /** Base filter applied to all tabs */
  baseFilter?: string;

  /** Active tab value */
  value?: string;

  /** Tab change handler */
  onValueChange?: (value: string) => void;

  /** Plugin client for queries */
  client: PluginClient;

  /** Render function for table content */
  renderTable: (data: T[], isRefreshing: boolean) => React.ReactNode;

  /** Render function for empty state */
  renderEmpty?: () => React.ReactNode;

  /** Render function for error state */
  renderError?: (error: string) => React.ReactNode;

  /** Render function for loading state */
  renderLoading?: () => React.ReactNode;

  /** Transform node data to custom type */
  transformData?: (nodes: Node[]) => T[];

  /** Minimum loading duration (ms) for smooth UX */
  minLoadingDuration?: number;

  /** className for container */
  className?: string;
}

function defaultRenderEmpty() {
  return (
    <div className="p-12 text-center text-muted-foreground">
      No items found
    </div>
  );
}

function defaultRenderError(error: string) {
  return (
    <div className="p-6">
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <h3 className="font-semibold text-destructive mb-2">Error</h3>
        <p className="text-sm text-destructive/90">{error}</p>
      </div>
    </div>
  );
}

function defaultRenderLoading() {
  return (
    <div className="p-6 space-y-3">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export function FilteredTableWithTabs<T = Node>({
  tabs,
  baseFilter,
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  client,
  renderTable,
  renderEmpty = defaultRenderEmpty,
  renderError = defaultRenderError,
  renderLoading = defaultRenderLoading,
  transformData = (nodes) => nodes as unknown as T[],
  minLoadingDuration = 500,
  className,
}: FilteredTableWithTabsProps<T>) {
  // Tab state (controlled or uncontrolled)
  const [internalValue, setInternalValue] = React.useState(tabs[0]?.value || '');
  const activeTab = controlledValue ?? internalValue;
  const setActiveTab = controlledOnValueChange ?? setInternalValue;

  // Data state per tab
  const [dataByTab, setDataByTab] = React.useState<Record<string, T[]>>({});
  const [loadingByTab, setLoadingByTab] = React.useState<Record<string, boolean>>({});
  const [errorByTab, setErrorByTab] = React.useState<Record<string, string | null>>({});
  const [refreshingByTab, setRefreshingByTab] = React.useState<Record<string, boolean>>({});

  // Build filter for active tab
  const buildFilter = React.useCallback((tabValue: string) => {
    const tab = tabs.find((t) => t.value === tabValue);
    const filters: string[] = [];

    if (baseFilter) filters.push(baseFilter);
    if (tab?.filter) filters.push(tab.filter);

    return filters.length > 0 ? filters.join(' and ') : undefined;
  }, [tabs, baseFilter]);

  // Fetch data for a tab
  const fetchTabData = React.useCallback(async (tabValue: string, isRefresh = false) => {
    const filter = buildFilter(tabValue);

    setLoadingByTab((prev) => ({ ...prev, [tabValue]: !isRefresh }));
    setRefreshingByTab((prev) => ({ ...prev, [tabValue]: isRefresh }));
    setErrorByTab((prev) => ({ ...prev, [tabValue]: null }));

    const startTime = Date.now();

    try {
      const nodes = await client.queryNodes({ filter });
      const transformed = transformData(nodes);

      // Enforce minimum loading duration for smooth UX
      const elapsed = Date.now() - startTime;
      if (elapsed < minLoadingDuration) {
        await new Promise((resolve) => setTimeout(resolve, minLoadingDuration - elapsed));
      }

      setDataByTab((prev) => ({ ...prev, [tabValue]: transformed }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch data';
      setErrorByTab((prev) => ({ ...prev, [tabValue]: errorMsg }));
    } finally {
      setLoadingByTab((prev) => ({ ...prev, [tabValue]: false }));
      setRefreshingByTab((prev) => ({ ...prev, [tabValue]: false }));
    }
  }, [client, buildFilter, transformData, minLoadingDuration]);

  // Fetch data when active tab changes
  React.useEffect(() => {
    if (activeTab && !dataByTab[activeTab] && !loadingByTab[activeTab]) {
      fetchTabData(activeTab);
    }
  }, [activeTab, dataByTab, loadingByTab, fetchTabData]);

  // Handle refresh
  const handleRefresh = React.useCallback(() => {
    if (activeTab) {
      fetchTabData(activeTab, true);
    }
  }, [activeTab, fetchTabData]);

  // Current tab state
  const currentData = dataByTab[activeTab] || [];
  const isLoading = loadingByTab[activeTab] || false;
  const error = errorByTab[activeTab];
  const isRefreshing = refreshingByTab[activeTab] || false;

  // Calculate counts for tabs
  const tabsWithCounts = tabs.map((tab) => ({
    ...tab,
    count: dataByTab[tab.value]?.length,
  }));

  return (
    <div className={className}>
      {/* Header with Tabs and Refresh Button */}
      <div className="flex items-center justify-between mb-4">
        <Tabs
          tabs={tabsWithCounts}
          value={activeTab}
          onValueChange={setActiveTab}
        />
        <RefreshButton
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      </div>

      {/* Content */}
      <div>
        {isLoading && !isRefreshing && renderLoading()}
        {error && renderError(error)}
        {!isLoading && !error && currentData.length === 0 && renderEmpty()}
        {!isLoading && !error && currentData.length > 0 && renderTable(currentData, isRefreshing)}
      </div>
    </div>
  );
}
