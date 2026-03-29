/**
 * Task Detail Page - Workspace UI for Task
 *
 * Features:
 * - Fixed header with task info and actions
 * - Fixed sidebar navigation (right side)
 * - Main content area with section-based views
 * - Shows tickets under this task
 * - Real API integration using plugin-client SDK
 */

import { useState, lazy, Suspense } from 'react';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import type { Task } from '../types/task.types';
import { Skeleton } from '@/components/ui/skeleton';

// Components
import { TaskHeader } from '../components/TaskHeader';
import { TaskSidebarNavigation } from '../components/TaskSidebarNavigation';

// Sections - Lazy loaded for better performance
import { TaskOverviewSection } from '../sections/TaskOverviewSection';
const TaskBasicInfoSection = lazy(() => import('../sections/TaskBasicInfoSection').then(m => ({ default: m.TaskBasicInfoSection })));
const TicketsSectionV2 = lazy(() => import('../sections/TicketsSectionV2').then(m => ({ default: m.TicketsSectionV2 })));
const TaskCommentsSection = lazy(() => import('../sections/TaskCommentsSection').then(m => ({ default: m.TaskCommentsSection })));
const TaskTimeEntriesSection = lazy(() => import('../sections/TaskTimeEntriesSection').then(m => ({ default: m.TaskTimeEntriesSection })));
const TaskSystemInfoSection = lazy(() => import('../sections/TaskSystemInfoSection').then(m => ({ default: m.TaskSystemInfoSection })));

export type TaskSectionId = 'overview' | 'basic-info' | 'tickets' | 'comments' | 'time-entries' | 'system-info';

// Loading fallback for lazy sections
function SectionLoadingFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

interface TaskDetailPageProps {
  task: Task;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  onTaskUpdated?: (task: Task) => void;
}

export function TaskDetailPage({
  task: initialTask,
  orgId,
  deviceId,
  baseUrl = '/api/v1',
  token,
  onTaskUpdated,
}: TaskDetailPageProps) {
  const [task, setTask] = useState<Task>(initialTask);
  const [activeSection, setActiveSection] = useState<TaskSectionId>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create plugin client
  const client = createPluginClient({ orgId, deviceId, baseUrl, token });

  // Stats state
  const [stats, setStats] = useState({
    totalTickets: 0,
    ticketsCompleted: 0,
    ticketsInProgress: 0,
    ticketsBlocked: 0,
    progress: task.settings?.progress || 0,
    actualHours: task.settings?.actualHours || 0,
    estimatedHours: task.settings?.estimatedHours || 0,
    lastActivity: task.updatedAt || new Date().toISOString(),
  });

  // Refresh task data
  const refreshTask = async () => {
    try {
      setIsLoading(true);
      const updated = await client.getNode(task.id);
      setTask(updated as Task);
      onTaskUpdated?.(updated as Task);
    } catch (err) {
      console.error('[TaskDetailPage] Failed to refresh task:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh task');
    } finally {
      setIsLoading(false);
    }
  };

  // Update task
  const updateTask = async (updates: { name?: string; settings?: Record<string, any> }) => {
    try {
      setIsLoading(true);
      // Update name if provided
      if (updates.name) {
        await client.updateNode(task.id, { name: updates.name });
      }
      // Update settings if provided (uses PATCH endpoint for deep merge)
      let updated = task;
      if (updates.settings) {
        updated = await client.updateNodeSettings(task.id, updates.settings) as Task;
      }
      setTask(updated);
      onTaskUpdated?.(updated);
    } catch (err) {
      console.error('[TaskDetailPage] Failed to update task:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats (will be updated by child components)
  const updateStats = (newStats: Partial<typeof stats>) => {
    setStats(prev => ({ ...prev, ...newStats }));
  };

  // Render active section
  const renderSection = () => {
    const commonProps = {
      task,
      orgId,
      deviceId,
      baseUrl,
      token,
      client,
      onTaskUpdate: updateTask,
      onRefresh: refreshTask,
    };

    switch (activeSection) {
      case 'overview':
        return <TaskOverviewSection {...commonProps} stats={stats} onStatsUpdate={updateStats} />;
      case 'basic-info':
        return <TaskBasicInfoSection {...commonProps} />;
      case 'tickets':
        return <TicketsSectionV2 {...commonProps} onStatsUpdate={updateStats} />;
      case 'comments':
        return <TaskCommentsSection {...commonProps} />;
      case 'time-entries':
        return <TaskTimeEntriesSection {...commonProps} onStatsUpdate={updateStats} />;
      case 'system-info':
        return <TaskSystemInfoSection {...commonProps} />;
      default:
        return <TaskOverviewSection {...commonProps} stats={stats} onStatsUpdate={updateStats} />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header - Fixed at top */}
      <TaskHeader
        task={task}
        onEdit={() => {/* TODO: Open edit dialog */}}
        isLoading={isLoading}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Main content (scrollable) */}
        <div className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-6xl">
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            <Suspense fallback={<SectionLoadingFallback />}>
              {renderSection()}
            </Suspense>
          </div>
        </div>

        {/* Right: Sidebar navigation (fixed) */}
        <TaskSidebarNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          stats={stats}
        />
      </div>
    </div>
  );
}
