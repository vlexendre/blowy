/**
 * Quand demander une note sur l'App Store (règles pures, testées ; aucune horloge ici : `now` est passé).
 *
 * Seule la demande native d'Apple est utilisée (SKStoreReviewController par `expo-store-review`) : App Review 5.6.1
 * interdit une fenêtre maison qui demande une note. Apple décide seul de l'afficher (au plus 3 fois par an, jamais en
 * TestFlight ni pendant la revue) ; nous, on ne la propose qu'après un vrai bon moment, à quelqu'un qui connaît l'app.
 */

const DAY = 86_400_000;

/** Au moins 3 jours depuis la première ouverture. */
export const REVIEW_MIN_AGE_MS = 3 * DAY;
/** Au moins 5 sessions (une session : l'app ouverte après 30 minutes au moins sans l'avoir eue au premier plan). */
export const REVIEW_MIN_SESSIONS = 5;
/** Au plus une demande tous les 120 jours. */
export const REVIEW_EVERY_MS = 120 * DAY;
/** Au plus 3 demandes sur 365 jours (le plafond d'Apple ; le nôtre est déjà plus bas). */
export const REVIEW_MAX_PER_YEAR = 3;
/** Jamais juste après une erreur… */
export const REVIEW_AFTER_SETBACK_MS = 10 * 60_000;
/** … ni juste après un achat. */
export const REVIEW_AFTER_PURCHASE_MS = DAY;
/** Une nouvelle session après 30 minutes passées hors de l'app. */
export const SESSION_GAP_MS = 30 * 60_000;

/** Les bons moments où l'on peut demander (« après utilisation »). */
export type ReviewMoment = 'encounter_accepted' | 'proof_validated' | 'streak_milestone';

/** Ce qui est gardé sur le téléphone (jamais envoyé). */
export interface ReviewMemory {
  firstOpenAt: number | null;
  sessions: number;
  /** Dernier passage au premier plan (pour compter les sessions). */
  lastActiveAt: number | null;
  /** Dates des demandes faites (les 365 derniers jours suffisent). */
  askedAt: number[];
  lastSetbackAt: number | null;
  lastPurchaseAt: number | null;
}

export const EMPTY_REVIEW_MEMORY: ReviewMemory = {
  firstOpenAt: null,
  sessions: 0,
  lastActiveAt: null,
  askedAt: [],
  lastSetbackAt: null,
  lastPurchaseAt: null,
};

export type ReviewVerdict =
  | { ask: true }
  | { ask: false; why: 'not_ready' | 'too_new' | 'few_sessions' | 'asked_recently' | 'yearly_cap' | 'after_setback' | 'after_purchase' };

/**
 * Faut-il demander maintenant ? `ready` : compte prêt, hors inscription (jamais pendant l'onboarding).
 * La disponibilité de la demande sur l'appareil (`isAvailableAsync`, `hasAction`) se vérifie à part.
 */
export function shouldAskForReview(m: ReviewMemory, now: number, ctx: { ready: boolean }): ReviewVerdict {
  if (!ctx.ready) return { ask: false, why: 'not_ready' };
  if (m.firstOpenAt === null || now - m.firstOpenAt < REVIEW_MIN_AGE_MS) return { ask: false, why: 'too_new' };
  if (m.sessions < REVIEW_MIN_SESSIONS) return { ask: false, why: 'few_sessions' };
  const last = m.askedAt.length ? Math.max(...m.askedAt) : null;
  if (last !== null && now - last < REVIEW_EVERY_MS) return { ask: false, why: 'asked_recently' };
  if (m.askedAt.filter((t) => now - t < 365 * DAY).length >= REVIEW_MAX_PER_YEAR) return { ask: false, why: 'yearly_cap' };
  if (m.lastSetbackAt !== null && now - m.lastSetbackAt < REVIEW_AFTER_SETBACK_MS) return { ask: false, why: 'after_setback' };
  if (m.lastPurchaseAt !== null && now - m.lastPurchaseAt < REVIEW_AFTER_PURCHASE_MS) return { ask: false, why: 'after_purchase' };
  return { ask: true };
}

/** L'app revient au premier plan : première ouverture notée, une session de plus si l'absence a duré. */
export function onForeground(m: ReviewMemory, now: number): ReviewMemory {
  const fresh = m.lastActiveAt === null || now - m.lastActiveAt >= SESSION_GAP_MS;
  return {
    ...m,
    firstOpenAt: m.firstOpenAt ?? now,
    sessions: fresh ? m.sessions + 1 : m.sessions,
    lastActiveAt: now,
  };
}

/** Une demande vient d'être faite (Apple l'affiche ou non : on ne le sait pas, on compte quand même). */
export function onAsked(m: ReviewMemory, now: number): ReviewMemory {
  return { ...m, askedAt: [...m.askedAt.filter((t) => now - t < 365 * DAY), now] };
}
