import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Task } from '@features/task/types/task.types';
import type { Product } from '@features/product/types/product.types';

interface TasksReportProps {
  tasks: Task[];
  products: Product[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function TasksReport({ tasks, products }: TasksReportProps) {
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Group tasks by product for status breakdown
  const byProduct = new Map<string, Task[]>();
  for (const task of tasks) {
    const pid = task.parentId || 'unknown';
    if (!byProduct.has(pid)) byProduct.set(pid, []);
    byProduct.get(pid)!.push(task);
  }

  // Overall status counts
  const statusCounts: Record<string, number> = {};
  for (const task of tasks) {
    const status = task.settings?.status || 'pending';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">Tasks by Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status breakdown bar */}
        {tasks.length > 0 && (
          <div className="space-y-2">
            <div className="flex gap-3 text-xs text-muted-foreground">
              {Object.entries(statusCounts).map(([status, count]) => (
                <span key={status} className="flex items-center gap-1">
                  <span className={`inline-block h-2 w-2 rounded-full ${STATUS_COLORS[status]?.split(' ')[0] || 'bg-slate-300'}`} />
                  {status}: {count}
                </span>
              ))}
            </div>
            <Progress
              value={tasks.length > 0 ? ((statusCounts['completed'] || 0) / tasks.length) * 100 : 0}
              className="h-2"
            />
          </div>
        )}

        {/* Per-product breakdown */}
        {tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tasks found for selected products.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="text-muted-foreground">
                    {productMap.get(task.parentId || '')?.name || '—'}
                  </TableCell>
                  <TableCell className="font-medium">{task.name}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[task.settings?.status || 'pending'] || ''} variant="outline">
                      {task.settings?.status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>{task.settings?.priority || '—'}</TableCell>
                  <TableCell>{task.settings?.assignee || '—'}</TableCell>
                  <TableCell>{task.settings?.dueDate || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
