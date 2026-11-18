/**
 * Socle des langues de Minimoa (app, API, site). Pur : ni React, ni horloge, ni module natif.
 *
 * Un « dictionnaire » = un objet de textes écrit en français (la langue source), plus une traduction par langue.
 * Une traduction a exactement les clés du français (une clé en trop ou en moins est une erreur de type) ;
 * chaque valeur est soit le texte traduit, soit `TODO` : on affiche alors le français, et `pnpm i18n:check` le compte.
 * `TODO` peut remplacer une feuille, un sous-objet ou le dictionnaire entier (langue pas encore commencée).
 * Un tableau est une feuille : il se traduit en entier.
 */
import { LOCALES, type Locale } from '@blowy/domain';

export { LOCALES, type Locale };

/** Langue d'écriture des textes : celle qui sert de repli tant qu'une traduction manque. */
export const SOURCE_LOCALE: Locale = 'fr';
/** Langue choisie quand celle du téléphone n'est pas proposée (spéc §23). */
export const FALLBACK_LOCALE: Locale = 'en';

/** Marque « pas encore traduit » : le texte français s'affiche à la place. */
export const TODO: unique symbol = Symbol.for('blowy.i18n.todo');
export type Todo = typeof TODO;

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as readonly string[]).includes(v);

// ── Types ────────────────────────────────────────────────────────────────────

/** Le même type, littéraux élargis : `'Retour'` devient `string`, `true` devient `boolean`. */
export type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends (...args: infer A) => infer R
        ? (...args: A) => Widen<R>
        : T extends object
          ? { [K in keyof T]: Widen<T[K]> }
          : T;

/** Ce qu'une langue doit fournir pour un dictionnaire français de type `T`. */
export type Translation<T> =
  | Todo
  | (T extends (...args: never[]) => unknown ? Widen<T> : T extends readonly unknown[] ? Widen<T> : T extends object ? { [K in keyof T]: Translation<T[K]> } : Widen<T>);

export type TranslatedLocale = Exclude<Locale, 'fr'>;

export type Dictionaries<T> = { fr: T } & { [L in TranslatedLocale]: Translation<NoInfer<T>> };

export interface Messages<T> {
  /** Le dictionnaire dans une langue, français pour ce qui manque (résolu une fois, puis gardé). */
  in(locale: Locale): T;
  /** Les textes tels qu'écrits, langue par langue (pour la vérification). */
  readonly dictionaries: Dictionaries<T>;
}

// ── Résolution ───────────────────────────────────────────────────────────────

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

/** Fusionne une traduction sur le français : `TODO` (à tout niveau) rend le français. */
export function resolveTranslation<T>(source: T, translation: unknown): T {
  if (translation === TODO || translation === undefined) return source;
  if (isPlainObject(source) && isPlainObject(translation)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source)) out[key] = resolveTranslation(source[key], translation[key]);
    return out as T;
  }
  return translation as T;
}

/**
 * Déclare un dictionnaire dans les cinq langues. Le français fixe la forme ; les autres langues sont vérifiées
 * contre elle (`TODO` pour ce qui n'est pas encore traduit).
 */
export function defineMessages<T>(dictionaries: Dictionaries<T>): Messages<T> {
  const cache = new Map<Locale, T>();
  return {
    dictionaries,
    in(locale) {
      let resolved = cache.get(locale);
      if (resolved === undefined) {
        resolved = locale === SOURCE_LOCALE ? dictionaries.fr : resolveTranslation(dictionaries.fr, dictionaries[locale as TranslatedLocale]);
        cache.set(locale, resolved);
      }
      return resolved;
    },
  };
}

/**
 * Un texte à résoudre plus tard, dans la langue de la personne : `textOf(visionText, (t) => t.errors.locationConsent)`.
 * Sert aux erreurs de l'API (`DomainError`), dont la langue n'est connue qu'au moment de répondre.
 */
export const textOf =
  <T>(messages: Messages<T>, pick: (t: T) => string) =>
  (locale: Locale): string =>
    pick(messages.in(locale));

/** Chemins des feuilles non traduites d'une langue (« common.back »), pour `i18n:check`. */
export function untranslatedPaths(source: unknown, translation: unknown, prefix = ''): string[] {
  if (translation === TODO || translation === undefined) return leafPaths(source, prefix);
  if (isPlainObject(source) && isPlainObject(translation)) {
    return Object.keys(source).flatMap((k) => untranslatedPaths(source[k], translation[k], prefix ? `${prefix}.${k}` : k));
  }
  return [];
}

/** Chemins de toutes les feuilles d'un dictionnaire. */
export function leafPaths(value: unknown, prefix = ''): string[] {
  if (isPlainObject(value)) return Object.keys(value).flatMap((k) => leafPaths(value[k], prefix ? `${prefix}.${k}` : k));
  return [prefix];
}

/** Clés présentes d'un côté et pas de l'autre (garde-fou à l'exécution, en plus des types). */
export function shapeMismatches(source: unknown, translation: unknown, prefix = ''): string[] {
  if (translation === TODO || !isPlainObject(source)) return [];
  if (!isPlainObject(translation)) return [prefix || '(racine)'];
  const missing = Object.keys(source).filter((k) => !(k in translation)).map((k) => `${prefix}${k} (manquante)`);
  const extra = Object.keys(translation).filter((k) => !(k in source)).map((k) => `${prefix}${k} (en trop)`);
  const nested = Object.keys(source)
    .filter((k) => k in translation)
    .flatMap((k) => shapeMismatches(source[k], translation[k], `${prefix}${k}.`));
  return [...missing, ...extra, ...nested];
}

// ── Choix de la langue ───────────────────────────────────────────────────────

/**
 * Langue de Minimoa à partir des langues préférées (étiquettes BCP 47, la préférée d'abord) :
 * la première proposée par Minimoa, sinon l'anglais (spéc §23).
 */
export function pickLocale(tags: readonly (string | null | undefined)[]): Locale {
  for (const tag of tags) {
    const lang = tag?.trim().toLowerCase().split(/[-_]/)[0];
    if (isLocale(lang)) return lang;
  }
  return FALLBACK_LOCALE;
}

/** Langue d'un en-tête `Accept-Language` ; sans en-tête : `fallback` (français pour les anciens clients). */
export function localeFromAcceptLanguage(header: string | null | undefined, fallback: Locale = SOURCE_LOCALE): Locale {
  if (!header || !header.trim()) return fallback;
  const tags = header
    .split(',')
    .map((part, i) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { tag: tag.trim(), q: q ? Number(q.slice(2)) || 0 : 1, i };
    })
    .filter((t) => t.tag && t.tag !== '*' && t.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i)
    .map((t) => t.tag);
  return tags.length ? pickLocale(tags) : fallback;
}

// ── Pluriels, nombres, dates, prix ───────────────────────────────────────────

export type PluralCategory = 'one' | 'other';

/** Catégorie de pluriel (règles CLDR simplifiées, sans dépendre d'`Intl.PluralRules` absent de Hermes). */
export function pluralCategory(locale: Locale, n: number): PluralCategory {
  const i = Math.floor(Math.abs(n));
  const integer = Number.isInteger(n);
  switch (locale) {
    case 'fr':
    case 'pt':
      return i === 0 || i === 1 ? 'one' : 'other';
    default:
      return n === 1 && integer ? 'one' : 'other';
  }
}

/** Forme du mot selon le nombre : `plural('fr', 2, { one: 'jour', other: 'jours' })` → `jours`. */
export const plural = (locale: Locale, n: number, forms: { one: string; other: string }): string => forms[pluralCategory(locale, n)];

/** « 2 jours », « 1 jour » : le nombre formaté puis le mot accordé. */
export const countOf = (locale: Locale, n: number, forms: { one: string; other: string }): string =>
  `${formatNumber(locale, n)} ${plural(locale, n, forms)}`;

/** Région par défaut d'une langue, quand l'appareil ne la donne pas (serveur, e-mails). */
export const DEFAULT_REGION_TAG: Readonly<Record<Locale, string>> = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', pt: 'pt-BR', nl: 'nl-NL' };

/** Étiquette à passer à `Intl` : celle de l'appareil si elle est de la même langue, sinon la région par défaut. */
export const intlTag = (locale: Locale, deviceTag?: string | null): string =>
  deviceTag && deviceTag.toLowerCase().split(/[-_]/)[0] === locale ? deviceTag.replace('_', '-') : DEFAULT_REGION_TAG[locale];

export const formatNumber = (locale: Locale, n: number, opts?: Intl.NumberFormatOptions, deviceTag?: string | null): string =>
  new Intl.NumberFormat(intlTag(locale, deviceTag), opts).format(n);

/** Prix à partir de centimes : « 4,99 € » en français, « €4.99 » en anglais. */
export const formatPrice = (locale: Locale, amountMinor: number, currency: string, deviceTag?: string | null): string =>
  formatNumber(locale, amountMinor / 100, { style: 'currency', currency, minimumFractionDigits: amountMinor % 100 === 0 ? 0 : 2 }, deviceTag);

/**
 * Étiquette des dates : l'anglais de Minimoa est américain (orthographe US), ses dates aussi (« November 22 »), quelle
 * que soit la région du téléphone ; les autres langues suivent la région de l'appareil.
 */
const dateTag = (locale: Locale, deviceTag?: string | null): string => (locale === 'en' ? 'en-US' : intlTag(locale, deviceTag));

/**
 * Date (Europe/Paris par défaut) : `formatDate('fr', iso, { day: 'numeric', month: 'long' })` → « 22 novembre » ;
 * en anglais « November 22 » (et l'heure « 5:19 PM »).
 */
export const formatDate = (
  locale: Locale,
  date: Date | string,
  opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' },
  deviceTag?: string | null,
): string => {
  // Heure à l'américaine en anglais : « 5:19 PM », pas « 05:19 PM ».
  const shown = locale === 'en' && opts.hour === '2-digit' ? { ...opts, hour: 'numeric' as const } : opts;
  return new Intl.DateTimeFormat(dateTag(locale, deviceTag), { timeZone: 'Europe/Paris', ...shown }).format(typeof date === 'string' ? new Date(date) : date);
};

/** Remplace les {clés} d'un modèle ; une clé absente disparaît proprement. */
export const fillTemplate = (template: string, vars: Readonly<Record<string, string | number>>): string =>
  template
    .replace(/\{(\w+)\}/g, (_, key: string) => (vars[key] !== undefined ? String(vars[key]) : ''))
    .replace(/[  ]{2,}/g, ' ')
    .trim();
