import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'nube_github',
      filename: 'remoteEntry.js',
      dts: false,
      exposes: {
        './Page': './src/GitHubPluginPage.tsx',
      },
      shared: {},
      runtimePlugins: [],
    }),
  ],
  resolve: {
    alias: {
      '@rubix-sdk/frontend': path.resolve(__dirname, '../../frontend-sdk'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/api/v1/ext/nube.github/',
  build: {
    target: 'esnext',
    outDir: '../dist-frontend',
    emptyOutDir: true,
    modulePreload: false,
  },
});
