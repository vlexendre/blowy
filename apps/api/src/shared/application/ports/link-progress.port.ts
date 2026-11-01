/** Progression du Lien sur événement conversationnel (implémentée par relationships). */
import type { TxScope } from '../unit-of-work.js';

export interface LinkProgressPort {
  /**
   * Message humain publié de `authorId` dans la relation : met à jour la dette de réponse
   * et, si c'est une réponse à l'autre dans la fenêtre, attribue l'aller-retour (moteur).
   */
  onHumanMessagePublished(scope: TxScope, input: { contextId: string; authorId: string; messageId: string; previousOtherMessageAt: Date | null; previousAuthorId: string | null }): Promise<{ linkXpMilli: number }>;
}
export const LINK_PROGRESS_PORT = Symbol('LinkProgressPort');
