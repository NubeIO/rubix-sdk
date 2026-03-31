/**
 * Task Overview Section - Dashboard summary for a single task
 */

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@features/project/v2/components/StatCard';
import type { Task } from '../types/task.types';
import type { Ticket } from '@features/ticket/types/ticket.types';
import { normalizeTicketStatus } from '@features/ticket/utils/ticket-helpers';
import { formatTaskDate } from '../utils/task-date';

interface TaskOverviewSectionProps {
  task: Task;
  client: any;
  stats: {
    totalTickets: number;
    ticketsCompleted: number;
    ticketsInProgress: number;
    ticketsBlocked: number;
    progress: number;
    actualHours: number;
    estimatedHours: number;
    lastActivity: string;
  };
  onStatsUpdate: (stats: Record<string, unknown>) => void;
}

export function TaskOverviewSection({
  task,
  client,
  stats,
  onStatsUpdate,
}: TaskOverviewSectionProps) {
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    void fetchOverviewData();
  }, [task.id]);

  const fetchOverviewData = async () => {
    try {
      const nodes = await client.queryNodes({
        filter: `type is "plm.ticket" and parent.id is "${task.id}"`,
      });

      const tickets = (nodes || []) as Ticket[];
      const completed = tickets.filter((ticket) => normalizeTicketStatus(ticket.settings?.status) === 'completed').length;
      const inProgress = tickets.filter((ticket) => normalizeTicketStatus(ticket.settings?.status) === 'in-progress').length;
      const blocked = tickets.filter((ticket) => normalizeTicketStatus(ticket.settings?.status) === 'blocked').length;
      const estimatedHours = tickets.reduce((sum, ticket) => sum + (ticket.settings?.estimatedHours || 0), 0);
      const actualHours = tickets.reduce((sum, ticket) => sum + (ticket.settings?.actualHours || 0), 0);

      onStatsUpdate({
        totalTickets: tickets.length,
        ticketsCompleted: completed,
        ticketsInProgress: inProgress,
        ticketsBlocked: blocked,
        progress: tickets.length > 0 ? Math.round((completed / tickets.length) * 100) : (task.settings?.progress || 0),
        estimatedHours: estimatedHours || task.settings?.estimatedHours || 0,
        actualHours: actualHours || task.settings?.actualHours || 0,
        lastActivity: task.updatedAt || new Date().toISOString(),
      });

      const sortedTickets = [...tickets].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setRecentTickets(sortedTickets.slice(0, 5));
    } catch (error) {
      console.error('[TaskOverviewSection] Failed to fetch overview data:', error);
    }
  };

  const healthLabel = stats.progress >= 80 ? 'On Track' : stats.ticketsBlocked > 0 ? 'At Risk' : 'Needs Attention';
  const lastActivity = new Date(stats.lastActivity);
  const hoursRemaining = Math.max(0, (stats.estimatedHours || 0) - (stats.actualHours || 0));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Progress"
          value={`${stats.progress}%`}
          description={`${stats.ticketsCompleted} of ${stats.totalTickets} tickets completed`}
          icon={CheckCircle2}
          iconBgColor="bg-emerald-500"
        />
        <StatCard
          title="Active Tickets"
          value={stats.ticketsInProgress}
          description={`${stats.ticketsBlocked} blocked right now`}
          icon={Activity}
          iconBgColor="bg-blue-500"
        />
        <StatCard
          title="Hours Logged"
          value={`${stats.actualHours}h`}
          description={`${hoursRemaining}h remaining against estimate`}
          icon={Clock3}
          iconBgColor="bg-amber-500"
        />
        <StatCard
          title="Task Health"
          value={healthLabel}
          description={`Last activity ${lastActivity.toLocaleDateString('en-US')}`}
          icon={AlertTriangle}
          iconBgColor={stats.ticketsBlocked > 0 ? 'bg-red-500' : 'bg-violet-500'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">Execution Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ticket completion</span>
                <span className="font-medium">{stats.progress}%</span>
              </div>
              <Progress value={stats.progress} className="h-2.5" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Due Date
                </div>
                <div className="mt-2 text-sm font-medium">
                  {formatTaskDate(task.settings?.dueDate)}
                </div>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Assignee
                </div>
                <div className="mt-2 text-sm font-medium">
                  {task.settings?.assignee || 'Unassigned'}
                </div>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Priority
                </div>
                <div className="mt-2 text-sm font-medium">
                  {task.settings?.priority || 'Medium'}
                </div>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Story Points
                </div>
                <div className="mt-2 text-sm font-medium">
                  {task.settings?.storyPoints || 0}
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Description
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {task.settings?.description || 'No description provided for this task yet.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentTickets.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No tickets created for this task yet.
              </div>
            ) : (
              recentTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{ticket.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {ticket.settings?.assignee || 'Unassigned'}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {normalizeTicketStatus(ticket.settings?.status)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
