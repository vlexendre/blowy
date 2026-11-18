/**
 * Tous les dictionnaires du site, pour `pnpm i18n:check` (forme identique dans les cinq langues, aucun `TODO`, jamais
 * « pet »). Les pages légales ont leur propre contenu (content/legal) et ne sont pas listées ici.
 */
import type { Locale } from '../i18n/site';
import { landingText } from './landing-text';
import { siteText } from './site';
import { publicText } from './public';
import { quizCopy } from './quiz';
import { growthCopy } from './growth';
import { openCopy } from './open';
import { quartierXpCopy } from './quartier';

export const siteDictionaries: Record<string, Record<Locale, unknown>> = {
  landing: landingText,
  site: siteText,
  public: publicText,
  quiz: quizCopy,
  growth: growthCopy,
  open: openCopy,
  quartier: quartierXpCopy,
};
