/**
 * Task Detail Page - Module Federation Entry Point
 *
 * This wraps TaskDetailPage for mount/unmount pattern.
 * Loaded via Module Federation when viewing a plm.task node.
 */

import { createRoot, type Root } from 'react-dom/client';
import { TaskDetailPage } from './TaskDetailPage';
import type { Task } from '@features/task/types/task.types';

console.log('🔵 [TaskDetailPageEntry] Module loaded - TaskDetailPageEntry.tsx');

interface PluginPageProps {
  orgId: string;
  deviceId: string;
  nodeId: string;
  node: Task;
  token?: string;
  baseUrl?: string;
}

// Export mount/unmount API for Module Federation
export default {
  mount: (container: HTMLElement, props?: PluginPageProps) => {
    console.log('🟢 [TaskDetailPageEntry] mount() called');
    console.log('🟢 [TaskDetailPageEntry] container:', container);
    console.log('🟢 [TaskDetailPageEntry] props:', props);
    console.log('🟢 [TaskDetailPageEntry] node:', props?.node);

    try {
      const root = createRoot(container);
      console.log('🟢 [TaskDetailPageEntry] React root created');

      root.render(
        <TaskDetailPage
          task={props?.node!}
          orgId={props?.orgId || ''}
          deviceId={props?.deviceId || ''}
          baseUrl={props?.baseUrl || '/api/v1'}
          token={props?.token}
        />
      );
      console.log('🟢 [TaskDetailPageEntry] Rendered TaskDetailPage');

      return root;
    } catch (error) {
      console.error('🔴 [TaskDetailPageEntry] Error in mount():', error);
      throw error;
    }
  },

  unmount: (root: Root) => {
    console.log('🟠 [TaskDetailPageEntry] unmount() called');
    root.unmount();
  },
};
