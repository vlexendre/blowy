/**
 * Langues du site minimoa.app (mêmes cinq langues que l'app et les pages légales, voir ./legal.ts).
 *
 * - Pages indexées (landing, quiz, quartier) : une page statique par langue. Français à la racine (`/`, `/quiz/`),
 *   les autres sous leur préfixe (`/en/`, `/en/quiz/`). Jamais de redirection selon la langue du navigateur : au plus
 *   une bannière « Available in English » (`components/organisms/LangBanner.astro`).
 * - Pages de partage (`/m/…`, `/i/…`, `/g/…`, `/c/…`, `/r/…`, `/l/…`, `/plus`, `/defi`, `/habitudes`, `/carte`, 404, et les
 *   liens `/quiz/<code>`, `/quartier/<zone>`) : une seule adresse, les cinq langues rendues au build, et le navigateur
 *   montre celle du téléphone (`layouts/Public.astro`, mode `shell`).
 *
 * Textes : un dictionnaire par zone, typé par le français (`siteMessages`) ; une clé en trop ou en moins dans une
 * langue est une erreur de type, et aucune langue ne peut renvoyer au français (pas de `TODO` sur le site).
 */
import type { Widen } from '@blowy/content';
import { DEFAULT_LOCALE, LOCALES, LOCALE_NAME, TRANSLATED_LOCALES, isLocale, type Locale } from './legal';

export { DEFAULT_LOCALE, LOCALES, LOCALE_NAME, TRANSLATED_LOCALES, isLocale, type Locale };
export type TranslatedLocale = Exclude<Locale, 'fr'>;

/**
 * Variante de chaque langue sur le site. Portugais du Brésil et anglais américain, comme l'app
 * (`apps/mobile/src/locales`, « você », « celular »), pages légales comprises (`<html lang="pt-BR">`). Les balises hreflang
 * gardent le code de langue seul (`pt`), une seule version par langue.
 */
export const HTML_LANG: Record<Locale, string> = { fr: 'fr', en: 'en', es: 'es', pt: 'pt-BR', nl: 'nl' };
export const OG_LOCALE: Record<Locale, string> = { fr: 'fr_FR', en: 'en_US', es: 'es_ES', pt: 'pt_BR', nl: 'nl_NL' };

/** Pages indexées, chemin français (avec la barre finale de l'URL canonique servie). */
export const SEO_PAGES = ['/', '/quiz/', '/quartier/'] as const;
export type SeoPage = (typeof SEO_PAGES)[number];

/** Chemin d'une page dans une langue : `localePath('en', '/quiz/')` → `/en/quiz/`. */
export function localePath(locale: Locale, path: string = '/'): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? p : `/${locale}${p}`;
}

/** Langue d'un chemin servi (`/en/quiz/` → en ; tout chemin sans préfixe connu → français). */
export function localeOfPath(pathname: string): Locale {
  const first = pathname.split('/').filter(Boolean)[0] ?? '';
  return isLocale(first) ? first : DEFAULT_LOCALE;
}

/** Balises hreflang d'une page indexée : les cinq langues et `x-default` (le français). */
export function pageAlternates(path: SeoPage): { hreflang: string; path: string }[] {
  return [...LOCALES.map((l) => ({ hreflang: l, path: localePath(l, path) })), { hreflang: 'x-default', path: localePath(DEFAULT_LOCALE, path) }];
}

/** Première langue du navigateur proposée par le site, `null` si aucune (pas de repli : c'est au code appelant de choisir). */
export function browserLocale(languages: readonly (string | null | undefined)[]): Locale | null {
  for (const tag of languages) {
    const base = (tag ?? '').toLowerCase().split(/[-_]/)[0] ?? '';
    if (isLocale(base)) return base;
  }
  return null;
}

/** Ce qu'une langue doit fournir pour un dictionnaire français de type `T` : tout, même forme, sans `TODO`. */
export type SiteTranslation<T> = Widen<T>;
export type SiteDictionaries<T> = { fr: T } & { [L in TranslatedLocale]: SiteTranslation<NoInfer<T>> };

/** Déclare les textes d'une zone du site dans les cinq langues (vérifié à la compilation et par `pnpm i18n:check`). */
export function siteMessages<T>(dictionaries: SiteDictionaries<T>): Record<Locale, T> {
  return dictionaries as unknown as Record<Locale, T>;
}

/** Remplace `{clé}` par sa valeur. */
export const fill = (template: string, vars: Readonly<Record<string, string | number>>): string =>
  template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

/** Nom de chaque langue dans sa langue, pour le sélecteur. */
export const localeName = (l: Locale): string => LOCALE_NAME[l];
