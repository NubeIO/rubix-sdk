/**
 * Project Detail Page V2 - Module Federation Entry Point
 *
 * This wraps ProjectDetailPageV2 for mount/unmount pattern.
 * Loaded via Module Federation when viewing a plm.project node with V2 UI.
 */

import { createRoot, type Root } from 'react-dom/client';
import { ProjectDetailPageV2 } from '../v2/ProjectDetailPageV2';
import type { Project } from '@features/project/types/project.types';

console.log('🔵 [ProjectDetailPageV2Entry] Module loaded - ProjectDetailPageV2Entry.tsx');

interface PluginPageProps {
  orgId: string;
  deviceId: string;
  nodeId: string;
  node: Project;
  token?: string;
  baseUrl?: string;
}

// Export mount/unmount API for Module Federation
export default {
  mount: (container: HTMLElement, props?: PluginPageProps) => {
    console.log('🟢 [ProjectDetailPageV2Entry] mount() called');
    console.log('🟢 [ProjectDetailPageV2Entry] container:', container);
    console.log('🟢 [ProjectDetailPageV2Entry] props:', props);
    console.log('🟢 [ProjectDetailPageV2Entry] node:', props?.node);

    try {
      const root = createRoot(container);
      console.log('🟢 [ProjectDetailPageV2Entry] React root created');

      root.render(
        <ProjectDetailPageV2
          project={props?.node!}
          orgId={props?.orgId || ''}
          deviceId={props?.deviceId || ''}
          baseUrl={props?.baseUrl || '/api/v1'}
          token={props?.token}
        />
      );
      console.log('🟢 [ProjectDetailPageV2Entry] Rendered ProjectDetailPageV2');

      return root;
    } catch (error) {
      console.error('🔴 [ProjectDetailPageV2Entry] Error in mount():', error);
      throw error;
    }
  },

  unmount: (root: Root) => {
    console.log('🟠 [ProjectDetailPageV2Entry] unmount() called');
    root.unmount();
  },
};
