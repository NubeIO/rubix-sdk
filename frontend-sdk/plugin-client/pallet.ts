import type { PluginClient, PalletDetailsResponse } from './index';

export async function getPalletDetails(
  client: PluginClient,
  nodeType: string
): Promise<PalletDetailsResponse> {
  const response = await client.request<{ data: PalletDetailsResponse }>(
    `/pallet/${nodeType}`
  );
  return response.data;
}
