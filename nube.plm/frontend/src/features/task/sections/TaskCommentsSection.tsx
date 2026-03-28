/**
 * Task Comments Section - Display and manage comments on tasks
 */

import type { Task } from '../types/task.types';
import type { PluginClient } from '@rubix-sdk/frontend/plugin-client';
import { CommentsSection } from '../../comments/components/CommentsSection';

interface TaskCommentsSectionProps {
  task: Task;
  client: PluginClient;
  orgId: string;
  deviceId: string;
}

export function TaskCommentsSection({ task, client, orgId, deviceId }: TaskCommentsSectionProps) {
  // TODO: Get actual user ID and name from auth context
  const currentUserId = 'user_' + deviceId.slice(0, 8);
  const currentUserName = 'Current User';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Comments</h2>
        <p className="text-muted-foreground">
          Discussion and updates for {task.name}
        </p>
      </div>

      <CommentsSection
        nodeId={task.id}
        nodeType="task"
        client={client}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </div>
  );
}
