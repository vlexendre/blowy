import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@blowy/ui-web/styles.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: { default: 'Blowy', template: '%s — Blowy' },
  description: 'Élève ton pet. Rencontre de nouvelles personnes. Comptes vérifiés et accords mutuels.',
  metadataBase: new URL('https://blowy.app'),
};
export const viewport: Viewport = { themeColor: '#16110D', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
