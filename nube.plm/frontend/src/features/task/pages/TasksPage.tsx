/**
 * Tasks Page - Task management for a product
 *
 * Shows tasks under a specific plm.product node
 */

import { createRoot, type Root } from 'react-dom/client';
import { useState, useCallback } from 'react';
import '@rubix-sdk/frontend/globals.css';
// @ts-ignore - SDK types are resolved at build time
import { Button, Skeleton } from '@rubix-sdk/frontend/common/ui';
import { createPluginClient } from '@rubix-sdk/frontend/plugin-client';
import { PlusIcon } from '@shared/components/icons';

import { TasksPageTabs } from './tasks-page-tabs';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@features/task/types/task.types';
import { normalizeTaskStatus } from '@features/task/utils/task-status';

export interface TasksPageProps {
  orgId: string;
  deviceId: string;
  nodeId: string; // Product ID
  node?: any; // Product node data
  baseUrl: string;
  token?: string;
}

function TasksPage({
  orgId,
  deviceId,
  nodeId,
  node,
  baseUrl,
  token,
}: TasksPageProps) {
  console.log('[TasksPage] Render with props:', {
    orgId,
    deviceId,
    nodeId,
    productName: node?.name,
    baseUrl,
    hasToken: !!token,
  });

  // Create plugin client - use SDK directly!
  const client = createPluginClient({ orgId, deviceId, baseUrl, token });

  // State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<{ id: string; name: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // CRUD operations - use SDK directly, no API wrapper!
  const createTask = useCallback(async (input: CreateTaskInput) => {
    await client.createNode({
      type: 'plm.task',
      profile: 'plm-task',
      name: input.name,
      parentId: input.parentId,
      identity: ['task', 'work-item', 'plm'],
      refs: [
        {
          refName: 'parentRef',
          toNodeId: input.parentId,
        },
      ],
      settings: input.settings || {},
    });
    setRefreshKey((prev) => prev + 1);
  }, [client]);

  const updateTask = useCallback(async (taskId: string, input: UpdateTaskInput) => {
    // Update name if provided
    if (input.name) {
      await client.updateNode(taskId, { name: input.name });
    }
    // Update settings if provided (uses PATCH endpoint for deep merge)
    if (input.settings) {
      // Normalize status before saving to prevent data drift
      const normalized = {
        ...input.settings,
        status: input.settings.status
          ? normalizeTaskStatus(input.settings.status)
          : undefined
      };
      await client.updateNodeSettings(taskId, normalized);
    }
    setRefreshKey((prev) => prev + 1);
  }, [client]);

  const deleteTask = useCallback(async (taskId: string) => {
    await client.deleteNode(taskId);
    setRefreshKey((prev) => prev + 1);
  }, [client]);

  const displaySettings = {
    showStatus: true,
    showPriority: true,
    showProgress: true,
    showAssignee: true,
    compactMode: false,
  };

  const productName = node?.name || 'Product';

  return (
    <div className="p-8 h-full overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Tasks</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Managing tasks for: <span className="font-medium">{productName}</span>
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusIcon size={16} />
              Create Task
            </Button>
          </div>
        </div>

        {/* Tabbed Table */}
        <TasksPageTabs
          key={refreshKey}
          client={client}
          productId={nodeId}
          displaySettings={displaySettings}
          onEdit={(task) => {
            console.log('[TasksPage] Edit task:', task);
            setEditingTask(task);
          }}
          onDelete={(taskId, taskName) => {
            console.log('[TasksPage] Delete task:', taskId, taskName);
            setDeletingTask({ id: taskId, name: taskName });
          }}
        />
      </div>

      {/* TODO: Add task dialogs (create, edit, delete) */}
      {createDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Create Task (Placeholder)</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Task dialogs will be implemented next.
            </p>
            <Button onClick={() => setCreateDialogOpen(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export mount/unmount API for Module Federation
export default {
  mount: (container: HTMLElement, props?: TasksPageProps) => {
    console.log('[TasksPage] mount() called with props:', props);
    const root = createRoot(container);
    root.render(
      <TasksPage
        orgId={props?.orgId || ''}
        deviceId={props?.deviceId || ''}
        nodeId={props?.nodeId || ''}
        node={props?.node}
        baseUrl={props?.baseUrl || ''}
        token={props?.token}
      />
    );
    return root;
  },

  unmount: (root: Root) => {
    console.log('[TasksPage] unmount() called');
    root.unmount();
  },
};
