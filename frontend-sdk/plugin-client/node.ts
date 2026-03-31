import type { Node } from '../ras/types';
import type { CreateNodeInput, NodeRef, PluginClient, UpdateNodeInput } from './index';

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
  parentId: string | undefined,
  input: Omit<CreateNodeInput, 'parentId' | 'refs'> & { refs?: NodeRef[] }
): Promise<Node> {
  const rasClient = client.getRASClient();
  const config = client.getConfig();
  const refs = [...(input.refs ?? [])];

  if (parentId && !refs.some((ref) => ref.refName === 'parentRef')) {
    refs.unshift({
      refName: 'parentRef',
      toNodeId: parentId,
    });
  }

  const body = {
    type: input.type,
    profile: input.profile,
    name: input.name,
    identity: input.identity,
    parentId,
    settings: input.settings,
    data: input.data,
    ui: input.ui,
    position: input.position,
    refs,
  };

  console.log('[PluginClient] createNode called:', {
    type: input.type,
    name: input.name,
    parentId,
  });

  // Debug: detect non-serializable values before they hit JSON.stringify
  try {
    JSON.stringify(body);
  } catch (serErr) {
    console.error('[PluginClient] createNode body is not serializable!');
    for (const [key, value] of Object.entries(body)) {
      try {
        JSON.stringify(value);
      } catch {
        console.error(`  Field "${key}" is not serializable:`, typeof value, value);
      }
    }
    throw serErr;
  }

  const result = await rasClient.nodes.create({
    orgId: config.orgId,
    deviceId: config.deviceId,
    body,
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
