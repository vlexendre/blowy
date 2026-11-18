/** Constantes du site : liens des stores, contact, entité légale. Un seul endroit à modifier. */
import { brand } from '@blowy/content';

export const SITE_URL = brand.site;

/**
 * Environnement du site, lu au build (`PUBLIC_SITE_ENV`) : absent ou `production` → minimoa.app ; `dev` → le site de
 * test https://dev.minimoa.app (branche `dev`, déploiement de prévisualisation Cloudflare Pages, docs/ENVIRONNEMENTS.md).
 * En dev : `noindex,nofollow` sur chaque page, bandeau « DEV », et `scripts/site-env.mjs` réécrit robots.txt (`Disallow: /`),
 * retire le plan du site et ajoute `X-Robots-Tag` à `_headers`. Toute autre valeur arrête le build (une faute de frappe ne
 * doit pas publier un site de test indexable, ni marquer la production en noindex).
 * La canonique, les hreflang, le JSON-LD et og:url restent sur SITE_URL (minimoa.app) dans les deux cas : le site de test
 * n'est jamais présenté comme l'adresse de référence d'une page.
 */
const rawSiteEnv = (import.meta.env.PUBLIC_SITE_ENV ?? '').trim().toLowerCase();
if (rawSiteEnv !== '' && rawSiteEnv !== 'production' && rawSiteEnv !== 'dev') {
  throw new Error(`PUBLIC_SITE_ENV=${rawSiteEnv} : « dev », « production » ou rien (production).`);
}
export const SITE_ENV: 'production' | 'dev' = rawSiteEnv === 'dev' ? 'dev' : 'production';
export const IS_DEV_SITE = SITE_ENV === 'dev';
/** Adresse du site de test (branche `dev`). */
export const DEV_SITE_URL = 'https://dev.minimoa.app';
/**
 * Base des liens que les pages fabriquent pour être partagés (résultat du quiz, quartier) : ils doivent rouvrir le même
 * environnement (un code du quiz de test n'existe pas en production). Les balises de référencement gardent SITE_URL.
 */
export const LINK_URL = IS_DEV_SITE ? DEV_SITE_URL : SITE_URL;
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

/**
 * Schéma du lien profond ouvert par l'app (minimoa://i/CODE ; l'app accepte aussi l'ancien blowy://). Site de test :
 * `minimoa-dev://`, le schéma de l'app « Minimoa Dev » (apps/mobile/app.config.ts), pour ne jamais ouvrir l'app de
 * production depuis le dev quand les deux sont installées. Les liens `minimoa://` écrits dans les pages sont réécrits
 * au chargement (scripts/ref.ts).
 */
export const DEEP_LINK_SCHEME = IS_DEV_SITE ? 'minimoa-dev://' : 'minimoa://';

/** URL de l'API, injectée au build (PUBLIC_API_URL). */
export const API_URL: string = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';

/** Éditeur, hébergeurs, contacts et sous-traitants des pages légales : voir ./legal.ts. */

/** Aperçu de lien par défaut (1200 × 630, scripts/site-images/build.py) ; chaque page de partage a le sien (/og/<page>.jpg). */
export const OG_IMAGE = '/og/accueil.jpg';
export const OG_ALT = 'Nino, Suzie et Pia, des minimoas tout poilus, à côté du titre « Des potes près de chez toi. »';
