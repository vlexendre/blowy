import { defineConfig } from 'vite';

/**
 * Appli statique servie à la racine de son propre domaine (https://admin.minimoa.app, projet Cloudflare Pages à part) :
 * `pnpm build` produit `dist/` avec `public/` (_headers, _redirects, robots.txt, polices). Base `/` : les fichiers
 * se chargent aussi depuis une adresse profonde servie par la règle SPA de `_redirects`.
 */
export default defineConfig({
  base: '/',
  oxc: { jsx: { runtime: 'automatic' } },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 900 },
  server: { host: 'localhost' },
});
