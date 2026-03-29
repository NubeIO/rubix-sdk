/**
 * Access Control & Task Assignment Examples
 *
 * This file demonstrates how to use the plugin client for access control,
 * including the common pattern of assigning tasks to specific users.
 */

import { createPluginClient } from '../index';

// ============================================================================
// Setup
// ============================================================================

const client = createPluginClient({
  orgId: 'org_abc123',
  deviceId: 'device_xyz789',
  baseUrl: '/api/v1',
  token: 'your-auth-token',
});

// ============================================================================
// Example 1: Assign Task to Specific User
// ============================================================================

async function assignTaskToUser() {
  // Create a task
  const task = await client.createNode(undefined, {
    type: 'plm.task',
    name: 'Implement user authentication',
    settings: {
      description: 'Add OAuth2 login flow',
      status: 'pending',
      priority: 'high',
    },
  });

  console.log('Created task:', task.id, task.name);

  // Assign to Alice (only she can see it)
  await client.assignUserToNode(task.id!, 'user_alice_123', 'Alice');

  console.log('✅ Task assigned to Alice');

  // Verify task is private to Alice
  const isPublic = await client.isNodePublic(task.id!);
  console.log('Is task public?', isPublic); // false

  // Get assigned users
  const users = await client.getNodeUsers(task.id!);
  console.log('Assigned users:', users.map((u) => u.displayName)); // ["Alice"]
}

// ============================================================================
// Example 2: Assign Task to Multiple Users
// ============================================================================

async function assignTaskToMultipleUsers() {
  const task = await client.createNode(undefined, {
    type: 'plm.task',
    name: 'Review API design',
    settings: { status: 'pending' },
  });

  // Assign to Alice and Bob
  await client.assignUserToNode(task.id!, 'user_alice_123', 'Alice');
  await client.assignUserToNode(task.id!, 'user_bob_456', 'Bob');

  console.log('✅ Task assigned to Alice and Bob');

  // Get all assigned users
  const users = await client.getNodeUsers(task.id!);
  console.log('Assigned users:', users.map((u) => u.displayName)); // ["Alice", "Bob"]
}

// ============================================================================
// Example 3: Assign Task to Team
// ============================================================================

async function assignTaskToTeam() {
  const task = await client.createNode(undefined, {
    type: 'plm.task',
    name: 'Deploy to production',
    settings: { status: 'pending' },
  });

  // Assign to Engineering team
  await client.assignTeamToNode(task.id!, 'team_engineering', 'Engineering');

  console.log('✅ Task assigned to Engineering team');

  // Get assigned teams
  const teams = await client.getNodeTeams(task.id!);
  console.log('Assigned teams:', teams.map((t) => t.displayName)); // ["Engineering"]
}

// ============================================================================
// Example 4: Reassign Task (Replace User)
// ============================================================================

async function reassignTask() {
  const taskId = 'task_001';

  // Replace all user assignments with just Charlie
  await client.replaceNodeUsers(taskId, [{ userId: 'user_charlie_789', userName: 'Charlie' }]);

  console.log('✅ Task reassigned to Charlie only');
}

// ============================================================================
// Example 5: Make Task Public (Remove All Access Control)
// ============================================================================

async function makeTaskPublic() {
  const taskId = 'task_001';

  // Remove all user and team assignments
  await client.removeUsersFromNode(taskId);
  await client.removeTeamsFromNode(taskId);

  console.log('✅ Task is now public');

  // Verify
  const isPublic = await client.isNodePublic(taskId);
  console.log('Is task public?', isPublic); // true
}

// ============================================================================
// Example 6: Query Tasks for Current User
// ============================================================================

async function getMyTasks() {
  const currentUserId = 'user_alice_123';

  // Query all tasks
  const allTasks = await client.queryNodes({
    filter: 'type is "plm.task"',
  });

  // Filter to tasks assigned to current user
  const myTasks = [];
  for (const task of allTasks) {
    const users = await client.getNodeUsers(task.id!);
    const isAssignedToMe = users.some((u) => u.toNodeId === currentUserId);
    const isPublic = await client.isNodePublic(task.id!);

    if (isAssignedToMe || isPublic) {
      myTasks.push(task);
    }
  }

  console.log('My tasks:', myTasks.map((t) => t.name));
}

// ============================================================================
// Example 7: Create Task with Initial Assignment
// ============================================================================

async function createTaskWithAssignment() {
  // Create task with userRef in one call
  const task = await client.createNode(undefined, {
    type: 'plm.task',
    name: 'Fix login bug',
    settings: {
      status: 'pending',
      priority: 'critical',
    },
    refs: [
      {
        refName: 'userRef',
        toNodeId: 'user_alice_123',
        // displayName will be auto-populated by backend
      },
    ],
  });

  console.log('✅ Task created and assigned to Alice in one call');
}

// ============================================================================
// Example 8: Hybrid Access - Team + Specific Users
// ============================================================================

async function hybridAccess() {
  const task = await client.createNode(undefined, {
    type: 'plm.task',
    name: 'Security audit',
    settings: { status: 'pending' },
  });

  // Assign to Security team
  await client.assignTeamToNode(task.id!, 'team_security', 'Security');

  // Also give access to CTO (not on Security team)
  await client.assignUserToNode(task.id!, 'user_cto_999', 'CTO');

  console.log('✅ Task visible to Security team + CTO');

  // Check access
  const teams = await client.getNodeTeams(task.id!);
  const users = await client.getNodeUsers(task.id!);

  console.log('Teams:', teams.map((t) => t.displayName)); // ["Security"]
  console.log('Users:', users.map((u) => u.displayName)); // ["CTO"]
}

// ============================================================================
// Example 9: List All Teams and Users (for UI pickers)
// ============================================================================

async function listTeamsAndUsers() {
  // Get all teams for team picker
  const teams = await client.listTeams();
  console.log(
    'Available teams:',
    teams.map((t) => ({ id: t.id, name: t.name }))
  );

  // Get all users for user picker
  const users = await client.listUsers();
  console.log(
    'Available users:',
    users.map((u) => ({ id: u.id, name: u.name }))
  );
}

// ============================================================================
// Example 10: Complex Workflow - Task Assignment with Notification
// ============================================================================

async function assignTaskWithWorkflow() {
  const taskId = 'task_001';
  const userId = 'user_alice_123';

  // 1. Get user details
  const user = await client.getUser(userId, { includeSettings: true });
  console.log('Assigning to:', user.name, user.settings?.email);

  // 2. Assign task
  await client.assignUserToNode(taskId, userId, user.name);

  // 3. Update task status
  await client.updateNodeSettings(taskId, {
    assignee: user.name, // Also set assignee field for display
    status: 'assigned',
    assignedAt: new Date().toISOString(),
  });

  console.log('✅ Task assigned with workflow complete');

  // 4. (In real app, you'd send notification here)
  // await sendNotification(user.settings?.email, `You've been assigned task ${taskId}`);
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  console.log('=== Plugin Client Access Control Examples ===\n');

  // Uncomment to run specific examples:
  // await assignTaskToUser();
  // await assignTaskToMultipleUsers();
  // await assignTaskToTeam();
  // await reassignTask();
  // await makeTaskPublic();
  // await getMyTasks();
  // await createTaskWithAssignment();
  // await hybridAccess();
  // await listTeamsAndUsers();
  // await assignTaskWithWorkflow();
}

// main().catch(console.error);
