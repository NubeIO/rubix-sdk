import type { Node } from '../ras/types';
import type { PluginClient, QueryNodesOptions } from './index';

export async function queryNodes(
  client: PluginClient,
  options: QueryNodesOptions = {}
): Promise<Node[]> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  const result = await rasClient.query.create({
    orgId: config.orgId,
    deviceId: config.deviceId,
    body: {
      filter: options.filter,
      limit: options.limit,
      offset: options.offset,
      ports: options.ports,
      runtime: options.runtime,
    },
  });

  return (result?.data || []) as Node[];
}
