import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import type {
  ManufacturingRun,
  ManufacturingUnit,
  ManufacturingUnitSettings,
} from '../types';

interface UseProductionRunConfig {
  orgId: string;
  deviceId: string;
  runId: string | null;
  baseUrl?: string;
  token?: string;
}

interface CreateUnitInput {
  name: string;
  settings: ManufacturingUnitSettings;
}

interface UpdateUnitInput {
  id: string;
  name?: string;
  settings?: Partial<ManufacturingUnitSettings>;
}

export function useProductionRun(config: UseProductionRunConfig) {
  const [run, setRun] = useState<ManufacturingRun | null>(null);
  const [units, setUnits] = useState<ManufacturingUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(() => createPluginClient({
    orgId: config.orgId,
    deviceId: config.deviceId,
    baseUrl: config.baseUrl,
    token: config.token,
  }), [config.baseUrl, config.deviceId, config.orgId, config.token]);

  const fetchRun = useCallback(async () => {
    if (!config.runId) {
      setRun(null);
      setUnits([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [runNode, unitNodes] = await Promise.all([
        client.getNode(config.runId),
        client.queryNodes({
          filter: `type is "core.asset" and parent.id is "${config.runId}"`,
        }),
      ]);

      setRun(runNode as ManufacturingRun);
      setUnits(unitNodes as ManufacturingUnit[]);
      setError(null);
    } catch (fetchError) {
      console.error('[useProductionRun] Failed to fetch run:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch run details');
    } finally {
      setLoading(false);
    }
  }, [client, config.runId]);

  const createUnit = useCallback(async (input: CreateUnitInput) => {
    if (!config.runId || !run) {
      throw new Error('Select a manufacturing run before adding units');
    }

    await client.createNode(config.runId, {
      type: 'core.asset',
      name: input.name,
      settings: {
        ...input.settings,
        hardwareRevision: input.settings.hardwareRevision || run.settings?.hardwareVersion,
        productionRunNumber: run.settings?.runNumber,
      },
    });

    await fetchRun();
  }, [client, config.runId, fetchRun, run]);

  const updateUnit = useCallback(async (input: UpdateUnitInput) => {
    if (input.name) {
      await client.updateNode(input.id, { name: input.name });
    }

    if (input.settings && Object.keys(input.settings).length > 0) {
      await client.updateNodeSettings(input.id, input.settings);
    }

    await fetchRun();
  }, [client, fetchRun]);

  const deleteUnit = useCallback(async (unitId: string) => {
    await client.deleteNode(unitId);
    await fetchRun();
  }, [client, fetchRun]);

  useEffect(() => {
    fetchRun();
  }, [fetchRun]);

  return {
    run,
    units,
    loading,
    error,
    createUnit,
    updateUnit,
    deleteUnit,
    refetch: fetchRun,
  };
}
