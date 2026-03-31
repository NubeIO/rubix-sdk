/**
 * Project status badge component
 */

// @ts-ignore - SDK types are resolved at build time
import { Badge } from '@rubix-sdk/frontend/common/ui';
import { ProjectStatus } from '@features/project/types/project.types';

interface ProjectStatusBadgeProps {
  status?: ProjectStatus | string;
}

const VARIANT_MAP: Record<string, 'default' | 'warning' | 'success' | 'secondary'> = {
  Design: 'default',
  Prototype: 'warning',
  Production: 'success',
  Discontinued: 'secondary',
};

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const variant = VARIANT_MAP[status || ''] || 'secondary';

  return (
    <Badge variant={variant}>
      {status || 'Unknown'}
    </Badge>
  );
}
