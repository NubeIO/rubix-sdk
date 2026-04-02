import { useState, useRef, useCallback } from 'react';
import type { TimesheetRow } from '../hooks/useTimesheetData';
import { formatDateKey } from '../hooks/useTimesheetData';
import type { TimeEntry } from '@features/time/types/time-entry.types';
import {
  createTimeEntryWithRecalc,
  updateTimeEntryWithRecalc,
  deleteTimeEntryWithRecalc,
} from '@features/time/utils/time-entry-helpers';

// @ts-ignore - SDK types
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@rubix-sdk/frontend/common/ui';

interface TimesheetGridProps {
  rows: TimesheetRow[];
  weekDays: Date[];
  dailyTotals: number[];
  weekTotal: number;
  entryMap: Map<string, TimeEntry>;
  currentUserId: string;
  currentUserName: string;
  client: any;
  onRefresh: () => void;
  onAddTicket: () => void;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatHours(h: number): string {
  if (h === 0) return '';
  return h % 1 === 0 ? String(h) : h.toFixed(1);
}

export function TimesheetGrid({
  rows,
  weekDays,
  dailyTotals,
  weekTotal,
  entryMap,
  currentUserId,
  currentUserName,
  client,
  onRefresh,
  onAddTicket,
}: TimesheetGridProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cellKey = (ticketId: string, dayIdx: number) => `${ticketId}:${dayIdx}`;

  const startEdit = (ticketId: string, dayIdx: number, currentHours: number) => {
    const key = cellKey(ticketId, dayIdx);
    setEditingCell(key);
    setEditValue(currentHours > 0 ? String(currentHours) : '');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveCell = useCallback(
    async (ticketId: string, dayIdx: number) => {
      const dateKey = formatDateKey(weekDays[dayIdx]);
      const hours = parseFloat(editValue) || 0;
      const existing = entryMap.get(`${ticketId}:${dateKey}`);

      setSaving(cellKey(ticketId, dayIdx));
      setEditingCell(null);

      try {
        if (hours === 0 && existing) {
          await deleteTimeEntryWithRecalc(client, existing.id);
        } else if (existing && hours > 0) {
          await updateTimeEntryWithRecalc(client, existing.id, { hours });
        } else if (hours > 0) {
          await createTimeEntryWithRecalc(client, {
            name: `${currentUserName} - ${hours}h - ${dateKey}`,
            parentId: ticketId,
            date: dateKey,
            hours,
            userId: currentUserId,
            userName: currentUserName,
            userNodeId: currentUserId,
          });
        }
        onRefresh();
      } catch (err) {
        console.error('[TimesheetGrid] Save failed:', err);
      } finally {
        setSaving(null);
      }
    },
    [editValue, entryMap, weekDays, client, currentUserId, currentUserName, onRefresh]
  );

  const handleKeyDown = (e: React.KeyboardEvent, ticketId: string, dayIdx: number) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      saveCell(ticketId, dayIdx);

      // Move to next cell
      if (e.key === 'Tab') {
        const nextDay = dayIdx + 1;
        if (nextDay < 7) {
          const dateKey = formatDateKey(weekDays[nextDay]);
          const entry = entryMap.get(`${ticketId}:${dateKey}`);
          setTimeout(() => startEdit(ticketId, nextDay, entry?.settings?.hours || 0), 50);
        }
      } else if (e.key === 'Enter') {
        // Move down to next row
        const nextRowIdx = rows.findIndex((r) => r.ticketId === ticketId) + 1;
        if (nextRowIdx < rows.length) {
          const nextRow = rows[nextRowIdx];
          const dateKey = formatDateKey(weekDays[dayIdx]);
          const entry = entryMap.get(`${nextRow.ticketId}:${dateKey}`);
          setTimeout(() => startEdit(nextRow.ticketId, dayIdx, entry?.settings?.hours || 0), 50);
        }
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px] min-w-[200px]">Ticket</TableHead>
            {DAY_LABELS.map((day, i) => (
              <TableHead key={day} className="w-16 text-center">
                <div>{day}</div>
                <div className="text-xs text-muted-foreground font-normal">
                  {weekDays[i]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </TableHead>
            ))}
            <TableHead className="w-16 text-center">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.ticketId}>
              <TableCell className="font-medium text-sm">
                <div className="truncate max-w-[240px]" title={row.ticketName}>
                  {row.productName && (
                    <span className="text-muted-foreground">{row.productName} &gt; </span>
                  )}
                  {row.ticketName}
                </div>
              </TableCell>
              {weekDays.map((day, dayIdx) => {
                const dateKey = formatDateKey(day);
                const entry = row.entries.get(dateKey);
                const hours = entry?.settings?.hours || 0;
                const key = cellKey(row.ticketId, dayIdx);
                const isEditing = editingCell === key;
                const isSaving = saving === key;

                return (
                  <TableCell
                    key={dayIdx}
                    className="text-center p-1 cursor-pointer hover:bg-muted/50 relative"
                    onClick={() => !isEditing && startEdit(row.ticketId, dayIdx, hours)}
                  >
                    {isSaving ? (
                      <span className="text-xs text-muted-foreground">...</span>
                    ) : isEditing ? (
                      <input
                        ref={inputRef}
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveCell(row.ticketId, dayIdx)}
                        onKeyDown={(e) => handleKeyDown(e, row.ticketId, dayIdx)}
                        className="w-12 h-7 text-center text-sm border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    ) : (
                      <span className={hours > 0 ? 'font-medium' : 'text-muted-foreground'}>
                        {hours > 0 ? formatHours(hours) : '\u2014'}
                      </span>
                    )}
                  </TableCell>
                );
              })}
              <TableCell className="text-center font-semibold text-sm">
                {formatHours(row.totalHours) || '\u2014'}
              </TableCell>
            </TableRow>
          ))}

          {/* Add ticket row */}
          <TableRow>
            <TableCell colSpan={9}>
              <button
                onClick={onAddTicket}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                + Add ticket...
              </button>
            </TableCell>
          </TableRow>

          {/* Daily totals */}
          <TableRow className="border-t-2 font-semibold">
            <TableCell className="text-sm">Daily total</TableCell>
            {dailyTotals.map((total, i) => (
              <TableCell key={i} className="text-center text-sm">
                {total > 0 ? formatHours(total) : '\u2014'}
              </TableCell>
            ))}
            <TableCell className="text-center text-sm">
              {weekTotal > 0 ? `${formatHours(weekTotal)}h` : '\u2014'}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
