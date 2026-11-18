/** Constantes du site : liens des stores, contact, entité légale. Un seul endroit à modifier. */
import { brand } from '@blowy/content';

export const SITE_URL = brand.site;
export const SITE_NAME = brand.name;
export const TAGLINE = brand.tagline;
export const SUPPORT_EMAIL = brand.supportEmail;

/**
 * Fiches des stores : un seul endroit, lu au build (PUBLIC_APP_STORE_URL, PUBLIC_PLAY_STORE_URL). Tant qu'une fiche
 * n'est pas publiée, la variable reste vide et le bouton dit « Bientôt sur … » sans lien (aucune adresse inventée).
 * TODO(propriétaire) : PUBLIC_APP_STORE_URL=https://apps.apple.com/fr/app/minimoa/id<Apple ID> dans les variables
 * du build Cloudflare Pages dès que la fiche est en ligne ; PUBLIC_PLAY_STORE_URL quand l'app Android l'est.
 */
const storeUrl = (raw: string | undefined): string | null => (raw && /^https:\/\//.test(raw.trim()) ? raw.trim() : null);
export const APP_STORE_URL: string | null = storeUrl(import.meta.env.PUBLIC_APP_STORE_URL);
export const PLAY_STORE_URL: string | null = storeUrl(import.meta.env.PUBLIC_PLAY_STORE_URL);

/**
 * Identifiant Apple de l'app (App Store Connect › Informations de l'app › Identifiant Apple) : bannière Safari
 * `apple-itunes-app` des pages indexées et JSON-LD `MobileApplication` (lib/structured-data.ts).
 */
export const APP_STORE_ID = '6833895780';

/** Schéma du lien profond ouvert par l'app (minimoa://i/CODE ; l'app accepte aussi l'ancien blowy://). */
export const DEEP_LINK_SCHEME = 'minimoa://';

/** URL de l'API, injectée au build (PUBLIC_API_URL). */
export const API_URL: string = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';

/** Éditeur, hébergeurs, contacts et sous-traitants des pages légales : voir ./legal.ts. */

/** Aperçu de lien par défaut (1200 × 630, scripts/site-images/build.py) ; chaque page de partage a le sien (/og/<page>.jpg). */
export const OG_IMAGE = '/og/accueil.jpg';
export const OG_ALT = 'Nino, Suzie et Pia, des minimoas tout poilus, à côté du titre « Des potes près de chez toi. »';
