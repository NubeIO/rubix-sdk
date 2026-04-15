import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { computeGateProgress, deriveCurrentGate } from '@shared/utils/gate-helpers';
import type { ProductSummary } from '../types/program.types';

export interface UseProgramDashboardConfig {
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
}

export function useProgramDashboard(config: UseProgramDashboardConfig) {
  const [products, setProducts] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = createPluginClient({
    orgId: config.orgId,
    deviceId: config.deviceId,
    baseUrl: config.baseUrl,
    token: config.token,
  });

  const fetchData = useCallback(async () => {
    if (!config.orgId || !config.deviceId) return;

    try {
      const [productsResult, tasksResult] = await Promise.all([
        client.queryNodes({ filter: `type is "plm.product"` }),
        client.queryNodes({ filter: `type is "plm.task"` }),
      ]);

      setProducts(Array.isArray(productsResult) ? productsResult : productsResult.nodes || []);
      setAllTasks(Array.isArray(tasksResult) ? tasksResult : tasksResult.nodes || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch program data');
      console.error('[useProgramDashboard] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [config.orgId, config.deviceId, config.baseUrl, config.token]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const intervalId = setInterval(fetchData, 30_000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  // Compute per-product gate progress
  const productData: ProductSummary[] = useMemo(() => {
    return products.map(product => {
      const productTasks = allTasks.filter((t: any) => t.parentId === product.id);
      const manualOverride = product.settings?.currentGate;
      const currentGate = deriveCurrentGate(productTasks, manualOverride);
      const gateProgress = computeGateProgress(productTasks, manualOverride);
      const overallProgress = productTasks.length > 0
        ? Math.round(productTasks.reduce((s: number, t: any) => s + (t.settings?.progress || 0), 0) / productTasks.length)
        : 0;

      return { product, tasks: productTasks, gateProgress, currentGate, overallProgress };
    });
  }, [products, allTasks]);

  return { productData, isLoading, error, refetch: fetchData };
}
