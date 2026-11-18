/**
 * Langue de la page dans le navigateur : celle de <html lang>, posée au build (pages indexées) ou par le gabarit des
 * pages de partage avant les scripts de page (`layouts/Public.astro`, mode `shell`). Une seule source pour tous les
 * scripts : ils lisent leurs textes dans le dictionnaire de cette langue.
 */
import { DEFAULT_LOCALE, browserLocale, isLocale, localePath, type Locale } from './site';

export function currentLocale(): Locale {
  const l = (document.documentElement.lang || '').slice(0, 2).toLowerCase();
  return isLocale(l) ? l : DEFAULT_LOCALE;
}

/**
 * Adresse d'une page de partage (`/quiz/CODE`) qui garde la langue de la page : la copie partagée suit le téléphone,
 * donc `?lang=` n'est ajouté que si la page n'est pas dans la langue que le téléphone choisirait.
 */
export function sharePathKeepingLocale(path: string): string {
  const locale = currentLocale();
  const phone = browserLocale(navigator.languages?.length ? navigator.languages : [navigator.language]) ?? 'en';
  if (locale === phone) return path;
  return `${path}${path.includes('?') ? '&' : '?'}lang=${locale}`;
}

/** Lien vers une page du site dans la langue de la page. */
export const pathInLocale = (path: string): string => localePath(currentLocale(), path);
