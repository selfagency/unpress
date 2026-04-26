import { builtinModules } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nodeBuiltins = new Set(builtinModules.flatMap(mod => [mod, `node:${mod}`]));
const nativeModules = new Set(['ssh2', 'cpu-features']);

export default defineConfig({
  build: {
    target: 'esnext',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      external: [...Array.from(nodeBuiltins), ...Array.from(nativeModules)],
      input: {
        main: resolve(__dirname, 'src/index.ts'),
        search: resolve(__dirname, 'assets/search.ts'),
      },
      output: {
        dir: resolve(__dirname, 'dist'),
        entryFileNames: chunkInfo => {
          // Place search.js in assets subdirectory
          if (chunkInfo.name === 'search') {
            return 'assets/[name].js';
          }
          return '[name].js';
        },
        assetFileNames: assetInfo => {
          // Handle source map files for search
          if (assetInfo.name === 'search.js.map') {
            return 'assets/[name].map';
          }
          // Default asset handling
          return '[name].[ext]';
        },
      },
    },
  },
});
