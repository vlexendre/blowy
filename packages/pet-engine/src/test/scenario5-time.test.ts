/** §21 scénario 5 : ticks réguliers == rattrapage, nuit, seuil santé, pauses chevauchantes, DST. */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { advanceTime, advanceWorld } from '../world/index.js';
import { displayGauges, poseFor } from '../gauges/index.js';
import { createPet } from '../factory.js';
import { pointsToUnits } from '../shared/index.js';
import type { World } from '../model/index.js';
import { HOUR, NEUTRAL, T, TZ, ctxAt, pairWorld, utc } from './fixtures.js';

const TICK = T.time.tickMinutes * 60_000;

function byTicks(w: World, from: number, to: number): { state: World; types: string[] } {
  let cur = w;
  const types: string[] = [];
  for (let t = from + TICK; t <= to; t += TICK) {
    const r = advanceWorld(cur, t, ctxAt(t));
    cur = r.state;
    types.push(...r.effects.filter((e) => e.type !== 'NOTIFY').map((e) => e.type));
  }
  if ((to - from) % TICK !== 0) cur = advanceWorld(cur, to, ctxAt(to)).state;
  return { state: cur, types };
}

const WINDOWS: Array<[string, number]> = [
  ['passage à l’heure d’été (mars)', utc(2026, 3, 27, 10)],
  ['passage à l’heure d’hiver (octobre)', utc(2026, 10, 23, 10)],
  ['période ordinaire', utc(2026, 6, 10, 7)],
];

describe('§21-5 convergence ticks / rattrapage', () => {
  for (const [label, start] of WINDOWS) {
    it(`même état et mêmes franchissements — ${label}`, () => {
      const end = start + 6 * 86_400_000;
      const w = pairWorld(start, { together: false });
      w.pets.a!.location = { ...w.relationships.r!.spot }; // a attend b
      w.pets.b!.pauses = [{ startMs: start + 30 * HOUR, endMs: start + 50 * HOUR }, { startMs: start + 40 * HOUR, endMs: start + 70 * HOUR }];
      w.relationships.r!.pauses = [{ startMs: start + 60 * HOUR, endMs: start + 80 * HOUR }];
      const once = advanceWorld(w, end, ctxAt(end));
      const ticks = byTicks(w, start, end);
      expect(ticks.state).toEqual(once.state);
      expect(ticks.types).toEqual(once.effects.filter((e) => e.type !== 'NOTIFY').map((e) => e.type));
    });
  }

  it('deux ticks identiques n’appliquent pas deux fois la baisse', () => {
    const start = utc(2026, 5, 1, 9);
    const w = pairWorld(start);
    const one = advanceWorld(w, start + TICK, ctxAt(start + TICK));
    const two = advanceWorld(one.state, start + TICK, ctxAt(start + TICK));
    expect(two.state).toEqual(one.state);
    expect(two.effects).toEqual([]);
  });

  it('rattrapage : pas de dizaines d’anciennes notifications', () => {
    const start = utc(2026, 5, 1, 9);
    const w = pairWorld(start, { together: false });
    w.pets.a!.location = { ...w.relationships.r!.spot };
    const r = advanceWorld(w, start + 10 * 86_400_000, ctxAt(start + 10 * 86_400_000));
    expect(r.effects.filter((e) => e.type === 'NOTIFY')).toHaveLength(0);
  });

  it('propriété : découpage arbitraire == un seul rattrapage', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 1, max: 40 * HOUR }), { minLength: 1, maxLength: 8 }), fc.integer({ min: 0, max: 365 }), (steps, dayOffset) => {
        const start = utc(2026, 1, 1, 0) + dayOffset * 86_400_000 + 7 * 60_000;
        const w = pairWorld(start);
        let cur = w;
        let t = start;
        for (const s of steps) {
          t += s;
          cur = advanceWorld(cur, t, ctxAt(t)).state;
        }
        expect(cur).toEqual(advanceWorld(w, t, ctxAt(t)).state);
      }),
      { numRuns: 60 },
    );
  });
});

describe('§21-5 règles de jauges', () => {
  const gaston = (now: number) => createPet({ id: 'g', species: 'GASTON', axes: NEUTRAL, tz: TZ, nowMs: now }, T);
  const nino = (now: number) => createPet({ id: 'n', species: 'NINO', axes: NEUTRAL, tz: TZ, nowMs: now }, T);

  it('jour : faim −4/h (−5 Gaston), énergie −3/h, humeur −2/h', () => {
    const s = utc(2026, 6, 10, 8); // 10 h à Paris
    expect(displayGauges(advanceTime(nino(s), s, s + 5 * HOUR, TZ, [], T))).toEqual({ satiety: 80, energy: 85, mood: 70, health: 100 });
    expect(displayGauges(advanceTime(gaston(s), s, s + 5 * HOUR, TZ, [], T)).satiety).toBe(75);
  });

  it('nuit 23h–8h : baisses ÷4, énergie +6/h net', () => {
    const s = utc(2026, 6, 10, 21); // 23 h Paris (CEST)
    const p = nino(s);
    p.gauges.energy = pointsToUnits(40);
    const g = displayGauges(advanceTime(p, s, s + 8 * HOUR, TZ, [], T));
    expect(g).toEqual({ satiety: 92, energy: 88, mood: 76, health: 100 });
  });

  it('nuit de mars (8 h réelles) vs octobre (10 h réelles) à Paris', () => {
    const mar = utc(2026, 3, 28, 22); // 23 h CET
    const oct = utc(2026, 10, 24, 21); // 23 h CEST
    const end = (s: number) => s + 12 * HOUR;
    const gm = displayGauges(advanceTime(nino(mar), mar, end(mar), TZ, [], T));
    const go = displayGauges(advanceTime(nino(oct), oct, end(oct), TZ, [], T));
    // mars : 8 h de nuit (−8 faim) + 4 h de jour (−16) ; octobre : 10 h de nuit (−10) + 2 h de jour (−8)
    expect(gm.satiety).toBe(100 - 8 - 16);
    expect(go.satiety).toBe(100 - 10 - 8);
  });

  it('santé : −2/h seulement après faim < 15 pendant > 12 h, borne minimale 1', () => {
    const s = utc(2026, 6, 10, 8);
    const p = nino(s);
    p.gauges.satiety = pointsToUnits(10);
    const after12 = advanceTime(p, s, s + 12 * HOUR, TZ, [], T);
    expect(displayGauges(after12).health).toBe(100);
    const after13 = advanceTime(after12, s + 12 * HOUR, s + 13 * HOUR, TZ, [], T);
    expect(displayGauges(after13).health).toBe(98);
    const longAfter = advanceTime(p, s, s + 30 * 86_400_000, TZ, [], T);
    expect(displayGauges(longAfter).health).toBe(1);
    expect(poseFor(longAfter, s + 30 * 86_400_000 + 4 * HOUR, T)).toBe('SICK');
  });

  it('pauses chevauchantes : temps exclu une seule fois', () => {
    const s = utc(2026, 6, 10, 8);
    const pauses = [{ startMs: s + HOUR, endMs: s + 3 * HOUR }, { startMs: s + 2 * HOUR, endMs: s + 4 * HOUR }];
    expect(displayGauges(advanceTime(nino(s), s, s + 5 * HOUR, TZ, pauses, T)).satiety).toBe(100 - 4 * 2);
  });

  it('propriété : jauges toujours dans [0,100]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 60 * 86_400_000 }), fc.constantFrom('GASTON', 'PIA', 'NINO', 'SUZIE'), fc.constantFrom('Europe/Paris', 'America/New_York', 'Asia/Tokyo', 'Australia/Sydney'), (dur, sp, tz) => {
        const s = utc(2026, 3, 1, 0);
        const p = createPet({ id: 'x', species: sp, axes: NEUTRAL, tz, nowMs: s }, T);
        const g = displayGauges(advanceTime(p, s, s + dur, tz, [], T));
        for (const v of Object.values(g)) expect(v >= 0 && v <= 100).toBe(true);
      }),
      { numRuns: 80 },
    );
  });
});

describe('poses', () => {
  const s = utc(2026, 6, 10, 10); // 12 h Paris
  const base = () => createPet({ id: 'p', species: 'NINO', axes: NEUTRAL, tz: TZ, nowMs: s }, T);
  it('priorité malade > endormi > affamé > réaction > triste > joyeux > présentation', () => {
    const p = base();
    p.reaction = { pose: 'DANCE', untilMs: s + 1000 };
    expect(poseFor(p, s, T)).toBe('DANCE');
    expect(poseFor(p, s + 2000, T)).toBe('JOYFUL');
    p.gauges.satiety = pointsToUnits(20);
    expect(poseFor(p, s, T)).toBe('HUNGRY'); // la réaction ne masque pas la faim
    p.gauges.energy = pointsToUnits(10);
    expect(poseFor(p, s, T)).toBe('ASLEEP');
    p.gauges.health = pointsToUnits(20);
    expect(poseFor(p, s, T)).toBe('SICK');
    const q = base();
    q.gauges.mood = pointsToUnits(50);
    expect(poseFor(q, s, T)).toBe('PRESENTATION');
    q.gauges.mood = pointsToUnits(20);
    expect(poseFor(q, s, T)).toBe('SAD');
    expect(poseFor(q, utc(2026, 6, 10, 22), T)).toBe('ASLEEP'); // minuit Paris
  });
});
