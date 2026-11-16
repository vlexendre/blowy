/**
 * Le prestataire d'IA à qui Minimoa envoie des données (lecture des chats, preuves d'habitude, bilan sans nom).
 * Les phrases ne le nomment jamais en dur : elles reçoivent son nom et son pays. La valeur réelle vient de la
 * configuration de l'API (`AI_PROVIDER_NAME`, `AI_PROVIDER_COUNTRY`) ; la valeur par défaut ci-dessous doit rester celle
 * de la politique de confidentialité (`apps/web/src/config/legal.ts`, `PROCESSORS.ai`).
 */
import type { Locale } from '@blowy/domain';

export interface AiProcessor {
  /** Nom tel qu'il apparaît dans la politique de confidentialité (« Anthropic »). */
  name: string;
  /** Pays où il traite les données (code ISO 3166-1 alpha-2, « US »). */
  country: string;
}

export const DEFAULT_AI_PROCESSOR: AiProcessor = Object.freeze({ name: 'Anthropic', country: 'US' });

/** Nom du pays dans la langue demandée (« États-Unis », « United States ») ; le code tel quel si inconnu. */
export function countryName(locale: Locale, code: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** Le prestataire tel qu'on le montre : nom et pays dans la langue de la personne. */
export const aiProcessorView = (locale: Locale, p: AiProcessor = DEFAULT_AI_PROCESSOR): { name: string; country: string } => ({
  name: p.name,
  country: countryName(locale, p.country),
});
