/**
 * Observateurs outbox du module `safety` :
 *  - `outing.seat_cancelled` (annulation, retrait système, suppression) → liens du propriétaire révoqués ;
 *  - `outing.cancelled` → tous les liens de la sortie révoqués ;
 *  - `privacy.deletion_requested` → tous les liens de la personne révoqués ;
 *  - `outing.knows_someone_review` → dossier staff « je connais quelqu'un » (réponse < 1 h) ;
 *  - `safety.alert_raised` → accusé WS (transactionnel) puis Web Push sans contenu (effet externe).
 */
import type { OutboxConsumer, OutboxEffect, OutboxEnvelope } from '../../../shared/application/outbox-consumer.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { HUMAN_RESPONSE_MINUTES } from '../domain/guardian.js';
import type { SafetyUseCases } from '../application/safety.use-cases.js';
import type { GuardianPushSender, SafetyCaseSink, SubjectReader } from '../application/ports/safety.ports.js';

const str = (v: unknown) => (typeof v === 'string' ? v : null);

export class GuardianRevocationConsumer implements OutboxConsumer {
  readonly name = 'safety.guardian_revocation';
  readonly topics = ['outing.seat_cancelled', 'outing.cancelled', 'privacy.deletion_requested'];
  constructor(
    private readonly safety: SafetyUseCases,
    private readonly subjects: SubjectReader,
  ) {}
  async handle(scope: TxScope, e: OutboxEnvelope) {
    if (e.topic === 'outing.cancelled') {
      const outingId = str(e.payload.outingId) ?? e.aggregateId;
      await this.safety.revokeForOuting(scope, outingId);
    } else if (e.topic === 'outing.seat_cancelled') {
      // « Je pars, mal à l'aise » : les liens restent (la page montre le départ si la personne l'a choisi).
      if (e.payload.cancelKind === 'SAFETY_EXIT') return;
      const seat = await this.subjects.seatOwner(str(e.payload.seatId) ?? e.aggregateId);
      if (seat) await this.safety.revokeForSeat(scope, seat.userId, seat.outingId);
    } else {
      const userId = str(e.payload.userId) ?? e.aggregateId;
      await this.safety.revokeForUser(scope, userId);
    }
  }
}

export class KnowsSomeoneReviewConsumer implements OutboxConsumer {
  readonly name = 'safety.knows_someone_review';
  readonly topics = ['outing.knows_someone_review'];
  constructor(
    private readonly cases: SafetyCaseSink,
    private readonly subjects: SubjectReader,
  ) {}
  async handle(scope: TxScope, e: OutboxEnvelope) {
    const seatId = str(e.payload.seatId) ?? e.aggregateId;
    const seat = await this.subjects.seatOwner(seatId);
    // Sujet = la place (subjectType OUTING) ; la personne visée n'est jamais révélée au demandeur.
    await this.cases.open(scope, { subjectType: 'OUTING', subjectId: seatId, subjectUserId: seat?.userId ?? null, reasonCode: 'KNOWS_SOMEONE_REVIEW', priority: 1, dueInMinutes: HUMAN_RESPONSE_MINUTES });
  }
}

export class AlertAckConsumer implements OutboxConsumer {
  readonly name = 'safety.alert_ack';
  readonly topics = ['safety.alert_raised'];
  constructor(private readonly safety: SafetyUseCases) {}
  async handle(scope: TxScope, e: OutboxEnvelope) {
    await this.safety.ack(scope, str(e.payload.alertId) ?? e.aggregateId);
  }
}

export class GuardianPushEffect implements OutboxEffect {
  readonly name = 'safety.guardian_push';
  readonly topics = ['safety.alert_raised', 'safety.guardian_notify'];
  constructor(
    private readonly safety: SafetyUseCases,
    private readonly sender: GuardianPushSender,
  ) {}
  async run(e: OutboxEnvelope) {
    if (e.topic === 'safety.guardian_notify') {
      const kind = e.payload.subjectKind === 'DUO_DATE' ? 'DUO_DATE' : 'OUTING';
      await this.safety.notifyFor(str(e.payload.userId) ?? e.aggregateId, kind, str(e.payload.subjectId) ?? '', this.sender);
      return;
    }
    await this.safety.notifyGuardians(str(e.payload.alertId) ?? e.aggregateId, this.sender);
  }
}

/**
 * « Je pars, mal à l'aise » (V5.3 B.9) — toute place annulée `SAFETY_EXIT` (route dédiée ou annulation
 * « sécurité ») : trace, message au staff (dossier sur la place, réponse < 1 h), et au 3ᵉ départ un
 * dossier « recontact humain » sur la personne. Jamais de pénalité.
 */
export class UneasyLeaveConsumer implements OutboxConsumer {
  readonly name = 'safety.uneasy_leave';
  readonly topics = ['outing.seat_cancelled'];
  constructor(
    private readonly safety: SafetyUseCases,
    private readonly subjects: SubjectReader,
  ) {}
  async handle(scope: TxScope, e: OutboxEnvelope) {
    if (e.payload.cancelKind !== 'SAFETY_EXIT') return;
    const seatId = str(e.payload.seatId) ?? e.aggregateId;
    const seat = await this.subjects.seatOwner(seatId);
    if (seat) await this.safety.onUneasyLeave(scope, { userId: seat.userId, outingId: seat.outingId, seatId });
  }
}
