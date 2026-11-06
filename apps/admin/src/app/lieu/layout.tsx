import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@blowy/ui-web/venue.css';
import './fonts.css';

export const metadata: Metadata = { title: 'blowy. lieu', robots: { index: false, follow: false } };

/** Espace lieu partenaire (spec-v5 §10.2) : styles et polices propres ; aucune donnée ici. */
export default function VenueRootLayout({ children }: { children: ReactNode }) {
  return children;
}
