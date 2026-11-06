/**
 * i18n typé : `t('nest.actions.HUG')` — les clés sont dérivées de fr.json à la compilation,
 * les variables `{name}` sont interpolées. Ajouter une langue = un fichier de même forme.
 */
import fr from './fr.json';

type Dict = typeof fr;

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : T[K] extends object
      ? Leaves<T[K], `${P}${K}.`>
      : never;
}[keyof T & string];

export type TKey = Leaves<Dict>;
export type TParams = Readonly<Record<string, string | number>>;

const lookup = (dict: unknown, key: string): string | undefined => {
  let cur: unknown = dict;
  for (const part of key.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
};

export const interpolate = (template: string, params?: TParams): string =>
  params
    ? template.replace(/\{(\w+)\}/g, (m, k: string) =>
        params[k] !== undefined ? String(params[k]) : m,
      )
    : template;

export function t(key: TKey, params?: TParams): string {
  const raw = lookup(fr, key);
  return raw === undefined ? key : interpolate(raw, params);
}

/** Clé dynamique (enum serveur → libellé) : vérifiée à l'exécution, renvoie la clé si absente. */
export function tDynamic(key: string, params?: TParams): string {
  const raw = lookup(fr, key);
  return raw === undefined ? key : interpolate(raw, params);
}

export const hasKey = (key: string): boolean => lookup(fr, key) !== undefined;

export const locale = 'fr-FR';

/** Formats localisés (dates/heures) — l'heure affichée est celle de l'appareil. */
export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
export const formatRelative = (iso: string, now = Date.now()): string => {
  const diff = new Date(iso).getTime() - now;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const abs = Math.abs(diff);
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), 'minute');
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), 'hour');
  return rtf.format(Math.round(diff / 86_400_000), 'day');
};
