/**
 * Sidebar Navigation - Right sidebar with section nav and stats
 */

import { Grid3x3, Info, DollarSign, Layers, CheckSquare, Ticket, Settings, Factory } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { SectionId } from '../ProductDetailPageV2';

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface SidebarNavigationProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  productType?: 'software' | 'hardware';
  stats: {
    totalTasks: number;
    totalTickets?: number;
    bomItemsCount: number;
    health: number;
    latency: number;
  };
}

export function SidebarNavigation({
  activeSection,
  onSectionChange,
  productType,
  stats,
}: SidebarNavigationProps) {
  const allNavItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: Grid3x3 },
    { id: 'basic-info', label: 'Basic Info', icon: Info },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'bom', label: 'Bill of Materials', icon: Layers, badge: stats.bomItemsCount },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: stats.totalTasks },
    { id: 'manufacturing', label: 'Manufacturing', icon: Factory },
    { id: 'tickets', label: 'Tickets', icon: Ticket, badge: stats.totalTickets },
    { id: 'system-info', label: 'System Info', icon: Settings },
  ];

  // Filter out BOM for software products (BOM is hardware-only)
  const navItems = allNavItems.filter(item => {
    if (item.id === 'bom' && productType === 'software') {
      return false;
    }
    return true;
  });

  // Fake workspace progress for now
  const workspaceProgress = 65;

  return (
    <div className="flex w-80 shrink-0 flex-col border-l bg-card">
      {/* Top section */}
      <div className="border-b p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Workspace Navigation
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-600 font-medium">Connected</span>
          </div>
        </div>

        {/* Sync status - Live indicator */}
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Sync Status</span>
          <span className="font-medium text-emerald-600 flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Connected
          </span>
        </div>

        {/* Workspace progress */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Workspace Progress</span>
            <span className="font-medium">{workspaceProgress}%</span>
          </div>
          <Progress value={workspaceProgress} className="h-2" />
        </div>
      </div>

      {/* Navigation menu */}
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
                      isActive && 'bg-white/20 text-white border-white/30'
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

      {/* Bottom section: Quick Stats */}
      <div className="border-t p-6">
        <div className="mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Quick Stats
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Health</span>
            <span className="font-bold text-emerald-600">{stats.health}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Latency</span>
            <span className="font-mono font-medium">{stats.latency}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
