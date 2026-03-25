# GitHub Plugin

GitHub account plugin for Rubix with one node type and a simple action-style page.

## Current shape

This version is intentionally small:

- one plugin node type: `github.account`
- one page for running simple actions
- actions currently mirror the command shape you want:
  - `getRepos`
  - `getUsers`
  - `getTeams`
  - `getIssues`
  - `getReleases`

The frontend uses the shared Rubix SDK client from `@rubix-sdk/frontend/plugin-client`, with a thin plugin-specific helper layer in `frontend/src/lib/github-account.ts`.

## Layout

```text
github-plugin/
├── backend/
│   ├── main.go
│   └── internal/
│       ├── githubapi/
│       └── nodes/
├── frontend/
│   └── src/
├── plugin.json
└── README.md
```

## Node model

### `github.account`

- Parent: `rubix.device`
- Purpose: connection settings for one GitHub org/account
- Settings:
  - display name
  - API base URL
  - org login
  - token
  - default repository
  - default issue state
  - commands note

## Important v1 note

For this first version, the GitHub token is stored in `github.account.settings.token` so the page can call the GitHub API directly. That keeps the plugin immediately usable, but it is not the long-term secret-management design.

Recommended next step later:

- move token handling to a secure backend secret flow
- keep node settings for non-secret configuration only

## Frontend behavior

The page currently supports:

- creating a `github.account` node
- selecting from multiple GitHub account nodes
- running `getRepos`
- running `getUsers`
- running `getTeams`
- running `getIssues`
- running `getReleases`
- rendering the returned results in tables

## Backend behavior

The backend currently provides:

- plugin bootstrap and Rubix registration
- node type registration for `github.account`
- settings schema for `github.account`
- a small GitHub API client package for future backend-driven command/sync work

## Build

### Backend

```bash
cd /home/user/code/go/nube/rubix-sdk/github-plugin/backend
go test ./...
go build ./...
```

### Frontend

```bash
cd /home/user/code/go/nube/rubix-sdk/github-plugin/frontend
npm install
npm run build
```

## Next sensible expansions

- add real plugin-node command support once Rubix SDK/core supports commands for external plugin nodes
- move these actions from page-only execution to backend execution
- map GitHub teams/users to Rubix `auth.team` and `auth.user`
- move GitHub API access and token handling to the backend
- add task workflows, labels, milestones, and PR reporting
