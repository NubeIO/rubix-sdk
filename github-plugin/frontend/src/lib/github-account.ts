import { createPluginClient, type CreateNodeInput } from '@rubix-sdk/frontend/plugin-client';

export interface PluginContext {
  orgId: string;
  deviceId: string;
  baseUrl: string;
  token?: string;
}

export interface RubixNode {
  id: string;
  name: string;
  type: string;
  parentId?: string;
  settings?: Record<string, unknown>;
}

export interface AccountNode extends RubixNode {
  settings?: {
    orgLogin?: string;
    token?: string;
    baseUrl?: string;
    displayName?: string;
    defaultRepository?: string;
    defaultIssueState?: string;
    commandsNote?: string;
  };
}

export function createGitHubPluginClient(context: PluginContext) {
  return createPluginClient(context);
}

export async function listGitHubAccounts(context: PluginContext): Promise<AccountNode[]> {
  const client = createGitHubPluginClient(context);
  const nodes = (await client.listNodes()) as RubixNode[];
  return nodes.filter((node) => node.type === 'github.account') as AccountNode[];
}

export async function createGitHubAccount(
  context: PluginContext,
  input: {
    name: string;
    orgLogin: string;
    tokenValue: string;
    baseUrl?: string;
    defaultRepository?: string;
    defaultIssueState?: string;
    commandsNote?: string;
  }
): Promise<void> {
  const client = createGitHubPluginClient(context);
  await client.createNode({
    type: 'github.account',
    name: input.name,
    settings: {
      displayName: input.name,
      orgLogin: input.orgLogin,
      token: input.tokenValue,
      baseUrl: input.baseUrl || 'https://api.github.com',
      defaultRepository: input.defaultRepository || '',
      defaultIssueState: input.defaultIssueState || 'open',
      commandsNote: input.commandsNote || '',
    },
  } as CreateNodeInput);
}
