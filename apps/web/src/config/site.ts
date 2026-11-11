/** Constantes du site : liens des stores, contact, entité légale. Un seul endroit à modifier. */
import { brand } from '@blowy/content';

export const SITE_URL = brand.site;
export const SITE_NAME = brand.name;
export const TAGLINE = brand.tagline;
export const SUPPORT_EMAIL = brand.supportEmail;

// TODO(propriétaire) : remplacer par l'URL réelle de la fiche App Store (https://apps.apple.com/fr/app/blowy/idXXXXXXXXXX).
export const APP_STORE_URL = 'https://apps.apple.com/app/blowy';
// TODO(propriétaire) : vérifier l'identifiant Android définitif.
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.blowy';

/** Schéma du lien profond ouvert par l'app (blowy://i/CODE). */
export const DEEP_LINK_SCHEME = 'blowy://';

/** URL de l'API, injectée au build (PUBLIC_API_URL). */
export const API_URL: string = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';

/** Mentions légales. TODO(propriétaire) : compléter avant la mise en ligne. */
export const LEGAL = {
  entity: '[Raison sociale à compléter]',
  /** Date affichée sur les pages légales. */
  updatedAt: '11 novembre 2026',
  updatedAtIso: '2026-11-11',
} as const;

export const OG_IMAGE = '/img/og.png';
