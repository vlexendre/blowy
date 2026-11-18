/**
 * Langues et adresses des pages légales.
 * Français (version qui fait foi) : /legal/<page>. Autres langues : /<langue>/legal/<page>.
 * Les noms de page (slugs) sont les mêmes dans toutes les langues : l'app et App Store Connect
 * n'ont qu'à changer le préfixe de langue.
 */

export const LOCALES = ['fr', 'en', 'es', 'pt', 'nl'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'fr';
/** Langues traduites (préfixées dans l'URL). */
export const TRANSLATED_LOCALES = LOCALES.filter((l): l is Exclude<Locale, 'fr'> => l !== DEFAULT_LOCALE);

export const LEGAL_SLUGS = [
  'mentions-legales',
  'conditions',
  'confidentialite',
  'abonnement',
  'regles',
  'cookies',
  'securite',
  'supprimer-mon-compte',
  'assistance',
] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export const isLegalSlug = (s: string): s is LegalSlug => (LEGAL_SLUGS as readonly string[]).includes(s);
export const isLocale = (s: string): s is Locale => (LOCALES as readonly string[]).includes(s);

/**
 * Chemin d'une page légale, ou de l'index des pages légales si `slug` est absent.
 * Avec la barre finale, comme l'URL canonique servie (build « directory ») : pas de redirection en route.
 * Les adresses sans barre finale fonctionnent aussi.
 */
export function legalPath(locale: Locale, slug?: LegalSlug): string {
  const base = locale === DEFAULT_LOCALE ? '/legal/' : `/${locale}/legal/`;
  return slug ? `${base}${slug}/` : base;
}

/** Nom de chaque langue dans sa propre langue (sélecteur). */
export const LOCALE_NAME: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  pt: 'Português',
  nl: 'Nederlands',
};

/** Région utilisée pour les dates et Open Graph. */
export const LOCALE_REGION: Record<Locale, { intl: string; og: string }> = {
  fr: { intl: 'fr-FR', og: 'fr_FR' },
  en: { intl: 'en-GB', og: 'en_GB' },
  es: { intl: 'es-ES', og: 'es_ES' },
  pt: { intl: 'pt-BR', og: 'pt_BR' },
  nl: { intl: 'nl-NL', og: 'nl_NL' },
};

/** Date ISO (AAAA-MM-JJ) écrite en toutes lettres dans la langue. */
export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_REGION[locale].intl, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

/** Liens hreflang d'une page légale (ou de l'index) dans toutes les langues, plus x-default (français). */
export function legalAlternates(slug?: LegalSlug): { hreflang: string; path: string }[] {
  return [
    ...LOCALES.map((l) => ({ hreflang: l, path: legalPath(l, slug) })),
    { hreflang: 'x-default', path: legalPath(DEFAULT_LOCALE, slug) },
  ];
}
