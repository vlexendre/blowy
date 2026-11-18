/** Textes de la landing dans les cinq langues (le français fixe la forme : une clé manquante est une erreur de type). */
import { siteMessages } from '../../i18n/site';
import { fr, type LandingText } from './fr';
import { en } from './en';
import { es } from './es';
import { pt } from './pt';
import { nl } from './nl';

export type { LandingText };
export const landingText = siteMessages<LandingText>({ fr, en, es, pt, nl });
