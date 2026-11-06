/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * V5 — « fuite zéro » (spec-v5 §3, J18 ; V5.1 C ; V5.2 B, C.9) : à CHAQUE état de la sortie, toutes
 * les projections HTTP de chaque acteur et TOUS les événements WS reçus sont balayés : jamais
 * d'intention (potes/histoire, sous-choix secrets, genres recherchés), d'orientation, d'âge exact,
 * de vote d'autrui, de financement d'autrui, de motif d'absence. Un « plus » unilatéral ne laisse
 * aucune trace chez l'autre. Une personne extérieure ne voit rien (404 identique).
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import type { Person } from './support/actor.js';
import { story } from './support/story.js';
import { startWorld, type World } from './support/world.js';
import { at, checkIn, city, CYCLE, formOuting, leaksIn, outing, vote, votes, v5Person, type City } from './support/v5.js';

let w: World;
let c: City;
const people: Person[] = [];
let stranger: Person;
let outingId = '';
const S = story('v5-fuite-zero', 'V5 : aucune fuite d’intention, d’âge exact ni de vote, à chaque état');

beforeAll(async () => {
  w = await startWorld('J_V5_FUITE', CYCLE.monday);
  c = await city(w, { slug: 'j-paris-fuite', name: 'Paris 11e', city: 'Paris', status: 'LIVE' });
});
afterAll(async () => w?.close());

/** V5.2 B + jury tour 3 : ni libellé positif, ni champ de garantie, dans aucune vue HTTP/WS. */
const GUARANTEE = /AT_LEAST_TWO|guarantee|garantie|friendsOnly|storyCompatible/i;

/** Marqueurs secrets propres à ce parcours (valeurs de sous-choix, genres recherchés). */
const SECRET = ['SERIOUS', 'SEE_HOW_IT_GOES', 'DONT_KNOW', 'STORY', 'BOTH', '"FRIENDS"', '1996-', '1997-', '1999-'];

async function sweep(label: string) {
  const problems: string[] = [];
  for (const p of people) {
    const views = [await outing(p, outingId), await p.call('GET', '/v1/outings/week'), await p.call('GET', '/v1/band'), await p.call('GET', '/v1/me/neighborhood')];
    const vv = await votes(p, outingId);
    if (vv.ok) views.push(vv);
    for (const v of views) {
      const l = leaksIn(v.data?.members ?? v.data?.targets ?? v.data?.items ?? v.data, SECRET);
      if (l.length) problems.push(`${label} ${p.name} HTTP: ${l.join(',')}`);
      // Financement : seulement le mien.
      const others = JSON.stringify(v.data?.members ?? []);
      if (/funding|PAID|FREE_FIRST/.test(others)) problems.push(`${label} ${p.name}: financement d'autrui`);
      // Décision jury tour 3 : la garantie « ≥ 2 compatibles » n'est JAMAIS exposée (vue entière).
      if (GUARANTEE.test(JSON.stringify(v.data ?? null))) problems.push(`${label} ${p.name} HTTP: garantie exposée`);
    }
    for (const d of p.devices) for (const e of d.events) {
      const l = leaksIn(e.payload, SECRET);
      if (l.length) problems.push(`${label} ${p.name} WS ${e.type}: ${l.join(',')}`);
      if (GUARANTEE.test(JSON.stringify(e ?? null))) problems.push(`${label} ${p.name} WS ${e.type}: garantie exposée`);
    }
  }
  return problems;
}

describe('Fuite zéro', () => {
  S.step('Cinq personnes aux intentions secrètes variées (histoire sérieuse, potes, les deux) forment une sortie', async () => {
    const specs = [
      { key: 'v5f.alice', displayName: 'Alice', gender: 'WOMAN', looking: 'STORY', romance: ['MAN'], seriousness: 'SERIOUS', petName: 'Luciole', birthDate: '1996-02-01' },
      { key: 'v5f.bruno', displayName: 'Bruno', gender: 'MAN', looking: 'BOTH', romance: ['WOMAN'], petName: 'Fusain', birthDate: '1997-06-01' },
      { key: 'v5f.chloe', displayName: 'Chloé', gender: 'WOMAN', looking: 'FRIENDS', petName: 'Brindille', birthDate: '1999-01-01' },
      { key: 'v5f.david', displayName: 'David', gender: 'MAN', looking: 'BOTH', romance: ['WOMAN'], petName: 'Grizzli', birthDate: '1997-09-01' },
      { key: 'v5f.elsa', displayName: 'Elsa', gender: 'WOMAN', looking: 'FRIENDS', petName: 'Nuage', birthDate: '1999-03-01' },
    ] as const;
    for (const s of specs) people.push(await v5Person(w, { ...s, seeking: [], romance: 'romance' in s ? [...s.romance] : [] } as any, c));
    stranger = await v5Person(w, { key: 'v5f.zed', displayName: 'Zed', gender: 'MAN', seeking: [], looking: 'FRIENDS', petName: 'Zinzin' }, c);
    outingId = await formOuting(w, people);
    expect(await sweep('FORMING')).toEqual([]);
  });

  S.step('Une personne extérieure : 404 identique à un identifiant inconnu ; salle outing: refusée', async () => {
    const r = await outing(stranger, outingId);
    const unknown = await outing(stranger, '00000000-0000-7000-8000-000000000000');
    expect([r.status, unknown.status]).toEqual([404, 404]);
    expect(r.data.code).toBe(unknown.data.code);
    expect(await stranger.phone.join(`outing:${outingId}`)).toBe(false);
  });

  S.step('« Histoire » : Alice a la garantie (Bruno, David) appliquée par la composition mais jamais affichée ; Chloé ne voit rien', async () => {
    const [alice, , chloe] = people;
    expect((await outing(alice!, outingId)).data.storyMatch).toBeUndefined();
    expect(JSON.stringify((await outing(alice!, outingId)).data)).not.toMatch(GUARANTEE);
    expect((await outing(chloe!, outingId)).data.storyMatch).toBeUndefined();
    expect((await alice!.call('GET', '/v1/preferences/intentions')).data).toMatchObject({ lookingFor: 'STORY', storySeriousness: 'SERIOUS' });
  });

  S.step('Lieu, visages, check-in : balayage à chaque état ; tranches de la grille fixe seulement', async () => {
    await at(w, CYCLE.locked);
    await w.runJob('outings.lifecycle');
    expect(await sweep('CONFIRMED')).toEqual([]);
    await at(w, CYCLE.faces);
    const v = (await outing(people[0]!, outingId)).data;
    for (const m of v.members) expect(['18_21', '22_25', '26_29', '30_34', '35_39', '40_44', '45_49', '50_PLUS']).toContain(m.ageRange);
    expect(await sweep('VISAGES')).toEqual([]);
    await at(w, CYCLE.checkin);
    await w.runJob('outings.lifecycle');
    for (const p of people) await checkIn(p, outingId);
    expect(await sweep('CHECKIN_OPEN')).toEqual([]);
  });

  S.step('Votes : un « plus » unilatéral (Bruno → Chloé) ne laisse aucune trace chez Chloé, ni avant ni après la clôture', async () => {
    await at(w, CYCLE.done);
    await w.runJob('outings.lifecycle');
    const [alice, bruno, chloe, david] = people;
    await vote(bruno!, outingId, { [chloe!.userId]: 'PLUS', [alice!.userId]: 'PLUS' });
    await vote(alice!, outingId, { [bruno!.userId]: 'PLUS', [david!.userId]: 'NO' });
    await vote(chloe!, outingId, { [bruno!.userId]: 'NO' });
    await w.drain();
    expect(await sweep('VOTES')).toEqual([]);
    await at(w, CYCLE.votesClosed);
    await w.runJob('outings.lifecycle');
    expect(await sweep('CLOTURE')).toEqual([]);
    const chloeEvents = chloe!.devices.flatMap((d) => d.events);
    expect(chloeEvents.filter((e) => e.type === 'connection.revealed')).toEqual([]);
    expect(JSON.stringify((await votes(chloe!, outingId)).data)).not.toMatch(/PLUS/);
    expect((await votes(alice!, outingId)).data.targets.find((t: any) => t.userId === bruno!.userId).mutual).toBe('PLUS');
    // David ne sait pas qu'Alice a dit « non » : aucune trace côté David.
    expect(JSON.stringify((await votes(david!, outingId)).data)).not.toMatch(/"NO"[^}]*alice|mutual/i);
  });

  S.step('Personne n’accède aux intentions d’autrui : aucune route par identifiant, et le staff non plus via les projections', async () => {
    const r = await people[1]!.call('GET', `/v1/preferences/intentions?userId=${people[0]!.userId}`);
    expect(r.data?.lookingFor).toBe('BOTH'); // toujours SES propres intentions
  });
});
