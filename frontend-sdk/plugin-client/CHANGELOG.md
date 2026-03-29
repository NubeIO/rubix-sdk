# Plugin Client SDK - Changelog

## [2026-03-28] - Teams, Users & Access Control Support

### ✨ New Features

#### 🔧 Core APIs Added

**Teams API (`teams.ts`)**
- `listTeams()` - List all teams
- `getTeam(teamId)` - Get team details
- `createTeam(input)` - Create new team
- `updateTeam(teamId, input)` - Update team
- `deleteTeam(teamId)` - Delete team
- `addUserToTeam(teamId, userId)` - Add user to team
- `removeUserFromTeam(teamId, userId)` - Remove user from team
- `listTeamUsers(teamId)` - List team members

**Users API (`users.ts`)**
- `listUsers(options?)` - List all users
- `getUser(userId, options?)` - Get user details
- `inviteUser(input)` - Invite new user
- `updateUser(userId, input)` - Update user
- `deleteUser(userId)` - Delete user

**Refs API (`refs.ts`)**
- `listRefs(nodeId)` - List all refs for a node
- `createRef(nodeId, input)` - Create new ref
- `deleteRef(nodeId, refName)` - Delete all refs of type

**Access Control Helpers (`refs.ts`)**
- `assignUserToNode(nodeId, userId, userName?)` - Assign user (create userRef)
- `assignTeamToNode(nodeId, teamId, teamName?)` - Assign team (create teamRef)
- `getNodeUsers(nodeId)` - Get assigned users
- `getNodeTeams(nodeId)` - Get assigned teams
- `removeUsersFromNode(nodeId)` - Remove all user assignments
- `removeTeamsFromNode(nodeId)` - Remove all team assignments
- `isNodePublic(nodeId)` - Check if node is public
- `replaceNodeUsers(nodeId, users)` - Replace user assignments
- `replaceNodeTeams(nodeId, teams)` - Replace team assignments

### 📚 Documentation

**New Files:**
- `examples/access-control-usage.ts` - 10 complete examples showing:
  - Task assignment to specific users
  - Task assignment to teams
  - Hybrid access (team + users)
  - Public tasks
  - Task reassignment
  - Filtering tasks by user
  - Complex workflows

**Updated Files:**
- `examples/README.md` - Added access control examples section
- `docs/PLUGIN-CLIENT-TS.md` - Added comprehensive "Teams, Users & Access Control" section with:
  - Full API reference for all new methods
  - 7 common access control patterns
  - Real-world examples

### 🎯 Use Cases Enabled

#### Task Management
```typescript
// Assign task to specific user (user-only access)
await client.assignUserToNode(taskId, 'user_alice_123', 'Alice');

// Reassign task
await client.replaceNodeUsers(taskId, [
  { userId: 'user_bob_456', userName: 'Bob' }
]);

// Make task public
await client.removeUsersFromNode(taskId);
await client.removeTeamsFromNode(taskId);
```

#### Team-Based Access
```typescript
// Assign to team
await client.assignTeamToNode(nodeId, 'team_engineering', 'Engineering');

// Hybrid: team + specific users
await client.assignTeamToNode(nodeId, 'team_ops', 'Operations');
await client.assignUserToNode(nodeId, 'user_cto_999', 'CTO');
```

#### Access Control Queries
```typescript
// Check if node is public
const isPublic = await client.isNodePublic(nodeId);

// Get all assigned users/teams
const users = await client.getNodeUsers(nodeId);
const teams = await client.getNodeTeams(nodeId);
```

### 🏗️ Architecture

**New Modules:**
- `teams.ts` - Teams CRUD + team membership management
- `users.ts` - Users CRUD + invitation
- `refs.ts` - Generic refs management + access control helpers

**Integration:**
- All methods added to `PluginClient` class
- Full TypeScript type safety
- Consistent error handling via `PluginClientError`
- Uses RAS client under the hood (`rasClient.teams.*`, `rasClient.users.*`, `rasClient.refs.*`)

### 📝 Breaking Changes

None - This is a backwards-compatible addition.

### 🔗 Related

- RAS endpoints: `/orgs/{orgId}/devices/{deviceId}/teams/*`
- RAS endpoints: `/orgs/{orgId}/devices/{deviceId}/users/*`
- RAS endpoints: `/orgs/{orgId}/devices/{deviceId}/nodes/{nodeId}/refs/*`
- Frontend components: `TeamRefPicker`, `UserRefPicker`, `AccessControlTab`

---

**Impact:** Enables plugins to implement user-level access control, task assignment, team management, and any refs-based relationships without manual API calls.
