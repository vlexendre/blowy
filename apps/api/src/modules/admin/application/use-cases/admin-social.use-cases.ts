/**
 * Actions staff sur le social (§18.11) : masquage d'une réponse anonyme abusive (motivé, audité).
 * Ne révèle jamais l'auteur : aucune méthode ne lit l'empreinte visiteur.
 */
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import type { AdminActor, AdminCommandRunner } from '../admin-command.js';

/** Port fourni par le module social (seul écrivain de ses tables). */
export interface SocialModerationPort {
  staffHide(scope: TxScope, responseId: string): Promise<{ targetUserId: string }>;
}
export const SOCIAL_MODERATION = Symbol.for('blowy.social.moderation');

export class AdminSocialUseCases {
  constructor(private readonly social: SocialModerationPort, private readonly runner: AdminCommandRunner) {}

  hideAnonymous(a: AdminActor, id: string, reason: string, commandId: string) {
    return this.runner.run(a, {
      permission: 'social.anonymous.moderate', operation: 'social.anonymous_hide', commandId, payload: { id, reason }, reason, target: { type: 'AnonymousResponse', id },
      handle: async (scope) => {
        const r = await this.social.staffHide(scope, id);
        return { result: { id, hidden: true }, auditData: { targetUserId: r.targetUserId } };
      },
    });
  }
}
