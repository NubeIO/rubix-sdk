import { useState, useEffect, useCallback } from 'react';
import type { Task } from '@features/task/types/task.types';
import type { Ticket } from '@features/ticket/types/ticket.types';
import type { TimeEntry } from '@features/time/types/time-entry.types';

export interface MyWorkData {
  tasks: (Task & { productName: string })[];
  tickets: (Ticket & { productName: string; taskName: string })[];
  timeEntries: TimeEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useMyWork(client: any, userNodeId: string | null): MyWorkData {
  const [tasks, setTasks] = useState<(Task & { productName: string })[]>([]);
  const [tickets, setTickets] = useState<(Ticket & { productName: string; taskName: string })[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!userNodeId) {
      setTasks([]);
      setTickets([]);
      setTimeEntries([]);
      return;
    }

    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);

      try {
        // Fetch assigned tasks and tickets in parallel
        const [rawTasks, rawTickets, rawEntries] = await Promise.all([
          client.queryNodes({
            filter: `type is "plm.task" and assignedUserRef is "${userNodeId}"`,
          }) as Promise<Task[]>,
          client.queryNodes({
            filter: `type is "plm.ticket" and assignedUserRef is "${userNodeId}"`,
          }) as Promise<Ticket[]>,
          client.queryNodes({
            filter: `type is "core.entry" and createdByRef is "${userNodeId}"`,
          }) as Promise<TimeEntry[]>,
        ]);

        if (cancelled) return;

        // Resolve product/task names for context
        const parentIds = new Set<string>();
        for (const t of rawTasks) if (t.parentId) parentIds.add(t.parentId);
        for (const t of rawTickets) if (t.parentId) parentIds.add(t.parentId);

        // Fetch all parent nodes in parallel
        const parentNodes = await Promise.all(
          Array.from(parentIds).map((id) => client.getNode(id).catch(() => null))
        );
        const parentMap = new Map<string, any>();
        for (const n of parentNodes) {
          if (n) parentMap.set(n.id, n);
        }

        // Also fetch grandparents for tickets under tasks
        const grandparentIds = new Set<string>();
        for (const t of rawTickets) {
          const parent = parentMap.get(t.parentId || '');
          if (parent?.type === 'plm.task' && parent.parentId) {
            grandparentIds.add(parent.parentId);
          }
        }
        if (grandparentIds.size > 0) {
          const gpNodes = await Promise.all(
            Array.from(grandparentIds).map((id) => client.getNode(id).catch(() => null))
          );
          for (const n of gpNodes) {
            if (n) parentMap.set(n.id, n);
          }
        }

        if (cancelled) return;

        // Enrich tasks with product name
        const enrichedTasks = rawTasks.map((t) => {
          const product = parentMap.get(t.parentId || '');
          return { ...t, productName: product?.name || 'Unknown' };
        });

        // Enrich tickets with product and task name
        const enrichedTickets = rawTickets.map((t) => {
          const parent = parentMap.get(t.parentId || '');
          if (parent?.type === 'plm.task') {
            const product = parentMap.get(parent.parentId || '');
            return {
              ...t,
              taskName: parent.name || '',
              productName: product?.name || 'Unknown',
            };
          }
          return {
            ...t,
            taskName: '',
            productName: parent?.name || 'Unknown',
          };
        });

        setTasks(enrichedTasks);
        setTickets(enrichedTickets);
        setTimeEntries(rawEntries);
      } catch (err: any) {
        if (!cancelled) {
          console.error('[useMyWork] Fetch error:', err);
          setError(err.message || 'Failed to load work data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [client, userNodeId, refreshKey]);

  return { tasks, tickets, timeEntries, loading, error, refresh };
}
