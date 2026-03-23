import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'index.ts',
    'common/index': 'common/index.ts',
    'common/ui/index': 'common/ui/index.ts',
    'common/utils/index': 'common/utils/index.ts',
    'settings/index': 'settings/index.ts',
    'plugin-client/index': 'plugin-client/index.ts',
    'ras/index': 'ras/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'lucide-react',
    /^@radix-ui\//, // Externalize ALL Radix UI packages
  ],
  treeshake: true,
  splitting: false,
  sourcemap: true,
  outDir: 'dist',
});
