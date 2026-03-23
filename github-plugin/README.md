# GitHub Plugin

GitHub tasks and reporting plugin for Rubix, built around Rubix nodes, refs, and settings from the start.

## Current shape

This first cut is intentionally basic but properly structured:

- `github.workspace` is the Rubix-side root for one managed GitHub org/workspace.
- `github.account` stores connection settings for that workspace.
- `github.report` stores reporting config linked to the account with `accountRef`.
- The frontend page can create a workspace bundle, load GitHub repos/issues/releases, and import them into shared core nodes.

That gives us multi-org support without inventing a side model outside Rubix.

The frontend uses the shared Rubix SDK client from `@rubix-sdk/frontend/plugin-client`, with a thin plugin-specific helper layer in `frontend/src/lib/github-nodes.ts`.

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

### `github.workspace`

- Parent: `rubix.device`
- Purpose: top-level Rubix container for one GitHub workspace
- Settings: name, description, default issue state

### `github.account`

- Parent: `github.workspace`
- Purpose: connection settings for one GitHub org/account
- Settings: display name, API base URL, org login, token, default repo, default issue state

### `github.report`

- Parent: `github.workspace`
- Required ref: `accountRef -> github.account`
- Purpose: store report preferences while imported business records live in shared core nodes

## Core node reuse

The plugin now treats GitHub as an integration layer, not the owner of every record type:

- `core.document` for repositories and external resources
- `core.ticket` for issues/tasks
- `core.release` for GitHub releases

The plugin-specific nodes stay focused on:

- credentials and connection config
- GitHub-specific reporting config
- future sync/import logic

## Important v1 note

For this first version, the GitHub token is stored in `github.account.settings.token` so the frontend can use it to call the GitHub API directly. That keeps the plugin immediately usable, but it is not the long-term secret-management design.

Recommended next step later:

- move token handling to a secure backend secret flow
- keep node settings for non-secret configuration only

## Frontend behavior

The page currently supports:

- creating a workspace bundle
- selecting from multiple GitHub account nodes
- listing repositories
- listing teams
- listing users
- listing issues for the default repository
- listing releases for the default repository
- importing repositories into `core.document`
- importing issues into `core.ticket`
- importing releases into `core.release`
- showing a simple reporting summary

## Backend behavior

The backend currently provides:

- plugin bootstrap and Rubix registration
- node type registration
- settings schemas for `github.workspace`, `github.account`, and `github.report`
- ref constraints for `github.report`
- a small GitHub API client package for future backend-driven sync/workflows

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

- map GitHub teams/users to Rubix `auth.team` and `auth.user`
- move GitHub API access and token handling to the backend
- make imports fully idempotent and sync-aware
- move reporting logic to backend jobs
- add task workflows, labels, milestones, and PR reporting
