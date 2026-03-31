/**
 * Project Header - Top bar with project info and actions
 */

import { Package, Search, Edit, Rocket } from 'lucide-react';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Project } from '../../types/project.types';

interface ProjectHeaderProps {
  project: Project;
  onEdit: () => void;
  onRelease: () => void;
  isLoading?: boolean;
}

export function ProjectHeader({ project, onEdit, onRelease, isLoading }: ProjectHeaderProps) {
  const status = project.settings?.status || 'Design';
  const projectType = project.settings?.projectType || 'hardware';
  const projectCode = project.settings?.projectCode || 'N/A';

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Production':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Prototype':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Discontinued':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="flex h-20 items-center justify-between border-b bg-card px-8">
      {/* Left side: Project info */}
      <div className="flex items-center gap-4">
        {/* Project icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Package className="h-6 w-6" />
        </div>

        {/* Project details */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <Badge className={getStatusColor(status)}>{status}</Badge>
            <Badge variant="outline" className="text-xs">
              {projectType}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono">CODE: {projectCode}</span>
            <span>•</span>
            <span className="font-mono">NODE: {project.id.slice(0, 16)}...</span>
          </div>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3">
        {/* Search box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workspace..."
            className="h-10 w-64 pl-9"
          />
        </div>

        {/* Edit button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          disabled={isLoading}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>

        {/* Release button */}
        <Button
          size="sm"
          onClick={onRelease}
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90"
        >
          <Rocket className="mr-2 h-4 w-4" />
          Release
        </Button>
      </div>
    </div>
  );
}
