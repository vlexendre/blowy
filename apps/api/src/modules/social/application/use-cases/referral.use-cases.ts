/**
 * Parrainage (P-5.9). Aucune récompense au clic, à l'ouverture du lien ni à l'installation :
 * seul le passage d'un claim PENDING_ACTIVATION à REWARDED (activation admissible vérifiée en
 * base, sous verrou) émet `referral.activated`, que le module economy crédite une fois au ledger.
 */
import type { InvitePreview, ReferralClaimView, ReferralLink } from '@blowy/api-contract';
import { coinRewards, DEFAULT_TUNING } from '@blowy/tuning';
import type { CommandBus } from '../../../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../../../shared/application/clock.js';
import type { TxScope, UnitOfWork } from '../../../../shared/application/unit-of-work.js';
import { AppError, Errors } from '../../../../shared/domain/errors.js';
import { codeFromHex, missingForActivation, parseInviteRef, signInvite } from '../../domain/referral.js';
import type { ReferralRepository, SocialConfig } from '../ports/social.ports.js';

export const REFERRAL_ACTIVATED_TOPIC = 'referral.activated';
const rewards = () => coinRewards(DEFAULT_TUNING);

export class ReferralUseCases {
  constructor(
    private readonly repo: ReferralRepository,
    private readonly bus: CommandBus,
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly random: RandomSource,
    private readonly cfg: SocialConfig,
  ) {}

  private toLink(l: { code: string; expiresAt: Date }): ReferralLink {
    const token = signInvite(this.cfg.publicLinkSecret, l.code, l.expiresAt);
    return { token, code: l.code, url: `${this.cfg.publicWebOrigin}/invite/${token}`, expiresAt: l.expiresAt.toISOString() };
  }

  /** Lien du parrain (réutilisé tant qu'il est valide). */
  async myLink(userId: string, commandId: string): Promise<ReferralLink> {
    const now = this.clock.now();
    const existing = await this.repo.activeLink(userId, now);
    if (existing) return this.toLink(existing);
    const out = await this.bus.execute({
      actorId: userId, operation: 'social.referral_link.create', commandId, payload: {},
      handle: async (scope) => {
        for (let i = 0; i < 5; i++) {
          const code = codeFromHex(this.random.hex(8));
          const expiresAt = new Date(scope.now.getTime() + this.cfg.inviteTtlDays * 86_400_000);
          if (await this.repo.createLink(scope, { id: this.random.uuid(), userId, code, expiresAt })) return { code, expiresAt: expiresAt.toISOString() };
        }
        throw new AppError('CONFLICT', 'Génération de code impossible, réessaie', { retryable: true });
      },
    });
    return this.toLink({ code: out.result.code, expiresAt: new Date(out.result.expiresAt) });
  }

  /** Aperçu public d'une invitation (page /invite/<token>) : ne crée rien, ne trace personne. */
  async preview(ref: string): Promise<InvitePreview> {
    const r = rewards();
    const base = { rewardCoins: { referrer: r.referralReferrer, referee: r.referralReferee } };
    const parsed = parseInviteRef(this.cfg.publicLinkSecret, ref);
    if (parsed.kind === 'INVALID') return { valid: false, reason: parsed.reason, inviter: null, code: null, expiresAt: null, ...base };
    const link = await this.repo.findLinkByCode(null, parsed.code);
    if (!link) return { valid: false, reason: 'UNKNOWN', inviter: null, code: null, expiresAt: null, ...base };
    const now = this.clock.now();
    const expiresAt = parsed.kind === 'TOKEN' && parsed.expiresAt < link.expiresAt ? parsed.expiresAt : link.expiresAt;
    if (link.revokedAt) return { valid: false, reason: 'REVOKED', inviter: null, code: null, expiresAt: null, ...base };
    if (expiresAt <= now) return { valid: false, reason: 'EXPIRED', inviter: null, code: null, expiresAt: expiresAt.toISOString(), ...base };
    const inviter = await this.repo.inviterPreview(link.userId);
    return { valid: !!inviter, reason: inviter ? null : 'UNKNOWN', inviter, code: link.code, expiresAt: expiresAt.toISOString(), ...base };
  }

  /** Claim par le nouveau compte (authentifié). Anti-auto-parrainage, un seul claim par filleul. */
  async claim(refereeUserId: string, ref: string, commandId: string): Promise<ReferralClaimView> {
    const parsed = parseInviteRef(this.cfg.publicLinkSecret, ref);
    if (parsed.kind === 'INVALID') throw Errors.precondition('INVITE_INVALID');
    const out = await this.bus.execute({
      actorId: refereeUserId, operation: 'social.referral.claim', commandId, payload: { ref },
      handle: async (scope) => {
        const link = await this.repo.findLinkByCode(scope, parsed.code);
        if (!link || link.revokedAt) throw Errors.precondition('INVITE_INVALID');
        const exp = parsed.kind === 'TOKEN' && parsed.expiresAt < link.expiresAt ? parsed.expiresAt : link.expiresAt;
        if (exp <= scope.now) throw Errors.precondition('INVITE_EXPIRED');
        if (link.userId === refereeUserId) throw new AppError('FORBIDDEN', 'Impossible de se parrainer soi-même', { detailsSafe: { reason: 'SELF_REFERRAL' } });
        await scope.lock.users([link.userId, refereeUserId]);
        // Un compte déjà actif (onboarding terminé avant le lien) ne peut pas être « parrainé » rétroactivement.
        const onboardedAt = await this.repo.userOnboardedAt(scope, refereeUserId);
        if (onboardedAt && onboardedAt < link.createdAt) throw Errors.precondition('ACCOUNT_PREDATES_INVITE');
        const prior = await this.repo.claimOf(scope, refereeUserId);
        if (prior) throw Errors.conflict('ALREADY_CLAIMED');
        const id = this.random.uuid();
        await this.repo.createClaim(scope, { id, linkId: link.id, referrerUserId: link.userId, refereeUserId });
        return { id };
      },
    });
    void out;
    // Tentative d'activation immédiate (compte peut-être déjà admissible), puis vue.
    await this.tryActivate(refereeUserId);
    return this.status(refereeUserId);
  }

  async status(refereeUserId: string): Promise<ReferralClaimView> {
    const c = await this.repo.claimOf(null, refereeUserId);
    if (!c) throw Errors.notFound('Parrainage');
    const missing = c.status === 'PENDING_ACTIVATION' ? await this.uow.run((scope) => this.missing(scope, refereeUserId)) : [];
    return { status: c.status, missing, claimedAt: c.claimedAt.toISOString(), rewardedAt: c.rewardedAt?.toISOString() ?? null };
  }

  private async missing(scope: TxScope, userId: string) {
    return missingForActivation(await this.repo.activationFacts(scope, userId, scope.now), this.cfg.allowLocalDemoVerification);
  }

  /**
   * Activation : vérifiée sous verrou ; PENDING → REWARDED une seule fois (garde de statut) puis
   * événement outbox. Appelée au claim, par le job périodique et après les événements utiles.
   */
  async tryActivate(refereeUserId: string): Promise<'REWARDED' | 'PENDING' | 'NONE' | 'REJECTED'> {
    return this.uow.run(async (scope) => {
      const c0 = await this.repo.claimOf(scope, refereeUserId);
      if (!c0 || c0.status !== 'PENDING_ACTIVATION') return c0 ? (c0.status === 'REWARDED' ? 'REWARDED' : 'REJECTED') : 'NONE';
      await scope.lock.users([c0.referrerUserId, refereeUserId]);
      const c = await this.repo.claimOf(scope, refereeUserId);
      if (!c || c.status !== 'PENDING_ACTIVATION') return 'NONE';
      if (!(await this.repo.referrerActive(scope, c.referrerUserId))) {
        await this.repo.markRejected(scope, c.id);
        return 'REJECTED';
      }
      if ((await this.missing(scope, refereeUserId)).length > 0) return 'PENDING';
      if (!(await this.repo.markRewarded(scope, c.id, scope.now))) return 'NONE';
      const r = rewards();
      await scope.outbox.emit({
        topic: REFERRAL_ACTIVATED_TOPIC, aggregateType: 'ReferralClaim', aggregateId: c.id,
        payload: { claimId: c.id, referrerUserId: c.referrerUserId, refereeUserId, referrerCoins: r.referralReferrer, refereeCoins: r.referralReferee, tuningVersion: DEFAULT_TUNING.version },
      });
      return 'REWARDED';
    });
  }

  /** Job : réévalue les claims en attente (filet si aucun événement déclencheur). */
  async activatePending(limit = 200): Promise<number> {
    let n = 0;
    for (const userId of await this.repo.pendingClaims(limit)) if ((await this.tryActivate(userId)) === 'REWARDED') n++;
    return n;
  }
}
