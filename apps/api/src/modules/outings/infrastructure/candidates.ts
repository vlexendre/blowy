/**
 * Construction des entrées de la composition (spec-v5 §4.1) à partir de la base : profil de
 * vision, intentions (jamais exposées : elles ne sortent que vers le moteur pur), tranche d'âge,
 * créneaux, quartiers acceptables, activités, team, présences, priorité. Aucune donnée de paiement.
 */
import { pairKey, seeksOf, type Gender } from '@blowy/domain';
import type { Prisma, Tx, Db } from '@blowy/database';
import type { MatchProfile } from '@blowy/matching';
import type { CompositionFacts, OutingCandidate } from '@blowy/matching/groups';
import { defaultGroupAge } from '@blowy/pet-engine';
import type { Tuning } from '@blowy/tuning';
import { storedToVision } from '../../pets/domain/pet.js';
import { ageOf } from './person-facts.js';
import { travelFrom } from './travel-times.js';

export const CANDIDATE_INCLUDE = {
  profile: { select: { gender: true } },
  matchPreferences: true,
  outingPreferences: true,
  acceptableNeighborhoods: { select: { neighborhoodId: true } },
  primaryPet: { include: { vision: true } },
  reliabilityStat: true,
  reputation: { select: { respondents: true } },
  teamMemberships: { where: { leftAt: null }, select: { teamId: true } },
} satisfies Prisma.UserInclude;

export type CandidateUser = Prisma.UserGetPayload<{ include: typeof CANDIDATE_INCLUDE }>;

export async function verifiedSet(c: Tx | Db, userIds: string[], at: Date): Promise<Set<string>> {
  const rows = await c.verificationSession.findMany({ where: { userId: { in: userIds }, status: 'VERIFIED', OR: [{ expiresAt: null }, { expiresAt: { gt: at } }] }, select: { userId: true } });
  return new Set(rows.map((r) => r.userId));
}

export function toCandidate(u: CandidateUser, o: { at: Date; verified: boolean; slotStartsAtMs: number[]; homeNeighborhoodId: string | null; missedWeeks: number; requestedAt: Date; tuning: Tuning; mode?: 'NORMAL' | 'FRIENDS_THIS_WEEK' }): OutingCandidate | null {
  const pet = u.primaryPet;
  const prefs = u.matchPreferences;
  if (!pet?.vision || !prefs || !u.birthDate) return null;
  const age = ageOf(u.birthDate, u.timezone, o.at);
  // V5.5 (D-061) : « sortir quand même, en amitié » cette semaine → composé·e comme « nouveaux potes ».
  const seeks = o.mode === 'FRIENDS_THIS_WEEK' ? seeksOf('FRIENDS') : seeksOf(prefs.lookingFor ?? 'FRIENDS');
  const groupAge = u.outingPreferences ? { min: u.outingPreferences.groupAgeMin, max: u.outingPreferences.groupAgeMax } : defaultGroupAge(age, o.tuning);
  const attendance = { attended: u.reliabilityStat?.attended ?? 0, noShows: (u.reliabilityStat?.noShows ?? 0) + (u.reliabilityStat?.lateCancels ?? 0) };
  const meetGenders = prefs.meetGenders as Gender[];
  const profile: MatchProfile = {
    userId: u.id,
    petId: pet.id,
    species: pet.species,
    vision: storedToVision(pet.vision),
    age,
    gender: (u.profile?.gender ?? 'UNDISCLOSED') as Gender,
    intention: prefs.intention,
    preferences: { minAge: groupAge.min, maxAge: groupAge.max, genders: [], maxDistanceKm: 0 },
    eligibility: { adult: age >= 18, verified: o.verified, active: u.status === 'ACTIVE', lastActiveDaysAgo: u.lastActiveAt ? Math.floor((o.at.getTime() - u.lastActiveAt.getTime()) / 86_400_000) : 0, hasFreeSlot: true, exclusive: false },
    reliability: u.reliability,
    activityByHour: new Array(24).fill(0),
    reputationWords: u.reputation?.respondents ?? 0,
    meetGenders,
    attendance,
  };
  const acceptable = u.acceptableNeighborhoods.map((a) => a.neighborhoodId);
  return {
    profile,
    seeks,
    meetGenders,
    romanceGenders: seeks.romance ? (prefs.romanceGenders as Gender[]) : [],
    groupAge,
    slotStartsAtMs: o.slotStartsAtMs,
    neighborhoodIds: acceptable.length ? acceptable : o.homeNeighborhoodId ? [o.homeNeighborhoodId] : [],
    activities: u.outingPreferences?.activities ?? [],
    ambiance: u.outingPreferences?.ambiance ?? 'ANY',
    // V5.6 (E11) : « Âge pour une histoire » (secret) — seulement si la personne cherche une histoire cette semaine.
    ...(seeks.romance && prefs.storyAgeBrackets?.length ? { storyAgeBrackets: prefs.storyAgeBrackets } : {}),
    teamId: u.teamMemberships[0]?.teamId ?? null,
    attendance,
    priority: { missedWeeks: o.missedWeeks, firstOuting: attendance.attended === 0, requestedAtMs: o.requestedAt.getTime() },
  };
}

/**
 * V5.6 (E11, §2.1, D-063) : temps de trajet — un lieu est acceptable s'il est dans le trajet max de la personne
 * (`NeighborhoodTravelTime(from = son quartier) ≤ maxTravelMinutes`, à défaut estimation par centres de quartier) ;
 * les « quartiers acceptables » saisis restent acceptés (dérivation, pas de saisie supplémentaire).
 */
export async function withTravel(db: Tx | Db, items: readonly { candidate: OutingCandidate; home: string | null; maxTravelMinutes: number }[]): Promise<void> {
  const homes = [...new Set(items.map((i) => i.home).filter((h): h is string => !!h))];
  const byHome = new Map<string, Map<string, { minutes: number }>>();
  for (const h of homes) byHome.set(h, await travelFrom(db, h));
  for (const i of items) {
    if (!i.home) continue;
    const reach = [...(byHome.get(i.home) ?? new Map()).entries()].filter(([, t]) => t.minutes <= i.maxTravelMinutes).map(([id]) => id);
    if (reach.length) i.candidate.neighborhoodIds = [...new Set([...i.candidate.neighborhoodIds, i.home, ...reach])];
  }
}

/** Faits de paire : blocages et signalements non clos ; déjà vus (co-présence, bande, duo). */
export async function compositionFacts(db: Db, userIds: string[]): Promise<CompositionFacts> {
  if (userIds.length === 0) return { blockedPairs: new Set(), metPairs: new Set(), knownContactPairs: new Set() };
  const [blocks, reports, friends, duos, co, avoid] = await Promise.all([
    db.block.findMany({ where: { blockerId: { in: userIds }, blockedId: { in: userIds } }, select: { blockerId: true, blockedId: true } }),
    db.report.findMany({ where: { reporterId: { in: userIds }, reportedUserId: { in: userIds }, status: { in: ['OPEN', 'IN_REVIEW'] } }, select: { reporterId: true, reportedUserId: true } }),
    db.friendship.findMany({ where: { userLowId: { in: userIds }, userHighId: { in: userIds } }, select: { userLowId: true, userHighId: true } }),
    db.duo.findMany({ where: { userLowId: { in: userIds }, userHighId: { in: userIds } }, select: { userLowId: true, userHighId: true } }),
    db.$queryRaw<{ a: string; b: string }[]>`
      SELECT DISTINCT s1."userId" AS a, s2."userId" AS b FROM "OutingSeat" s1
      JOIN "OutingSeat" s2 ON s2."outingId" = s1."outingId" AND s2."userId" > s1."userId"
      WHERE s1.status = 'ATTENDED' AND s2.status = 'ATTENDED' AND s1."userId" = ANY(${userIds}::uuid[]) AND s2."userId" = ANY(${userIds}::uuid[])`,
    // V5.4 (A.6, D-049) : paires « je connais cette personne » (opt-in « éviter les personnes que je connais »).
    db.avoidPair.findMany({ where: { userLowId: { in: userIds }, userHighId: { in: userIds } }, select: { userLowId: true, userHighId: true } }),
  ]);
  return {
    blockedPairs: new Set([...blocks.map((b) => pairKey(b.blockerId, b.blockedId)), ...reports.map((r) => pairKey(r.reporterId, r.reportedUserId))]),
    metPairs: new Set([...friends.map((f) => pairKey(f.userLowId, f.userHighId)), ...duos.map((d) => pairKey(d.userLowId, d.userHighId)), ...co.map((r) => pairKey(r.a, r.b))]),
    knownContactPairs: new Set(avoid.map((p) => pairKey(p.userLowId, p.userHighId))),
  };
}
