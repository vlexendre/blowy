import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@blowy/ui-web/styles.css';

export const metadata: Metadata = { title: 'Blowy — back-office', robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
