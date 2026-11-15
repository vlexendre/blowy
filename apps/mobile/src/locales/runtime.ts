/**
 * Langue de l'app à l'exécution. Pur (aucun module natif) : la détection vit dans `src/core/locale.ts`.
 *
 * Chaque fichier de `src/locales/` exporte des objets « vivants » : `messages({ fr, en, es, pt, nl })` rend le texte
 * de la langue courante, et `setLocale` les met à jour sur place (mêmes objets, mêmes sous-objets), si bien que
 * `import { common } from '@/locales/common'` puis `common.back` donne toujours la bonne langue.
 */
import {
  type Dictionaries,
  type Locale,
  type Messages,
  SOURCE_LOCALE,
  defineMessages,
  formatDate as formatDateIn,
  formatNumber as formatNumberIn,
  formatPrice as formatPriceIn,
  plural as pluralIn,
} from '@blowy/content';

let current: Locale = SOURCE_LOCALE;
/** Étiquette complète de l'appareil (« fr-BE », « en-US ») pour les formats de nombres et de dates. */
let deviceTag: string | null = null;
const live: { source: Messages<unknown>; target: Record<string, unknown> }[] = [];
const listeners = new Set<(locale: Locale) => void>();

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

/** Copie des objets simples (les tableaux et les fonctions sont partagés : on ne les modifie jamais). */
const copy = (v: unknown): unknown => (isPlainObject(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, copy(x)])) : v);

/** Remplace le contenu de `target` par `next` sans changer l'identité des sous-objets. */
function assignInPlace(target: Record<string, unknown>, next: Record<string, unknown>): void {
  for (const key of Object.keys(next)) {
    const a = target[key];
    const b = next[key];
    if (isPlainObject(a) && isPlainObject(b)) assignInPlace(a, b);
    else target[key] = copy(b);
  }
}

/** Vue vivante d'un dictionnaire partagé (`@blowy/content`) dans la langue de l'app. */
export function liveMessages<T>(source: Messages<T>): T {
  const target = copy(source.in(current)) as Record<string, unknown>;
  live.push({ source: source as Messages<unknown>, target });
  return target as T;
}

/** Déclare les textes d'un écran dans les cinq langues (`TODO` pour ce qui n'est pas encore traduit). */
export function messages<T>(dictionaries: Dictionaries<T>): T {
  return liveMessages(defineMessages(dictionaries));
}

/** Tous les dictionnaires vivants de l'app et l'objet exporté de chacun (pour `pnpm i18n:check`). */
export const registeredMessages = (): readonly { source: Messages<unknown>; target: object }[] => live;

export const getLocale = (): Locale => current;
export const getDeviceTag = (): string | null => deviceTag;

/** Change la langue : tous les textes vivants sont mis à jour, puis les abonnés prévenus (re-rendu, API). */
export function setLocale(locale: Locale, tag: string | null = deviceTag): void {
  deviceTag = tag;
  if (locale === current) return;
  current = locale;
  for (const l of live) assignInPlace(l.target, l.source.in(locale) as Record<string, unknown>);
  for (const fn of listeners) fn(locale);
}

export function onLocaleChange(fn: (locale: Locale) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ── Formats dans la langue courante ──────────────────────────────────────────

/** Majuscule initiale (un mot de dictionnaire placé en tête de phrase). */
export const upperFirst = (s: string): string => (s ? s.charAt(0).toLocaleUpperCase(current) + s.slice(1) : s);

/** Forme du mot selon le nombre : `plural(n, { one: 'jour', other: 'jours' })`. */
export const plural = (n: number, forms: { one: string; other: string }): string => pluralIn(current, n, forms);
export const formatNumber = (n: number, opts?: Intl.NumberFormatOptions): string => formatNumberIn(current, n, opts, deviceTag);
/** Prix à partir de centimes, dans la langue et la région de l'appareil (« 4,99 € », « €4.99 »). */
export const formatPrice = (amountMinor: number, currency: string): string => formatPriceIn(current, amountMinor, currency, deviceTag);
export const formatDate = (date: Date | string, opts?: Intl.DateTimeFormatOptions): string =>
  formatDateIn(current, date, { timeZone: undefined, ...opts }, deviceTag);
