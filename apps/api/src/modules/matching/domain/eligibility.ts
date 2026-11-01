/**
 * Filtres réciproques durs (§7) — données collectées côté backend, fonction pure.
 * Le score de vision est calculé par @blowy/matching via EngineGateway.
 */
export interface Candidate {
  userId: string;
  petId: string;
  age: number;
  gender: 'WOMAN' | 'MAN' | 'NON_BINARY' | 'UNDISCLOSED';
  prefs: { ageMin: number; ageMax: number; maxDistanceKm: number; seekingGenders: string[]; intention: string };
  verified: boolean;
  reliability: number;
  limit: string;
  lastActiveAt: Date | null;
  cell: { lat: number; lng: number } | null;
  hasCapacity: boolean;
  paused: boolean;
}

export type ExclusionReason = 'SELF' | 'AGE' | 'GENDER' | 'DISTANCE' | 'UNVERIFIED' | 'INACTIVE' | 'BLOCKED' | 'HISTORY' | 'CAPACITY' | 'GHOSTER_LIMIT' | 'PAUSED' | 'INTENTION';

export interface PairContext {
  blocked: boolean;
  metBefore: boolean;
}

const FRIEND_ONLY = new Set(['FRIENDS_ONE', 'FRIENDS_GROUP']);

/** Distance haversine (km) entre cellules approximatives. */
export function cellDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function accepts(a: Candidate, b: Candidate): ExclusionReason | null {
  if (b.age < a.prefs.ageMin || b.age > a.prefs.ageMax) return 'AGE';
  // Genre déclaré, jamais inféré. Préférence non vide + genre non déclaré = impossible sans deviner.
  if (a.prefs.seekingGenders.length > 0 && !a.prefs.seekingGenders.includes(b.gender)) return 'GENDER';
  if (a.limit === 'GHOSTER' && b.reliability < 70) return 'GHOSTER_LIMIT';
  return null;
}

export function exclusionReason(a: Candidate, b: Candidate, pair: PairContext, now: Date, inactiveAfterDays: number): ExclusionReason | null {
  if (a.userId === b.userId) return 'SELF';
  if (pair.blocked) return 'BLOCKED';
  if (pair.metBefore) return 'HISTORY';
  if (!a.verified || !b.verified) return 'UNVERIFIED';
  if (a.paused || b.paused) return 'PAUSED';
  if (!a.hasCapacity || !b.hasCapacity) return 'CAPACITY';
  const cutoff = now.getTime() - inactiveAfterDays * 86_400_000;
  if (!b.lastActiveAt || b.lastActiveAt.getTime() < cutoff || !a.lastActiveAt || a.lastActiveAt.getTime() < cutoff) return 'INACTIVE';
  // Intentions : amitié seule ↔ amitié seule ou ouverts ; toujours compatibles (début en Ami).
  void FRIEND_ONLY;
  const r = accepts(a, b) ?? accepts(b, a);
  if (r) return r;
  if (a.cell && b.cell) {
    const d = cellDistanceKm(a.cell, b.cell);
    if (d > Math.min(a.prefs.maxDistanceKm, b.prefs.maxDistanceKm)) return 'DISTANCE';
  }
  return null;
}
