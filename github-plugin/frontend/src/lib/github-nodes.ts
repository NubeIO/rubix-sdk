import {
  createPluginClient,
  type CreateNodeInput,
  type UpdateNodeInput,
} from '@rubix-sdk/frontend/plugin-client';
import type { GitHubSnapshot } from './github';

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
  refs?: Array<{
    refName: string;
    toNodeId: string;
  }>;
}

export interface AccountNode extends RubixNode {
  settings?: {
    orgLogin?: string;
    token?: string;
    baseUrl?: string;
    displayName?: string;
    defaultRepository?: string;
    defaultIssueState?: string;
  };
}

export function createGitHubPluginClient(context: PluginContext) {
  return createPluginClient(context);
}

export async function listGitHubPluginNodes(context: PluginContext): Promise<RubixNode[]> {
  const client = createGitHubPluginClient(context);
  const nodes = (await client.listNodes()) as RubixNode[];
  return nodes.filter((node) => node.type.startsWith('github.'));
}

export async function createGitHubWorkspaceBundle(
  context: PluginContext,
  input: {
    workspaceName: string;
    description?: string;
    orgLogin: string;
    tokenValue: string;
    baseUrl?: string;
    defaultRepository?: string;
    defaultIssueState?: string;
  }
): Promise<void> {
  const client = createGitHubPluginClient(context);

  const workspace = await client.createNode({
    type: 'github.workspace',
    name: input.workspaceName,
    settings: {
      name: input.workspaceName,
      description: input.description || '',
      defaultIssueState: input.defaultIssueState || 'open',
    },
  } as CreateNodeInput);

  const account = await client.createNode({
    type: 'github.account',
    name: `${input.orgLogin} account`,
    parentId: workspace.id,
    settings: {
      displayName: input.workspaceName,
      orgLogin: input.orgLogin,
      token: input.tokenValue,
      baseUrl: input.baseUrl || 'https://api.github.com',
      defaultRepository: input.defaultRepository || '',
      defaultIssueState: input.defaultIssueState || 'open',
    },
  } as CreateNodeInput);

  await client.createNode({
    type: 'github.report',
    name: `${input.workspaceName} report`,
    parentId: workspace.id,
    settings: {
      defaultGrouping: 'repository',
      includeClosed: true,
    },
    refs: [
      {
        refName: 'accountRef',
        toNodeId: account.id,
      },
    ],
  } as CreateNodeInput);
}

export async function importGitHubSnapshotToCoreNodes(
  context: PluginContext,
  input: {
    workspaceId: string;
    accountId: string;
    account: AccountNode;
    snapshot: GitHubSnapshot;
  }
): Promise<{
  documents: number;
  tickets: number;
  releases: number;
}> {
  const client = createGitHubPluginClient(context);
  const existingNodes = (await client.listNodes()) as RubixNode[];

  let documentCount = 0;
  let ticketCount = 0;
  let releaseCount = 0;

  for (const repository of input.snapshot.repositories) {
    await upsertNode(client, existingNodes, {
      type: 'core.document',
      name: repository.full_name,
      parentId: input.workspaceId,
      settings: {
        documentType: 'github_repo',
        title: repository.full_name,
        description: repository.description || '',
        url: repository.html_url,
        version: '',
        author: input.account.settings?.orgLogin || '',
        tags: buildTags(['github', 'repo', repository.language || '']),
        accessLevel: repository.private ? 'internal' : 'public',
        format: 'repository',
        externalId: String(repository.id),
        fullName: repository.full_name,
        visibility: repository.visibility || (repository.private ? 'private' : 'public'),
        githubAccountId: input.accountId,
      },
      refs: [
        {
          refName: 'githubAccountRef',
          toNodeId: input.accountId,
        },
      ],
    });
    documentCount += 1;
  }

  const repositoryByName = new Map(
    input.snapshot.repositories.map((repository) => [repository.name, repository])
  );
  const defaultRepository = input.account.settings?.defaultRepository?.trim();
  const repoRefTarget = defaultRepository ? repositoryByName.get(defaultRepository) : input.snapshot.repositories[0];

  for (const issue of input.snapshot.issues) {
    await upsertNode(client, existingNodes, {
      type: 'core.ticket',
      name: `#${issue.number} ${issue.title}`,
      parentId: input.workspaceId,
      settings: {
        ticketNumber: `GH-${issue.number}`,
        ticketType: 'github_issue',
        status: issue.state,
        priority: 'medium',
        title: issue.title,
        description: '',
        reporter: issue.user?.login || '',
        reporterEmail: '',
        assignee: '',
        createdDate: '',
        dueDate: '',
        resolvedDate: issue.state === 'closed' ? issue.updated_at : '',
        resolution: '',
        category: 'github',
        tags: 'github,issue',
        externalId: String(issue.id),
        githubNumber: issue.number,
        githubUrl: issue.html_url,
        githubAccountId: input.accountId,
      },
      refs: [
        {
          refName: 'githubAccountRef',
          toNodeId: input.accountId,
        },
        ...(repoRefTarget
          ? [
              {
                refName: 'documentRef',
                toNodeId: findExistingNodeId(
                  existingNodes,
                  'core.document',
                  String(repoRefTarget.id)
                ),
              },
            ].filter((ref) => ref.toNodeId)
          : []),
      ],
    });
    ticketCount += 1;
  }

  for (const release of input.snapshot.releases) {
    await upsertNode(client, existingNodes, {
      type: 'core.release',
      name: release.name || release.tag_name,
      parentId: input.workspaceId,
      settings: {
        version: release.tag_name,
        releaseType: 'github_release',
        status: release.draft ? 'draft' : release.prerelease ? 'review' : 'released',
        releaseDate: release.published_at || '',
        releaseNotes: release.body || '',
        buildRef: release.html_url,
        compatibility: '',
        author: input.account.settings?.orgLogin || '',
        approvedBy: '',
        approvedDate: '',
        downloadUrl: release.html_url,
        checksumSHA256: '',
        externalId: String(release.id),
        githubAccountId: input.accountId,
      },
      refs: [
        {
          refName: 'githubAccountRef',
          toNodeId: input.accountId,
        },
        ...(repoRefTarget
          ? [
              {
                refName: 'documentRef',
                toNodeId: findExistingNodeId(
                  existingNodes,
                  'core.document',
                  String(repoRefTarget.id)
                ),
              },
            ].filter((ref) => ref.toNodeId)
          : []),
      ],
    });
    releaseCount += 1;
  }

  return {
    documents: documentCount,
    tickets: ticketCount,
    releases: releaseCount,
  };
}

type UpsertableNode = {
  type: string;
  name: string;
  parentId: string;
  settings: Record<string, unknown>;
  refs?: Array<{
    refName: string;
    toNodeId: string;
  }>;
};

async function upsertNode(
  client: ReturnType<typeof createGitHubPluginClient>,
  existingNodes: RubixNode[],
  node: UpsertableNode
) {
  const externalId = String(node.settings.externalId || '');
  const existing = existingNodes.find((candidate) => {
    return (
      candidate.type === node.type &&
      String(candidate.settings?.externalId || '') === externalId
    );
  });

  if (existing) {
    await client.updateNode(existing.id, {
      name: node.name,
      parentId: node.parentId,
      settings: node.settings,
    } as UpdateNodeInput);
    existing.name = node.name;
    existing.parentId = node.parentId;
    existing.settings = node.settings;
    return existing.id;
  }

  const created = await client.createNode({
    type: node.type,
    name: node.name,
    parentId: node.parentId,
    settings: node.settings,
    refs: node.refs,
  } as CreateNodeInput);
  existingNodes.push(created as RubixNode);
  return created.id;
}

function findExistingNodeId(existingNodes: RubixNode[], type: string, externalId: string): string {
  return (
    existingNodes.find((candidate) => {
      return (
        candidate.type === type &&
        String(candidate.settings?.externalId || '') === externalId
      );
    })?.id || ''
  );
}

function buildTags(parts: string[]): string {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(',');
}
