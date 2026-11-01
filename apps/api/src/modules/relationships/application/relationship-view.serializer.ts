/**
 * Sérialiseur explicite RelationshipView. Ne contient JAMAIS le vote de l'autre, ni sa
 * réponse à une offre, ni d'autres relations, ni position, ni données humaines privées.
 * `viewVersion` = version de la projection du lecteur (n'avance pas sur un vote d'autrui).
 */
import type { PublicPetProfile, RelationshipView } from '@blowy/api-contract';
import { capabilitiesOf } from '../domain/capabilities.js';
import type { ContextRow, OfferRow, RoundRow } from './ports/relationship.repository.js';

export interface ViewInput {
  ctx: ContextRow;
  viewerId: string;
  myPet: PublicPetProfile;
  otherPet: PublicPetProfile;
  locations: Map<string, { kind: string; contextId: string | null }>;
  pausedBy: Set<string>;
  photosAllowedByBoth: boolean;
  offers: OfferRow[];
  round: RoundRow | null;
  myChoice: 'FRIEND' | 'PLUS' | null;
  viewVersion: number;
}

export function toRelationshipView(i: ViewInput): RelationshipView {
  const { ctx, viewerId } = i;
  const mine = ctx.sides.find((s) => s.userId === viewerId)!;
  const other = ctx.sides.find((s) => s.userId !== viewerId)!;
  const here = (petId: string) => i.locations.get(petId)?.contextId === ctx.id;
  const paused = i.pausedBy.size > 0;
  const movedIn = ctx.status === 'MOVED_IN';
  return {
    id: ctx.id,
    type: ctx.type,
    status: ctx.status,
    branch: ctx.branch,
    affinity: ctx.affinity,
    xp: ctx.xpMilli / 1000,
    eligibleLevel: ctx.eligibleLevel,
    reachedLevel: ctx.reachedLevel,
    complicity: Math.round(ctx.complicity),
    tension: Math.round(ctx.tension),
    capabilities: capabilitiesOf({ status: ctx.status, branch: ctx.branch, reachedLevel: ctx.reachedLevel, paused, photosAllowedByBoth: i.photosAllowedByBoth, movedIn }),
    myPet: i.myPet,
    otherPet: i.otherPet,
    otherPresence: here(other.petId) ? 'HERE' : 'OUT',
    myPetHere: here(mine.petId),
    dateSpotKey: ctx.dateSpotKey,
    conversationId: ctx.conversationId,
    pausedByMe: i.pausedBy.has(viewerId),
    paused,
    legacy: ctx.legacy,
    exclusive: mine.exclusive,
    pendingOffers: i.offers.map((o) => ({
      id: o.id,
      scope: o.scope,
      version: o.version,
      proposedByMe: o.proposedBy === viewerId,
      myDecision: o.responses.find((r) => r.userId === viewerId)?.decision ?? null,
      expiresAt: o.expiresAt.toISOString(),
    })),
    openBranchRound: i.round && i.round.status === 'OPEN' ? { id: i.round.id, roundNo: i.round.roundNo, deadlineAt: i.round.deadlineAt.toISOString(), myChoice: i.myChoice } : null,
    startedAt: ctx.startedAt.toISOString(),
    endedAt: ctx.endedAt?.toISOString() ?? null,
    viewVersion: i.viewVersion,
  };
}
