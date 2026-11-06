/** Chargement des faits « personne » montrables (prénom, âge calculé, pet, fiabilité, 3 mots). */
import { ANONYMOUS_WORDS, type Gender } from '@blowy/domain';
import type { Prisma, Tx, Db } from '@blowy/database';
import type { PetCard } from '@blowy/api-contract';
import { ageOn, localCivilDate } from '../../users/domain/age.js';
import type { PersonFacts } from '../domain/facts.js';

export const PERSON_INCLUDE = {
  profile: { select: { displayName: true, gender: true } },
  primaryPet: { select: { name: true, species: true, stage: true, vision: { select: { school: true, sunday: true, passions: true } }, state: { select: { engineStateV5: true } } } },
  reliabilityStat: { select: { attended: true, noShows: true, lateCancels: true } },
  reputation: { select: { wordCounts: true } },
  outingPreferences: { select: { showCalmBadge: true } },
} satisfies Prisma.UserInclude;

type PersonRow = Prisma.UserGetPayload<{ include: typeof PERSON_INCLUDE }>;

export function ageOf(birthDate: Date | null, timezone: string, at: Date): number {
  if (!birthDate) return 18;
  return ageOn({ y: birthDate.getUTCFullYear(), m: birthDate.getUTCMonth() + 1, d: birthDate.getUTCDate() }, localCivilDate(at, timezone));
}

export function petCardOf(p: PersonRow['primaryPet']): PetCard {
  const v5 = (p?.state?.engineStateV5 ?? null) as { equipped?: string[] } | null;
  const traits = p?.vision ? [`school.${p.vision.school.toLowerCase()}`, `sunday.${p.vision.sunday.toLowerCase()}`, ...(p.vision.passions[0] ? [`passion.${p.vision.passions[0].toLowerCase()}`] : [])] : [];
  return { name: p?.name ?? 'Un pet', species: p?.species ?? 'NINO', stage: p?.stage ?? 'BABY', equipped: (v5?.equipped ?? []).slice(0, 3) as PetCard['equipped'], traits };
}

const WORDS = new Set<string>(ANONYMOUS_WORDS);
export function threeWordsOf(wordCounts: unknown): string[] {
  if (!wordCounts || typeof wordCounts !== 'object') return [];
  return Object.entries(wordCounts as Record<string, unknown>)
    .filter(([w, n]) => WORDS.has(w) && typeof n === 'number' && n > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number) || (a[0] < b[0] ? -1 : 1))
    .slice(0, 3)
    .map(([w]) => w);
}

export function personOf(u: PersonRow, at: Date): PersonFacts {
  return {
    firstName: u.profile?.displayName ?? '',
    age: ageOf(u.birthDate, u.timezone, at),
    gender: (u.profile?.gender ?? 'UNDISCLOSED') as Gender,
    reliability: { attended: u.reliabilityStat?.attended ?? 0, noShows: u.reliabilityStat?.noShows ?? 0, lateCancels: u.reliabilityStat?.lateCancels ?? 0 },
    pet: petCardOf(u.primaryPet),
    threeWords: threeWordsOf(u.reputation?.wordCounts),
    calmBadge: u.outingPreferences?.showCalmBadge ?? false,
  };
}

export async function loadPersons(c: Tx | Db, userIds: string[], at: Date): Promise<Map<string, PersonFacts>> {
  const rows = await c.user.findMany({ where: { id: { in: userIds } }, include: PERSON_INCLUDE });
  return new Map(rows.map((u) => [u.id, personOf(u, at)]));
}
