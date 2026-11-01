import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

const config: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: root,
  turbopack: { root },
  transpilePackages: ['@blowy/ui-web'],
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  async rewrites() {
    // Fichiers d'association Universal Links / App Links servis par des route handlers.
    return [
      { source: '/.well-known/apple-app-site-association', destination: '/wellknown/apple-app-site-association' },
      { source: '/apple-app-site-association', destination: '/wellknown/apple-app-site-association' },
      { source: '/.well-known/assetlinks.json', destination: '/wellknown/assetlinks.json' },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
      // Assets publics seulement : cache long (noms stables, contenu versionné par le build).
      { source: '/sprites/:file*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] },
    ];
  },
};
export default config;
