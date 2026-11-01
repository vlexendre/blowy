/**
 * Planification des notifications ordinaires : 3/jour/personne, jamais 23 h–8 h locale,
 * regroupées par (relation, catégorie), priorité message humain > attente réelle > série >
 * Quartier > mission. Pur : le backend fournit la file candidate et l'historique du jour.
 */
import type { NotificationCategory, Tuning } from '@blowy/tuning';
import { isNightHour, localDayKey, localParts } from '../time/index.js';

export interface NotificationCandidate {
  key: string;
  category: NotificationCategory;
  relationshipId: string | null;
  atMs: number;
}

export interface NotificationPlan {
  send: NotificationCandidate[];
  /** Conservés dans l'inbox/badge, non poussés. */
  held: NotificationCandidate[];
}

export function planNotifications(candidates: readonly NotificationCandidate[], sentTodayCount: number, nowMs: number, tz: string, t: Tuning): NotificationPlan {
  const n = t.notifications;
  if (isNightHour(localParts(nowMs, tz).hour, { startHour: n.quietStartHour, endHour: n.quietEndHour })) return { send: [], held: [...candidates] };
  const today = localDayKey(nowMs, tz);
  const groups = new Map<string, NotificationCandidate>();
  for (const c of candidates) {
    if (localDayKey(c.atMs, tz) !== today) continue;
    const g = `${c.relationshipId ?? '-'}|${c.category}`;
    const prev = groups.get(g);
    if (!prev || c.atMs > prev.atMs) groups.set(g, c);
  }
  const rank = (c: NotificationCandidate): number => n.priority.indexOf(c.category);
  const ordered = [...groups.values()].sort((a, b) => rank(a) - rank(b) || b.atMs - a.atMs);
  const budget = Math.max(0, n.maxPerDay - sentTodayCount);
  const send = ordered.slice(0, budget);
  const sentKeys = new Set(send.map((s) => s.key));
  return { send, held: candidates.filter((c) => !sentKeys.has(c.key)) };
}
