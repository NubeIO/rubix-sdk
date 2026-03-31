import { Package, ListChecks, CheckSquare, Clock, Factory } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReportingStats } from '../hooks/useReportingData';

interface SummaryCardsProps {
  stats: ReportingStats;
  hasHardware: boolean;
}

interface CardDef {
  title: string;
  value: string | number;
  description: string;
  icon: typeof Package;
  iconBg: string;
  hidden?: boolean;
}

export function SummaryCards({ stats, hasHardware }: SummaryCardsProps) {
  const cards: CardDef[] = [
    {
      title: 'Products',
      value: stats.totalProducts,
      description: 'selected',
      icon: Package,
      iconBg: 'bg-blue-500',
    },
    {
      title: 'Tasks',
      value: stats.totalTasks,
      description: `${stats.tasksCompleted} completed (${stats.totalTasks > 0 ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100) : 0}%)`,
      icon: ListChecks,
      iconBg: 'bg-violet-500',
    },
    {
      title: 'Tickets',
      value: stats.totalTickets,
      description: `${stats.ticketsOpen} open / ${stats.ticketsClosed} closed`,
      icon: CheckSquare,
      iconBg: 'bg-indigo-500',
    },
    {
      title: 'Hours Logged',
      value: `${stats.totalHours.toFixed(1)}h`,
      description: 'total across all entries',
      icon: Clock,
      iconBg: 'bg-emerald-500',
    },
    {
      title: 'Mfg Runs',
      value: stats.totalRuns,
      description: 'hardware only',
      icon: Factory,
      iconBg: 'bg-amber-500',
      hidden: !hasHardware,
    },
  ];

  const visibleCards = cards.filter((c) => !c.hidden);

  return (
    <div className={cn('grid gap-4', `md:grid-cols-${Math.min(visibleCards.length, 5)}`)}>
      {visibleCards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="overflow-hidden transition-all hover:shadow-md">
            <CardContent className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', card.iconBg)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {card.title}
              </div>
              <div className="mb-1 text-2xl font-bold tracking-tight">{card.value}</div>
              <div className="text-xs text-muted-foreground">{card.description}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
