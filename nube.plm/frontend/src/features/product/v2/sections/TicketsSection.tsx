/**
 * Tickets Section - Unified view of all tickets across all tasks
 */

import React, { useState } from 'react';
// @ts-ignore - SDK types are resolved at build time
import { Button } from '@rubix-sdk/frontend/common/ui';
import { Plus } from 'lucide-react';
import type { Product } from '../../types/product.types';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Ticket } from '@features/ticket/types/ticket.types';
import { TicketDialog } from '@features/ticket/components/TicketDialog';
import { DeleteTicketDialog } from '@features/ticket/components/DeleteTicketDialog';
import {
  TicketStats,
  TicketFilters,
  TicketTable,
  useTicketData,
  useTicketFilters,
} from './tickets';

interface TicketsSectionProps {
  product: Product;
  client: PluginClient;
  onStatsUpdate: (stats: any) => void;
}

interface TicketWithTask extends Ticket {
  taskName?: string;
  taskId?: string;
}

export function TicketsSection({ product, client, onStatsUpdate }: TicketsSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null);

  // Fetch ticket data
  const { tickets, tasks, isLoading, stats: dataStats } = useTicketData({
    productId: product.id,
    client,
    refreshKey,
  });

  // Update parent stats
  React.useEffect(() => {
    onStatsUpdate(dataStats);
  }, [dataStats, onStatsUpdate]);

  // Filter tickets
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    taskFilter,
    setTaskFilter,
    filteredTickets,
    stats: filterStats,
    clearFilters,
  } = useTicketFilters(tickets);

  // Handlers
  const handleCreateTicket = (taskId?: string) => {
    setSelectedTaskId(taskId || null);
    setEditingTicket(null);
    setCreateDialogOpen(true);
  };

  const handleEditTicket = (ticket: TicketWithTask) => {
    setSelectedTaskId(ticket.taskId || null);
    setEditingTicket(ticket);
    setCreateDialogOpen(true);
  };

  const handleDeleteTicket = (ticket: Ticket) => {
    setDeletingTicket(ticket);
  };

  const handleTicketSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setCreateDialogOpen(false);
    setEditingTicket(null);
    setDeletingTicket(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
            <p className="text-sm text-muted-foreground">
              All tickets across all tasks
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading tickets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
          <p className="text-sm text-muted-foreground">
            All tickets across all tasks
          </p>
        </div>
        <Button onClick={() => handleCreateTicket()}>
          <Plus className="mr-2 h-4 w-4" />
          Create Ticket
        </Button>
      </div>

      {/* Statistics Cards */}
      <TicketStats
        total={filterStats.total}
        pending={filterStats.pending}
        inProgress={filterStats.inProgress}
        blocked={filterStats.blocked}
        review={filterStats.review}
        completed={filterStats.completed}
      />

      {/* Filters */}
      <TicketFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        taskFilter={taskFilter}
        onTaskFilterChange={setTaskFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        tasks={tasks}
        onClearFilters={clearFilters}
      />

      {/* Tickets Table */}
      <TicketTable
        tickets={filteredTickets}
        hasTickets={tickets.length > 0}
        onEdit={handleEditTicket}
        onDelete={handleDeleteTicket}
        onCreate={handleCreateTicket}
      />

      {/* Create/Edit Ticket Dialog */}
      {createDialogOpen && (
        <TicketDialog
          client={client}
          taskId={selectedTaskId || product.id}
          ticket={editingTicket || undefined}
          tasks={tasks}
          productId={product.id}
          onClose={() => {
            setCreateDialogOpen(false);
            setEditingTicket(null);
            setSelectedTaskId(null);
          }}
          onSuccess={handleTicketSuccess}
        />
      )}

      {/* Delete Ticket Dialog */}
      {deletingTicket && (
        <DeleteTicketDialog
          client={client}
          ticket={deletingTicket}
          onClose={() => setDeletingTicket(null)}
          onSuccess={handleTicketSuccess}
        />
      )}
    </div>
  );
}
