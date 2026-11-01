/**
 * Commande matching.accept_proposal. La seconde acceptation revalide sous verrous
 * (users → pets) : vérification, capacité (droits actuels), exclusivité, blocage, statut ;
 * puis crée relation + lieu attitré SANS déplacer les pets. Deux acceptations simultanées
 * ne dépassent jamais la capacité (verrou user + recomptage dans la transaction).
 * Aucune notification de rejet ; la proposition n'est pas une réservation de slot.
 */
import type { AcceptProposalResult } from '@blowy/api-contract';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { BlockReader } from '../../../shared/application/ports/block-reader.port.js';
import type { EntitlementsReader } from '../../../shared/application/ports/entitlements-reader.port.js';
import type { RelationshipCreator } from '../../../shared/application/ports/relationship-creator.port.js';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import type { MatchingRepository } from './ports/matching.repository.js';

export class AcceptProposalUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: MatchingRepository,
    private readonly creator: RelationshipCreator,
    private readonly entitlements: EntitlementsReader,
    private readonly blocks: BlockReader,
  ) {}

  async execute(actorId: string, proposalId: string, commandId: string): Promise<AcceptProposalResult> {
    const pre = await this.repo.load(null, proposalId);
    if (!pre || (pre.userLowId !== actorId && pre.userHighId !== actorId)) throw Errors.notFound('Proposition');
    const otherId = pre.userLowId === actorId ? pre.userHighId : pre.userLowId;
    // Lectures hors verrou (pas d'appel réseau sous verrou) ; revalidées dans la transaction.
    const now0 = new Date();
    const [slotsMe, slotsOther] = await Promise.all([this.entitlements.dateSlots(actorId, now0), this.entitlements.dateSlots(otherId, now0)]);
    const { result } = await this.bus.execute({
      actorId,
      operation: 'matching.accept_proposal',
      commandId,
      payload: { proposalId },
      handle: async (scope): Promise<AcceptProposalResult> => {
        await scope.lock.users([pre.userLowId, pre.userHighId]);
        await scope.lock.pets([pre.petLowId, pre.petHighId]);
        const p = (await this.repo.load(scope, proposalId))!;
        if (p.status === 'ACCEPTED' && p.contextId) return { status: 'MATCHED', relationshipId: p.contextId };
        if (p.status !== 'OPEN' || p.expiresAt <= scope.now) throw Errors.precondition('PROPOSAL_NOT_OPEN');
        if (await this.blocks.isBlockedBetween(actorId, otherId)) throw Errors.notFound('Proposition');
        const me = await this.repo.matchingInputs(scope, actorId, scope.now);
        if (!me.verified) throw new AppError('PRECONDITION_FAILED', 'Vérification requise', { detailsSafe: { reason: 'NOT_VERIFIED' } });
        const cap = await this.creator.canStartDate(scope, actorId, slotsMe);
        if (!cap.ok) throw new AppError('CAPACITY_EXCEEDED', 'Plus de place pour un rendez-vous', { detailsSafe: { reason: cap.reason } });
        await this.repo.accept(scope, proposalId, actorId);
        const accepted = new Set([...p.acceptedBy, actorId]);
        if (!accepted.has(otherId)) return { status: 'WAITING_OTHER', relationshipId: null };
        // Seconde acceptation : revalider l'autre côté aussi.
        const other = await this.repo.matchingInputs(scope, otherId, scope.now);
        const capO = await this.creator.canStartDate(scope, otherId, slotsOther);
        if (!other.verified || other.status !== 'ACTIVE' || !capO.ok) {
          await this.repo.setStatus(scope, proposalId, 'INVALIDATED');
          // Pas de rejet notifié : l'état recalculé indique simplement l'indisponibilité.
          throw new AppError('CAPACITY_EXCEEDED', 'Cette rencontre n’est plus disponible', { detailsSafe: { reason: 'OTHER_UNAVAILABLE' } });
        }
        const { contextId } = await this.creator.createDate(scope, {
          users: [pre.userLowId, pre.userHighId],
          pets: [pre.petLowId, pre.petHighId],
          affinity: Math.max(0, Math.min(100, p.visionScore)),
          dateSpotKey: me.dateSpotHint,
          timezone: me.timezone,
        });
        await this.repo.setStatus(scope, proposalId, 'ACCEPTED', contextId);
        await scope.outbox.emit({ topic: 'match.created', aggregateType: 'RelationshipContext', aggregateId: contextId, payload: { userIds: [pre.userLowId, pre.userHighId], proposalId } });
        return { status: 'MATCHED', relationshipId: contextId };
      },
    });
    return result;
  }
}
