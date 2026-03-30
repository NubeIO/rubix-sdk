/**
 * Custom hook for fetching and managing ticket data
 */

import { useState, useEffect, useMemo } from 'react';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Ticket } from '@features/ticket/types/ticket.types';
import type { Task } from '@features/task/types/task.types';

interface TicketWithTask extends Ticket {
  taskName?: string;
  taskId?: string;
}

interface UseTicketDataProps {
  productId: string;
  client: PluginClient;
  refreshKey: number;
}

interface TicketStats {
  totalTickets: number;
  completedTickets: number;
  blockedTickets: number;
  ticketsByStatus: Record<string, number>;
}

export function useTicketData({ productId, client, refreshKey }: UseTicketDataProps) {
  const [tickets, setTickets] = useState<TicketWithTask[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [productId, refreshKey]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch tickets directly under the product
      const productTickets = await client.queryNodes({
        filter: `type is "plm.ticket" and parent.id is "${productId}"`,
      });

      // Fetch all tasks for this product (for task filter dropdown)
      const taskNodes = await client.queryNodes({
        filter: `type is "plm.task" and parent.id is "${productId}"`,
      });
      const taskList = taskNodes as Task[];
      setTasks(taskList);

      // Fetch all tickets under tasks
      const allTickets: TicketWithTask[] = [];

      // Add product-level tickets (no task)
      allTickets.push(...(productTickets as Ticket[]).map((ticket) => ({
        ...ticket,
        taskName: undefined,
        taskId: undefined,
      })));

      // Add task-level tickets
      await Promise.all(
        taskList.map(async (task) => {
          try {
            const ticketNodes = await client.queryNodes({
              filter: `type is "plm.ticket" and parent.id is "${task.id}"`,
            });
            const taskTickets = (ticketNodes as Ticket[]).map((ticket) => ({
              ...ticket,
              taskName: task.name,
              taskId: task.id,
            }));
            allTickets.push(...taskTickets);
          } catch (err) {
            console.error(`[useTicketData] Failed to fetch tickets for task ${task.id}:`, err);
          }
        })
      );

      setTickets(allTickets);
    } catch (err) {
      console.error('[useTicketData] Failed to fetch tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const stats: TicketStats = useMemo(() => {
    const totalTickets = tickets.length;
    const ticketsByStatus = tickets.reduce((acc: Record<string, number>, ticket) => {
      const status = ticket.settings?.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalTickets,
      completedTickets: ticketsByStatus['completed'] || 0,
      blockedTickets: ticketsByStatus['blocked'] || 0,
      ticketsByStatus,
    };
  }, [tickets]);

  return {
    tickets,
    tasks,
    isLoading,
    stats,
  };
}
