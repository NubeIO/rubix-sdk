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
import { type Tab } from '../../common/ui/tabs';
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
export declare function FilteredTableWithTabs<T = Node>({ tabs, baseFilter, value: controlledValue, onValueChange: controlledOnValueChange, client, renderTable, renderEmpty, renderError, renderLoading, transformData, minLoadingDuration, className, }: FilteredTableWithTabsProps<T>): import("react/jsx-runtime").JSX.Element;
