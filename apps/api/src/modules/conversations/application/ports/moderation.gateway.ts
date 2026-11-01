/**
 * Port ModerationGateway (Strategy). Implémentation locale déterministe ici ;
 * l'agent E branchera l'adapter OpenAI (packages/ai) derrière ce même port.
 * Une panne fournisseur NE VAUT PAS approbation : `PROCESSING_FAILED`.
 */
export interface ModerationVerdict {
  action: 'ALLOW' | 'WARN' | 'QUARANTINE' | 'REJECT' | 'HUMAN_REVIEW';
  reasonCode: string;
  policyVersion: string;
  provider: string;
  source: 'DETERMINISTIC' | 'AUTO';
  signals?: Record<string, number>;
}

export interface ModerationGateway {
  readonly provider: string;
  /** Peut lever une erreur (timeout, panne) → message PROCESSING_FAILED. */
  moderateText(input: { text: string; conversationId: string; authorId: string }): Promise<ModerationVerdict>;
}
export const MODERATION_GATEWAY = Symbol('ModerationGateway');
