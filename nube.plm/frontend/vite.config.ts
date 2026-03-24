import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

/**
 * ✅ PRODUCTION: Isolated React Plugin Configuration (Mount/Unmount Pattern)
 *
 * This configuration does NOT share React/ReactDOM.
 * Plugin bundles its own React + Radix UI + shadcn components.
 *
 * How it works: Plugin exports mount/unmount functions instead of React components.
 * Plugin creates AND renders elements with its own React instance.
 *
 * Trade-off: ~200KB extra bundle size per plugin
 * Benefit: Can use EXACT same shadcn/ui components as host ✅
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'nube_plm',
      filename: 'remoteEntry.js',
      exposes: {
        './ProductTableWidget': './src/features/product/widgets/ProductTableWidget.tsx',
        './Page': './src/features/product/pages/ProductsListPage.tsx',
        './ProductDetail': './src/features/product/pages/ProductDetailPage.tsx',
        './ProofShared': './src/test/ProveItsShared.tsx',
      },
      shared: {
        // DON'T share React - let plugin bundle its own
        // This makes plugin completely isolated
      },
      runtimePlugins: [],
    }),
  ],
  resolve: {
    alias: {
      '@rubix-sdk/frontend': path.resolve(__dirname, '../../frontend-sdk'),
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  base: '/api/v1/ext/nube.plm/',
  build: {
    target: 'esnext',
    outDir: '../dist-frontend',
    emptyOutDir: true,
    modulePreload: false,
  },
});
