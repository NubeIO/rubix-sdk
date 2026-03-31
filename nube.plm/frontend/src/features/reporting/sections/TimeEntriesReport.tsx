import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { TimeEntry } from '@features/time/types/time-entry.types';

type EnrichedEntry = TimeEntry & { productName: string; ticketName: string };

interface TimeEntriesReportProps {
  entries: EnrichedEntry[];
}

interface UserSummary {
  name: string;
  hours: number;
  entryCount: number;
}

export function TimeEntriesReport({ entries }: TimeEntriesReportProps) {
  const [userFilter, setUserFilter] = useState('');

  // Group by user (createdByRef fallback to settings.userId)
  const userSummaries = useMemo(() => {
    const map = new Map<string, UserSummary>();
    for (const entry of entries) {
      const userName = entry.settings?.userName || entry.settings?.userId || 'Unknown';
      const existing = map.get(userName) || { name: userName, hours: 0, entryCount: 0 };
      existing.hours += entry.settings?.hours || 0;
      existing.entryCount += 1;
      map.set(userName, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.hours - a.hours);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!userFilter) return entries;
    const lower = userFilter.toLowerCase();
    return entries.filter((e) => {
      const name = (e.settings?.userName || e.settings?.userId || '').toLowerCase();
      return name.includes(lower);
    });
  }, [entries, userFilter]);

  const totalHours = filteredEntries.reduce((sum, e) => sum + (e.settings?.hours || 0), 0);

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No time entries found for selected products.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Time Entries by User</CardTitle>
          <Input
            placeholder="Filter by user..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="w-48"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User summary row */}
        <div className="flex flex-wrap gap-3">
          {userSummaries.map((u) => (
            <button
              key={u.name}
              type="button"
              onClick={() => setUserFilter(userFilter === u.name ? '' : u.name)}
              className={`rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted/50 ${
                userFilter === u.name ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <div className="text-sm font-medium">{u.name}</div>
              <div className="text-xs text-muted-foreground">
                {u.hours.toFixed(1)}h / {u.entryCount} entries
              </div>
            </button>
          ))}
        </div>

        {/* Entries table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Ticket</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="max-w-[200px]">Description</TableHead>
              <TableHead className="text-right">Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">
                  {entry.settings?.userName || entry.settings?.userId || 'Unknown'}
                </TableCell>
                <TableCell className="text-muted-foreground">{entry.productName}</TableCell>
                <TableCell>{entry.ticketName}</TableCell>
                <TableCell>{entry.settings?.date || '—'}</TableCell>
                <TableCell>
                  {entry.settings?.category ? (
                    <Badge variant="outline">{entry.settings.category}</Badge>
                  ) : '—'}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {entry.settings?.description || '—'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {entry.settings?.hours || 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Total */}
        <div className="flex justify-end border-t pt-3">
          <span className="text-sm font-semibold">
            Total: {totalHours.toFixed(1)}h ({filteredEntries.length} entries)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
