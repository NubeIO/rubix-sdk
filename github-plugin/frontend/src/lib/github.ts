export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  language: string | null;
  visibility?: string;
}

export interface GitHubTeam {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  privacy?: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  name?: string | null;
  email?: string | null;
  html_url: string;
  type?: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  updated_at: string;
  user?: {
    login: string;
  };
  pull_request?: unknown;
}

export interface GitHubRelease {
  id: number;
  name: string | null;
  tag_name: string;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  body: string | null;
}

export interface GitHubAccountConfig {
  baseUrl?: string;
  orgLogin?: string;
  token?: string;
  defaultRepository?: string;
  defaultIssueState?: string;
}

export interface GitHubSnapshot {
  repositories: GitHubRepository[];
  teams: GitHubTeam[];
  users: GitHubUser[];
  issues: GitHubIssue[];
  releases: GitHubRelease[];
}

const DEFAULT_BASE_URL = 'https://api.github.com';

async function githubGET<T>(
  account: GitHubAccountConfig,
  path: string
): Promise<T> {
  const baseUrl = (account.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
  const token = account.token?.trim();

  if (!account.orgLogin?.trim() || !token) {
    throw new Error('GitHub account is missing org login or token');
  }

  const res = await fetch(`${baseUrl}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub API request failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function getRepositories(account: GitHubAccountConfig): Promise<GitHubRepository[]> {
  const orgLogin = account.orgLogin?.trim();
  if (!orgLogin) {
    throw new Error('Missing organization login');
  }

  return githubGET<GitHubRepository[]>(
    account,
    `/orgs/${encodeURIComponent(orgLogin)}/repos?per_page=100&sort=updated`
  );
}

export async function getTeams(account: GitHubAccountConfig): Promise<GitHubTeam[]> {
  const orgLogin = account.orgLogin?.trim();
  if (!orgLogin) {
    throw new Error('Missing organization login');
  }

  return githubGET<GitHubTeam[]>(
    account,
    `/orgs/${encodeURIComponent(orgLogin)}/teams?per_page=100`
  );
}

export async function getUsers(account: GitHubAccountConfig): Promise<GitHubUser[]> {
  const orgLogin = account.orgLogin?.trim();
  if (!orgLogin) {
    throw new Error('Missing organization login');
  }

  return githubGET<GitHubUser[]>(
    account,
    `/orgs/${encodeURIComponent(orgLogin)}/members?per_page=100`
  );
}

export async function getIssues(account: GitHubAccountConfig): Promise<GitHubIssue[]> {
  const orgLogin = account.orgLogin?.trim();
  const repoName = account.defaultRepository?.trim();
  if (!orgLogin) {
    throw new Error('Missing organization login');
  }
  if (!repoName) {
    throw new Error('Repository is required for getIssues');
  }

  const issues = await githubGET<GitHubIssue[]>(
    account,
    `/repos/${encodeURIComponent(orgLogin)}/${encodeURIComponent(repoName)}/issues?per_page=100&state=${encodeURIComponent(account.defaultIssueState || 'open')}`
  );
  return issues.filter((issue) => !issue.pull_request);
}

export async function getReleases(account: GitHubAccountConfig): Promise<GitHubRelease[]> {
  const orgLogin = account.orgLogin?.trim();
  const repoName = account.defaultRepository?.trim();
  if (!orgLogin) {
    throw new Error('Missing organization login');
  }
  if (!repoName) {
    throw new Error('Repository is required for getReleases');
  }

  return githubGET<GitHubRelease[]>(
    account,
    `/repos/${encodeURIComponent(orgLogin)}/${encodeURIComponent(repoName)}/releases?per_page=100`
  );
}

export async function loadGitHubSnapshot(
  account: GitHubAccountConfig
): Promise<GitHubSnapshot> {
  const repositories = await getRepositories(account);
  const teams = await getTeams(account);
  const users = await getUsers(account);
  let issues: GitHubIssue[] = [];
  let releases: GitHubRelease[] = [];
  if (account.defaultRepository?.trim()) {
    issues = await getIssues(account);
    releases = await getReleases(account);
  }

  return { repositories, teams, users, issues, releases };
}

export function buildIssueSummary(issues: GitHubIssue[]) {
  const summary = {
    total: issues.length,
    open: 0,
    closed: 0,
    byAssignee: {} as Record<string, number>,
  };

  for (const issue of issues) {
    if (issue.state === 'open') {
      summary.open += 1;
    }
    if (issue.state === 'closed') {
      summary.closed += 1;
    }

    const assignee = issue.user?.login || 'unknown';
    summary.byAssignee[assignee] = (summary.byAssignee[assignee] || 0) + 1;
  }

  return summary;
}
