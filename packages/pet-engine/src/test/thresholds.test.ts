/** Franchissements uniques : inactivité 48 h, ghosting −8 une fois par épisode, clôture 14 j, pause. */
import { describe, expect, it } from 'vitest';
import { reduce } from '../reduce.js';
import { advanceWorld } from '../world/index.js';
import { HOUR, T, ctxAt, pairWorld, utc } from './fixtures.js';

const now = utc(2026, 6, 10, 10);
const DAY = 86_400_000;
const count = (eff: { type: string }[], type: string) => eff.filter((e) => e.type === type).length;

describe('seuils relationnels', () => {
  it('inactivité 48 h : un seul franchissement, pénalité d’humeur plafonnée', () => {
    const r = advanceWorld(pairWorld(now), now + 10 * DAY, ctxAt(now + 10 * DAY));
    expect(count(r.effects, 'INACTIVITY_THRESHOLD_CROSSED')).toBe(1);
    expect(count(r.effects, 'MOOD_PENALTY')).toBe(2);
    expect(count(r.effects, 'RELATIONSHIP_SILENCE_CLOSE')).toBe(0);
  });
  it('absence : complicité −5/jour après 24 h, XP inchangée', () => {
    const w = pairWorld(now);
    w.relationships.r!.xpMilli = 42_000;
    const r = advanceWorld(w, now + 3 * DAY, ctxAt(now + 3 * DAY));
    expect(r.state.relationships.r!.complicity).toBe(T.relationshipInitial.complicity - 15);
    expect(r.state.relationships.r!.xpMilli).toBe(42_000);
  });
  it('ghosting : −8 une seule fois après 72 h ; aucune pénalité si personne n’attend', () => {
    const silent = advanceWorld(pairWorld(now), now + 5 * DAY, ctxAt(now + 5 * DAY));
    expect(count(silent.effects, 'RELIABILITY_PENALTY')).toBe(0);
    const w = reduce(pairWorld(now), { eventId: 'm', type: 'MESSAGE_PUBLISHED', relationshipId: 'r', authorSide: 0, messageId: 'x', human: true }, ctxAt(now)).state;
    let cur = w;
    const effects: { type: string }[] = [];
    for (let t = now + HOUR; t <= now + 6 * DAY; t += HOUR) {
      const r = advanceWorld(cur, t, ctxAt(t));
      cur = r.state;
      effects.push(...r.effects);
    }
    expect(effects.filter((e) => e.type === 'RELIABILITY_PENALTY')).toEqual([{ type: 'RELIABILITY_PENALTY', relationshipId: 'r', side: 1, points: 8, atMs: now + 72 * HOUR }]);
  });
  it('silence 14 j : clôture une seule fois ; une pause suspend la durée', () => {
    const r = advanceWorld(pairWorld(now), now + 20 * DAY, ctxAt(now + 20 * DAY));
    expect(count(r.effects, 'RELATIONSHIP_SILENCE_CLOSE')).toBe(1);
    const p = pairWorld(now);
    p.relationships.r!.pauses = [{ startMs: now + DAY, endMs: now + 15 * DAY }];
    expect(count(advanceWorld(p, now + 20 * DAY, ctxAt(now + 20 * DAY)).effects, 'RELATIONSHIP_SILENCE_CLOSE')).toBe(0);
  });
  it('pause > 14 j refusée', () => {
    const r = reduce(pairWorld(now), { eventId: 'p', type: 'PAUSE_SET', scope: 'RELATIONSHIP', targetId: 'r', interval: { startMs: now, endMs: now + 15 * DAY } }, ctxAt(now));
    expect(r.effects).toContainEqual({ type: 'ACTION_REJECTED', reason: 'PAUSE_TOO_LONG' });
  });
  it('relation en pause : XP du Lien gelée', () => {
    const w = pairWorld(now, { level: 2 });
    w.relationships.r!.pauses = [{ startMs: now - HOUR, endMs: now + DAY }];
    const r = reduce(w, { eventId: 'p', type: 'PLAY', relationshipId: 'r', actorSide: 0 }, ctxAt(now));
    expect(r.effects).toContainEqual({ type: 'ACTION_REJECTED', reason: 'RELATIONSHIP_PAUSED' });
  });
});
