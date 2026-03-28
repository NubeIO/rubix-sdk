/**
 * Ticket helper functions
 *
 * IMPORTANT: These helpers MUST be called after any changes to child nodes
 * to prevent calculated field drift (see DESIGN-DECISIONS.md L1)
 */

// @ts-ignore - SDK types are resolved at build time
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { TimeEntry } from '@features/time/types/time-entry.types';

/**
 * Recalculate actual hours for a ticket by summing all time entries
 *
 * ⚠️ MUST call this after:
 * - Creating a time entry
 * - Updating a time entry's hours
 * - Deleting a time entry
 *
 * @returns Updated actual hours
 * @throws Error if API calls fail
 */
export async function recalculateActualHours(
  client: PluginClient,
  ticketId: string
): Promise<number> {
  try {
    // Query all time entries for this ticket
    const entries = await client.queryNodes({
      filter: `type is "core.entry" and parent.id is "${ticketId}"`
    }) as TimeEntry[];

    // Sum hours from all entries
    const actualHours = entries.reduce(
      (sum: number, entry: TimeEntry) => sum + (entry.settings?.hours || 0),
      0
    );

    // Update ticket settings
    await client.updateNodeSettings(ticketId, {
      actualHours
    });

    return actualHours;
  } catch (error) {
    console.error(`Failed to recalculate actual hours for ticket ${ticketId}:`, error);
    throw error;
  }
}

/**
 * Normalize ticket status values to prevent data drift
 *
 * ⚠️ ALWAYS use this before setting status
 * (see DESIGN-DECISIONS.md L5)
 */
export function normalizeTicketStatus(status?: string): string {
  const normalized = status?.trim().toLowerCase().replace(/_/g, '-');

  switch (normalized) {
    case 'completed':
      return 'completed';
    case 'in-progress':
      return 'in-progress';
    case 'blocked':
      return 'blocked';
    case 'review':
      return 'review';
    case 'cancelled':
      return 'cancelled';
    case 'pending':
    default:
      return 'pending';
  }
}

/**
 * Standard identity tags for tickets
 * Use these constants to ensure consistency
 */
export const TICKET_IDENTITY = {
  BUG: ['ticket', 'plm', 'bug'],
  FEATURE: ['ticket', 'plm', 'feature'],
  TASK: ['ticket', 'plm', 'task'],
  CHORE: ['ticket', 'plm', 'chore'],
} as const;
