/** §21 scénario 4 : lieu unique, second appel non refusé, aide à un pet malade jamais refusée. */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { reduce } from '../reduce.js';
import { refusalProbability, resolveCall } from '../random/index.js';
import { pointsToUnits } from '../shared/index.js';
import type { EngineEffect, World } from '../model/index.js';
import { T, ctxAt, pairWorld, utc } from './fixtures.js';

const now = utc(2026, 6, 10, 10);
const findCall = (effects: EngineEffect[]) => effects.find((e) => e.type === 'CALL_RESOLVED') as Extract<EngineEffect, { type: 'CALL_RESOLVED' }>;

/** Monde où « a » est avec « b » et on l'appelle chez lui ; on cherche une graine qui refuse. */
function refusingSeed(w: World): string {
  for (let i = 0; i < 500; i++) {
    const seed = `s${i}`;
    const r = reduce(w, { eventId: 'e1', type: 'CALL_PET', petId: 'a', to: { kind: 'HOME', contextId: 'a' }, purpose: 'MEET' }, ctxAt(now, seed));
    if (findCall(r.effects).refused) return seed;
  }
  throw new Error('aucune graine de refus');
}

describe('§21-4 appels', () => {
  it('formule exacte de p et bornes', () => {
    // Nino espiègle (+1), envie 80, attente 0 : 0.10 + 0.15 + 0.28 + 0.10 = 0.63 → 0.60
    expect(refusalProbability({ species: 'NINO', kindMischief: 1, desire: 80, waitingHours: 0 }, T)).toBeCloseTo(0.6, 10);
    // Gaston gentil, envie 40, attente 10 h : 0.10 + 0 + 0.14 − 0.025 − 0.05 = 0.165
    expect(refusalProbability({ species: 'GASTON', kindMischief: -1, desire: 40, waitingHours: 10 }, T)).toBeCloseTo(0.165, 10);
    expect(refusalProbability({ species: 'GASTON', kindMischief: -1, desire: 0, waitingHours: 500 }, T)).toBe(0);
    fc.assert(
      fc.property(fc.double({ min: -1, max: 1, noNaN: true }), fc.integer({ min: 0, max: 100 }), fc.double({ min: 0, max: 1000, noNaN: true }), fc.constantFrom('GASTON', 'PIA', 'NINO', 'SUZIE'), (m, d, a, sp) => {
        const p = refusalProbability({ species: sp, kindMischief: m, desire: d, waitingHours: a }, T);
        expect(p >= 0 && p <= 0.6).toBe(true);
      }),
    );
  });

  it('jamais deux refus consécutifs : le deuxième appel cède', () => {
    const w = pairWorld(now, { species: ['NINO', 'SUZIE'] });
    w.pets.a!.axes.kindMischief = 1;
    const seed = refusingSeed(w);
    const r1 = reduce(w, { eventId: 'e1', type: 'CALL_PET', petId: 'a', to: { kind: 'HOME', contextId: 'a' }, purpose: 'MEET' }, ctxAt(now, seed));
    expect(findCall(r1.effects).refused).toBe(true);
    expect(r1.state.pets.a!.location.kind).toBe('DATE_SPOT');
    const r2 = reduce(r1.state, { eventId: 'e2', type: 'CALL_PET', petId: 'a', to: { kind: 'HOME', contextId: 'a' }, purpose: 'MEET' }, ctxAt(now + 1000, seed));
    expect(findCall(r2.effects)).toMatchObject({ refused: false, forcedAccept: true });
    expect(r2.state.pets.a!.location).toEqual({ kind: 'HOME', contextId: 'a' });
  });

  it('aide à un pet malade ou affamé jamais refusée (toutes graines)', () => {
    const w = pairWorld(now);
    w.pets.a!.axes.kindMischief = 1;
    w.pets.a!.gauges.health = pointsToUnits(10);
    for (let i = 0; i < 200; i++) {
      const r = reduce(w, { eventId: `e${i}`, type: 'CALL_PET', petId: 'a', to: { kind: 'HOME', contextId: 'a' }, purpose: 'MEET' }, ctxAt(now, `seed${i}`));
      expect(findCall(r.effects).refused).toBe(false);
    }
    expect(resolveCall({ species: 'NINO', kindMischief: 1, desire: 100, waitingHours: 0, consecutiveRefusals: 0, vital: true, seed: 'x', petId: 'a', callIndex: 0 }, T).refused).toBe(false);
  });

  it('lieu unique et rejeu idempotent', () => {
    const w = pairWorld(now, { together: false });
    const ev = { eventId: 'm1', type: 'CALL_PET' as const, petId: 'a', to: w.relationships.r!.spot, purpose: 'MEET' as const };
    const r1 = reduce(w, ev, ctxAt(now, 'seed-ok'));
    const r2 = reduce(r1.state, ev, ctxAt(now, 'seed-ok'));
    expect(r2.effects).toEqual([{ type: 'ACTION_REJECTED', reason: 'DUPLICATE_EVENT' }]);
    expect(r2.state).toBe(r1.state);
    expect(typeof r1.state.pets.a!.location.kind).toBe('string'); // une seule localisation par construction
  });

  it('déterminisme : même graine, même résultat ; l’identifiant client n’influence pas le tirage', () => {
    const w = pairWorld(now);
    w.pets.a!.axes.kindMischief = 1;
    const outcome = (eventId: string) =>
      findCall(reduce(w, { eventId, type: 'CALL_PET', petId: 'a', to: { kind: 'HOME', contextId: 'a' }, purpose: 'MEET' }, ctxAt(now, 'server-seed')).effects).refused;
    const first = outcome('client-1');
    for (let i = 2; i < 30; i++) expect(outcome(`client-${i}`)).toBe(first);
  });
});
