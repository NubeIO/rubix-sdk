/**
 * Overview Section - Dashboard with stats, recent tasks, and quick actions
 */

import { useEffect, useState } from 'react';
import { CheckSquare, Layers, DollarSign, Activity } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { RecentTasks } from '../widgets/RecentTasks';
import { QuickActions } from '../widgets/QuickActions';
import type { Product } from '../../types/product.types';
import { normalizeTaskStatus } from '@shared/utils/task-status';

interface OverviewSectionProps {
  product: Product;
  orgId: string;
  deviceId: string;
  baseUrl?: string;
  token?: string;
  client: any;
  stats: {
    totalTasks: number;
    tasksCompletedThisWeek: number;
    bomItemsCount: number;
    bomItemsPending: number;
    totalCost: number;
    totalTickets: number;
    blockedTickets: number;
    completedTickets: number;
    ticketsByStatus: Record<string, number>;
    lastActivity: string;
  };
  onStatsUpdate: (stats: any) => void;
  onProductUpdate?: (updates: any) => Promise<void>;
}

export function OverviewSection({
  product,
  orgId,
  deviceId,
  baseUrl,
  token,
  client,
  stats,
  onStatsUpdate,
}: OverviewSectionProps) {
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    fetchOverviewData();
  }, [product.id]);

  const fetchOverviewData = async () => {
    try {
      setIsLoading(true);

      // Fetch tasks
      const tasks = await client.queryNodes({
        filter: `type is "plm.task" and parent.id is "${product.id}"`,
      });

      // Fetch BOM items
      const bomItems = await client.queryNodes({
        filter: `parent.id is "${product.id}" and type is "plm.bom"`,
      });

      // Calculate stats
      const totalTasks = tasks.length;
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const tasksCompletedThisWeek = tasks.filter((task: any) => {
        const status = normalizeTaskStatus(task.settings?.status, task.settings?.completed);
        const completedAt = task.updatedAt ? new Date(task.updatedAt) : null;
        return status === 'completed' && completedAt && completedAt >= oneWeekAgo;
      }).length;

      const bomItemsCount = bomItems.length;
      const bomItemsPending = bomItems.filter((item: any) =>
        item.settings?.status === 'Pending'
      ).length;

      const totalCost = bomItems.reduce((sum: number, item: any) => {
        const qty = parseFloat(item.settings?.quantity) || 0;
        const unitCost = parseFloat(item.settings?.unitCost) || 0;
        return sum + (qty * unitCost);
      }, 0);

      // Update stats
      onStatsUpdate({
        totalTasks,
        tasksCompletedThisWeek,
        bomItemsCount,
        bomItemsPending,
        totalCost,
        lastActivity: product.updatedAt || new Date().toISOString(),
      });

      // Set recent tasks (sort by updated date)
      const sortedTasks = [...tasks].sort((a: any, b: any) => {
        const dateA = new Date(a.updatedAt || 0).getTime();
        const dateB = new Date(b.updatedAt || 0).getTime();
        return dateB - dateA;
      });

      setRecentTasks(sortedTasks.slice(0, 5).map((task: any) => ({
        id: task.id,
        name: task.name,
        status: normalizeTaskStatus(task.settings?.status, task.settings?.completed),
        assignee: task.settings?.assignee || 'Unassigned',
        dueDate: task.settings?.dueDate,
      })));

    } catch (err) {
      console.error('[OverviewSection] Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityLevel = () => {
    const lastUpdate = new Date(stats.lastActivity);
    const now = new Date();
    const minutesAgo = Math.floor((now.getTime() - lastUpdate.getTime()) / 60000);

    if (minutesAgo < 5) return 'High';
    if (minutesAgo < 60) return 'Medium';
    return 'Low';
  };

  const getTimeSinceLastEdit = () => {
    const lastUpdate = new Date(stats.lastActivity);
    const now = new Date();
    const minutesAgo = Math.floor((now.getTime() - lastUpdate.getTime()) / 60000);

    if (minutesAgo < 1) return 'Just now';
    if (minutesAgo < 60) return `${minutesAgo} mins ago`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `${hoursAgo} hours ago`;
    const daysAgo = Math.floor(hoursAgo / 24);
    return `${daysAgo} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Stat cards grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tasks & Tickets"
          value={`${stats.totalTasks} / ${stats.totalTickets}`}
          description={`${stats.totalTasks} tasks • ${stats.totalTickets} tickets • ${stats.blockedTickets} blocked`}
          icon={CheckSquare}
          iconBgColor="bg-blue-500"
        />

        <StatCard
          title="BOM Items"
          value={stats.bomItemsCount.toLocaleString()}
          description={`${stats.bomItemsPending} items pending release`}
          icon={Layers}
          iconBgColor="bg-amber-500"
        />

        <StatCard
          title="Total Cost"
          value={formatCurrency(stats.totalCost)}
          description="Estimated production cost"
          icon={DollarSign}
          iconBgColor="bg-emerald-500"
        />

        <StatCard
          title="Activity"
          value={getActivityLevel()}
          description={`Last edit ${getTimeSinceLastEdit()}`}
          icon={Activity}
          iconBgColor="bg-purple-500"
        />
      </div>

      {/* Two-column layout: Recent Tasks + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks - 1/2 width */}
        <div>
          <RecentTasks
            tasks={recentTasks}
            onViewAll={() => {/* TODO: Switch to tasks section */}}
          />
        </div>

        {/* Quick Actions - 1/2 width */}
        <div>
          <QuickActions
            onAddBOMItem={() => {/* TODO: Open add BOM dialog */}}
            onCreateTask={() => {/* TODO: Open create task dialog */}}
            onUpdatePricing={() => {/* TODO: Switch to pricing section */}}
            onExportReport={() => {/* TODO: Export report */}}
          />
        </div>
      </div>
    </div>
  );
}
