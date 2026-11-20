/** Progression (maquette V7) : étincelles de la semaine, ligue entre voisins, trophées. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type TestWorld, onboardBody, startWorld } from './helpers';

describe('progression', () => {
  let world: TestWorld;
  beforeAll(async () => {
    world = await startWorld();
  });
  afterAll(() => world.close());

  it('un bonjour rapporte des étincelles, un trophée, et la ligue montre les voisins', async () => {
    const ana = world.client();
    const ben = world.client();
    await ana.api.me.onboard(onboardBody({ displayName: 'Ana' }));
    await ben.api.me.onboard(onboardBody({ displayName: 'Ben' }));

    const before = await ana.api.progression();
    expect(before.sparks).toBe(0);
    expect(before.trophiesTotal).toBe(18);
    expect(before.trophiesWon).toBe(0);
    expect(before.trophies.find((t) => t.family === 'bonjour')).toMatchObject({ won: 0, value: 0, next: 1 });

    await ana.api.encounters.wave(ben.id);
    const after = await ana.api.progression();
    expect(after.sparks).toBe(5);
    expect(after.trophies.find((t) => t.family === 'bonjour')).toMatchObject({ won: 1, value: 1, next: 10 });
    expect(after.league.located).toBe(true);
    expect(after.league).toMatchObject({ tier: 'plume', lastWeekSparks: 0, next: { tier: 'pompon', sparks: 60 } });
    const me = after.league.rows.find((r) => r.me);
    expect(me).toMatchObject({ rank: 1, sparks: 5, podium: true, displayName: '' });
    expect(after.league.rows.find((r) => r.userId === ben.id)).toMatchObject({ displayName: 'Ben', sparks: 0, podium: false });
  });
});
