/** Progression : XP vs niveau éligible vs niveau atteint ; portes ; matrice de capacités ; XP pet. */
import { describe, expect, it } from 'vitest';
import { VISION_AXES } from '@blowy/domain';
import { reduce } from '../reduce.js';
import { capabilitiesFor, canTransferToNeighborhood, eligibleLevel, stageFor } from '../progression/index.js';
import { refusalProbability } from '../random/index.js';
import { groupCohesion, groupGainsActive, groupMissionValid } from '../group/index.js';
import { planNotifications } from '../notify/index.js';
import { composeBabyName, inherit } from '../egg/index.js';
import { createEgg } from '../factory.js';
import type { EngineEffect, World } from '../model/index.js';
import { NEUTRAL, T, TZ, ctxAt, pairWorld, utc } from './fixtures.js';

const now = utc(2026, 6, 10, 10);

describe('niveaux et portes', () => {
  it('seuils 0/150/500/900/1400/2000/3000', () => {
    expect([0, 149, 150, 499, 500, 3000].map((x) => eligibleLevel(x * 1000, T))).toEqual([1, 1, 2, 2, 3, 7]);
  });
  it('XP accumulée sans consentement : éligible 4, atteint 2 ; l’emménagement débloque 3 puis la branche 4', () => {
    const w = pairWorld(now, { level: 2 });
    w.relationships.r!.xpMilli = 950_000;
    let r = reduce(w, { eventId: 'g0', type: 'GATES_UPDATED', relationshipId: 'r', gates: {} }, ctxAt(now));
    expect(r.state.relationships.r!.reachedLevel).toBe(2);
    expect(capabilitiesFor(r.state.relationships.r!, { paused: false, tuning: T }).has('VOICE')).toBe(false);
    r = reduce(r.state, { eventId: 'g1', type: 'GATES_UPDATED', relationshipId: 'r', gates: { moveInAccepted: true } }, ctxAt(now));
    expect(r.state.relationships.r!.reachedLevel).toBe(3);
    r = reduce(r.state, { eventId: 'g2', type: 'GATES_UPDATED', relationshipId: 'r', gates: { branch: 'FRIEND' } }, ctxAt(now));
    expect(r.state.relationships.r!.reachedLevel).toBe(4);
    expect(r.effects).toContainEqual({ type: 'LEVEL_REACHED', relationshipId: 'r', level: 4 });
    // photos : jamais sans les deux consentements ; « jamais » l'emporte
    const rel = r.state.relationships.r!;
    expect(capabilitiesFor(rel, { paused: false, tuning: T }).has('PHOTO_CLEAR')).toBe(false);
    rel.gates.photoConsent = [true, true];
    expect(capabilitiesFor(rel, { paused: false, tuning: T }).has('PHOTO_CLEAR')).toBe(true);
    rel.gates.photoPreference = ['NEVER', 'FROM_LEVEL_4_WITH_CONSENT'];
    expect(capabilitiesFor(rel, { paused: false, tuning: T }).has('PHOTO_CLEAR')).toBe(false);
  });
  it('niveau atteint ne redescend pas ; droits révocables', () => {
    const w = pairWorld(now, { level: 2 });
    const rel = w.relationships.r!;
    rel.xpMilli = 600_000;
    let r = reduce(w, { eventId: 'g1', type: 'GATES_UPDATED', relationshipId: 'r', gates: { moveInAccepted: true } }, ctxAt(now));
    r = reduce(r.state, { eventId: 'g2', type: 'GATES_UPDATED', relationshipId: 'r', gates: { moveInAccepted: false } }, ctxAt(now));
    expect(r.state.relationships.r!.reachedLevel).toBe(3);
  });
  it('matrice : pause conserve texte/voix, suspend XP et relances', () => {
    const w = pairWorld(now, { level: 3 });
    const caps = capabilitiesFor(w.relationships.r!, { paused: true, tuning: T });
    expect(caps.has('CHAT_TEXT') && caps.has('VOICE')).toBe(true);
    expect(caps.has('XP_GAIN') || caps.has('NUDGES')).toBe(false);
  });
  it('matrice : transfert Ami N6 → Quartier conserve la communication, sans nid ni exclusivité', () => {
    const w = pairWorld(now, { level: 6 });
    const rel = w.relationships.r!;
    rel.gates = { ...rel.gates, moveInAccepted: true, branch: 'FRIEND' };
    expect(canTransferToNeighborhood(rel, T)).toBe(true);
    rel.gates.transferToNeighborhoodAccepted = true;
    const caps = capabilitiesFor(rel, { paused: false, tuning: T });
    expect(caps.has('CHAT_TEXT') && caps.has('VOICE')).toBe(true);
    expect(caps.has('SHARED_NEST') || caps.has('MOVE_IN_PROPOSAL')).toBe(false);
  });
  it('matrice : entrée en Plus avec niveau historique élevé exige les portes Plus', () => {
    const w = pairWorld(now, { level: 6 });
    const rel = w.relationships.r!;
    rel.gates = { ...rel.gates, moveInAccepted: true, branch: 'PLUS', photoConsent: [true, true], photoOriginalConsent: [true, true] };
    const caps = capabilitiesFor(rel, { paused: false, tuning: T });
    expect(caps.has('PHOTO_BLURRED')).toBe(true);
    expect(caps.has('PHOTO_ORIGINAL') || caps.has('IRL_DATE') || caps.has('EGG')).toBe(false);
  });
  it('Ami plafonne au niveau 6 ; aucun œuf amical', () => {
    const w = pairWorld(now, { level: 2 });
    w.relationships.r!.xpMilli = 3_500_000;
    const r = reduce(w, { eventId: 'g', type: 'GATES_UPDATED', relationshipId: 'r', gates: { moveInAccepted: true, branch: 'FRIEND', irlDateConfirmed: true, eggAccepted: true } }, ctxAt(now));
    expect(r.state.relationships.r!.reachedLevel).toBe(6);
  });
});

describe('XP pet', () => {
  it('bonus week-end Blowy+ uniquement sur l’XP pet ; gel si malade', () => {
    const sat = utc(2026, 6, 13, 10); // samedi
    const w = pairWorld(sat, { level: 2 });
    const r = reduce(w, { eventId: 'm', type: 'MISSION_VALIDATED', petId: 'a', missionId: 'M', relationshipId: 'r', boost: 'MOOD', weekendEntitlement: true }, ctxAt(sat));
    const pet = r.effects.find((e) => e.type === 'PET_XP_GAINED') as Extract<EngineEffect, { type: 'PET_XP_GAINED' }>;
    expect(pet.weekendMultiplier).toBe(2);
    const link = r.effects.find((e) => e.type === 'LINK_XP_GAINED') as Extract<EngineEffect, { type: 'LINK_XP_GAINED' }>;
    expect(link.baseXp).toBe(T.actions.mission.linkXp);
  });
  it('croissance de stade', () => {
    const ctx = ctxAt(now);
    expect([0, 300_000, 1_500_000].map((x) => stageFor(x, ctx))).toEqual(['BABY', 'YOUNG', 'ADULT']);
  });
});

describe('sens des axes de vision', () => {
  it('kindMischief : gentil = −1 refuse moins qu’espiègle = +1', () => {
    const base = { species: 'PIA' as const, desire: 50, waitingHours: 0 };
    expect(refusalProbability({ ...base, kindMischief: -1 }, T)).toBeLessThan(refusalProbability({ ...base, kindMischief: 1 }, T));
    expect(VISION_AXES).toEqual(['kindMischief', 'sportyContemplative', 'scienceArt', 'homeAdventure']);
  });
});

describe('œuf', () => {
  function eggWorld(): World {
    const w = pairWorld(now);
    w.eggs.e = createEgg({ id: 'e', relationshipId: 'r', tz: TZ });
    return w;
  }
  const night = (day: number) => utc(2026, 6, 10 + day, 19, 5); // 21 h 05 Paris
  function playNight(w: World, n: number, at: number, same: boolean): World {
    let cur = reduce(w, { eventId: `o${n}`, type: 'EGG_SESSION_OPEN', eggId: 'e' }, ctxAt(at)).state;
    for (let q = 0; q < T.egg.questionsPerNight; q++) {
      cur = reduce(cur, { eventId: `a${n}${q}`, type: 'EGG_ANSWER', eggId: 'e', night: n, question: q, side: 0, choice: 'X' }, ctxAt(at + 1000)).state;
      cur = reduce(cur, { eventId: `b${n}${q}`, type: 'EGG_ANSWER', eggId: 'e', night: n, question: q, side: 1, choice: same ? 'X' : 'Y' }, ctxAt(at + 2000)).state;
    }
    return cur;
  }
  it('chaleur : +15 identique/+8 différente par question pour la paire, plafond 180, 3 nuits', () => {
    let w = eggWorld();
    for (let n = 1; n <= 3; n++) w = playNight(w, n, night(n - 1), true);
    expect(w.eggs.e!.heat).toBe(180);
    expect(w.eggs.e!.status).toBe('READY_TO_HATCH');
    let d = eggWorld();
    for (let n = 1; n <= 3; n++) d = playNight(d, n, night(n - 1), false);
    expect(d.eggs.e!.heat).toBe(96);
  });
  it('réponses révélées seulement quand les deux ont répondu ; réponse unique', () => {
    let w = reduce(eggWorld(), { eventId: 'o', type: 'EGG_SESSION_OPEN', eggId: 'e' }, ctxAt(night(0))).state;
    const r = reduce(w, { eventId: 'a', type: 'EGG_ANSWER', eggId: 'e', night: 1, question: 0, side: 0, choice: 'X' }, ctxAt(night(0)));
    expect(r.effects.some((e) => e.type === 'EGG_ANSWERS_REVEALED')).toBe(false);
    w = r.state;
    expect(reduce(w, { eventId: 'a2', type: 'EGG_ANSWER', eggId: 'e', night: 1, question: 0, side: 0, choice: 'Y' }, ctxAt(night(0))).effects).toContainEqual({ type: 'ACTION_REJECTED', reason: 'EGG_NOT_OPEN' });
  });
  it('nuit ratée rattrapable ; au plus 1 courante + 1 rattrapage ; ouverture idempotente', () => {
    let w = reduce(eggWorld(), { eventId: 'o1', type: 'EGG_SESSION_OPEN', eggId: 'e' }, ctxAt(night(0))).state;
    w = reduce(w, { eventId: 'o1b', type: 'EGG_SESSION_OPEN', eggId: 'e' }, ctxAt(night(0) + 60_000)).state;
    expect(w.eggs.e!.sessions).toHaveLength(1);
    const r2 = reduce(w, { eventId: 'o2', type: 'EGG_SESSION_OPEN', eggId: 'e' }, ctxAt(night(1)));
    expect(r2.effects).toContainEqual({ type: 'EGG_SESSION_OPENED', eggId: 'e', night: 2, catchUp: true });
    const r3 = reduce(r2.state, { eventId: 'o3', type: 'EGG_SESSION_OPEN', eggId: 'e' }, ctxAt(night(2)));
    expect(r3.state.eggs.e!.sessions).toHaveLength(2); // pas de 3e ouverte tant que 2 sont en cours
  });
  it('tapotement dans 60 s ; naissance unique ; nom composé stable', () => {
    let w = eggWorld();
    for (let n = 1; n <= 3; n++) w = playNight(w, n, night(n - 1), true);
    const t0 = night(3);
    let r = reduce(w, { eventId: 't1', type: 'EGG_TAP', eggId: 'e', side: 0 }, ctxAt(t0));
    r = reduce(r.state, { eventId: 't2', type: 'EGG_TAP', eggId: 'e', side: 1 }, ctxAt(t0 + 61_000));
    expect(r.state.eggs.e!.status).toBe('READY_TO_HATCH');
    r = reduce(r.state, { eventId: 't3', type: 'EGG_TAP', eggId: 'e', side: 0 }, ctxAt(t0 + 70_000));
    expect(r.effects.filter((e) => e.type === 'EGG_HATCHED')).toHaveLength(1);
    expect(reduce(r.state, { eventId: 't4', type: 'EGG_TAP', eggId: 'e', side: 1 }, ctxAt(t0 + 71_000)).effects).toContainEqual({ type: 'ACTION_REJECTED', reason: 'EGG_INVALID' });
    expect(composeBabyName(['Pépite', 'Biscotte'], T)).toBe('Biscotte-Pépite');
    expect(composeBabyName(['Biscotte', 'Pépite'], T)).toBe('Biscotte-Pépite');
    expect(composeBabyName(['Biscotte', 'Biscotte'], T)).toBe('Biscotte');
  });
  it('hérédité : moyenne + deltas bornés, seed conservée', () => {
    const res = inherit({ parents: [{ ...NEUTRAL, kindMischief: 1 }, { ...NEUTRAL, kindMischief: -0.2 }], answerDeltas: { kindMischief: 5, scienceArt: -5 }, passionVotes: ['ART', 'MUSIQUE'], seed: 's' }, T);
    expect(res.axes.kindMischief).toBeCloseTo(0.4 + T.egg.heredityMaxDeltaPerAxis, 10);
    expect(res.axes.scienceArt).toBeCloseTo(-T.egg.heredityMaxDeltaPerAxis, 10);
    expect(res.seed).toBe('s');
    expect(inherit({ parents: [NEUTRAL, NEUTRAL], answerDeltas: {}, passionVotes: ['ART', 'MUSIQUE'], seed: 's' }, T).passion).toBe(res.passion);
  });
});

describe('bande et notifications', () => {
  it('cohésion = moyenne des complicités ; < 3 suspend les gains collectifs', () => {
    expect(groupCohesion(['a', 'b', 'c'], [{ a: 'a', b: 'b', complicity: 30 }, { a: 'b', b: 'c', complicity: 60 }, { a: 'a', b: 'z', complicity: 100 }])).toBe(45);
    expect(groupGainsActive(2, T)).toBe(false);
    expect(groupMissionValid(['a', 'a', 'b'], T)).toBe(false);
  });
  it('3/jour, plages calmes, regroupement et priorité', () => {
    const day = utc(2026, 6, 10, 10);
    const c = (key: string, category: 'HUMAN_MESSAGE' | 'MISSION' | 'STREAK' | 'REAL_WAITING', rel: string | null) => ({ key, category, relationshipId: rel, atMs: day });
    const plan = planNotifications([c('1', 'MISSION', null), c('2', 'HUMAN_MESSAGE', 'r'), c('3', 'HUMAN_MESSAGE', 'r'), c('4', 'STREAK', null), c('5', 'REAL_WAITING', 'r')], 0, day, TZ, T);
    expect(plan.send.map((s) => s.category)).toEqual(['HUMAN_MESSAGE', 'REAL_WAITING', 'STREAK']);
    expect(planNotifications([c('1', 'MISSION', null)], 0, utc(2026, 6, 10, 22), TZ, T).send).toEqual([]);
  });
});
