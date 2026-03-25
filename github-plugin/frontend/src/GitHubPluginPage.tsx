import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import './styles.css';
import {
  createGitHubAccount,
  listGitHubAccounts,
  type AccountNode,
  type PluginContext,
} from './lib/github-account';
import {
  getIssues,
  getReleases,
  getRepositories,
  getTeams,
  getUsers,
  type GitHubIssue,
  type GitHubRelease,
  type GitHubRepository,
  type GitHubTeam,
  type GitHubUser,
} from './lib/github';

export interface GitHubPluginPageProps extends PluginContext {}

interface AccountFormState {
  name: string;
  orgLogin: string;
  tokenValue: string;
  baseUrl: string;
  defaultRepository: string;
  defaultIssueState: string;
  commandsNote: string;
}

const initialForm: AccountFormState = {
  name: '',
  orgLogin: '',
  tokenValue: '',
  baseUrl: 'https://api.github.com',
  defaultRepository: '',
  defaultIssueState: 'open',
  commandsNote: '',
};

export function GitHubPluginApp(props: GitHubPluginPageProps) {
  const [form, setForm] = useState<AccountFormState>(initialForm);
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [teams, setTeams] = useState<GitHubTeam[]>([]);
  const [users, setUsers] = useState<GitHubUser[]>([]);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [runningAction, setRunningAction] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [repoSearch, setRepoSearch] = useState('');
  const deferredRepoSearch = useDeferredValue(repoSearch);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) || accounts[0],
    [accounts, selectedAccountId]
  );

  const filteredRepositories = useMemo(() => {
    const search = deferredRepoSearch.trim().toLowerCase();
    if (!search) {
      return repositories;
    }
    return repositories.filter((repo) => {
      return (
        repo.name.toLowerCase().includes(search) ||
        repo.full_name.toLowerCase().includes(search) ||
        (repo.description || '').toLowerCase().includes(search)
      );
    });
  }, [deferredRepoSearch, repositories]);

  async function refreshNodes() {
    setLoadingNodes(true);
    setError('');
    try {
      const accountNodes = await listGitHubAccounts(props);
      setAccounts(accountNodes);
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

  async function handleCreateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await createGitHubAccount(props, form);
      setForm(initialForm);
      setMessage(`Created GitHub account node for ${form.orgLogin}`);
      await refreshNodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    }
  }

  async function runAction(action: 'repos' | 'teams' | 'users' | 'issues' | 'releases') {
    if (!selectedAccount) {
      setError('Select a GitHub account first');
      return;
    }

    setRunningAction(action);
    setError('');
    setMessage('');

    try {
      const config = selectedAccount.settings || {};
      if (action === 'repos') {
        setRepositories(await getRepositories(config));
        setMessage('Loaded repositories');
      }
      if (action === 'teams') {
        setTeams(await getTeams(config));
        setMessage('Loaded teams');
      }
      if (action === 'users') {
        setUsers(await getUsers(config));
        setMessage('Loaded users');
      }
      if (action === 'issues') {
        setIssues(await getIssues(config));
        setMessage('Loaded issues');
      }
      if (action === 'releases') {
        setReleases(await getReleases(config));
        setMessage('Loaded releases');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to run ${action}`);
    } finally {
      setRunningAction('');
    }
  }

  return (
    <div className="page-shell">
      <div className="hero-panel">
        <div>
          <p className="eyebrow">GitHub Tasks and Reporting</p>
          <h1>One GitHub account node with simple actions</h1>
          <p className="hero-copy">
            Keep this version small: create a `github.account` node, select it,
            and run action-style fetches for repositories, users, teams, issues, and releases.
          </p>
        </div>
        <div className="hero-stats">
          <StatCard label="Accounts" value={String(accounts.length)} />
          <StatCard label="Repos" value={String(repositories.length)} />
          <StatCard label="Issues" value={String(issues.length)} />
          <StatCard label="Releases" value={String(releases.length)} />
        </div>
      </div>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Create GitHub Account</h2>
              <p>Creates one `github.account` node with the settings needed for action-style fetches.</p>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleCreateAccount}>
            <label>
              Node name
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="GitHub Platform"
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
              Commands note
              <textarea
                value={form.commandsNote}
                onChange={(event) => setForm({ ...form, commandsNote: event.target.value })}
                placeholder="Operator note about how this account is used."
                rows={4}
              />
            </label>

            <div className="form-actions full-span">
              <button type="submit">Create account node</button>
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
              <p>Select a `github.account` node, then run the actions below.</p>
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
              <h2>Actions</h2>
              <p>These stand in for commands for now, since plugin-node commands are not wired through the SDK yet.</p>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => void runAction('repos')} disabled={!selectedAccount || !!runningAction}>
              {runningAction === 'repos' ? 'Loading…' : 'getRepos'}
            </button>
            <button type="button" onClick={() => void runAction('users')} disabled={!selectedAccount || !!runningAction}>
              {runningAction === 'users' ? 'Loading…' : 'getUsers'}
            </button>
            <button type="button" onClick={() => void runAction('teams')} disabled={!selectedAccount || !!runningAction}>
              {runningAction === 'teams' ? 'Loading…' : 'getTeams'}
            </button>
            <button type="button" onClick={() => void runAction('issues')} disabled={!selectedAccount || !!runningAction}>
              {runningAction === 'issues' ? 'Loading…' : 'getIssues'}
            </button>
            <button type="button" onClick={() => void runAction('releases')} disabled={!selectedAccount || !!runningAction}>
              {runningAction === 'releases' ? 'Loading…' : 'getReleases'}
            </button>
          </div>
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
              <p>Result from `getTeams`.</p>
            </div>
          </div>
          <SimpleTable
            columns={['Name', 'Slug', 'Privacy']}
            rows={teams.map((team) => [team.name, team.slug, team.privacy || 'n/a'])}
            emptyText="No teams loaded"
          />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Users</h2>
              <p>Result from `getUsers`.</p>
            </div>
          </div>
          <SimpleTable
            columns={['Login', 'Type', 'Profile']}
            rows={users.map((user) => [
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
              <p>Result from `getIssues`. Requires `defaultRepository` on the selected account.</p>
            </div>
          </div>
          <SimpleTable
            columns={['Issue', 'State', 'Updated', 'Author']}
            rows={issues.map((issue) => [
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
              <p>Result from `getReleases`. Requires `defaultRepository` on the selected account.</p>
            </div>
          </div>
          <SimpleTable
            columns={['Release', 'Status', 'Published', 'Link']}
            rows={releases.map((release) => [
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
