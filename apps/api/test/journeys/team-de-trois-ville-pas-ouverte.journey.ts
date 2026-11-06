/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * V5 — « Viens avec ta team » dans une ville pas encore ouverte (V5.1 B.7, V5.2 A) : Mehdi crée sa
 * team et invite Yacine et Zoé par lien ; l'écran d'attente montre de vrais nombres (« il manque N
 * personnes sur tes créneaux ») sans position individuelle ; à 3 vérifiés + une autre team, la sortie
 * d'amorçage se forme ; aperçu anonyme qui compte les teams ; règles de team (complète, autre ville).
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import type { Person } from './support/actor.js';
import { story } from './support/story.js';
import { startWorld, type World } from './support/world.js';
import { at, city, CYCLE, leaksIn, outing, v5Person, type City } from './support/v5.js';

let w: World;
let sd: City;
let paris: City;
let mehdi: Person, yacine: Person, zoe: Person, amel: Person, bilal: Person, nina: Person, paul: Person;
let inviteUrl = '';
let outingId = '';
const S = story('v5-team-amorcage', 'V5 : team de 3 dans une ville pas encore ouverte → sortie d’amorçage');

beforeAll(async () => {
  w = await startWorld('J_V5_TEAM', CYCLE.monday);
  sd = await city(w, { slug: 'j-saint-denis', name: 'Saint-Denis', city: 'Saint-Denis', status: 'WAITLIST', zoneCode: 'J_V5_SD' });
  paris = await city(w, { slug: 'j-paris-team', name: 'Paris 11e', city: 'Paris', status: 'LIVE' });
});
afterAll(async () => w?.close());

describe('Team d’amorçage', () => {
  S.step('Mehdi choisit Saint-Denis : écran d’attente honnête (vrais nombres, aucune position), créneau à compléter', async () => {
    mehdi = await v5Person(w, { key: 'v5.mehdi', displayName: 'Mehdi', gender: 'MAN', seeking: [], looking: 'FRIENDS', petName: 'Tonnerre' }, sd);
    const st = (await mehdi.call('GET', '/v1/me/neighborhood')).data;
    expect(st.neighborhood).toMatchObject({ name: 'Saint-Denis', status: 'WAITLIST' });
    expect(st.waitlist).toMatchObject({ verifiedCount: 1, seedingAvailable: true, nextOutingGap: { missing: 4 } });
    expect(JSON.stringify(st)).not.toMatch(/position|rank/i);
  });

  S.step('Mehdi crée sa team ; Yacine et Zoé la rejoignent par le lien ; team de 3 vérifiés = éligible à l’amorçage', async () => {
    const t = await mehdi.call('POST', '/v1/teams', {});
    expect(t.ok, JSON.stringify(t.data)).toBe(true);
    inviteUrl = t.data.inviteUrl;
    expect(inviteUrl).toMatch(/\/team\/[a-z0-9]{12}$/);
    expect(inviteUrl).not.toContain(mehdi.userId);
    yacine = await v5Person(w, { key: 'v5.yacine', displayName: 'Yacine', gender: 'MAN', seeking: [], looking: 'BOTH', romance: ['WOMAN'], petName: 'Mistral' }, sd);
    zoe = await v5Person(w, { key: 'v5.zoe', displayName: 'Zoé', gender: 'WOMAN', seeking: [], looking: 'FRIENDS', petName: 'Plume' }, sd);
    for (const p of [yacine, zoe]) expect((await p.call('POST', '/v1/teams/join', { inviteRef: inviteUrl })).ok).toBe(true);
    const mine = (await zoe.call('GET', '/v1/teams/mine')).data;
    expect(mine.team.members.map((m: any) => m.firstName).sort()).toEqual(['Mehdi', 'Yacine', 'Zoé']);
    expect(mine.team).toMatchObject({ status: 'ACTIVE', seedingEligible: true });
    expect(leaksIn(mine)).toEqual([]);
  });

  S.step('Règles de team : 4ᵉ membre refusé (TEAM_FULL) ; autre ville refusée (NOT_SAME_CITY) ; déjà dans une team refusé', async () => {
    nina = await v5Person(w, { key: 'v5.nina', displayName: 'Nina', gender: 'WOMAN', seeking: [], looking: 'FRIENDS', petName: 'Noisette' }, sd);
    const full = await nina.call('POST', '/v1/teams/join', { inviteRef: inviteUrl });
    expect(full.status).toBe(409);
    expect(full.data.detailsSafe.reason).toBe('TEAM_FULL');
    paul = await v5Person(w, { key: 'v5.paul', displayName: 'Paul', gender: 'MAN', seeking: [], looking: 'FRIENDS', petName: 'Galet' }, paris);
    const other = await paul.call('POST', '/v1/teams', {});
    const otherUrl = other.data.inviteUrl;
    const cross = await nina.call('POST', '/v1/teams/join', { inviteRef: otherUrl });
    expect(cross.status).toBe(412);
    expect(cross.data.detailsSafe.reason).toBe('NOT_SAME_CITY');
    expect((await yacine.call('POST', '/v1/teams', {})).data.detailsSafe.reason).toBe('ALREADY_IN_TEAM');
  });

  S.step('Une autre team de Saint-Denis (Amel + Bilal) ; le job d’amorçage forme une sortie de 5 ; tous invités', async () => {
    amel = await v5Person(w, { key: 'v5.amel', displayName: 'Amel', gender: 'WOMAN', seeking: [], looking: 'FRIENDS', petName: 'Cerise' }, sd);
    bilal = await v5Person(w, { key: 'v5.bilal', displayName: 'Bilal', gender: 'MAN', seeking: [], looking: 'FRIENDS', petName: 'Caillou' }, sd);
    const t2 = await amel.call('POST', '/v1/teams', {});
    expect((await bilal.call('POST', '/v1/teams/join', { inviteRef: t2.data.inviteUrl })).ok).toBe(true);
    await at(w, CYCLE.monday);
    await w.runJob('outings.seeding');
    const people = [mehdi, yacine, zoe, amel, bilal];
    const ids = new Set<string>();
    for (const p of people) ids.add((await p.call('GET', '/v1/outings/week')).data.myOutingId);
    expect(ids.size).toBe(1);
    outingId = [...ids][0]!;
    expect(outingId).toBeTruthy();
    expect((await nina.call('GET', '/v1/outings/week')).data.myOutingId).toBeUndefined();
    const v = (await outing(zoe, outingId)).data;
    expect(v.status).toBe('PROPOSED');
    expect(v.preview).toMatchObject({ size: 5, teams: 2 });
    expect(v.members.filter((m: any) => m.inMyTeam).length).toBe(2);
    expect(leaksIn(v, ['Amel', 'Bilal', 'Mehdi', 'Yacine'])).toEqual([]);
  });

  S.step('Rejouer le job ne crée aucune deuxième sortie (une place active par semaine)', async () => {
    await w.runJob('outings.seeding');
    const n = await w.db.outingSeat.count({ where: { userId: zoe.userId, status: { in: ['INVITED', 'CONFIRMED'] } } });
    expect(n).toBe(1);
  });
});
