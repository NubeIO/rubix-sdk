/**
 * Enhanced Data Table for All Tasks
 * Using TanStack Table with shadcn/ui
 */

import { useState, useMemo, Fragment } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
// @ts-ignore
import { Button } from '@rubix-sdk/frontend/common/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Search, Pencil, Trash2, Filter, X, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import type { Task } from '@features/task/types/task.types';
import type { Product } from '@features/product/types/product.types';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import { TaskStatusBadge } from '@features/task/components/TaskStatusBadge';
import { TasksNestedTickets } from './tasks-nested-tickets';

interface TasksDataTableProps {
  tasks: Task[];
  products: Product[];
  client: PluginClient;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string, taskName: string) => void;
}

export function TasksDataTable({ tasks, products, client, onEdit, onDelete }: TasksDataTableProps) {
  console.log('[TasksDataTable] Rendering with:', { tasksCount: tasks.length, productsCount: products.length });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Create product lookup map (memoized)
  const productMap = useMemo(() => {
    return products.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, Product>);
  }, [products]);

  // Apply filters to tasks (memoized to prevent infinite loops)
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (statusFilter !== 'all' && task.settings?.status !== statusFilter) {
        return false;
      }
      // Product filter
      if (productFilter !== 'all' && task.parentId !== productFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, statusFilter, productFilter]);

  // Helper to check if task is overdue
  const isTaskOverdue = (task: Task) => {
    if (!task.settings?.dueDate || task.settings?.status === 'completed') {
      return false;
    }
    return new Date(task.settings.dueDate) < new Date();
  };

  const toggleRow = (taskId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Define columns
  const columns: ColumnDef<Task>[] = [
    {
      id: 'expand',
      header: '',
      cell: ({ row }) => {
        const task = row.original;
        const isExpanded = expandedRows.has(task.id);
        return (
          <button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              toggleRow(task.id);
            }}
            className="p-1 hover:bg-muted rounded"
            title={isExpanded ? 'Collapse tickets' : 'Expand tickets'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        );
      },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Task Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      id: 'product',
      accessorFn: (row) => productMap[row.parentId || '']?.name || 'Unknown',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Product
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const task = row.original;
        const product = productMap[task.parentId || ''];
        return (
          <div className="flex items-center gap-2">
            {product ? (
              <>
                <span className="font-medium">{product.name}</span>
                {product.settings?.code && (
                  <Badge variant="outline" className="text-xs">
                    {product.settings.code}
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">Unknown</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'settings.status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.settings?.status;
        return <TaskStatusBadge status={status} />;
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'settings.priority',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Priority
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const priority = row.original.settings?.priority || 'medium';
        const variants: Record<string, any> = {
          critical: 'destructive',
          high: 'destructive',
          medium: 'default',
          low: 'secondary',
        };
        return (
          <Badge variant={variants[priority.toLowerCase()] || 'default'}>
            {priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'settings.progress',
      header: 'Progress',
      cell: ({ row }) => {
        const progress = row.original.settings?.progress || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  progress < 30
                    ? 'bg-destructive'
                    : progress < 70
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-8">{progress}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'settings.assignee',
      header: 'Assignee',
      cell: ({ row }) => {
        const assignee = row.original.settings?.assignee;
        return assignee || <span className="text-muted-foreground">Unassigned</span>;
      },
    },
    {
      accessorKey: 'settings.dueDate',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Due Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const dueDate = row.original.settings?.dueDate;
        if (!dueDate) return <span className="text-muted-foreground">No date</span>;

        const date = new Date(dueDate);
        const isOverdue = date < new Date() && row.original.settings?.status !== 'completed';

        return (
          <span className={isOverdue ? 'text-destructive font-medium' : ''}>
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(task)}
                title="Edit task"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task.id, task.name)}
                title="Delete task"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredTasks,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  console.log('[TasksDataTable] Table rows:', table.getRowModel().rows.length);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="space-y-3">
        {/* Search and Count */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} of {filteredTasks.length} task(s)
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />

          {/* Status Filter Chips */}
          <div className="flex gap-1">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(option.value)}
                className="h-7"
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Product Filter Dropdown */}
          <select
            value={productFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProductFilter(e.target.value)}
            className="h-7 px-3 text-sm border rounded-md bg-background"
          >
            <option value="all">All Products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {(statusFilter !== 'all' || productFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setProductFilter('all');
              }}
              className="h-7"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const task = row.original;
                const isOverdue = isTaskOverdue(task);
                const isExpanded = expandedRows.has(task.id);

                return (
                  <Fragment key={row.id}>
                    {/* Main Task Row */}
                    <TableRow
                      data-state={row.getIsSelected() && 'selected'}
                      className={`${
                        isOverdue ? 'bg-destructive/5 border-l-4 border-l-destructive' : ''
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {cell.column.id === 'name' && isOverdue && (
                            <AlertCircle className="inline h-4 w-4 text-destructive mr-2" />
                          )}
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Nested Tickets Row */}
                    {isExpanded && (
                      <TasksNestedTickets task={task} client={client} />
                    )}
                  </Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
