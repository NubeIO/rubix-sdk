import { useMemo } from 'react';
import type { TimeEntry } from '@features/time/types/time-entry.types';

export interface TimesheetRow {
  ticketId: string;
  ticketName: string;
  productName: string;
  taskName: string;
  entries: Map<string, TimeEntry>; // key = ISO date string (YYYY-MM-DD)
  totalHours: number;
}

export interface TimesheetData {
  rows: TimesheetRow[];
  weekDays: Date[];
  dailyTotals: number[];
  weekTotal: number;
  entryMap: Map<string, TimeEntry>; // key = ticketId:date
  loading: boolean;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function useTimesheetData(
  weekStart: Date,
  allTimeEntries: TimeEntry[]
): TimesheetData {
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekStartKey = formatDateKey(weekStart);
  const weekEndKey = formatDateKey(weekDays[6]);

  // Filter entries to the current week and build grid
  const { rows, entryMap, dailyTotals, weekTotal } = useMemo(() => {
    const weekEntries = allTimeEntries.filter((e) => {
      const d = e.settings?.date;
      if (!d) return false;
      return d >= weekStartKey && d <= weekEndKey;
    });

    // Group by ticket (parentId)
    const ticketMap = new Map<string, TimeEntry[]>();
    for (const entry of weekEntries) {
      const key = entry.parentId;
      if (!ticketMap.has(key)) ticketMap.set(key, []);
      ticketMap.get(key)!.push(entry);
    }

    const eMap = new Map<string, TimeEntry>();
    const rows: TimesheetRow[] = [];

    for (const [ticketId, entries] of ticketMap) {
      const dayEntries = new Map<string, TimeEntry>();
      let totalHours = 0;

      for (const entry of entries) {
        const dateKey = entry.settings?.date || '';
        dayEntries.set(dateKey, entry);
        eMap.set(`${ticketId}:${dateKey}`, entry);
        totalHours += entry.settings?.hours || 0;
      }

      // Use entry metadata for display context
      const firstEntry = entries[0];
      rows.push({
        ticketId,
        ticketName: firstEntry?.name?.replace(/^.*? - \d+(\.\d+)?h - .*$/, '') || ticketId,
        productName: '',
        taskName: '',
        entries: dayEntries,
        totalHours,
      });
    }

    // Calculate daily totals
    const dailyTotals = weekDays.map((day) => {
      const dateKey = formatDateKey(day);
      let total = 0;
      for (const row of rows) {
        const entry = row.entries.get(dateKey);
        if (entry) total += entry.settings?.hours || 0;
      }
      return total;
    });

    const weekTotal = dailyTotals.reduce((a, b) => a + b, 0);

    return { rows, entryMap: eMap, dailyTotals, weekTotal };
  }, [allTimeEntries, weekStartKey, weekEndKey, weekDays]);

  return { rows, weekDays, dailyTotals, weekTotal, entryMap, loading: false };
}
