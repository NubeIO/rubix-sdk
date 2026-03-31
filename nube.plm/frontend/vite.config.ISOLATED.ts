import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

/**
 * EXPERIMENTAL: Fully Isolated Plugin Configuration
 *
 * This configuration does NOT share React/ReactDOM.
 * Plugin bundles its own React + Radix UI + shadcn components.
 *
 * Theory: If plugin has its own React instance, Radix UI should work
 * because the plugin creates AND renders elements with the same React.
 *
 * Trade-off: Bigger bundle size (~200KB extra for React)
 * Benefit: Can use EXACT same shadcn/ui components as host
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'nube_plm',
      filename: 'remoteEntry.js',
      exposes: {
        './ProjectTableWidget': './src/projects/widget/ProjectTableWidget.tsx',
        './Page': './src/projects/page/ProjectsPage.tsx',
        './HeadlessTest': './src/test/HeadlessDialogTest.tsx',
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
