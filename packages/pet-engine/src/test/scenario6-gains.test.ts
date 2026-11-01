/** §21 scénario 6 : facteur k, plafonds, ordre de validation d'une mission commune. */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { reduce } from '../reduce.js';
import { affinityMultiplierPermille, balanceFactorPermille, linkGainMilli } from '../relationship/index.js';
import type { EngineEffect, EngineEvent, EventInput, World } from '../model/index.js';
import { pointsToUnits } from '../shared/index.js';
import { HOUR, T, ctxAt, pairWorld, utc } from './fixtures.js';

const now = utc(2026, 6, 10, 10);
const linkGains = (eff: EngineEffect[]) => eff.filter((e): e is Extract<EngineEffect, { type: 'LINK_XP_GAINED' }> => e.type === 'LINK_XP_GAINED');

function run(w: World, events: EventInput[], start = now, stepMs = 60_000): { state: World; effects: EngineEffect[] } {
  let cur = w;
  const effects: EngineEffect[] = [];
  events.forEach((e, i) => {
    const r = reduce(cur, { ...e, eventId: `ev${i}` } as EngineEvent, ctxAt(start + i * stepMs));
    cur = r.state;
    effects.push(...r.effects);
  });
  return { state: cur, effects };
}

describe('§21-6 facteur k', () => {
  it('a = b → k = 1 ; a = 0, b > 0 → k = 0,5 ; a + b = 0 → k = 1', () => {
    expect(balanceFactorPermille(5, 5, T)).toBe(1000);
    expect(balanceFactorPermille(0, 7, T)).toBe(500);
    expect(balanceFactorPermille(0, 0, T)).toBe(1000);
    expect(balanceFactorPermille(3, 1, T)).toBe(750);
  });
  it('propriété : k ∈ [0,5 ; 1]', () => {
    fc.assert(fc.property(fc.nat(10_000), fc.nat(10_000), (a, b) => {
      const k = balanceFactorPermille(a, b, T);
      expect(k >= 500 && k <= 1000).toBe(true);
    }));
  });
  it('m = 0,8 + 0,4·affinité/100, gain = base·k·m en milli-points entiers', () => {
    expect(affinityMultiplierPermille(0, T)).toBe(800);
    expect(affinityMultiplierPermille(100, T)).toBe(1200);
    expect(affinityMultiplierPermille(50, T)).toBe(1000);
    expect(linkGainMilli(4, 500, 1200)).toBe(2400);
    expect(Number.isInteger(linkGainMilli(3, 733, 987))).toBe(true);
  });
  it('snapshot avant l’événement courant : la 1re contribution unilatérale garde k = 1', () => {
    const w = pairWorld(now, { level: 2, affinity: 50 });
    const r = run(w, [{ type: 'PLAY', relationshipId: 'r', actorSide: 0 }, { type: 'PLAY', relationshipId: 'r', actorSide: 0 }]);
    const g = linkGains(r.effects);
    expect(g[0]).toMatchObject({ kPermille: 1000, milli: 2000 });
    expect(g[1]).toMatchObject({ kPermille: 500, milli: 1000 }); // a=1, b=0 avant le 2e
  });
});

describe('§21-6 plafonds', () => {
  it('jeux : 5 gains/jour puis NO_GAIN_CAP_REACHED, puis plafond d’action', () => {
    const w = pairWorld(now, { level: 2 });
    const plays = Array.from({ length: T.actions.play.actionCapPerDay + 1 }, (_, i) => ({ type: 'PLAY' as const, relationshipId: 'r', actorSide: (i % 2) as 0 | 1 }));
    const r = run(w, plays);
    expect(linkGains(r.effects)).toHaveLength(T.actions.play.gainCapPerDay);
    expect(r.effects.filter((e) => e.type === 'NO_GAIN_CAP_REACHED')).toHaveLength(T.actions.play.actionCapPerDay - T.actions.play.gainCapPerDay);
    expect(r.effects.at(-1)).toEqual({ type: 'ACTION_REJECTED', reason: 'ACTION_CAP_REACHED' });
  });
  it('câlin : N ≥ 2, même lieu, complicité ≥ 20 ; 3 gains/jour', () => {
    expect(run(pairWorld(now), [{ type: 'HUG', relationshipId: 'r', actorSide: 0 }]).effects).toContainEqual({ type: 'ACTION_REJECTED', reason: 'LEVEL_TOO_LOW' });
    expect(run(pairWorld(now, { level: 2, together: false }), [{ type: 'HUG', relationshipId: 'r', actorSide: 0 }]).effects).toContainEqual({ type: 'ACTION_REJECTED', reason: 'NOT_SAME_PLACE' });
    const low = pairWorld(now, { level: 2 });
    low.relationships.r!.complicity = 10;
    expect(run(low, [{ type: 'HUG', relationshipId: 'r', actorSide: 0 }]).effects).toContainEqual({ type: 'ACTION_REJECTED', reason: 'COMPLICITY_TOO_LOW' });
    const r = run(pairWorld(now, { level: 2 }), Array.from({ length: 5 }, (_, i) => ({ type: 'HUG' as const, relationshipId: 'r', actorSide: (i % 2) as 0 | 1 })));
    expect(linkGains(r.effects)).toHaveLength(3);
  });
  it('messages : séquence même auteur = un seul AR ; bonus du premier AR ; plafond 20 XP bonus inclus, avant k·m', () => {
    const w = pairWorld(now, { affinity: 100 });
    const msg = (s: 0 | 1) => ({ type: 'MESSAGE_PUBLISHED' as const, relationshipId: 'r', authorSide: s, messageId: 'm', human: true });
    const r = run(w, [msg(0), msg(0), msg(0), msg(1)]);
    const g = linkGains(r.effects);
    expect(g).toHaveLength(1);
    expect(g[0]!.baseXp).toBe(12); // 2 + bonus 10
    const many = run(w, Array.from({ length: 20 }, (_, i) => msg((i % 2) as 0 | 1)));
    const bases = linkGains(many.effects).map((e) => e.baseXp);
    expect(bases.reduce((a, b) => a + b, 0)).toBe(20); // 12 + 2·4
    expect(bases).toEqual([12, 2, 2, 2, 2]);
    expect(many.effects.some((e) => e.type === 'NO_GAIN_CAP_REACHED')).toBe(true);
  });
  it('message système / non humain : aucun gain ni contribution', () => {
    const w = pairWorld(now);
    const r = run(w, [{ type: 'MESSAGE_PUBLISHED', relationshipId: 'r', authorSide: 0, messageId: 'm', human: false }]);
    expect(r.state.relationships.r!.sides[0].contributions).toEqual({});
  });
  it('réponse hors 24 h : pas d’aller-retour', () => {
    const w = pairWorld(now);
    const r = run(w, [{ type: 'MESSAGE_PUBLISHED', relationshipId: 'r', authorSide: 0, messageId: 'm', human: true }, { type: 'MESSAGE_PUBLISHED', relationshipId: 'r', authorSide: 1, messageId: 'n', human: true }], now, 25 * HOUR);
    expect(linkGains(r.effects)).toHaveLength(0);
  });
  it('gel XP Lien si un pet principal est malade ; soins sans gain contournant', () => {
    const w = pairWorld(now, { level: 2 });
    w.pets.b!.gauges.health = pointsToUnits(10);
    const r = run(w, [{ type: 'PLAY', relationshipId: 'r', actorSide: 0 }, { type: 'HEAL_PET', petId: 'b' }]);
    expect(r.effects).toContainEqual({ type: 'XP_FROZEN', scope: 'LINK', reason: 'SICK', relationshipId: 'r', petId: null });
    expect(r.state.relationships.r!.xpMilli).toBe(w.relationships.r!.xpMilli);
    expect(r.effects).toContainEqual({ type: 'PET_RECOVERED', petId: 'b' });
    expect(r.effects.some((e) => e.type === 'PET_XP_GAINED' || e.type === 'LINK_XP_GAINED')).toBe(false);
  });
  it('visite : +3 seulement après une nouvelle attente réelle > 6 h ; aller-retour immédiat = 0', () => {
    const w = pairWorld(now, { together: false });
    w.pets.b!.location = { ...w.relationships.r!.spot };
    const call = (id: string, to: World['relationships'][string]['spot']) => ({ type: 'CALL_PET' as const, petId: 'a', to, purpose: 'MEET' as const, eventId: id });
    const accept = (x: World): World => {
      x.pets.a!.consecutiveRefusals = T.refusal.maxConsecutiveRefusals; // force l'acceptation (règle anti-frustration)
      return x;
    };
    let cur = reduce(w, { eventId: 'adv', type: 'ADVANCE' }, ctxAt(now + 7 * HOUR)).state;
    const r1 = reduce(accept(cur), call('c1', cur.relationships.r!.spot), ctxAt(now + 7 * HOUR));
    expect(linkGains(r1.effects).filter((e) => e.source === 'VISIT')).toHaveLength(1);
    cur = reduce(accept(r1.state), call('c2', { kind: 'HOME', contextId: 'a' }), ctxAt(now + 7 * HOUR + 60_000)).state;
    const r3 = reduce(accept(cur), call('c3', cur.relationships.r!.spot), ctxAt(now + 7 * HOUR + 120_000));
    expect(linkGains(r3.effects).filter((e) => e.source === 'VISIT')).toHaveLength(0);
  });
});

describe('§21-6 mission commune : ordre de validation', () => {
  const mission = (pet: 'a' | 'b') => ({ type: 'MISSION_VALIDATED' as const, petId: pet, missionId: 'M1', relationshipId: 'r', boost: 'MOOD' as const, weekendEntitlement: false });
  function setup(): World {
    const w = pairWorld(now, { level: 2, affinity: 73 });
    // historique externe identique et déséquilibré : a a contribué, b non
    w.relationships.r!.sides[0].contributions['2026-06-10'] = { message: 3, play: 2, mission: 0 };
    return w;
  }
  it('a puis b == b puis a (total et répartition)', () => {
    const ab = run(setup(), [mission('a'), mission('b')], now, 3 * HOUR);
    const ba = run(setup(), [mission('b'), mission('a')], now, 3 * HOUR);
    expect(ab.state.relationships.r!.xpMilli).toBe(ba.state.relationships.r!.xpMilli);
    const ctxAB = Object.values(ab.state.relationships.r!.missionContexts)[0]!;
    const ctxBA = Object.values(ba.state.relationships.r!.missionContexts)[0]!;
    expect(ctxAB.creditedMilli).toEqual(ctxBA.creditedMilli);
    const expected = 2 * linkGainMilli(T.actions.mission.linkXp * T.actions.mission.jointMultiplier, ctxAB.kPermille, ctxAB.mPermille);
    expect(ab.state.relationships.r!.xpMilli - setup().relationships.r!.xpMilli).toBe(expected);
  });
  it('k et m figés à la première validation (le contexte n’est pas recalculé)', () => {
    const r = run(setup(), [mission('a'), { type: 'PLAY', relationshipId: 'r', actorSide: 0 }, mission('b')], now, HOUR);
    const created = r.effects.filter((e) => e.type === 'MISSION_CONTEXT_CREATED');
    expect(created).toHaveLength(1);
  });
  it('1 attribution par personne et par jour', () => {
    const r = run(setup(), [mission('a'), mission('a')]);
    expect(r.effects.filter((e) => e.type === 'COINS_CREDIT')).toHaveLength(1);
    expect(r.effects).toContainEqual({ type: 'NO_GAIN_CAP_REACHED', action: 'MISSION', relationshipId: 'r', petId: 'a' });
  });
});
