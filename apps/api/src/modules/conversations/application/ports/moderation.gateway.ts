/**
 * Port ModerationGateway (Strategy). Implémentation locale déterministe ici ;
 * l'agent E branchera l'adapter OpenAI (packages/ai) derrière ce même port.
 * Une panne fournisseur NE VAUT PAS approbation : `PROCESSING_FAILED`.
 */
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
export interface ModerationVerdict {
  action: 'ALLOW' | 'WARN' | 'QUARANTINE' | 'REJECT' | 'HUMAN_REVIEW';
  reasonCode: string;
  policyVersion: string;
  provider: string;
  source: 'DETERMINISTIC' | 'AUTO' | 'HUMAN';
  signals?: Record<string, number>;
  /** Dossier de modération à ouvrir (agent E) ; `restricted` = protection des mineurs. */
  case?: { priority: 1 | 2 | 3; restricted: boolean };
  /** Détresse exprimée : ressources d'aide proposées à l'auteur, aucune sanction. */
  distress?: boolean;
}

export interface ModerationGateway {
  readonly provider: string;
  /** Peut lever une erreur (timeout, panne) → message PROCESSING_FAILED. */
  moderateText(input: { text: string; conversationId: string; authorId: string; messageId?: string }): Promise<ModerationVerdict>;
  /** Message vocal (§9.2) : transcription serveur puis modération du texte. Absent = jamais publié. */
  moderateVoice?(input: { mediaId: string; conversationId: string; authorId: string; messageId: string }): Promise<ModerationVerdict>;
}
export const MODERATION_GATEWAY = Symbol('ModerationGateway');
/** Implémentation IA fournie par le module trust (agent E), optionnelle. */
export const AI_MODERATION_GATEWAY = Symbol.for('blowy.ai.moderationGateway');

/** Ouverture d'un dossier de modération dans la transaction de décision (fourni par trust). */
export interface ModerationCaseSink {
  open(scope: TxScope, c: { subjectType: 'MESSAGE'; subjectId: string; subjectUserId: string | null; reasonCode: string; priority: 1 | 2 | 3; restricted: boolean }): Promise<void>;
}
export const MODERATION_CASE_SINK = Symbol.for('blowy.trust.moderationCaseSink');

/** Porte d'envoi d'un vocal (fournie par media) : propriété, statut, capacité VOICE, usage unique. */
export interface VoiceMessageGate {
  assertCanSend(actorId: string, conversationId: string, mediaId: string): Promise<void>;
}
export const VOICE_MESSAGE_GATE = Symbol.for('blowy.media.voiceGate');
