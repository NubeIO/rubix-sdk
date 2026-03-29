import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import type {
  ManufacturingRun,
  ManufacturingRunSettings,
} from '../types';

interface UseProductionRunsConfig {
  orgId: string;
  deviceId: string;
  productId: string;
  baseUrl?: string;
  token?: string;
}

interface CreateManufacturingRunInput {
  name: string;
  settings: ManufacturingRunSettings;
}

interface UpdateManufacturingRunInput {
  id: string;
  name?: string;
  settings?: Partial<ManufacturingRunSettings>;
}

export function useProductionRuns(config: UseProductionRunsConfig) {
  const [runs, setRuns] = useState<ManufacturingRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(() => createPluginClient({
    orgId: config.orgId,
    deviceId: config.deviceId,
    baseUrl: config.baseUrl,
    token: config.token,
  }), [config.baseUrl, config.deviceId, config.orgId, config.token]);

  const fetchRuns = useCallback(async () => {
    if (!config.productId) {
      setRuns([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await client.queryNodes({
        filter: `type is "plm.manufacturing-run" and parent.id is "${config.productId}"`,
      });
      setRuns(result as ManufacturingRun[]);
      setError(null);
    } catch (fetchError) {
      console.error('[useProductionRuns] Failed to fetch runs:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch manufacturing runs');
    } finally {
      setLoading(false);
    }
  }, [client, config.productId]);

  const createRun = useCallback(async (input: CreateManufacturingRunInput) => {
    await client.createNode(config.productId, {
      type: 'plm.manufacturing-run',
      name: input.name,
      settings: input.settings,
    });

    await fetchRuns();
  }, [client, config.productId, fetchRuns]);

  const updateRun = useCallback(async (input: UpdateManufacturingRunInput) => {
    if (input.name) {
      await client.updateNode(input.id, { name: input.name });
    }

    if (input.settings && Object.keys(input.settings).length > 0) {
      await client.updateNodeSettings(input.id, input.settings);
    }

    await fetchRuns();
  }, [client, fetchRuns]);

  const deleteRun = useCallback(async (runId: string) => {
    await client.deleteNode(runId);
    await fetchRuns();
  }, [client, fetchRuns]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  return {
    runs,
    loading,
    error,
    createRun,
    updateRun,
    deleteRun,
    refetch: fetchRuns,
  };
}
