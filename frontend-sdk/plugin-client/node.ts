import type { Node } from '../ras/types';
import type { CreateNodeInput, PluginClient, UpdateNodeInput } from './index';

export async function getNode(
  client: PluginClient,
  nodeId: string
): Promise<Node> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  const result = await rasClient.nodes.get({
    orgId: config.orgId,
    deviceId: config.deviceId,
    id: nodeId,
  });

  return result.data as Node;
}

export async function createNode(
  client: PluginClient,
  input: CreateNodeInput
): Promise<Node> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  console.log('[PluginClient] createNode called:', { type: input.type, name: input.name });

  const result = await rasClient.nodes.create({
    orgId: config.orgId,
    deviceId: config.deviceId,
    body: {
      type: input.type,
      profile: input.profile,
      name: input.name,
      identity: input.identity,
      parentId: input.parentId,
      settings: input.settings,
      data: input.data,
      ui: input.ui,
      position: input.position,
      refs: input.refs,
    },
  });

  console.log('[PluginClient] createNode response:', result);
  console.log('[PluginClient] Unwrapped node:', result.data);
  return result.data as Node;
}

export async function updateNode(
  client: PluginClient,
  nodeId: string,
  input: UpdateNodeInput
): Promise<Node> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  const result = await rasClient.nodes.update({
    orgId: config.orgId,
    deviceId: config.deviceId,
    id: nodeId,
    body: {
      name: input.name,
      parentId: input.parentId,
      settings: input.settings,
      data: input.data,
      ui: input.ui,
      position: input.position,
    },
  });

  return result.data as Node;
}

export async function updateNodeSettings(
  client: PluginClient,
  nodeId: string,
  settings: Record<string, unknown>
): Promise<Node> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  const result = await rasClient.nodes.settingsPatch({
    orgId: config.orgId,
    deviceId: config.deviceId,
    id: nodeId,
    body: settings,
  });

  return result.data as Node;
}

export async function deleteNode(
  client: PluginClient,
  nodeId: string
): Promise<void> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  console.log('[PluginClient] deleteNode called:', {
    nodeId,
    orgId: config.orgId,
    deviceId: config.deviceId,
    url: `/orgs/${config.orgId}/devices/${config.deviceId}/nodes/${nodeId}`,
  });

  await rasClient.nodes.delete({
    orgId: config.orgId,
    deviceId: config.deviceId,
    id: nodeId,
  });

  console.log('[PluginClient] Delete successful');
}

export async function listNodes(client: PluginClient): Promise<Node[]> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();

  const result = await rasClient.nodes.list({
    orgId: config.orgId,
    deviceId: config.deviceId,
  });

  return (result?.data || []) as Node[];
}
