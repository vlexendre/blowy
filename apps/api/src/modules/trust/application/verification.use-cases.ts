/**
 * Vérification d'identité (§10) — use cases :
 *  - StartVerificationUseCase : session créée côté serveur. Fournisseur réel (Veriff) :
 *    appel réseau HORS transaction, puis enregistrement PENDING + lien de reprise ;
 *    démo locale (hors prod) : badge LOCAL_DEMO ; aucun fournisseur : NOT_CONFIGURED (jamais VERIFIED).
 *  - VerificationWebhookUseCase : webhook authentifié (HMAC du corps brut), dédupliqué
 *    (ProviderWebhookEvent), état idempotent (jamais de retour depuis un état final), type exact
 *    (IDENTITY_AGE) + provenance PROVIDER ; date de naissance utilisée pour le contrôle 18+ puis oubliée.
 */
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { RandomSource } from '../../../shared/application/clock.js';
import type { IdentityVerificationProvider } from '../../../shared/application/ports/identity-verification.port.js';
import type { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import type { VerificationGateway } from '../../users/application/ports/verification.gateway.js';
import { canApplyVerification, isAdultOn, mapVeriffDecision } from '../domain/verification.js';
import type { TrustRepository } from './ports/trust.repository.js';

const VERIFIED_VALIDITY_MS = 2 * 365 * 86_400_000;

export class StartVerificationUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: TrustRepository,
    private readonly provider: IdentityVerificationProvider | null,
    private readonly localDemo: VerificationGateway | null,
    private readonly random: RandomSource,
  ) {}

  async execute(actorId: string, commandId: string, kind: 'SELFIE_QUALITY' | 'LIVENESS' | 'IDENTITY_AGE') {
    if (this.provider) {
      const localId = this.random.uuid();
      // Réseau hors transaction ; la clé d'idempotence protège la création locale.
      const created = await this.provider.createSession({ localSessionId: localId });
      return this.bus.execute({
        actorId,
        operation: 'me.start_verification',
        commandId,
        payload: { kind },
        handle: async (scope) => {
          // Veriff contrôle document + visage : type exact IDENTITY_AGE, provenance PROVIDER.
          await this.repo.createVerification(scope, { id: localId, userId: actorId, kind: 'IDENTITY_AGE', provenance: 'PROVIDER', status: 'PENDING', providerRef: created.providerRef, providerSessionUrl: created.sessionUrl, expiresAt: null });
          await scope.outbox.emit({ topic: 'user.verification_changed', aggregateType: 'User', aggregateId: actorId, payload: { status: 'PENDING', provenance: 'PROVIDER' } });
          return { status: 'PENDING', provenance: 'PROVIDER' };
        },
      });
    }
    if (this.localDemo && this.localDemo.mode === 'LOCAL_DEMO') {
      return this.bus.execute({
        actorId,
        operation: 'me.start_verification',
        commandId,
        payload: { kind },
        handle: async (scope) => {
          const s = await this.localDemo!.start(actorId, kind, scope.now);
          await this.repo.createVerification(scope, { id: this.random.uuid(), userId: actorId, kind, provenance: 'LOCAL_DEMO', status: s.status, providerRef: s.providerRef, expiresAt: s.expiresAt });
          await scope.outbox.emit({ topic: 'user.verification_changed', aggregateType: 'User', aggregateId: actorId, payload: { status: s.status, provenance: 'LOCAL_DEMO' } });
          return { status: s.status, provenance: 'LOCAL_DEMO' };
        },
      });
    }
    // Production sans fournisseur : parcours en attente, jamais verified:true.
    throw new AppError('NOT_CONFIGURED', 'Vérification non configurée');
  }
}

export class VerificationWebhookUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly repo: TrustRepository,
    private readonly provider: IdentityVerificationProvider | null,
  ) {}

  /** Renvoie 'IGNORED' pour un événement rejoué ou inconnu (réponse 200 pour stopper les retries). */
  async execute(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): Promise<'APPLIED' | 'DUPLICATE' | 'IGNORED'> {
    if (!this.provider) throw new AppError('NOT_CONFIGURED', 'Vérification non configurée');
    if (!this.provider.verifyWebhook(rawBody, headers)) throw new AppError('UNAUTHENTICATED', 'Signature invalide');
    let body: unknown;
    try {
      body = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw Errors.validation({ reason: 'INVALID_JSON' });
    }
    const d = this.provider.parseDecision(body);
    if (!d) return 'IGNORED';
    const next = mapVeriffDecision(d.status);
    return this.uow.run(async (scope) => {
      // Charge utile minimisée : jamais la date de naissance ni les données personnelles.
      const fresh = await this.repo.recordWebhook(scope, { provider: 'veriff', providerEventId: d.eventId, environment: this.provider!.environment, eventType: `decision.${d.status}`, payload: { verificationId: d.providerRef, status: d.status, code: d.code }, eventTimestamp: d.decisionTime ? new Date(d.decisionTime) : scope.now });
      if (!fresh) return 'DUPLICATE';
      const v = await this.repo.verificationByProviderRef(scope, d.providerRef);
      // vendorData = identifiant local de session : il doit correspondre (sinon ignoré).
      if (!v || !next || (d.vendorData && d.vendorData !== v.id)) return 'IGNORED';
      await scope.lock.users([v.userId]);
      const cur = (await this.repo.loadVerification(scope, v.id))!;
      if (!canApplyVerification(cur.status, next)) return 'DUPLICATE';
      let status = next;
      let reasonCode = d.reasonCode;
      // Approuvé mais document mineur : refus (l'âge déclaré seul ne suffit pas).
      if (next === 'VERIFIED' && d.dateOfBirth && !isAdultOn(d.dateOfBirth, scope.now.toISOString().slice(0, 10))) {
        status = 'REJECTED';
        reasonCode = 'UNDERAGE_DOCUMENT';
      }
      await this.repo.updateVerification(scope, v.id, {
        status,
        decisionCode: d.code,
        reasonCode,
        lastProviderEventAt: scope.now,
        clearSessionUrl: status !== 'NEEDS_RETRY',
        ...(status === 'VERIFIED' ? { verifiedAt: scope.now, expiresAt: new Date(scope.now.getTime() + VERIFIED_VALIDITY_MS) } : {}),
      });
      await scope.outbox.emit({ topic: 'user.verification_changed', aggregateType: 'User', aggregateId: v.userId, payload: { status, provenance: 'PROVIDER' } });
      return 'APPLIED';
    });
  }
}
