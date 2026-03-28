/**
 * Delete Task Confirmation Dialog
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
// @ts-ignore - SDK button
import { Button } from '@rubix-sdk/frontend/common/ui/button';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface DeleteTaskDialogProps {
  client: any;
  task: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteTaskDialog({ client, task, onClose, onSuccess }: DeleteTaskDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await client.deleteNode(task.id);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('[DeleteTaskDialog] Failed to delete task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Delete Task</h2>
              <p className="text-sm text-muted-foreground">This action cannot be undone</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isDeleting}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <CardContent className="p-6">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this task?
            </p>
            <div className="rounded-md bg-muted p-3">
              <p className="font-medium text-sm">{task.name}</p>
              <p className="text-xs text-muted-foreground mt-1">ID: {task.id}</p>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/50 p-3 mb-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Task'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
