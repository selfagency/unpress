import { builtinModules } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nodeBuiltins = new Set(builtinModules.flatMap(mod => [mod, `node:${mod}`]));

const isExternal = (id: string): boolean => {
  if (nodeBuiltins.has(id)) {
    return true;
  }

  if (id.startsWith('.') || id.startsWith('/')) {
    return false;
  }

  if (id.startsWith('\0')) {
    return false;
  }

  return true;
};

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
      external: isExternal,
      output: {
        exports: 'named',
      },
    },
  },
});
