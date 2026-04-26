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
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      // Avoid passing non-serializable function references into the config
      // by listing known Node builtins and native modules as externals.
      external: [...Array.from(nodeBuiltins), ...Array.from(nativeModules)],
      output: {
        exports: 'named',
      },
    },
  },
});
