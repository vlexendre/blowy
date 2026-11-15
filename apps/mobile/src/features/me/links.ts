/**
 * Sorties de « Moi » : pages légales du site (dans la langue de l'app). Blowy+ : `openPlus` de `@/features/plus`.
 */
import { Linking } from 'react-native';

import { config } from '@/core';
import { getLocale } from '@/locales/runtime';

/** Pages légales du site (`apps/web/src/i18n/legal.ts` : mêmes noms de page dans toutes les langues). */
export type LegalPage = 'mentions-legales' | 'conditions' | 'confidentialite' | 'abonnement' | 'regles' | 'cookies' | 'securite' | 'supprimer-mon-compte' | 'assistance';

/** Français (version qui fait foi) : /legal/<page>/ ; autres langues : /<langue>/legal/<page>/. */
export function legalUrl(page: LegalPage): string {
  const locale = getLocale();
  return `${config.webUrl}${locale === 'fr' ? '' : `/${locale}`}/legal/${page}/`;
}

export const openLegal = (page: LegalPage) => () => void Linking.openURL(legalUrl(page));
