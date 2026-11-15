/**
 * Le prestataire d'IA nommé dans les textes vus par les gens (accords de lecture des chats et des preuves).
 * Vient de la configuration (`AI_PROVIDER_NAME`, `AI_PROVIDER_COUNTRY`), fourni par `PlateformeModule` (global).
 */
import type { AiProcessor } from '@blowy/content';

export const AI_PROCESSOR = Symbol('AI_PROCESSOR');
export type { AiProcessor };
