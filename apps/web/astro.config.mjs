// @ts-check
import { defineConfig } from 'astro/config';

/** Site statique (Cloudflare Pages). Les pages /m/ et /i/ appellent l'API côté navigateur. */
export default defineConfig({
  site: 'https://minimoa.app',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  // Anciennes adresses des pages légales (déjà liées depuis l'app) : pages de redirection en statique,
  // doublées d'une 301 dans public/_redirects pour Cloudflare Pages.
  redirects: {
    '/conditions': '/legal/conditions/',
    '/confidentialite': '/legal/confidentialite/',
    '/regles': '/legal/regles/',
    '/support': '/legal/assistance/',
  },
});
