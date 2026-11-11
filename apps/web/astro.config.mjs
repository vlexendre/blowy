// @ts-check
import { defineConfig } from 'astro/config';

/** Site statique (Cloudflare Pages). Les pages /m/ et /i/ appellent l'API côté navigateur. */
export default defineConfig({
  site: 'https://blowy.app',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
