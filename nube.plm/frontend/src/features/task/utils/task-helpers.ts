/**
 * Task helper functions
 *
 * IMPORTANT: These helpers MUST be called after any changes to child nodes
 * to prevent calculated field drift (see DESIGN-DECISIONS.md L1)
 */

// @ts-ignore - SDK types are resolved at build time
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Ticket } from '@features/ticket/types/ticket.types';

/**
 * Recalculate task progress based on completed tickets
 *
 * ⚠️ MUST call this after:
 * - Creating/updating/deleting tickets
 * - Changing ticket status to/from 'completed'
 *
 * @returns Updated progress percentage (0-100)
 * @throws Error if API calls fail
 */
export async function recalculateTaskProgress(
  client: PluginClient,
  taskId: string
): Promise<number> {
  try {
    // Query all tickets in task
    const tickets = await client.queryNodes({
      filter: `type is "plm.ticket" and parent.id is "${taskId}"`
    }) as Ticket[];

    if (tickets.length === 0) {
      await client.updateNodeSettings(taskId, {
        progress: 0,
        completed: false
      });
      return 0;
    }

    // Count completed tickets
    const completed = tickets.filter(
      (t: Ticket) => t.settings?.status === 'completed'
    ).length;

    const progress = Math.round((completed / tickets.length) * 100);
    const isCompleted = progress === 100;

    // Update task settings
    await client.updateNodeSettings(taskId, {
      progress,
      completed: isCompleted
    });

    return progress;
  } catch (error) {
    console.error(`Failed to recalculate task progress for ${taskId}:`, error);
    throw error;
  }
}

/**
 * Get all tickets for a project (direct + in tasks)
 *
 * This requires 2 queries because tickets can be under Project OR Task
 * (see DESIGN-DECISIONS.md L2 for details)
 *
 * @returns All tickets for the project (deduplicated)
 * @throws Error if API calls fail
 */
export async function getAllProjectTickets(
  client: PluginClient,
  projectId: string
): Promise<Ticket[]> {
  try {
    // Query 1: Direct tickets under project
    const directTickets = await client.queryNodes({
      filter: `type is "plm.ticket" and parent.id is "${projectId}"`
    }) as Ticket[];

    // Query 2: Tickets under tasks under project
    const taskTickets = await client.queryNodes({
      filter: `type is "plm.ticket" and parent.type is "plm.task" and parent.parent.id is "${projectId}"`
    }) as Ticket[];

    // Merge and deduplicate by ID
    const allTickets = [...directTickets, ...taskTickets];
    const uniqueTickets = Array.from(
      new Map(allTickets.map(t => [t.id, t])).values()
    );

    return uniqueTickets;
  } catch (error) {
    console.error(`Failed to get all project tickets for ${projectId}:`, error);
    throw error;
  }
}

/**
 * Recalculate actual hours for a task by summing all time entries
 * from all child tickets
 *
 * ⚠️ MUST call this after:
 * - Creating/updating/deleting time entries on any ticket in the task
 *
 * @returns Updated actual hours
 * @throws Error if API calls fail
 */
export async function recalculateTaskActualHours(
  client: PluginClient,
  taskId: string
): Promise<number> {
  try {
    // Get all tickets in task
    const tickets = await client.queryNodes({
      filter: `type is "plm.ticket" and parent.id is "${taskId}"`
    }) as Ticket[];

    if (tickets.length === 0) {
      await client.updateNodeSettings(taskId, { actualHours: 0 });
      return 0;
    }

    // Sum actualHours from all tickets
    const totalHours = tickets.reduce(
      (sum: number, ticket: Ticket) => sum + (ticket.settings?.actualHours || 0),
      0
    );

    // Update task
    await client.updateNodeSettings(taskId, {
      actualHours: totalHours
    });

    return totalHours;
  } catch (error) {
    console.error(`Failed to recalculate task actual hours for ${taskId}:`, error);
    throw error;
  }
}

/**
 * Recalculate progress and actualHours for all tasks in a project
 * Use for maintenance or fixing data drift
 *
 * @returns Summary of tasks fixed and any errors
 */
export async function recalculateAllProjectTasks(
  client: PluginClient,
  projectId: string
): Promise<{ tasksFixed: number; errors: string[] }> {
  const errors: string[] = [];
  let tasksFixed = 0;

  try {
    const tasks = await client.queryNodes({
      filter: `type is "plm.task" and parent.id is "${projectId}"`
    });

    for (const task of tasks) {
      try {
        await recalculateTaskProgress(client, task.id);
        await recalculateTaskActualHours(client, task.id);
        tasksFixed++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Task ${task.id}: ${errorMsg}`);
      }
    }

    return { tasksFixed, errors };
  } catch (error) {
    console.error(`Failed to recalculate all project tasks for ${projectId}:`, error);
    throw error;
  }
}
