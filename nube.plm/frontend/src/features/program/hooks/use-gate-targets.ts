import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { GateId } from '@shared/constants/gates';

/** Read gate target dates from product settings */
export function parseGateTargets(product: any): Record<GateId, string> | null {
  const raw = product?.settings?.gateTargets;
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

/** Save gate target dates to product settings */
export async function saveGateTargets(
  client: ReturnType<typeof createPluginClient>,
  productId: string,
  targets: Record<GateId, string>
) {
  await client.updateNodeSettings(productId, {
    gateTargets: JSON.stringify(targets),
  });
}

/** Save current gate on product */
export async function saveCurrentGate(
  client: ReturnType<typeof createPluginClient>,
  productId: string,
  gateId: GateId
) {
  await client.updateNodeSettings(productId, {
    currentGate: gateId,
  });
}
