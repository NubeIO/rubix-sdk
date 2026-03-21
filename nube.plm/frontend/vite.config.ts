import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'nube_plm',
      filename: 'remoteEntry.js',
      exposes: {
        './ProductTableWidget': './src/products/widget/ProductTableWidget.tsx',
        './Page': './src/products/page/ProductsPage.tsx',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '19.0.0',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '19.0.0',
        },
        // Only share React - plugin bundles its own UI components
      },
    }),
  ],
  resolve: {
    alias: {
      // @rubix-sdk/frontend → rubix-sdk/frontend-sdk (source - fine for non-UI utilities)
      '@rubix-sdk/frontend': path.resolve(__dirname, '../../frontend-sdk'),
      // @/ → plugin src folder (for local UI components)
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/api/v1/ext/nube.plm/',
  build: {
    target: 'esnext',
    outDir: '../dist-frontend',
    emptyOutDir: true,
  },
});
