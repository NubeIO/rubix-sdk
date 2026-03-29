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

/** Decode a JWT token and return the payload claims (no verification). */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return {};
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payload);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function TaskCommentsSection({ task, client, orgId, deviceId }: TaskCommentsSectionProps) {
  const config = client.getConfig();
  const claims = config.token ? decodeJwtPayload(config.token) : {};
  const currentUserId = (claims.email as string) || (claims.sub as string) || `user_${deviceId.slice(0, 8)}`;
  const currentUserName = (claims.name as string) || currentUserId;

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
