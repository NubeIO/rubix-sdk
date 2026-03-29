/**
 * Time Entry helper functions
 */

// @ts-ignore - SDK types are resolved at build time
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { CreateTimeEntryInput } from '../types/time-entry.types';
import { recalculateActualHours } from '@features/ticket/utils/ticket-helpers';
import { recalculateTaskActualHours } from '@features/task/utils/task-helpers';

/**
 * Create a time entry and automatically update parent ticket's actualHours
 *
 * This is a convenience wrapper that:
 * 1. Validates input
 * 2. Creates the time entry
 * 3. Recalculates the ticket's actualHours
 * 4. Recalculates the task's actualHours (if ticket is under a task)
 *
 * @returns Created time entry node
 * @throws Error if validation fails or API calls fail
 */
export async function createTimeEntryWithRecalc(
  client: PluginClient,
  input: CreateTimeEntryInput
): Promise<any> {
  // Validate input
  if (input.hours <= 0) {
    throw new Error('Hours must be greater than 0');
  }

  const entryDate = new Date(input.date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (entryDate > today) {
    throw new Error('Cannot log time for future dates');
  }

  if (!input.parentId) {
    throw new Error('parentId (ticket ID) is required');
  }

  try {
    // Verify parent ticket exists
    const parentTicket = await client.getNode(input.parentId);
    if (!parentTicket || parentTicket.type !== 'plm.ticket') {
      throw new Error('Invalid parentId: must be a valid ticket ID');
    }

    // Create the time entry
    const entry = await client.createNode(input.parentId, {
      type: 'core.entry',
      profile: 'plm-time-log',
      name: input.name,
      identity: ['entry', 'time-log', 'plm'],
      settings: {
        date: input.date,
        hours: input.hours,
        userId: input.userId,
        userName: input.userName,
        description: input.description,
        category: input.category,
      },
    });

    // Recalculate ticket actualHours
    await recalculateActualHours(client, input.parentId);

    // Get ticket to find parent task (if exists)
    const ticket = await client.getNode(input.parentId);
    if (ticket?.parentId) {
      const parent = await client.getNode(ticket.parentId);
      if (parent?.type === 'plm.task') {
        // Recalculate task actualHours
        await recalculateTaskActualHours(client, parent.id);
      }
    }

    return entry;
  } catch (error) {
    console.error('Failed to create time entry with recalc:', error);
    throw error;
  }
}

/**
 * Delete a time entry and automatically update parent ticket's actualHours
 *
 * @returns void
 * @throws Error if API calls fail
 */
export async function deleteTimeEntryWithRecalc(
  client: PluginClient,
  entryId: string
): Promise<void> {
  try {
    // Get entry to find parent ticket
    const entry = await client.getNode(entryId);
    const ticketId = entry?.parentId;

    if (!ticketId) {
      throw new Error('Time entry has no parent ticket');
    }

    // Delete the entry
    await client.deleteNode(entryId);

    // Recalculate ticket actualHours
    await recalculateActualHours(client, ticketId);

    // Get ticket to find parent task (if exists)
    const ticket = await client.getNode(ticketId);
    if (ticket?.parentId) {
      const parent = await client.getNode(ticket.parentId);
      if (parent?.type === 'plm.task') {
        // Recalculate task actualHours
        await recalculateTaskActualHours(client, parent.id);
      }
    }
  } catch (error) {
    console.error(`Failed to delete time entry ${entryId} with recalc:`, error);
    throw error;
  }
}

/**
 * Update a time entry and automatically update parent ticket's actualHours
 *
 * @returns Updated time entry node
 * @throws Error if validation fails or API calls fail
 */
export async function updateTimeEntryWithRecalc(
  client: PluginClient,
  entryId: string,
  updates: { hours?: number; date?: string; description?: string; category?: string }
): Promise<any> {
  try {
    // Validate hours if provided
    if (updates.hours !== undefined && updates.hours <= 0) {
      throw new Error('Hours must be greater than 0');
    }

    // Validate date if provided
    if (updates.date) {
      const entryDate = new Date(updates.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (entryDate > today) {
        throw new Error('Cannot log time for future dates');
      }
    }

    // Get entry to find parent ticket
    const entry = await client.getNode(entryId);
    const ticketId = entry?.parentId;

    if (!ticketId) {
      throw new Error('Time entry has no parent ticket');
    }

    // Update the entry
    const updatedEntry = await client.updateNodeSettings(entryId, updates);

    // Recalculate ticket actualHours
    await recalculateActualHours(client, ticketId);

    // Get ticket to find parent task (if exists)
    const ticket = await client.getNode(ticketId);
    if (ticket?.parentId) {
      const parent = await client.getNode(ticket.parentId);
      if (parent?.type === 'plm.task') {
        // Recalculate task actualHours
        await recalculateTaskActualHours(client, parent.id);
      }
    }

    return updatedEntry;
  } catch (error) {
    console.error(`Failed to update time entry ${entryId} with recalc:`, error);
    throw error;
  }
}
