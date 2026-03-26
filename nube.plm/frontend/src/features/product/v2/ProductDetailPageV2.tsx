/**
 * Product Detail Page V2 - Modern Workspace UI
 *
 * Features:
 * - Fixed header with product info and actions
 * - Fixed sidebar navigation (right side)
 * - Main content area with section-based views
 * - Real API integration using plugin-client SDK
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Product } from '../types/product.types';
import { Skeleton } from '@/components/ui/skeleton';

// Components
import { ProductHeader } from './components/ProductHeader';
import { SidebarNavigation } from './components/SidebarNavigation';

// Sections - Lazy loaded for better performance
import { OverviewSection } from './sections/OverviewSection';
const BasicInfoSection = lazy(() => import('./sections/BasicInfoSection').then(m => ({ default: m.BasicInfoSection })));
const PricingSection = lazy(() => import('./sections/PricingSection').then(m => ({ default: m.PricingSection })));
const BOMSectionV2 = lazy(() => import('./sections/BOMSectionV2').then(m => ({ default: m.BOMSectionV2 })));
const TasksSectionV2 = lazy(() => import('./sections/TasksSectionV2').then(m => ({ default: m.TasksSectionV2 })));
const SystemInfoSection = lazy(() => import('./sections/SystemInfoSection').then(m => ({ default: m.SystemInfoSection })));

export type SectionId = 'overview' | 'basic-info' | 'pricing' | 'bom' | 'tasks' | 'system-info';

// Loading fallback for lazy sections
function SectionLoadingFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

interface ProductDetailPageV2Props {
  product: Product;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  onProductUpdated?: (product: Product) => void;
}

export function ProductDetailPageV2({
  product: initialProduct,
  orgId,
  deviceId,
  baseUrl = '/api/v1',
  token,
  onProductUpdated,
}: ProductDetailPageV2Props) {
  const [product, setProduct] = useState<Product>(initialProduct);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create plugin client
  const client = createPluginClient({ orgId, deviceId, baseUrl, token });

  // Stats state
  const [stats, setStats] = useState({
    totalTasks: 0,
    tasksCompletedThisWeek: 0,
    bomItemsCount: 0,
    bomItemsPending: 0,
    totalCost: 0,
    lastActivity: product.updatedAt || new Date().toISOString(),
    health: 98.2,
    latency: 24,
  });

  // Refresh product data
  const refreshProduct = async () => {
    try {
      setIsLoading(true);
      const updated = await client.getNode(product.id);
      setProduct(updated as Product);
      onProductUpdated?.(updated as Product);
    } catch (err) {
      console.error('[ProductDetailPageV2] Failed to refresh product:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh product');
    } finally {
      setIsLoading(false);
    }
  };

  // Update product
  const updateProduct = async (updates: { name?: string; settings?: Record<string, any> }) => {
    try {
      setIsLoading(true);
      const updated = await client.updateNode(product.id, updates);
      setProduct(updated as Product);
      onProductUpdated?.(updated as Product);
    } catch (err) {
      console.error('[ProductDetailPageV2] Failed to update product:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats (will be updated by child components)
  const updateStats = (newStats: Partial<typeof stats>) => {
    setStats(prev => ({ ...prev, ...newStats }));
  };

  // Render active section
  const renderSection = () => {
    const commonProps = {
      product,
      orgId,
      deviceId,
      baseUrl,
      token,
      client,
      onProductUpdate: updateProduct,
      onRefresh: refreshProduct,
    };

    switch (activeSection) {
      case 'overview':
        return <OverviewSection {...commonProps} stats={stats} onStatsUpdate={updateStats} />;
      case 'basic-info':
        return <BasicInfoSection {...commonProps} />;
      case 'pricing':
        return <PricingSection {...commonProps} />;
      case 'bom':
        return <BOMSectionV2 {...commonProps} onStatsUpdate={updateStats} />;
      case 'tasks':
        return <TasksSectionV2 {...commonProps} onStatsUpdate={updateStats} />;
      case 'system-info':
        return <SystemInfoSection {...commonProps} />;
      default:
        return <OverviewSection {...commonProps} stats={stats} onStatsUpdate={updateStats} />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header - Fixed at top */}
      <ProductHeader
        product={product}
        onEdit={() => {/* TODO: Open edit dialog */}}
        onRelease={() => {/* TODO: Open release dialog */}}
        isLoading={isLoading}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Main content (scrollable) */}
        <div className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-6xl">
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            <Suspense fallback={<SectionLoadingFallback />}>
              {renderSection()}
            </Suspense>
          </div>
        </div>

        {/* Right: Sidebar navigation (fixed) */}
        <SidebarNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          stats={stats}
        />
      </div>
    </div>
  );
}
