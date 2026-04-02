import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';

// @ts-ignore - SDK types
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Skeleton, Badge, Button, Card, CardContent, CardHeader, CardTitle,
} from '@rubix-sdk/frontend/common/ui';

import { generateUsersReport } from '../utils/pdf-report';

// ── Types ──────────────────────────────────────────────────────────────────

interface UserInfo {
  id: string;
  name: string;
}

interface UserReport {
  id: string;
  name: string;
  taskCount: number;
  ticketCount: number;
  totalHours: number;
  filteredHours: number;
  entryCount: number;
  entries: EntryRow[];
  tasks: any[];
  tickets: any[];
}

interface EntryRow {
  id: string;
  ticketId: string;
  ticketName: string;
  date: string;
  hours: number;
  category: string;
  description: string;
}

interface AllUsersSectionProps {
  client: any;
  users: UserInfo[];
}

// ── Date range presets ─────────────────────────────────────────────────────

type Preset = '7d' | '30d' | '90d' | 'all';

const PRESETS: { value: Preset; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

function getPresetDateRange(preset: Preset): { from: string | null; to: string | null } {
  if (preset === 'all') return { from: null, to: null };
  const days = parseInt(preset);
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: from.toISOString().split('T')[0], to: null };
}

function formatDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatHours(h: number): string {
  return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`;
}

// ── Component ──────────────────────────────────────────────────────────────

export function AllUsersSection({ client, users }: AllUsersSectionProps) {
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<Preset>('30d');
  const [dateRange, setDateRange] = useState(getPresetDateRange('30d'));
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'entries' | 'tasks' | 'tickets'>('entries');

  const handlePreset = useCallback((preset: Preset) => {
    setDatePreset(preset);
    setDateRange(getPresetDateRange(preset));
  }, []);

  // Fetch all data for all users
  useEffect(() => {
    if (users.length === 0) { setLoading(false); return; }
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      try {
        const reports: UserReport[] = await Promise.all(
          users.map(async (u) => {
            const [tasks, tickets, allEntries] = await Promise.all([
              client.queryNodes({
                filter: `type is "plm.task" and assignedUserRef is "${u.id}"`,
              }),
              client.queryNodes({
                filter: `type is "plm.ticket" and assignedUserRef is "${u.id}"`,
              }),
              client.queryNodes({
                filter: `type is "core.entry" and createdByRef is "${u.id}"`,
              }),
            ]);

            // Resolve ticket names for entries
            const ticketIds = new Set((allEntries as any[]).map((e: any) => e.parentId).filter(Boolean));
            const ticketNodes = await Promise.all(
              Array.from(ticketIds).map((id) => client.getNode(id).catch(() => null))
            );
            const ticketMap = new Map(ticketNodes.filter(Boolean).map((n: any) => [n.id, n.name]));

            const totalHours = (allEntries as any[]).reduce(
              (sum: number, e: any) => sum + (e.settings?.hours || 0), 0
            );

            const entries: EntryRow[] = (allEntries as any[]).map((e: any) => ({
              id: e.id,
              ticketId: e.parentId || '',
              ticketName: ticketMap.get(e.parentId) || 'Unknown',
              date: e.settings?.date || '',
              hours: e.settings?.hours || 0,
              category: e.settings?.category || '',
              description: e.settings?.description || '',
            })).sort((a, b) => b.date.localeCompare(a.date));

            // Filter by date range
            const filtered = filterEntries(entries, dateRange);
            const filteredHours = filtered.reduce((sum, e) => sum + e.hours, 0);

            return {
              id: u.id,
              name: u.name,
              taskCount: tasks.length,
              ticketCount: tickets.length,
              totalHours,
              filteredHours,
              entryCount: filtered.length,
              entries,
              tasks,
              tickets,
            };
          })
        );

        if (!cancelled) setUserReports(reports);
      } catch (err) {
        console.error('[AllUsersSection] Fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [client, users]); // Intentionally not including dateRange - we filter client-side

  // Re-filter when date range changes (client-side, no API call)
  const filteredReports = useMemo(() => {
    return userReports.map((r) => {
      const filtered = filterEntries(r.entries, dateRange);
      return {
        ...r,
        filteredHours: filtered.reduce((sum, e) => sum + e.hours, 0),
        entryCount: filtered.length,
      };
    });
  }, [userReports, dateRange]);

  // Summary stats
  const stats = useMemo(() => {
    const totalUsers = filteredReports.length;
    const totalHours = filteredReports.reduce((s, r) => s + r.filteredHours, 0);
    const totalEntries = filteredReports.reduce((s, r) => s + r.entryCount, 0);
    const totalTasks = filteredReports.reduce((s, r) => s + r.taskCount, 0);
    const totalTickets = filteredReports.reduce((s, r) => s + r.ticketCount, 0);
    const activeUsers = filteredReports.filter((r) => r.filteredHours > 0).length;
    return { totalUsers, totalHours, totalEntries, totalTasks, totalTickets, activeUsers };
  }, [filteredReports]);

  // Expanded user data
  const expandedReport = useMemo(() => {
    if (!expandedUser) return null;
    const r = userReports.find((u) => u.id === expandedUser);
    if (!r) return null;
    return {
      ...r,
      filteredEntries: filterEntries(r.entries, dateRange),
    };
  }, [expandedUser, userReports, dateRange]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (filteredReports.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">No users found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date range filter + export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {PRESETS.map((p) => (
            <Button
              key={p.value}
              variant={datePreset === p.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePreset(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const presetLabel = PRESETS.find((p) => p.value === datePreset)?.label || 'Custom';
            const fullReports = filteredReports.map((r) => {
              const full = userReports.find((u) => u.id === r.id);
              return {
                name: r.name,
                taskCount: r.taskCount,
                ticketCount: r.ticketCount,
                entryCount: r.entryCount,
                filteredHours: r.filteredHours,
                tasks: (full?.tasks || []).map((t: any) => ({
                  name: t.name,
                  status: t.settings?.status || 'pending',
                  priority: t.settings?.priority || '-',
                  actualHours: t.settings?.actualHours ?? null,
                  estimatedHours: t.settings?.estimatedHours ?? null,
                  dueDate: t.settings?.dueDate || '',
                })),
                tickets: (full?.tickets || []).map((t: any) => ({
                  name: t.name,
                  ticketType: t.settings?.ticketType || '',
                  status: t.settings?.status || 'pending',
                  priority: t.settings?.priority || '-',
                  actualHours: t.settings?.actualHours ?? null,
                  estimatedHours: t.settings?.estimatedHours ?? null,
                })),
                entries: filterEntries(full?.entries || [], dateRange),
              };
            });
            generateUsersReport({
              title: 'Users Report',
              dateRangeLabel: presetLabel,
              users: fullReports,
              stats,
            });
          }}
        >
          <svg className="h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export PDF
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">of {stats.totalUsers} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">{stats.totalEntries} entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Assigned Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">across all users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Open Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">across all users</p>
          </CardContent>
        </Card>
      </div>

      {/* Users table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="text-center">Tasks</TableHead>
              <TableHead className="text-center">Tickets</TableHead>
              <TableHead className="text-center">Entries</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="w-[200px]">Distribution</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((row) => {
              const pct = stats.totalHours > 0
                ? (row.filteredHours / stats.totalHours) * 100
                : 0;
              const isExpanded = expandedUser === row.id;

              return (
                <Fragment key={row.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setExpandedUser(isExpanded ? null : row.id);
                      setSelectedTab('entries');
                    }}
                  >
                    <TableCell className="font-medium text-sm">
                      <span className="mr-2 text-muted-foreground text-xs">
                        {isExpanded ? '\u25BC' : '\u25B6'}
                      </span>
                      {row.name}
                    </TableCell>
                    <TableCell className="text-center text-sm">{row.taskCount}</TableCell>
                    <TableCell className="text-center text-sm">{row.ticketCount}</TableCell>
                    <TableCell className="text-center text-sm">{row.entryCount}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {row.filteredHours > 0 ? formatHours(row.filteredHours) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {pct > 0 ? `${pct.toFixed(0)}%` : ''}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded detail */}
                  {isExpanded && expandedReport && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/20 p-0">
                        <div className="p-4 space-y-4">
                          {/* Sub-tabs */}
                          <div className="flex gap-1">
                            {(['entries', 'tasks', 'tickets'] as const).map((tab) => (
                              <Button
                                key={tab}
                                variant={selectedTab === tab ? 'default' : 'ghost'}
                                size="sm"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  setSelectedTab(tab);
                                }}
                              >
                                {tab === 'entries'
                                  ? `Time Entries (${expandedReport.filteredEntries.length})`
                                  : tab === 'tasks'
                                  ? `Tasks (${expandedReport.taskCount})`
                                  : `Tickets (${expandedReport.ticketCount})`}
                              </Button>
                            ))}
                          </div>

                          {/* Time entries detail */}
                          {selectedTab === 'entries' && (
                            expandedReport.filteredEntries.length > 0 ? (
                              <div className="rounded-md border bg-background">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Ticket</TableHead>
                                      <TableHead>Category</TableHead>
                                      <TableHead>Description</TableHead>
                                      <TableHead className="text-right">Hours</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {expandedReport.filteredEntries.map((entry) => (
                                      <TableRow key={entry.id}>
                                        <TableCell className="text-sm">
                                          {entry.date ? formatDate(entry.date) : '-'}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">
                                          {entry.ticketName}
                                        </TableCell>
                                        <TableCell>
                                          {entry.category ? (
                                            <Badge variant="outline">{entry.category}</Badge>
                                          ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                          {entry.description || '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-medium">
                                          {entry.hours}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                    {/* Total row */}
                                    <TableRow className="border-t-2 font-semibold">
                                      <TableCell colSpan={4} className="text-sm text-right">
                                        Total
                                      </TableCell>
                                      <TableCell className="text-right text-sm">
                                        {formatHours(expandedReport.filteredEntries.reduce((s, e) => s + e.hours, 0))}
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground py-4 text-center">
                                No time entries in selected period.
                              </p>
                            )
                          )}

                          {/* Tasks detail */}
                          {selectedTab === 'tasks' && (
                            expandedReport.tasks.length > 0 ? (
                              <div className="rounded-md border bg-background">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Task</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Priority</TableHead>
                                      <TableHead className="text-right">Hours</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {expandedReport.tasks.map((t: any) => (
                                      <TableRow key={t.id}>
                                        <TableCell className="text-sm font-medium">{t.name}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline">
                                            {t.settings?.status || 'pending'}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                          {t.settings?.priority || '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-sm">
                                          {t.settings?.actualHours
                                            ? formatHours(t.settings.actualHours)
                                            : '-'}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground py-4 text-center">
                                No tasks assigned.
                              </p>
                            )
                          )}

                          {/* Tickets detail */}
                          {selectedTab === 'tickets' && (
                            expandedReport.tickets.length > 0 ? (
                              <div className="rounded-md border bg-background">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Ticket</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Priority</TableHead>
                                      <TableHead className="text-right">Hours</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {expandedReport.tickets.map((t: any) => (
                                      <TableRow key={t.id}>
                                        <TableCell className="text-sm font-medium">{t.name}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline">
                                            {t.settings?.ticketType || '-'}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline">
                                            {t.settings?.status || 'pending'}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                          {t.settings?.priority || '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-sm">
                                          {t.settings?.actualHours != null
                                            ? `${t.settings.actualHours}/${t.settings?.estimatedHours || 0}`
                                            : '-'}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground py-4 text-center">
                                No tickets assigned.
                              </p>
                            )
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}

            {/* Grand total row */}
            <TableRow className="border-t-2 bg-muted/30 font-semibold">
              <TableCell className="text-sm">Total ({filteredReports.length} users)</TableCell>
              <TableCell className="text-center text-sm">{stats.totalTasks}</TableCell>
              <TableCell className="text-center text-sm">{stats.totalTickets}</TableCell>
              <TableCell className="text-center text-sm">{stats.totalEntries}</TableCell>
              <TableCell className="text-right text-sm">{formatHours(stats.totalHours)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function filterEntries(entries: EntryRow[], range: { from: string | null; to: string | null }): EntryRow[] {
  if (!range.from && !range.to) return entries;
  return entries.filter((e) => {
    if (!e.date) return true;
    if (range.from && e.date < range.from) return false;
    if (range.to && e.date > range.to) return false;
    return true;
  });
}
