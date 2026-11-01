/**
 * Consommateurs/effets outbox du module trust (Observer interdomaine) :
 *  - user.consent_withdrawn → annulation jobs IA + invalidation caches/dérivés (transactionnel) ;
 *  - social.anonymous_response_reported → dossier ANONYMOUS_RESPONSE (agent F émet) ;
 *  - privacy.export_requested → construction de l'archive (effet externe : stockage) ;
 *  - message.submitted / realtime.deliver ne sont PAS consommés ici.
 */
import type { OutboxConsumer, OutboxEffect, OutboxEnvelope } from '../../../shared/application/outbox-consumer.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import type { BuildExportUseCase, ConsentWithdrawnHandler } from '../application/privacy.use-cases.js';
import type { TrustRepository } from '../application/ports/trust.repository.js';
import { caseDueAt } from '../domain/trust-rules.js';

const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export class ConsentWithdrawnConsumer implements OutboxConsumer {
  readonly name = 'trust.consent_withdrawn';
  readonly topics = ['user.consent_withdrawn'];
  constructor(private readonly handler: ConsentWithdrawnHandler) {}
  async handle(scope: TxScope, e: OutboxEnvelope) {
    await this.handler.handle(scope, e.aggregateId, strs(e.payload.purposes));
  }
}

export class AnonymousResponseReportedConsumer implements OutboxConsumer {
  readonly name = 'trust.anonymous_response_reported';
  readonly topics = ['social.anonymous_response_reported'];
  constructor(private readonly repo: TrustRepository) {}
  async handle(scope: TxScope, e: OutboxEnvelope) {
    const responseId = typeof e.payload.responseId === 'string' ? e.payload.responseId : null;
    if (!responseId) return;
    // Le répondant reste anonyme : aucune identité, seulement la réponse.
    await this.repo.openCase(scope, { subjectType: 'ANONYMOUS_RESPONSE', subjectId: responseId, subjectUserId: null, reasonCode: 'REPORT_ANONYMOUS_RESPONSE', priority: 3, restricted: false, dueAt: caseDueAt(scope.now, 3) });
  }
}

export class ExportBuildEffect implements OutboxEffect {
  readonly name = 'trust.export_build';
  readonly topics = ['privacy.export_requested'];
  constructor(private readonly build: BuildExportUseCase) {}
  async run(e: OutboxEnvelope) {
    await this.build.execute(String(e.payload.exportId));
  }
}

/**
 * Signal d'humeur (§9.5) : recalculé APRÈS la modération d'un message (effets exécutés dans
 * l'ordre), jamais par tick ; uniquement sur messages publiés d'auteurs consentants.
 */
export class ConversationSignalEffect implements OutboxEffect {
  readonly name = 'trust.conversation_signal';
  readonly topics = ['message.submitted'];
  constructor(private readonly refresh: (conversationId: string) => Promise<unknown>) {}
  async run(e: OutboxEnvelope) {
    const id = typeof e.payload.conversationId === 'string' ? e.payload.conversationId : null;
    if (id) await this.refresh(id).catch(() => null); // facultatif : une panne n'affecte pas la livraison
  }
}
