/**
 * Captures de l'App Store pour la galerie de la landing : public/img/store/manifest.json (français) et
 * public/img/store/<langue>/manifest.json (captures traduites), écrits par scripts/store-images.mjs.
 * Une langue sans captures à elle montre les captures françaises. Aucun manifeste : liste vide (la section disparaît).
 */
import type { Locale } from '../i18n/site';

export interface StoreShot {
  name: string;
  width: number;
  height: number;
  alt: string | null;
}
interface Manifest {
  widths: number[];
  shots: StoreShot[];
}
export interface StoreSet {
  /** dossier servi (`/img/store` ou `/img/store/en`) */
  dir: string;
  /** langue écrite sur les captures */
  locale: Locale;
  widths: number[];
  shots: StoreShot[];
}

const found = import.meta.glob<{ default: Manifest }>('/public/img/store/**/manifest.json', { eager: true });

function setAt(sub: string, locale: Locale): StoreSet | null {
  const m = found[`/public/img/store/${sub ? `${sub}/` : ''}manifest.json`]?.default;
  return m && m.shots.length ? { dir: `/img/store${sub ? `/${sub}` : ''}`, locale, widths: m.widths, shots: m.shots } : null;
}

/** Les captures à montrer dans une langue (les siennes, sinon les françaises). */
export function storeShotsFor(locale: Locale): StoreSet | null {
  return (locale !== 'fr' ? setAt(locale, locale) : null) ?? setAt('', 'fr');
}

export const storeSrc = (set: StoreSet, name: string, width: number): string => `${set.dir}/${name}-${width}.webp`;
