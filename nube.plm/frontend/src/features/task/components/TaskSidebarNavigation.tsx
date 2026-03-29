/**
 * Task Sidebar Navigation - Right sidebar with section navigation and stats
 */

import { Activity, BarChart3, Clock3, Info, ListTodo, MessageSquare, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { TaskSectionId } from '../pages/TaskDetailPage';

interface NavItem {
  id: TaskSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface TaskSidebarNavigationProps {
  activeSection: TaskSectionId;
  onSectionChange: (section: TaskSectionId) => void;
  stats: {
    totalTickets: number;
    ticketsCompleted: number;
    ticketsBlocked: number;
    progress: number;
    actualHours: number;
    estimatedHours: number;
  };
}

export function TaskSidebarNavigation({
  activeSection,
  onSectionChange,
  stats,
}: TaskSidebarNavigationProps) {
  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'basic-info', label: 'Basic Info', icon: Info },
    { id: 'tickets', label: 'Tickets', icon: ListTodo, badge: stats.totalTickets },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'time-entries', label: 'Time Entries', icon: Clock3 },
    { id: 'system-info', label: 'System Info', icon: Settings },
  ];

  const burnRate = stats.estimatedHours > 0
    ? Math.min(100, Math.round((stats.actualHours / stats.estimatedHours) * 100))
    : 0;

  return (
    <div className="flex w-80 shrink-0 flex-col border-l bg-card">
      <div className="border-b p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Task Workspace
          </span>
          <div className="flex items-center gap-2 text-xs text-emerald-600">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-medium">Live</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ticket Progress</span>
              <span className="font-medium">{stats.progress}%</span>
            </div>
            <Progress value={stats.progress} className="h-2" />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Hours Used</span>
              <span className="font-medium">
                {stats.actualHours}/{stats.estimatedHours || 0}h
              </span>
            </div>
            <Progress value={burnRate} className="h-2" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-black text-white'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <Badge
                    variant={isActive ? 'secondary' : 'outline'}
                    className={cn(
                      'h-5 min-w-[20px] px-1.5 text-[10px]',
                      isActive && 'border-white/30 bg-white/20 text-white'
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t p-6">
        <div className="mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Quick Stats
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completed</span>
            <span className="font-bold text-emerald-600">{stats.ticketsCompleted}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Blocked</span>
            <span className="font-bold text-red-600">{stats.ticketsBlocked}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              Velocity
            </span>
            <span className="font-medium">
              {stats.totalTickets > 0 ? Math.round((stats.ticketsCompleted / stats.totalTickets) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
