/**
 * Dépouillement des votes d'après (spec-v5 §2.10, V5.1 A) : résultat = min des deux votes, « plus »
 * sans compatibilité réciproque (genres recherchés, âges) devient « ami·e » EN SILENCE ; un bulletin
 * manquant vaut « non » ; jamais de vote entre membres d'une même team. Seuls les accords mutuels
 * sortent d'ici : un « non » ou un « plus » unilatéral ne laisse aucune trace.
 */
import { pairKey, resolvePairVotes, type ConnectionKind, type VoteChoice } from '@blowy/domain';
import { romanceCompatible, type SeeksProfile } from '@blowy/matching/groups';

export interface Attendee {
  userId: string;
  teamId: string | null;
  seeks: SeeksProfile;
}

export interface PairResult {
  a: string;
  b: string;
  kind: ConnectionKind;
}

/** Les cibles d'un votant : autres présents hors de sa team. */
export function voteTargets(voter: Pick<Attendee, 'userId' | 'teamId'>, attendees: readonly Pick<Attendee, 'userId' | 'teamId'>[]): string[] {
  return attendees.filter((a) => a.userId !== voter.userId && !(voter.teamId && a.teamId === voter.teamId)).map((a) => a.userId);
}

export function resolveOutingVotes(attendees: readonly Attendee[], ballots: ReadonlyMap<string, VoteChoice>): PairResult[] {
  const sorted = [...attendees].sort((x, y) => (x.userId < y.userId ? -1 : 1));
  const out: PairResult[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i]!;
      const b = sorted[j]!;
      if (a.teamId && a.teamId === b.teamId) continue;
      const kind = resolvePairVotes(ballots.get(`${a.userId}>${b.userId}`) ?? null, ballots.get(`${b.userId}>${a.userId}`) ?? null, romanceCompatible(a.seeks, b.seeks));
      if (kind) out.push({ a: a.userId, b: b.userId, kind });
    }
  }
  return out;
}

export const ballotKey = (voter: string, target: string) => `${voter}>${target}`;
export const pairOf = (a: string, b: string): [string, string] => (a < b ? [a, b] : [b, a]);
export { pairKey };
