import { defineConfig } from 'vite';

/** Appli statique : `pnpm build` produit `dist/`, à servir tel quel (voir README). */
export default defineConfig({
  base: './',
  oxc: { jsx: { runtime: 'automatic' } },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 900 },
  server: { host: 'localhost' },
});
