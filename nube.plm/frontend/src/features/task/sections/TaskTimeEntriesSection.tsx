/**
 * Task Time Entries Section - Aggregated time logs across child tickets
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import type { Task } from '../types/task.types';
import type { Ticket } from '@features/ticket/types/ticket.types';
import type { TimeEntry } from '@features/time/types/time-entry.types';
import { recalculateTaskActualHours } from '../utils/task-helpers';

interface TaskTimeEntriesSectionProps {
  task: Task;
  client: any;
  onStatsUpdate: (stats: Record<string, unknown>) => void;
  onRefresh: () => void;
}

interface TimeEntryRow {
  id: string;
  ticketName: string;
  date: string;
  userName: string;
  hours: number;
  category: string;
  description: string;
}

export function TaskTimeEntriesSection({
  task,
  client,
  onStatsUpdate,
  onRefresh,
}: TaskTimeEntriesSectionProps) {
  const [entries, setEntries] = useState<TimeEntryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void fetchEntries();
  }, [task.id]);

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const tickets = await client.queryNodes({
        filter: `type is "core.ticket" and parent.id is "${task.id}"`,
      }) as Ticket[];

      const entryGroups = await Promise.all(
        tickets.map(async (ticket) => {
          const ticketEntries = await client.queryNodes({
            filter: `type is "core.entry" and parent.id is "${ticket.id}"`,
          }) as TimeEntry[];

          return ticketEntries.map((entry) => ({
            id: entry.id,
            ticketName: ticket.name,
            date: entry.settings?.date || '',
            userName: entry.settings?.userName || entry.settings?.userId || 'Unknown',
            hours: entry.settings?.hours || 0,
            category: entry.settings?.category || 'General',
            description: entry.settings?.description || '',
          }));
        })
      );

      const flattened = entryGroups.flat().sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      });

      const actualHours = flattened.reduce((sum, entry) => sum + entry.hours, 0);
      const estimatedHours = tickets.reduce((sum, ticket) => sum + (ticket.settings?.estimatedHours || 0), 0);

      setEntries(flattened);
      onStatsUpdate({
        actualHours,
        estimatedHours: estimatedHours || task.settings?.estimatedHours || 0,
      });
    } catch (error) {
      console.error('[TaskTimeEntriesSection] Failed to fetch task time entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      const actualHours = await recalculateTaskActualHours(client, task.id);
      onStatsUpdate({ actualHours });
      onRefresh();
      await fetchEntries();
    } catch (error) {
      console.error('[TaskTimeEntriesSection] Failed to recalculate task hours:', error);
      alert(error instanceof Error ? error.message : 'Failed to recalculate task hours');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Time Entries</h2>
          <p className="text-sm text-muted-foreground">
            Aggregated work logs from tickets under this task
          </p>
        </div>
        {/* @ts-ignore - SDK button */}
        <Button variant="outline" onClick={handleRecalculate}>
          Recalculate Hours
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Logged Time</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading time entries...</div>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No time entries recorded for this task yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.date || '—'}</TableCell>
                    <TableCell className="font-medium">{entry.ticketName}</TableCell>
                    <TableCell>{entry.userName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate text-muted-foreground">
                      {entry.description || '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium">{entry.hours}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
