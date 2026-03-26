/**
 * Quick Actions Widget - Common action buttons
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Layers, CheckSquare, DollarSign, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
  onAddBOMItem: () => void;
  onCreateTask: () => void;
  onUpdatePricing: () => void;
  onExportReport: () => void;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  iconBgColor?: string;
  iconColor?: string;
}

function ActionButton({ icon, label, onClick, iconBgColor = 'bg-blue-500', iconColor = 'text-white' }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-all hover:border-border hover:bg-accent/50"
    >
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110', iconBgColor)}>
        <div className={cn('h-4 w-4', iconColor)}>
          {icon}
        </div>
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export function QuickActions({
  onAddBOMItem,
  onCreateTask,
  onUpdatePricing,
  onExportReport,
}: QuickActionsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
        <p className="text-xs text-muted-foreground">Commonly used operations</p>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        <ActionButton
          icon={<Layers className="h-full w-full" />}
          label="Add BOM Item"
          onClick={onAddBOMItem}
          iconBgColor="bg-amber-500"
          iconColor="text-white"
        />

        <ActionButton
          icon={<CheckSquare className="h-full w-full" />}
          label="Create Task"
          onClick={onCreateTask}
          iconBgColor="bg-blue-500"
          iconColor="text-white"
        />

        <ActionButton
          icon={<DollarSign className="h-full w-full" />}
          label="Update Pricing"
          onClick={onUpdatePricing}
          iconBgColor="bg-emerald-500"
          iconColor="text-white"
        />

        <Separator className="my-2" />

        <ActionButton
          icon={<FileText className="h-full w-full" />}
          label="Export Report"
          onClick={onExportReport}
          iconBgColor="bg-slate-500"
          iconColor="text-white"
        />
      </CardContent>
    </Card>
  );
}
