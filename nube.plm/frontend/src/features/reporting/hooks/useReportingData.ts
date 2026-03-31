import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@features/product/types/product.types';
import type { Task } from '@features/task/types/task.types';
import type { Ticket } from '@features/ticket/types/ticket.types';
import type { TimeEntry } from '@features/time/types/time-entry.types';
import type { ManufacturingRun, ManufacturingUnit } from '@features/production-run/types/production-run.types';

export interface ReportingStats {
  totalProducts: number;
  totalTasks: number;
  tasksCompleted: number;
  totalTickets: number;
  ticketsOpen: number;
  ticketsClosed: number;
  totalHours: number;
  totalRuns: number;
}

export interface ReportingData {
  products: Product[];
  tasks: Task[];
  tickets: Ticket[];
  timeEntries: (TimeEntry & { productName: string; ticketName: string })[];
  manufacturingRuns: (ManufacturingRun & { productName: string })[];
  units: ManufacturingUnit[];
  stats: ReportingStats;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

interface DateRange {
  from: Date | null;
  to: Date | null;
}

export function useReportingData(
  client: any,
  selectedProductIds: Set<string>,
  dateRange: DateRange
): ReportingData {
  const [products, setProducts] = useState<Product[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [timeEntries, setTimeEntries] = useState<(TimeEntry & { productName: string; ticketName: string })[]>([]);
  const [manufacturingRuns, setManufacturingRuns] = useState<(ManufacturingRun & { productName: string })[]>([]);
  const [units, setUnits] = useState<ManufacturingUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (selectedProductIds.size === 0) {
      setProducts([]);
      setTasks([]);
      setTickets([]);
      setTimeEntries([]);
      setManufacturingRuns([]);
      setUnits([]);
      return;
    }

    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);

      try {
        const productIds = Array.from(selectedProductIds);

        // Fetch all products first (for name lookups)
        const allProducts = await client.queryNodes({
          filter: 'type is "plm.product"',
        }) as Product[];
        const selectedProducts = allProducts.filter((p) => productIds.includes(p.id));
        const productMap = new Map(selectedProducts.map((p) => [p.id, p]));

        if (cancelled) return;

        // Fetch tasks and tickets for each product in parallel
        const [taskResults, ticketResults, runResults] = await Promise.all([
          // Tasks
          Promise.all(
            productIds.map((pid) =>
              client.queryNodes({ filter: `type is "plm.task" and parent.id is "${pid}"` })
            )
          ),
          // Product-level tickets
          Promise.all(
            productIds.map((pid) =>
              client.queryNodes({ filter: `type is "plm.ticket" and parent.id is "${pid}"` })
            )
          ),
          // Manufacturing runs
          Promise.all(
            productIds.map((pid) =>
              client.queryNodes({ filter: `type is "plm.manufacturing-run" and parent.id is "${pid}"` })
            )
          ),
        ]);

        if (cancelled) return;

        const allTasks = taskResults.flat() as Task[];
        let allTickets = ticketResults.flat() as Ticket[];

        // Also fetch task-level tickets
        if (allTasks.length > 0) {
          const taskTicketResults = await Promise.all(
            allTasks.map((t) =>
              client.queryNodes({ filter: `type is "plm.ticket" and parent.id is "${t.id}"` })
            )
          );
          const taskTickets = taskTicketResults.flat() as Ticket[];
          // Merge, avoiding duplicates
          const ticketIds = new Set(allTickets.map((t) => t.id));
          for (const t of taskTickets) {
            if (!ticketIds.has(t.id)) {
              allTickets.push(t);
            }
          }
        }

        if (cancelled) return;

        // Fetch time entries for all tickets
        let allTimeEntries: (TimeEntry & { productName: string; ticketName: string })[] = [];
        if (allTickets.length > 0) {
          const entryResults = await Promise.all(
            allTickets.map((ticket) =>
              client.queryNodes({ filter: `type is "core.entry" and parent.id is "${ticket.id}"` })
                .then((entries: TimeEntry[]) =>
                  entries.map((e) => ({
                    ...e,
                    ticketName: ticket.name,
                    productName: findProductName(ticket, allTasks, productMap),
                  }))
                )
            )
          );
          allTimeEntries = entryResults.flat();
        }

        if (cancelled) return;

        // Fetch units for manufacturing runs
        const allRuns = runResults.flat() as ManufacturingRun[];
        const runsWithProduct = allRuns.map((run) => ({
          ...run,
          productName: productMap.get(run.parentId || '')?.name || 'Unknown',
        }));

        let allUnits: ManufacturingUnit[] = [];
        if (allRuns.length > 0) {
          const unitResults = await Promise.all(
            allRuns.map((run) =>
              client.queryNodes({ filter: `type is "core.asset" and parent.id is "${run.id}"` })
            )
          );
          allUnits = unitResults.flat() as ManufacturingUnit[];
        }

        if (cancelled) return;

        // Apply date range filter to time entries
        const filteredEntries = filterByDateRange(allTimeEntries, dateRange);

        setProducts(selectedProducts);
        setTasks(allTasks);
        setTickets(allTickets);
        setTimeEntries(filteredEntries);
        setManufacturingRuns(runsWithProduct);
        setUnits(allUnits);
      } catch (err: any) {
        if (!cancelled) {
          console.error('[useReportingData] Fetch error:', err);
          setError(err.message || 'Failed to load reporting data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [client, selectedProductIds, dateRange, refreshKey]);

  const stats: ReportingStats = {
    totalProducts: products.length,
    totalTasks: tasks.length,
    tasksCompleted: tasks.filter((t) => t.settings?.status === 'completed').length,
    totalTickets: tickets.length,
    ticketsOpen: tickets.filter((t) => t.settings?.status !== 'completed' && t.settings?.status !== 'cancelled').length,
    ticketsClosed: tickets.filter((t) => t.settings?.status === 'completed' || t.settings?.status === 'cancelled').length,
    totalHours: timeEntries.reduce((sum, e) => sum + (e.settings?.hours || 0), 0),
    totalRuns: manufacturingRuns.length,
  };

  return {
    products,
    tasks,
    tickets,
    timeEntries,
    manufacturingRuns,
    units,
    stats,
    loading,
    error,
    refresh,
  };
}

function findProductName(
  ticket: Ticket,
  tasks: Task[],
  productMap: Map<string, Product>
): string {
  // Direct product child
  const directProduct = productMap.get(ticket.parentId || '');
  if (directProduct) return directProduct.name;
  // Task child — find parent task then its product
  const parentTask = tasks.find((t) => t.id === ticket.parentId);
  if (parentTask) {
    const product = productMap.get(parentTask.parentId || '');
    if (product) return product.name;
  }
  return 'Unknown';
}

function filterByDateRange<T extends { settings?: { date?: string } }>(
  entries: T[],
  dateRange: DateRange
): T[] {
  if (!dateRange.from && !dateRange.to) return entries;
  return entries.filter((e) => {
    const dateStr = e.settings?.date;
    if (!dateStr) return true; // Include entries without dates
    const date = new Date(dateStr);
    if (dateRange.from && date < dateRange.from) return false;
    if (dateRange.to && date > dateRange.to) return false;
    return true;
  });
}
