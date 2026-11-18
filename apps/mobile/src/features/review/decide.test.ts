import { describe, expect, it } from 'vitest';

import {
  EMPTY_REVIEW_MEMORY,
  onAsked,
  onForeground,
  type ReviewMemory,
  REVIEW_AFTER_PURCHASE_MS,
  REVIEW_AFTER_SETBACK_MS,
  REVIEW_EVERY_MS,
  SESSION_GAP_MS,
  shouldAskForReview,
} from './decide';

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 10, 1);
/** Quelqu'un qui connaît l'app : 10 jours, 8 sessions, jamais sollicité. */
const regular: ReviewMemory = { ...EMPTY_REVIEW_MEMORY, firstOpenAt: T0, sessions: 8, lastActiveAt: T0 + 10 * DAY };
const now = T0 + 10 * DAY;
const ready = { ready: true };

describe('demande de note : quand', () => {
  it('demande à quelqu’un qui connaît l’app, après un bon moment', () => {
    expect(shouldAskForReview(regular, now, ready)).toEqual({ ask: true });
  });

  it('jamais pendant l’inscription (compte pas prêt)', () => {
    expect(shouldAskForReview(regular, now, { ready: false })).toEqual({ ask: false, why: 'not_ready' });
  });

  it('pas avant 3 jours depuis la première ouverture', () => {
    expect(shouldAskForReview({ ...regular, firstOpenAt: now - 2 * DAY }, now, ready)).toEqual({ ask: false, why: 'too_new' });
    expect(shouldAskForReview({ ...regular, firstOpenAt: null }, now, ready)).toEqual({ ask: false, why: 'too_new' });
    expect(shouldAskForReview({ ...regular, firstOpenAt: now - 3 * DAY }, now, ready).ask).toBe(true);
  });

  it('pas avant 5 sessions', () => {
    expect(shouldAskForReview({ ...regular, sessions: 4 }, now, ready)).toEqual({ ask: false, why: 'few_sessions' });
    expect(shouldAskForReview({ ...regular, sessions: 5 }, now, ready).ask).toBe(true);
  });

  it('au plus une fois tous les 120 jours', () => {
    const asked = onAsked(regular, now);
    expect(shouldAskForReview(asked, now + 119 * DAY, ready)).toEqual({ ask: false, why: 'asked_recently' });
    expect(shouldAskForReview(asked, now + REVIEW_EVERY_MS, ready).ask).toBe(true);
  });

  it('au plus 3 fois par an, même si l’écart était respecté', () => {
    const m = { ...regular, askedAt: [now - 360 * DAY, now - 240 * DAY, now - 121 * DAY] };
    expect(shouldAskForReview(m, now, ready)).toEqual({ ask: false, why: 'yearly_cap' });
    // Une demande vieille de plus d'un an ne compte plus.
    expect(shouldAskForReview(m, now + 6 * DAY, ready).ask).toBe(true);
  });

  it('jamais juste après une erreur ni un achat', () => {
    expect(shouldAskForReview({ ...regular, lastSetbackAt: now - 60_000 }, now, ready)).toEqual({ ask: false, why: 'after_setback' });
    expect(shouldAskForReview({ ...regular, lastSetbackAt: now - REVIEW_AFTER_SETBACK_MS }, now, ready).ask).toBe(true);
    expect(shouldAskForReview({ ...regular, lastPurchaseAt: now - 3600_000 }, now, ready)).toEqual({ ask: false, why: 'after_purchase' });
    expect(shouldAskForReview({ ...regular, lastPurchaseAt: now - REVIEW_AFTER_PURCHASE_MS }, now, ready).ask).toBe(true);
  });
});

describe('demande de note : mémoire locale', () => {
  it('note la première ouverture et compte une session par retour après 30 minutes', () => {
    let m = onForeground(EMPTY_REVIEW_MEMORY, T0);
    expect(m).toMatchObject({ firstOpenAt: T0, sessions: 1, lastActiveAt: T0 });
    m = onForeground(m, T0 + 5 * 60_000);
    expect(m.sessions).toBe(1);
    m = onForeground(m, T0 + 5 * 60_000 + SESSION_GAP_MS);
    expect(m).toMatchObject({ firstOpenAt: T0, sessions: 2 });
  });

  it('ne garde que les demandes de l’année', () => {
    const m = onAsked({ ...regular, askedAt: [now - 400 * DAY, now - 200 * DAY] }, now);
    expect(m.askedAt).toEqual([now - 200 * DAY, now]);
  });
});
