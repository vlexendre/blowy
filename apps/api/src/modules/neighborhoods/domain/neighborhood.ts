/**
 * Règles quartier (spec-v5 §2.1–2.2, V5.1 B.5–B.7) : une ville/quartier par personne, changement
 * limité (cooldown) et jamais avec une place active ; liste d'attente = vrais nombres du quartier,
 * AUCUNE position individuelle ; amorçage possible en team dans une ville fermée.
 */
import type { NeighborhoodStatus } from '@blowy/domain';

const DAY = 86_400_000;

export type SetNeighborhoodVerdict = { ok: true } | { ok: false; reason: 'NEIGHBORHOOD_CLOSED' } | { ok: false; reason: 'NEIGHBORHOOD_CHANGE_TOO_SOON'; availableAt: Date } | { ok: false; reason: 'ACTIVE_SEAT_EXISTS' };

export function canSetNeighborhood(i: { current: string | null; target: { id: string; status: NeighborhoodStatus }; changedAt: Date | null; hasActiveSeat: boolean; now: Date; cooldownDays: number }): SetNeighborhoodVerdict {
  if (i.target.status === 'CLOSED') return { ok: false, reason: 'NEIGHBORHOOD_CLOSED' };
  if (i.current === i.target.id || i.current === null) return { ok: true };
  if (i.hasActiveSeat) return { ok: false, reason: 'ACTIVE_SEAT_EXISTS' };
  if (i.changedAt) {
    const availableAt = new Date(i.changedAt.getTime() + i.cooldownDays * DAY);
    if (i.now < availableAt) return { ok: false, reason: 'NEIGHBORHOOD_CHANGE_TOO_SOON', availableAt };
  }
  return { ok: true };
}

/** Recherche « Tu sors où ? » : sans accents, sans casse, sur nom / ville / slug. */
export const normalizeQuery = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export function matchesQuery(n: { name: string; city: string; slug: string }, q: string | undefined): boolean {
  if (!q) return true;
  const needle = normalizeQuery(q);
  return [n.name, n.city, n.slug].some((x) => normalizeQuery(x).includes(needle));
}
