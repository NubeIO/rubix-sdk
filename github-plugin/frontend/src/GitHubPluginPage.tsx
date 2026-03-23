import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  startTransition,
  type FormEvent,
  type ReactNode,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import './styles.css';
import type { AccountNode } from './lib/github-nodes';
import {
  createGitHubWorkspaceBundle,
  importGitHubSnapshotToCoreNodes,
  listGitHubPluginNodes,
  type PluginContext,
} from './lib/github-nodes';
import { buildIssueSummary, loadGitHubSnapshot, type GitHubSnapshot } from './lib/github';

export interface GitHubPluginPageProps extends PluginContext {}

interface WorkspaceFormState {
  workspaceName: string;
  description: string;
  orgLogin: string;
  tokenValue: string;
  baseUrl: string;
  defaultRepository: string;
  defaultIssueState: string;
}

const emptySnapshot: GitHubSnapshot = {
  repositories: [],
  teams: [],
  users: [],
  issues: [],
  releases: [],
};

const initialForm: WorkspaceFormState = {
  workspaceName: '',
  description: '',
  orgLogin: '',
  tokenValue: '',
  baseUrl: 'https://api.github.com',
  defaultRepository: '',
  defaultIssueState: 'open',
};

export function GitHubPluginApp(props: GitHubPluginPageProps) {
  const [form, setForm] = useState<WorkspaceFormState>(initialForm);
  const [nodes, setNodes] = useState<AccountNode[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [snapshot, setSnapshot] = useState<GitHubSnapshot>(emptySnapshot);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const deferredRepoSearch = useDeferredValue(repoSearch);

  const accounts = useMemo(
    () => nodes.filter((node) => node.type === 'github.account'),
    [nodes]
  );

  const workspaceByAccountId = useMemo(() => {
    const workspaceMap = new Map<string, string>();
    for (const node of nodes) {
      if (node.type === 'github.account' && node.parentId) {
        workspaceMap.set(node.id, node.parentId);
      }
    }
    return workspaceMap;
  }, [nodes]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) || accounts[0],
    [accounts, selectedAccountId]
  );

  const filteredRepositories = useMemo(() => {
    const search = deferredRepoSearch.trim().toLowerCase();
    if (!search) {
      return snapshot.repositories;
    }
    return snapshot.repositories.filter((repo) => {
      return (
        repo.name.toLowerCase().includes(search) ||
        repo.full_name.toLowerCase().includes(search) ||
        (repo.description || '').toLowerCase().includes(search)
      );
    });
  }, [deferredRepoSearch, snapshot.repositories]);

  const issueSummary = useMemo(() => buildIssueSummary(snapshot.issues), [snapshot.issues]);

  async function refreshNodes() {
    setLoadingNodes(true);
    setError('');
    try {
      const allNodes = await listGitHubPluginNodes(props);
      const accountNodes = allNodes
        .filter((node) => node.type === 'github.account')
        .map((node) => node as AccountNode);
      setNodes(accountNodes);
      if (!selectedAccountId && accountNodes[0]) {
        setSelectedAccountId(accountNodes[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load GitHub nodes');
    } finally {
      setLoadingNodes(false);
    }
  }

  useEffect(() => {
    void refreshNodes();
  }, []);

  useEffect(() => {
    if (!selectedAccount && accounts.length === 0) {
      setSnapshot(emptySnapshot);
      return;
    }

    if (!selectedAccount) {
      return;
    }

    setSelectedAccountId(selectedAccount.id);
    setLoadingSnapshot(true);
    setError('');

    void loadGitHubSnapshot(selectedAccount.settings || {})
      .then((result) => {
        startTransition(() => {
          setSnapshot(result);
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load GitHub data');
        setSnapshot(emptySnapshot);
      })
      .finally(() => {
        setLoadingSnapshot(false);
      });
  }, [selectedAccount?.id]);

  async function handleCreateWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await createGitHubWorkspaceBundle(props, form);
      setForm(initialForm);
      setMessage(`Created workspace for ${form.orgLogin}`);
      await refreshNodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
    }
  }

  async function handleImportCoreNodes() {
    if (!selectedAccount) {
      return;
    }

    const workspaceId = workspaceByAccountId.get(selectedAccount.id);
    if (!workspaceId) {
      setError('Selected account is missing a workspace parent');
      return;
    }

    setImporting(true);
    setError('');
    setMessage('');

    try {
      const result = await importGitHubSnapshotToCoreNodes(props, {
        workspaceId,
        accountId: selectedAccount.id,
        account: selectedAccount,
        snapshot,
      });
      setMessage(
        `Imported ${result.documents} documents, ${result.tickets} tickets, and ${result.releases} releases into core nodes`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import core nodes');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="hero-panel">
        <div>
          <p className="eyebrow">GitHub Tasks and Reporting</p>
          <h1>Manage many GitHub orgs with Rubix nodes</h1>
          <p className="hero-copy">
            Each GitHub org starts as a Rubix workspace plus a GitHub account node.
            Repositories, issues, and releases can then be imported into shared
            core nodes so the plugin stays thin and the business records stay reusable.
          </p>
        </div>
        <div className="hero-stats">
          <StatCard label="Accounts" value={String(accounts.length)} />
          <StatCard label="Repos" value={String(snapshot.repositories.length)} />
          <StatCard label="Issues" value={String(snapshot.issues.length)} />
          <StatCard label="Releases" value={String(snapshot.releases.length)} />
        </div>
      </div>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Create workspace bundle</h2>
              <p>Creates `github.workspace`, `github.account`, and a `github.report` node only.</p>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleCreateWorkspace}>
            <label>
              Workspace name
              <input
                value={form.workspaceName}
                onChange={(event) => setForm({ ...form, workspaceName: event.target.value })}
                placeholder="Platform Engineering"
                required
              />
            </label>

            <label>
              GitHub org login
              <input
                value={form.orgLogin}
                onChange={(event) => setForm({ ...form, orgLogin: event.target.value })}
                placeholder="nubeio"
                required
              />
            </label>

            <label>
              API base URL
              <input
                value={form.baseUrl}
                onChange={(event) => setForm({ ...form, baseUrl: event.target.value })}
                placeholder="https://api.github.com"
              />
            </label>

            <label>
              Personal access token
              <input
                type="password"
                value={form.tokenValue}
                onChange={(event) => setForm({ ...form, tokenValue: event.target.value })}
                placeholder="ghp_..."
                required
              />
            </label>

            <label>
              Default repository
              <input
                value={form.defaultRepository}
                onChange={(event) => setForm({ ...form, defaultRepository: event.target.value })}
                placeholder="rubix"
              />
            </label>

            <label>
              Default issue state
              <select
                value={form.defaultIssueState}
                onChange={(event) => setForm({ ...form, defaultIssueState: event.target.value })}
              >
                <option value="open">open</option>
                <option value="closed">closed</option>
                <option value="all">all</option>
              </select>
            </label>

            <label className="full-span">
              Description
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Scope of this workspace, reporting goals, or owners."
                rows={4}
              />
            </label>

            <div className="form-actions full-span">
              <button type="submit">Create workspace bundle</button>
              <button type="button" className="secondary-button" onClick={() => void refreshNodes()}>
                Refresh nodes
              </button>
            </div>
          </form>

          {message ? <p className="message success">{message}</p> : null}
          {error ? <p className="message error">{error}</p> : null}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Accounts</h2>
              <p>Select a GitHub account node to inspect GitHub data and import it into core nodes.</p>
            </div>
          </div>

          {loadingNodes ? (
            <p className="muted">Loading account nodes…</p>
          ) : accounts.length === 0 ? (
            <p className="muted">No GitHub account nodes yet.</p>
          ) : (
            <div className="account-list">
              {accounts.map((account) => {
                const isActive = account.id === selectedAccount?.id;
                return (
                  <button
                    key={account.id}
                    className={`account-card ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedAccountId(account.id)}
                    type="button"
                  >
                    <strong>{account.settings?.displayName || account.settings?.orgLogin || account.name}</strong>
                    <span>{account.settings?.orgLogin || 'unknown org'}</span>
                    <span>{account.settings?.defaultRepository || 'repo not set'}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Reporting summary</h2>
              <p>Basic issue reporting using the selected account’s default repository.</p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void handleImportCoreNodes()}
              disabled={!selectedAccount || importing || loadingSnapshot}
            >
              {importing ? 'Importing…' : 'Import into core nodes'}
            </button>
          </div>
          {loadingSnapshot ? (
            <p className="muted">Loading GitHub data…</p>
          ) : (
            <div className="stat-row">
              <StatCard label="Total issues" value={String(issueSummary.total)} />
              <StatCard label="Open" value={String(issueSummary.open)} />
              <StatCard label="Closed" value={String(issueSummary.closed)} />
              <StatCard
                label="Top reporter"
                value={
                  Object.entries(issueSummary.byAssignee).sort((a, b) => b[1] - a[1])[0]?.[0] || 'n/a'
                }
              />
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Repositories</h2>
              <p>Filter repositories for quick task and reporting pivots.</p>
            </div>
            <input
              value={repoSearch}
              onChange={(event) => setRepoSearch(event.target.value)}
              placeholder="Search repositories"
            />
          </div>
          <SimpleTable
            columns={['Name', 'Visibility', 'Language']}
            rows={filteredRepositories.map((repo) => [
              <a href={repo.html_url} target="_blank" rel="noreferrer" key={repo.id}>
                {repo.full_name}
              </a>,
              repo.visibility || (repo.private ? 'private' : 'public'),
              repo.language || 'n/a',
            ])}
            emptyText="No repositories loaded"
          />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Teams</h2>
              <p>GitHub org teams available for future mapping to `auth.team`.</p>
            </div>
          </div>
          <SimpleTable
            columns={['Name', 'Slug', 'Privacy']}
            rows={snapshot.teams.map((team) => [team.name, team.slug, team.privacy || 'n/a'])}
            emptyText="No teams loaded"
          />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Users</h2>
              <p>Members available for future mapping to `auth.user` and assignment flows.</p>
            </div>
          </div>
          <SimpleTable
            columns={['Login', 'Type', 'Profile']}
            rows={snapshot.users.map((user) => [
              user.login,
              user.type || 'user',
              <a href={user.html_url} target="_blank" rel="noreferrer" key={user.id}>
                open
              </a>,
            ])}
            emptyText="No users loaded"
          />
        </section>

        <section className="panel full-width">
          <div className="panel-header">
            <div>
              <h2>Issues</h2>
              <p>This task view uses the default repository from the selected account and imports into `core.ticket`.</p>
            </div>
          </div>
          <SimpleTable
            columns={['Issue', 'State', 'Updated', 'Author']}
            rows={snapshot.issues.map((issue) => [
              <a href={issue.html_url} target="_blank" rel="noreferrer" key={issue.id}>
                #{issue.number} {issue.title}
              </a>,
              issue.state,
              new Date(issue.updated_at).toLocaleString(),
              issue.user?.login || 'unknown',
            ])}
            emptyText="No issues loaded"
          />
        </section>

        <section className="panel full-width">
          <div className="panel-header">
            <div>
              <h2>Releases</h2>
              <p>GitHub releases can be imported into `core.release` for shared lifecycle tracking.</p>
            </div>
          </div>
          <SimpleTable
            columns={['Release', 'Status', 'Published', 'Link']}
            rows={snapshot.releases.map((release) => [
              release.name || release.tag_name,
              release.draft ? 'draft' : release.prerelease ? 'prerelease' : 'released',
              release.published_at ? new Date(release.published_at).toLocaleString() : 'n/a',
              <a href={release.html_url} target="_blank" rel="noreferrer" key={release.id}>
                open
              </a>,
            ])}
            emptyText="No releases loaded"
          />
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SimpleTable({
  columns,
  rows,
  emptyText,
}: {
  columns: string[];
  rows: ReactNode[][];
  emptyText: string;
}) {
  if (rows.length === 0) {
    return <p className="muted">{emptyText}</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default {
  mount: (container: HTMLElement, mountProps?: GitHubPluginPageProps) => {
    const root = createRoot(container);
    root.render(
      <GitHubPluginApp
        orgId={mountProps?.orgId || ''}
        deviceId={mountProps?.deviceId || ''}
        baseUrl={mountProps?.baseUrl || '/api/v1'}
        token={mountProps?.token}
      />
    );
    return root;
  },
  unmount: (root: Root) => {
    root.unmount();
  },
};
