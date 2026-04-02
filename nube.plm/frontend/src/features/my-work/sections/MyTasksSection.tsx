import type { Task } from '@features/task/types/task.types';

// @ts-ignore - SDK types
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
  Badge,
} from '@rubix-sdk/frontend/common/ui';

interface MyTasksSectionProps {
  tasks: (Task & { productName: string })[];
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  'completed': 'default',
  'in-progress': 'secondary',
  'pending': 'outline',
  'cancelled': 'destructive',
};

export function MyTasksSection({ tasks }: MyTasksSectionProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">No tasks assigned to you.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="text-sm">{task.productName}</TableCell>
              <TableCell className="text-sm font-medium">{task.name}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[task.settings?.status || ''] || 'outline'}>
                  {task.settings?.status || 'pending'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{task.settings?.priority || '-'}</TableCell>
              <TableCell className="text-sm">
                {task.settings?.dueDate
                  ? new Date(task.settings.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
