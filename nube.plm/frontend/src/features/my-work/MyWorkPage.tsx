/**
 * My Work Page - Personal dashboard with timesheet, tasks, and tickets
 *
 * Service-level page that shows the current user's assigned work
 * and provides a weekly timesheet for quick time logging.
 */

import { createRoot, type Root } from 'react-dom/client';
import { useState, useMemo, useCallback } from 'react';
import '@rubix-sdk/frontend/globals.css';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
// @ts-ignore - SDK types
import { Tabs, Skeleton } from '@rubix-sdk/frontend/common/ui';
import type { Tab } from '@rubix-sdk/frontend/common/ui';

import { useCurrentUser } from './hooks/useCurrentUser';
import { useMyWork } from './hooks/useMyWork';
import { useTimesheetData, getWeekStart } from './hooks/useTimesheetData';
import { UserSelector } from './components/UserSelector';
import { WeekNavigator } from './components/WeekNavigator';
import { TicketPicker } from './components/TicketPicker';
import { TimesheetGrid } from './sections/TimesheetGrid';
import { MyTasksSection } from './sections/MyTasksSection';
import { MyTicketsSection } from './sections/MyTicketsSection';
import { AllUsersSection } from './sections/AllUsersSection';

interface MyWorkPageProps {
  orgId: string;
  deviceId: string;
  baseUrl: string;
  token?: string;
}

const PAGE_TABS: Tab[] = [
  { value: 'my-work', label: 'My Work' },
  { value: 'all-users', label: 'All Users' },
];

function MyWorkDashboard({ orgId, deviceId, baseUrl, token }: MyWorkPageProps) {
  const [activeTab, setActiveTab] = useState('my-work');
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [ticketPickerOpen, setTicketPickerOpen] = useState(false);

  const client = useMemo(
    () => createPluginClient({ orgId, deviceId, baseUrl, token }),
    [orgId, deviceId, baseUrl, token]
  );

  const { user, users, loading: usersLoading, pickUser } = useCurrentUser(client);
  const workData = useMyWork(client, user?.id || null);
  const timesheetData = useTimesheetData(weekStart, workData.timeEntries);

  const handleAddTicket = useCallback(
    async (_ticketId: string, _ticketName: string) => {
      setTicketPickerOpen(false);
      workData.refresh();
    },
    [workData]
  );

  if (usersLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">My Work</h1>
          <Tabs tabs={PAGE_TABS} value={activeTab} onValueChange={setActiveTab} />
        </div>

        {/* User selector */}
        <UserSelector
          users={users}
          currentUser={user}
          loading={usersLoading}
          onSelect={pickUser}
        />

        {!user ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              Select a user above to view their work and timesheet.
            </p>
          </div>
        ) : activeTab === 'my-work' ? (
          <>
            {/* Timesheet */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Timesheet</h2>
                <WeekNavigator weekStart={weekStart} onWeekChange={setWeekStart} />
              </div>

              {workData.loading ? (
                <Skeleton className="h-48" />
              ) : workData.error ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <p className="text-sm text-destructive">{workData.error}</p>
                </div>
              ) : (
                <TimesheetGrid
                  rows={timesheetData.rows}
                  weekDays={timesheetData.weekDays}
                  dailyTotals={timesheetData.dailyTotals}
                  weekTotal={timesheetData.weekTotal}
                  entryMap={timesheetData.entryMap}
                  currentUserId={user.id}
                  currentUserName={user.name}
                  client={client}
                  onRefresh={workData.refresh}
                  onAddTicket={() => setTicketPickerOpen(true)}
                />
              )}
            </section>

            {/* My Tasks */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">
                My Tasks ({workData.tasks.length} assigned)
              </h2>
              <MyTasksSection tasks={workData.tasks} />
            </section>

            {/* My Tickets */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">
                My Tickets ({workData.tickets.length} open)
              </h2>
              <MyTicketsSection tickets={workData.tickets} />
            </section>

            {/* Ticket picker dialog */}
            <TicketPicker
              open={ticketPickerOpen}
              onClose={() => setTicketPickerOpen(false)}
              onSelect={handleAddTicket}
              client={client}
            />
          </>
        ) : (
          /* All Users tab */
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">All Users</h2>
            <AllUsersSection client={client} users={users} />
          </section>
        )}
      </div>
    </div>
  );
}

// Module Federation mount/unmount API
export default {
  mount: (container: HTMLElement, props?: MyWorkPageProps) => {
    console.log('[MyWorkPage] mount() called');
    const root = createRoot(container);
    root.render(
      <MyWorkDashboard
        orgId={props?.orgId || ''}
        deviceId={props?.deviceId || ''}
        baseUrl={props?.baseUrl || ''}
        token={props?.token}
      />
    );
    return root;
  },

  unmount: (root: Root) => {
    console.log('[MyWorkPage] unmount() called');
    root.unmount();
  },
};
