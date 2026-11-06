/** Lien : progression et portes de l'arbre (pur, testé). */
import type { RelationshipView } from '@blowy/api-contract';
import { LINK_LEVEL_THRESHOLDS } from '@blowy/domain';

/** Progression vers le niveau suivant (XP en points ; seuils du domaine). */
export function linkProgress(r: Pick<RelationshipView, 'xp' | 'reachedLevel'>): { level: number; xp: number; next: number | null; ratio: number } {
  const level = Math.max(1, Math.min(7, r.reachedLevel));
  const cur = LINK_LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = LINK_LEVEL_THRESHOLDS[level] ?? null;
  const xp = Math.floor(r.xp);
  return { level, xp, next, ratio: next === null ? 1 : Math.max(0, Math.min(1, (xp - cur) / (next - cur))) };
}

export type GateState = 'reached' | 'current' | 'locked' | 'consent-needed' | 'not-in-branch';

/** Portes de l'arbre du Lien selon branche, niveau atteint et accords requis (P-5.3/5.4). */
export function gateStates(r: Pick<RelationshipView, 'reachedLevel' | 'eligibleLevel' | 'branch'>): GateState[] {
  return [1, 2, 3, 4, 5, 6, 7].map((lvl) => {
    if (lvl === 7 && r.branch === 'FRIEND') return 'not-in-branch';
    if (lvl <= r.reachedLevel) return 'reached';
    const needsConsent = lvl === 3 || (r.branch === 'PLUS' && (lvl === 5 || lvl === 6 || lvl === 7));
    if (lvl === r.reachedLevel + 1) return needsConsent && r.eligibleLevel >= lvl ? 'consent-needed' : 'current';
    return 'locked';
  });
}
