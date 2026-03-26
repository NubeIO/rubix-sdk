/**
 * Product Detail Page V2 - Module Federation Entry Point
 *
 * This wraps ProductDetailPageV2 for mount/unmount pattern.
 * Loaded via Module Federation when viewing a plm.product node with V2 UI.
 */

import { createRoot, type Root } from 'react-dom/client';
import { ProductDetailPageV2 } from '../v2/ProductDetailPageV2';
import type { Product } from '@features/product/types/product.types';

console.log('🔵 [ProductDetailPageV2Entry] Module loaded - ProductDetailPageV2Entry.tsx');

interface PluginPageProps {
  orgId: string;
  deviceId: string;
  nodeId: string;
  node: Product;
  token?: string;
  baseUrl?: string;
}

// Export mount/unmount API for Module Federation
export default {
  mount: (container: HTMLElement, props?: PluginPageProps) => {
    console.log('🟢 [ProductDetailPageV2Entry] mount() called');
    console.log('🟢 [ProductDetailPageV2Entry] container:', container);
    console.log('🟢 [ProductDetailPageV2Entry] props:', props);
    console.log('🟢 [ProductDetailPageV2Entry] node:', props?.node);

    try {
      const root = createRoot(container);
      console.log('🟢 [ProductDetailPageV2Entry] React root created');

      root.render(
        <ProductDetailPageV2
          product={props?.node!}
          orgId={props?.orgId || ''}
          deviceId={props?.deviceId || ''}
          baseUrl={props?.baseUrl || '/api/v1'}
          token={props?.token}
        />
      );
      console.log('🟢 [ProductDetailPageV2Entry] Rendered ProductDetailPageV2');

      return root;
    } catch (error) {
      console.error('🔴 [ProductDetailPageV2Entry] Error in mount():', error);
      throw error;
    }
  },

  unmount: (root: Root) => {
    console.log('🟠 [ProductDetailPageV2Entry] unmount() called');
    root.unmount();
  },
};
