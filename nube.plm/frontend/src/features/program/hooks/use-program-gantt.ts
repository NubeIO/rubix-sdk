import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { CATEGORIES } from '@shared/constants/categories';
import { getTaskGate } from '@shared/utils/gate-helpers';
import type { CategoryGroup, GanttTask, GanttTicket } from '../types/program.types';

export interface UseProgramGanttConfig {
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
}

export function useProgramGantt(config: UseProgramGanttConfig, productId: string) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = createPluginClient({
    orgId: config.orgId,
    deviceId: config.deviceId,
    baseUrl: config.baseUrl,
    token: config.token,
  });

  const fetchTasks = useCallback(async () => {
    if (!config.orgId || !config.deviceId || !productId) return;

    try {
      const result = await client.queryNodes({
        filter: `type is "plm.task" and parent.id is "${productId}"`
      });
      const fetchedTasks = Array.isArray(result) ? result : result.nodes || [];
      setTasks(fetchedTasks);

      // Fetch tickets scoped per-task via Promise.all
      if (fetchedTasks.length > 0) {
        const ticketResults = await Promise.all(
          fetchedTasks.map((task: any) =>
            client.queryNodes({
              filter: `type is "plm.ticket" and parent.id is "${task.id}"`
            }).then((r: any) => Array.isArray(r) ? r : r.nodes || [])
          )
        );
        setTickets(ticketResults.flat());
      } else {
        setTickets([]);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gantt data');
      console.error('[useProgramGantt] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [config.orgId, config.deviceId, config.baseUrl, config.token, productId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Group by category, attach tickets to their parent tasks
  const categoryGroups: CategoryGroup[] = useMemo(() => {
    const allCategories = CATEGORIES.map(cat => ({
      category: cat as { id: string; name: string; description: string },
      tasks: tasks
        .filter((t: any) => t.settings?.category === cat.id)
        .map((task: any): GanttTask => ({
          id: task.id,
          name: task.name,
          category: task.settings?.category || 'uncategorised',
          gate: getTaskGate(task.settings?.tags),
          assignee: task.settings?.assignee,
          status: task.settings?.status,
          progress: task.settings?.progress,
          startDate: task.settings?.startDate,
          dueDate: task.settings?.dueDate,
          tickets: tickets
            .filter((ticket: any) => ticket.parentId === task.id)
            .map((ticket: any): GanttTicket => ({
              id: ticket.id,
              name: ticket.name,
              parentId: ticket.parentId,
              status: ticket.settings?.status,
            })),
        })),
    }));

    // Include uncategorised tasks
    const categorisedIds = new Set(CATEGORIES.map(c => c.id));
    const uncategorised = tasks.filter((t: any) => !categorisedIds.has(t.settings?.category));
    if (uncategorised.length > 0) {
      allCategories.push({
        category: { id: 'uncategorised', name: 'Uncategorised', description: 'Tasks without a category' },
        tasks: uncategorised.map((task: any): GanttTask => ({
          id: task.id,
          name: task.name,
          category: 'uncategorised',
          gate: getTaskGate(task.settings?.tags),
          assignee: task.settings?.assignee,
          status: task.settings?.status,
          progress: task.settings?.progress,
          startDate: task.settings?.startDate,
          dueDate: task.settings?.dueDate,
          tickets: tickets
            .filter((ticket: any) => ticket.parentId === task.id)
            .map((ticket: any): GanttTicket => ({
              id: ticket.id,
              name: ticket.name,
              parentId: ticket.parentId,
              status: ticket.settings?.status,
            })),
        })),
      });
    }

    return allCategories.filter(group => group.tasks.length > 0);
  }, [tasks, tickets]);

  return { categoryGroups, allTasks: tasks, isLoading, error, refetch: fetchTasks };
}
