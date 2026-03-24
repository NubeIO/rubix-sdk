/**
 * Product Detail Page - Module Federation Entry Point
 *
 * This wraps ProductDetailView for mount/unmount pattern.
 * Loaded via Module Federation when viewing a plm.product node.
 */

import { createRoot, type Root } from 'react-dom/client';
import { ProductDetailView } from './product-detail-view';
import type { Product } from '../common/types';

console.log('🔵 [ProductDetailPage] Module loaded - ProductDetailPage.tsx');

interface PluginPageProps {
  orgId: string;
  deviceId: string;
  nodeId: string;
  node: Product;
  token?: string;
  baseUrl?: string;
}

// Export mount/unmount API for Module Federation (must match ProductsPage pattern)
export default {
  mount: (container: HTMLElement, props?: PluginPageProps) => {
    console.log('🟢 [ProductDetailPage] mount() called');
    console.log('🟢 [ProductDetailPage] container:', container);
    console.log('🟢 [ProductDetailPage] props:', props);
    console.log('🟢 [ProductDetailPage] node:', props?.node);

    try {
      const root = createRoot(container);
      console.log('🟢 [ProductDetailPage] React root created');

      root.render(
        <ProductDetailView
          product={props?.node!}
          orgId={props?.orgId || ''}
          deviceId={props?.deviceId || ''}
          baseUrl={props?.baseUrl || '/api/v1'}
          token={props?.token}
        />
      );
      console.log('🟢 [ProductDetailPage] Rendered ProductDetailView');

      return root;
    } catch (error) {
      console.error('🔴 [ProductDetailPage] Error in mount():', error);
      throw error;
    }
  },

  unmount: (root: Root) => {
    console.log('🟠 [ProductDetailPage] unmount() called');
    root.unmount();
  },
};
