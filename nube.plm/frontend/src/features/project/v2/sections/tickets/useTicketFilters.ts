/**
 * Custom hook for managing ticket filters
 */

import { useState, useMemo } from 'react';
import type { Ticket } from '@features/ticket/types/ticket.types';

interface TicketWithTask extends Ticket {
  taskName?: string;
  taskId?: string;
}

export function useTicketFilters(tickets: TicketWithTask[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [taskFilter, setTaskFilter] = useState<string>('all');

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Search filter
      if (searchQuery && !ticket.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && ticket.settings?.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && ticket.settings?.priority !== priorityFilter) {
        return false;
      }

      // Task filter
      if (taskFilter === 'project-level') {
        if (ticket.taskId) return false; // Only show tickets without a task
      } else if (taskFilter !== 'all' && ticket.taskId !== taskFilter) {
        return false;
      }

      return true;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter, taskFilter]);

  const stats = useMemo(() => {
    const total = filteredTickets.length;
    const byStatus = filteredTickets.reduce((acc: Record<string, number>, ticket) => {
      const status = ticket.settings?.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      pending: byStatus['pending'] || 0,
      inProgress: byStatus['in-progress'] || 0,
      blocked: byStatus['blocked'] || 0,
      review: byStatus['review'] || 0,
      completed: byStatus['completed'] || 0,
      cancelled: byStatus['cancelled'] || 0,
    };
  }, [filteredTickets]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTaskFilter('all');
  };

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    taskFilter,
    setTaskFilter,
    filteredTickets,
    stats,
    clearFilters,
  };
}
