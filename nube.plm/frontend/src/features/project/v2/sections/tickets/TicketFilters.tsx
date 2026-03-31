/**
 * Ticket Filters Component
 */

import { Search } from 'lucide-react';
import { Button } from '@rubix-sdk/frontend/common/ui';
import type { Task } from '@features/task/types/task.types';

interface TicketFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  taskFilter: string;
  onTaskFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  tasks: Task[];
  onClearFilters: () => void;
}

export function TicketFilters({
  searchQuery,
  onSearchChange,
  taskFilter,
  onTaskFilterChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  tasks,
  onClearFilters,
}: TicketFiltersProps) {
  const hasActiveFilters =
    searchQuery ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    taskFilter !== 'all';

  return (
    <div className="flex flex-wrap gap-4 items-center p-4 border rounded-lg bg-muted/30">
      {/* Search Input */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tickets..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="px-3 py-1.5 text-sm border rounded-md bg-background"
        />
      </div>

      {/* Task Filter */}
      <select
        value={taskFilter}
        onChange={(e) => onTaskFilterChange(e.target.value)}
        className="px-3 py-1.5 text-sm border rounded-md bg-background"
      >
        <option value="all">All Tasks</option>
        <option value="project-level">Project-level (no task)</option>
        {tasks.map((task) => (
          <option key={task.id} value={task.id}>
            {task.name}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="px-3 py-1.5 text-sm border rounded-md bg-background"
      >
        <option value="all">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="blocked">Blocked</option>
        <option value="review">Review</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      {/* Priority Filter */}
      <select
        value={priorityFilter}
        onChange={(e) => onPriorityFilterChange(e.target.value)}
        className="px-3 py-1.5 text-sm border rounded-md bg-background"
      >
        <option value="all">All Priorities</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        <option value="Critical">Critical</option>
      </select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}
