/** Moteur pet V5 (spec-v5 §5.2–5.3) et calendrier des sorties. */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { PET_MEMORY_KINDS, REACTION_POSES, RETIRED_POSES_V5, STAGES, type PetMemoryKind } from '@blowy/domain';
import { DEFAULT_TUNING as T } from '@blowy/tuning';
import {
  ENGINE_VERSION_V5,
  cancelKindAt,
  defaultGroupAge,
  createPetV5,
  mondayOfWeek,
  migratePetV4ToV5,
  nextStageProgress,
  outingInstants,
  poseForV5,
  reduceV5,
  requestWindow,
  composeAtOf,
  weekKeyOf,
  type EffectV5,
  type PetEventV5,
  type PetStateV5,
} from '../v5/index.js';
import * as v4 from '../v4/index.js';

const NOW = Date.UTC(2026, 10, 19, 12);
const ctx = (now = NOW) => ({ now, seed: 'pet-seed', engineVersion: ENGINE_VERSION_V5, tuning: T });
let n = 0;
const ev = <E extends Omit<PetEventV5, 'eventId' | 'petId'>>(e: E) => ({ eventId: `e${++n}`, petId: 'pet', ...e }) as PetEventV5;
const memory = (memoryKind: PetMemoryKind, attended?: boolean) => ev({ type: 'MEMORY_RECORDED', memoryKind, refId: `r${n}`, attended });

function run(pet: PetStateV5, events: PetEventV5[]): { pet: PetStateV5; effects: EffectV5[] } {
  const effects: EffectV5[] = [];
  for (const e of events) {
    const r = reduceV5(pet, e, ctx());
    pet = r.state;
    effects.push(...r.effects);
  }
  return { pet, effects };
}

/** Une sortie vécue telle que le backend la rejoue : OUTING_LIVED(attended) puis PROMISE_KEPT au palier. */
function liveOuting(pet: PetStateV5, newFriends = 0): PetStateV5 {
  const first = run(pet, [memory('OUTING_LIVED', true)]);
  let p = first.pet;
  for (const e of first.effects) if (e.type === 'MILESTONE_REACHED') p = run(p, [memory('PROMISE_KEPT')]).pet;
  for (let i = 0; i < newFriends; i++) p = run(p, [memory('BAND_NEW_MEMBER')]).pet;
  return p;
}

describe('reduceV5', () => {
  it('éclosion : bébé, souvenir HATCHED compté, aucun accessoire', () => {
    const p = createPetV5('pet', 'NINO');
    expect(p).toMatchObject({ stage: 'BABY', memoryCount: 1, memoriesByKind: { HATCHED: 1 }, xpMilli: 0, equipped: [] });
  });

  it('1ʳᵉ sortie : XP 40, palier « parole tenue » 1, accessoire du 1er souvenir de sortie', () => {
    const { pet, effects } = run(createPetV5('pet', 'NINO'), [memory('OUTING_LIVED', true)]);
    expect(pet.xpMilli).toBe(40_000);
    expect(pet.attendedCount).toBe(1);
    expect(effects).toContainEqual({ type: 'MILESTONE_REACHED', petId: 'pet', kind: 'PROMISE_KEPT', n: 1 });
    expect(effects).toContainEqual({ type: 'ACCESSORY_UNLOCKED', petId: 'pet', accessoryId: 'badge_first_outing', source: 'MEMORY' });
    expect(effects).toContainEqual({ type: 'MEMORY_ADDED', petId: 'pet', memoryKind: 'OUTING_LIVED' });
  });

  it('calibrage : « jeune » après 2 sorties, « adulte » après 10 sorties (≈ 1 nouvel·le ami·e toutes les 2 sorties)', () => {
    let p = createPetV5('pet', 'PIA');
    const stages: string[] = [];
    for (let i = 0; i < 10; i++) {
      p = liveOuting(p, i % 2);
      stages.push(p.stage);
    }
    expect(stages[0]).toBe('BABY');
    expect(stages[1]).toBe('YOUNG');
    expect(stages[8]).toBe('YOUNG');
    expect(stages[9]).toBe('ADULT');
    // sans aucun lien : jeune quand même après 2 sorties (40 + 40 + 25 ≥ 100)
    expect(liveOuting(liveOuting(createPetV5('pet', 'PIA'))).stage).toBe('YOUNG');
  });

  it('pur, idempotent : l’entrée n’est pas mutée ; un eventId rejoué ne change rien', () => {
    const p = createPetV5('pet', 'GASTON');
    const frozen = structuredClone(p);
    const e = memory('BAND_NEW_MEMBER');
    const r1 = reduceV5(p, e, ctx());
    expect(p).toEqual(frozen);
    const r2 = reduceV5(r1.state, e, ctx());
    expect(r2.state).toBe(r1.state);
    expect(r2.effects).toEqual([{ type: 'ACTION_REJECTED', reason: 'DUPLICATE_EVENT' }]);
    expect(reduceV5(p, { ...memory('HATCHED'), petId: 'autre' }, ctx()).effects).toEqual([{ type: 'ACTION_REJECTED', reason: 'PET_MISMATCH' }]);
  });

  it('propriété : jamais de perte (XP, souvenirs, stade, accessoires monotones) ; jamais SICK/HUNGRY/SAD', () => {
    const anyEvent = fc.oneof(
      fc.record({ type: fc.constant('MEMORY_RECORDED' as const), memoryKind: fc.constantFrom(...PET_MEMORY_KINDS), refId: fc.string(), attended: fc.boolean() }),
      fc.record({ type: fc.constant('ACCESSORY_GRANTED' as const), accessoryId: fc.constantFrom('hat_beret', 'kite_referral', 'scarf_red'), source: fc.constantFrom('PLUS_MONTHLY' as const, 'REFERRAL' as const, 'STAFF' as const) }),
      fc.record({ type: fc.constant('ACCESSORY_EQUIP' as const), accessoryIds: fc.subarray(['hat_beret', 'kite_referral', 'scarf_red', 'badge_first_outing', 'x']) }),
      fc.record({ type: fc.constant('REACT' as const), pose: fc.constantFrom(...REACTION_POSES) }),
    );
    fc.assert(
      fc.property(fc.array(anyEvent, { maxLength: 60 }), fc.integer({ min: 0, max: 7 * 24 }), (events, hours) => {
        let p = createPetV5('pet', 'SUZIE');
        for (const [i, e] of events.entries()) {
          const before = p;
          const r = reduceV5(p, { ...e, eventId: `x${i}`, petId: 'pet' } as PetEventV5, ctx(NOW + i * 60_000));
          p = r.state;
          expect(p.xpMilli).toBeGreaterThanOrEqual(before.xpMilli);
          expect(p.memoryCount).toBeGreaterThanOrEqual(before.memoryCount);
          expect(STAGES.indexOf(p.stage)).toBeGreaterThanOrEqual(STAGES.indexOf(before.stage));
          for (const a of before.unlockedAccessories) expect(p.unlockedAccessories).toContain(a);
          expect(p.equipped.length).toBeLessThanOrEqual(T.accessories.maxEquipped);
          for (const a of p.equipped) expect(p.unlockedAccessories).toContain(a);
        }
        const pose = poseForV5(p, NOW + hours * 3_600_000, 'Europe/Paris', T);
        expect(RETIRED_POSES_V5).not.toContain(pose);
      }),
      { numRuns: 150, seed: 42 },
    );
  });

  it('accessoires : équiper exige un déblocage, ≤ 3, sans doublon ; un don déjà reçu est refusé', () => {
    let p = run(createPetV5('pet', 'NINO'), ['a', 'b', 'c', 'd'].map((accessoryId) => ev({ type: 'ACCESSORY_GRANTED', accessoryId, source: 'STAFF' }))).pet;
    expect(reduceV5(p, ev({ type: 'ACCESSORY_EQUIP', accessoryIds: ['a', 'zz'] }), ctx()).effects).toEqual([{ type: 'ACTION_REJECTED', reason: 'ACCESSORY_NOT_UNLOCKED' }]);
    expect(reduceV5(p, ev({ type: 'ACCESSORY_EQUIP', accessoryIds: ['a', 'b', 'c', 'd'] }), ctx()).effects).toEqual([{ type: 'ACTION_REJECTED', reason: 'TOO_MANY_EQUIPPED' }]);
    expect(reduceV5(p, ev({ type: 'ACCESSORY_EQUIP', accessoryIds: ['a', 'a'] }), ctx()).effects).toEqual([{ type: 'ACTION_REJECTED', reason: 'DUPLICATE_ACCESSORY' }]);
    p = reduceV5(p, ev({ type: 'ACCESSORY_EQUIP', accessoryIds: ['c', 'a'] }), ctx()).state;
    expect(p.equipped).toEqual(['c', 'a']);
    expect(reduceV5(p, ev({ type: 'ACCESSORY_GRANTED', accessoryId: 'a', source: 'PLUS_MONTHLY' }), ctx()).effects).toEqual([{ type: 'ACTION_REJECTED', reason: 'ACCESSORY_ALREADY_UNLOCKED' }]);
  });

  it('pose : réaction (TTL) > nuit locale > joyeux', () => {
    const p = reduceV5(createPetV5('pet', 'NINO'), ev({ type: 'REACT', pose: 'DANCE' }), ctx()).state;
    expect(poseForV5(p, NOW + 1000, 'Europe/Paris', T)).toBe('DANCE');
    expect(poseForV5(p, NOW + T.accessories.reactionTtlMs, 'Europe/Paris', T)).toBe('JOYFUL');
    expect(poseForV5(p, Date.UTC(2026, 10, 19, 23), 'Europe/Paris', T)).toBe('ASLEEP');
  });

  it('progression vers le prochain stade (‰), null à l’âge adulte', () => {
    expect(nextStageProgress('BABY', 50_000, T)).toEqual({ stage: 'YOUNG', progressPermille: 500 });
    expect(nextStageProgress('ADULT', 0, T)).toBeNull();
  });

  it('migration V4 → V5 : stade et XP conservés, HATCHED seul souvenir', () => {
    const old = v4.createPet({ id: 'pet', kind: 'PRIMARY', species: 'GASTON', axes: { kindMischief: 0, sportyContemplative: 0, scienceArt: 0, homeAdventure: 0 }, tz: 'Europe/Paris', nowMs: NOW }, T);
    const migrated = migratePetV4ToV5({ ...old, stage: 'YOUNG', xpMilli: 420_000 });
    expect(migrated).toMatchObject({ id: 'pet', species: 'GASTON', stage: 'YOUNG', xpMilli: 420_000, memoryCount: 1, memoriesByKind: { HATCHED: 1 } });
  });
});

describe('calendrier V5', () => {
  it('semaine ISO dans le fuseau du quartier', () => {
    expect(weekKeyOf(Date.UTC(2026, 10, 19, 18), 'Europe/Paris')).toBe('2026-W47');
    expect(weekKeyOf(Date.UTC(2026, 0, 1, 12), 'Europe/Paris')).toBe('2026-W01');
    expect(weekKeyOf(Date.UTC(2027, 0, 1, 12), 'Europe/Paris')).toBe('2026-W53');
    // dimanche 23 h 30 UTC = lundi 0 h 30 à Paris : semaine suivante
    expect(weekKeyOf(Date.UTC(2026, 10, 22, 23, 30), 'Europe/Paris')).toBe('2026-W48');
    // aller-retour : le jour appartient à la semaine [lundi, lundi + 7)
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 3000 }), (d) => {
        const day = Math.floor(Date.UTC(2024, 0, 1, 12) / 86_400_000) + d;
        const monday = mondayOfWeek(weekKeyOf(day * 86_400_000 + 43_200_000, 'UTC'));
        expect(day - monday).toBeGreaterThanOrEqual(0);
        expect(day - monday).toBeLessThan(7);
      }),
    );
  });
  it('V5.5 (D-053) : demande ouverte vendredi 21 h de W−1 ; composition J − 3 21 h par jour ; fermeture = composition du dimanche', () => {
    expect(mondayOfWeek('2026-W47')).toBe(Math.floor(Date.UTC(2026, 10, 16) / 86_400_000));
    const w = requestWindow('2026-W47', 'Europe/Paris', T);
    expect(new Date(w.opensAtMs).toISOString()).toBe('2026-11-13T20:00:00.000Z'); // ven. 13, 21 h Paris
    expect(new Date(w.closesAtMs).toISOString()).toBe('2026-11-19T20:00:00.000Z'); // jeu. 19, 21 h (pour dim. 22)
    const iso = (ms: number) => new Date(ms).toISOString();
    // Jeudi 19 → lundi 16, 21 h ; mardi 17 → samedi 14, 21 h.
    expect(iso(composeAtOf(Date.UTC(2026, 10, 19, 18, 30), 'Europe/Paris', T))).toBe('2026-11-16T20:00:00.000Z');
    expect(iso(composeAtOf(Date.UTC(2026, 10, 17, 18, 30), 'Europe/Paris', T))).toBe('2026-11-14T20:00:00.000Z');
    // Pour CHAQUE jour de créneau : composition < fin d'invitation (J−2 21 h) < confirmation (J−1 18 h).
    for (let d = 17; d <= 22; d++) {
      const startsAtMs = Date.UTC(2026, 10, d, 18, 30);
      const composedAtMs = composeAtOf(startsAtMs, 'Europe/Paris', T);
      const i = outingInstants({ startsAtMs, composedAtMs, tz: 'Europe/Paris', tuning: T });
      expect(composedAtMs).toBeLessThan(i.acceptDeadlineMs);
      expect(i.acceptDeadlineMs).toBeLessThan(i.lockAtMs);
    }
  });
  it('instants d’une sortie (jeudi 19 h 30) et passage à l’heure d’été', () => {
    const startsAtMs = Date.UTC(2026, 10, 19, 18, 30); // jeu. 19 h 30 Paris
    const i = outingInstants({ startsAtMs, composedAtMs: Date.UTC(2026, 10, 17, 11), tz: 'Europe/Paris', tuning: T });
    const iso = (ms: number) => new Date(ms).toISOString();
    expect(iso(i.lockAtMs)).toBe('2026-11-18T17:00:00.000Z');
    // V5.2 (C.8) : visages révélés 3 h avant le début (lieu la veille 18 h)
    expect(iso(i.photoRevealAtMs)).toBe('2026-11-19T15:30:00.000Z');
    const atLock = outingInstants({ startsAtMs, composedAtMs: Date.UTC(2026, 10, 17, 11), tz: 'Europe/Paris', tuning: { ...T, outings: { ...T.outings, cycle: { ...T.outings.cycle, photoRevealAtLock: true } } } });
    expect(iso(atLock.photoRevealAtMs)).toBe(iso(i.lockAtMs));
    const spec = outingInstants({ startsAtMs, composedAtMs: Date.UTC(2026, 10, 17, 11), tz: 'Europe/Paris', tuning: { ...T, outings: { ...T.outings, cycle: { ...T.outings.cycle, photoRevealHourLocal: 9 } } } });
    expect(iso(spec.photoRevealAtMs)).toBe('2026-11-19T08:00:00.000Z');
    expect(cancelKindAt(i.lockAtMs - 1, i.lockAtMs)).toBe('EARLY');
    expect(cancelKindAt(i.lockAtMs, i.lockAtMs)).toBe('LATE');
    expect(defaultGroupAge(20, T)).toEqual({ min: 18, max: 24 });
    expect(iso(i.acceptDeadlineMs)).toBe('2026-11-18T11:00:00.000Z');
    expect(iso(i.checkinOpensAtMs)).toBe('2026-11-19T18:00:00.000Z');
    expect(iso(i.checkinClosesAtMs)).toBe('2026-11-19T20:00:00.000Z');
    expect(iso(i.votesCloseAtMs)).toBe('2026-11-22T20:00:00.000Z');
    expect(iso(i.endsAtMs)).toBe('2026-11-19T20:30:00.000Z');
    // dimanche 29 mars 2026 (passage à l’heure d’été) à 11 h : verrouillage la veille 18 h (CET)
    const dst = outingInstants({ startsAtMs: Date.UTC(2026, 2, 29, 9), composedAtMs: Date.UTC(2026, 2, 24, 11), tz: 'Europe/Paris', tuning: T });
    expect(iso(dst.lockAtMs)).toBe('2026-03-28T17:00:00.000Z');
  });
});
