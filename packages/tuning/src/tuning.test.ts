import { describe, expect, it } from 'vitest';
import { DEFAULT_TUNING, parseTuning, safeParseTuning, coinRewards } from './index.js';

describe('tuning', () => {
  it('DEFAULT_TUNING passe le schéma', () => {
    expect(parseTuning(structuredClone(DEFAULT_TUNING)).version).toBe('tuning-2026.11.0');
  });
  it('est gelé', () => {
    expect(Object.isFrozen(DEFAULT_TUNING.gauges.initial)).toBe(true);
  });
  it('refuse des poids de vision ne sommant pas à 1', () => {
    const t = structuredClone(DEFAULT_TUNING) as { matching: { weights: { C: number } } };
    t.matching.weights.C = 0.5;
    expect(safeParseTuning(t).success).toBe(false);
  });
  it('refuse une matrice asymétrique', () => {
    const t = structuredClone(DEFAULT_TUNING) as { matching: { matrices: { school: Record<string, Record<string, number>> } } };
    t.matching.matrices.school.CIRQUE!.POLYTECHNIQUE = 0.9;
    expect(safeParseTuning(t).success).toBe(false);
  });
  it('refuse un plafond d’action inférieur au plafond de gain', () => {
    const t = structuredClone(DEFAULT_TUNING) as { actions: { hug: { actionCapPerDay: number } } };
    t.actions.hug.actionCapPerDay = 1;
    expect(safeParseTuning(t).success).toBe(false);
  });
  it('expose les constantes de pièces du brief', () => {
    expect(coinRewards(DEFAULT_TUNING)).toMatchObject({ missionDaily: 20, streakMilestoneCoins: 100, referralReferrer: 100, referralReferee: 100, neighborhoodFeed: 10 });
    expect(DEFAULT_TUNING.coins.catalog).toMatchObject({ streakFreeze: 200, visibilityBoost: 300 });
  });
});
