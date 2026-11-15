/** Contenu des pages légales, par langue. Le français fait foi. */
import type { Locale } from '../../i18n/legal';
import type { LegalBundle } from './types';
import { fr } from './fr';
import { en } from './en';
import { es } from './es';
import { pt } from './pt';
import { nl } from './nl';

export const LEGAL_CONTENT: Record<Locale, LegalBundle> = { fr, en, es, pt, nl };
