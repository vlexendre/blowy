/**
 * Porte unique vers les modèles d'IA (chantier « plateforme », voir docs/V7-INTERFACES.md).
 * Tout appel passe par ici : le compteur, les budgets par personne, le plafond global et l'interrupteur
 * s'appliquent AVANT l'appel. Un appelant a toujours un comportement sans IA quand `ok` est faux.
 */
export const AI_GATEWAY = Symbol('AI_GATEWAY');

export type AiFeature = 'habit_proof' | 'chat_remark' | 'weekly_review' | 'moderation';

export interface AiRequest {
  feature: AiFeature;
  userId: string;
  system: string; // consigne stable (mise en cache)
  prompt: string;
  image?: { base64: string; mediaType: 'image/jpeg' | 'image/webp' };
  maxTokens: number;
  tier: 'small' | 'medium';
  locale: string; // 'fr' | 'en' | 'es' | 'pt' | 'nl'
}

export type AiResult = { ok: true; text: string } | { ok: false; reason: 'disabled' | 'budget' | 'error' };

export interface AiGateway {
  complete(req: AiRequest): Promise<AiResult>;
}
