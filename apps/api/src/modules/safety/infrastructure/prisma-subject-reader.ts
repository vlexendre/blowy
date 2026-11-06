/**
 * Lecture SEULE des sujets d'ange gardien (tables du module `outings`, jamais écrites ici).
 * Sortie : la place du propriétaire fait foi (CONFIRMED / CHECKED_IN / ATTENDED = confirmée ;
 * annulée, retirée, refusée, expirée ou sortie annulée = plus rien n'est servi au proche).
 * RDV duo (`DUO_DATE`) : pas encore publiés par le module `connections` (T5) → introuvable.
 */
import type { Db } from '@blowy/database';
import type { GuardianSubjectKind } from '@blowy/domain';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { SubjectFacts } from '../domain/guardian.js';
import type { SubjectReader } from '../application/ports/safety.ports.js';

const CONFIRMED = new Set(['CONFIRMED', 'CHECKED_IN', 'ATTENDED', 'NO_SHOW']);
const ENDED = new Set(['CANCELLED', 'DECLINED', 'EXPIRED']);

export class PrismaSubjectReader implements SubjectReader {
  constructor(private readonly db: Db) {}

  async subject(ownerUserId: string, kind: GuardianSubjectKind, id: string, scope: TxScope | null = null): Promise<SubjectFacts | null> {
    if (kind !== 'OUTING') return null;
    const c = scope ? txOf(scope) : this.db;
    const seat = await c.outingSeat.findUnique({
      where: { outingId_userId: { outingId: id, userId: ownerUserId } },
      select: {
        id: true,
        status: true,
        cancelKind: true,
        cancelledAt: true,
        checkedInAt: true,
        outing: { select: { id: true, status: true, startsAt: true, endsAt: true, lockAt: true, venue: { select: { name: true, addressLine: true, postalCode: true, city: true } } } },
      },
    });
    if (!seat) return null;
    const user = await c.profile.findUnique({ where: { userId: ownerUserId }, select: { displayName: true } });
    const o = seat.outing;
    // « Je pars, mal à l'aise » (V5.3 B.9) : la page du proche reste servie jusqu'à expiration ;
    // le départ n'y apparaît que si la personne a choisi de prévenir son gardien.
    const uneasy = seat.status === 'CANCELLED' && seat.cancelKind === 'SAFETY_EXIT';
    const leave = uneasy ? await c.safetyUneasyLeave.findUnique({ where: { seatId: seat.id }, select: { notifyGuardian: true, createdAt: true } }) : null;
    const confirmed = CONFIRMED.has(seat.status) || uneasy;
    return {
      kind: 'OUTING',
      id: o.id,
      ownerUserId,
      ownerFirstName: user?.displayName ?? '',
      confirmed,
      cancelled: o.status === 'CANCELLED' || (ENDED.has(seat.status) && !uneasy),
      startsAt: o.startsAt,
      endsAt: o.endsAt,
      // Lieu au verrouillage, et seulement pour une place confirmée (spec-v5 §3.1).
      venueRevealAt: confirmed ? o.lockAt : null,
      venue: o.venue ? { name: o.venue.name, address: `${o.venue.addressLine}, ${o.venue.postalCode} ${o.venue.city}` } : null,
      checkedInAt: seat.checkedInAt,
      leftAt: leave?.notifyGuardian ? (seat.cancelledAt ?? leave.createdAt) : null,
    };
  }

  async seatOwner(seatId: string) {
    const s = await this.db.outingSeat.findUnique({ where: { id: seatId }, select: { userId: true, outingId: true } });
    return s ?? null;
  }
}
