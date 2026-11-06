/**
 * Outils des parcours V5 (sorties) : ville + quartier + créneaux + lieu (référentiels, comme le
 * seed), personnes V5 onboardées par l'API (quartier, intentions secrètes sous consentement,
 * photo de profil), horloge posée sur un cycle réel (semaine 2026-W47), jobs du worker.
 */
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { uuidv7 } from '@blowy/database';
import { Person, type PersonSpec } from './actor.js';
import { synthImage, upload } from './media.js';
import type { World } from './world.js';
import { OUTING_ADMIN_PORT } from '../../../src/shared/application/ports/outing-admin.port.js';

/** Cycle de référence (heure de Paris = UTC+1 en novembre). */
export const CYCLE = {
  monday: new Date('2026-11-16T09:30:00Z'), // lun. 10 h 30 : demandes ouvertes (W47)
  composed: new Date('2026-11-17T11:01:00Z'), // mar. 12 h 01 : composition
  locked: new Date('2026-11-18T17:01:00Z'), // mer. 18 h 01 : lieu révélé
  faces: new Date('2026-11-19T15:31:00Z'), // jeu. 16 h 31 : visages (startsAt − 3 h)
  checkin: new Date('2026-11-19T18:05:00Z'), // jeu. 19 h 05 : check-in ouvert
  done: new Date('2026-11-19T20:01:00Z'), // jeu. 21 h 01 : sortie terminée, votes ouverts
  votesClosed: new Date('2026-11-22T20:01:00Z'), // dim. 21 h 01 : dépouillement
  weekKey: '2026-W47',
};

export const VENUE = { lat: 48.8649, lng: 2.3707 };

export interface City {
  neighborhoodId: string;
  zoneId: string;
  venueId: string;
}

/** Ville + quartier + créneaux (jeu. 19 h 30 jeux, sam. 15 h jeux) + lieu partenaire. */
export async function city(w: World, o: { slug: string; name: string; city: string; status: 'LIVE' | 'WAITLIST'; zoneCode?: string }): Promise<City> {
  const zoneCode = o.zoneCode ?? w.zone;
  const zone = await w.db.zone.upsert({ where: { code: zoneCode }, create: { code: zoneCode, name: o.city, timezone: 'Europe/Paris' }, update: {} });
  const n = await w.db.neighborhood.create({ data: { id: uuidv7(), slug: o.slug, name: o.name, city: o.city, cityZoneId: zone.id, timezone: 'Europe/Paris', status: o.status, densityThreshold: 120 } });
  await w.db.neighborhoodSlotTemplate.createMany({ data: [{ neighborhoodId: n.id, isoWeekday: 4, localMinute: 19 * 60 + 30, activity: 'GAMES' }, { neighborhoodId: n.id, isoWeekday: 6, localMinute: 15 * 60, activity: 'GAMES' }] });
  const v = await w.db.venue.create({ data: { neighborhoodId: n.id, name: `Café ${o.name}`, addressLine: '12 rue Oberkampf', postalCode: '75011', city: o.city, ...VENUE, offerKey: 'venue.offer.table_reserved', activities: ['GAMES'], tablesPerSlot: 2, accessibilityTags: [], checkinSecretRef: `j-${o.slug}` } });
  return { neighborhoodId: n.id, zoneId: zone.id, venueId: v.id };
}

export interface V5Spec extends PersonSpec {
  looking: 'FRIENDS' | 'STORY' | 'BOTH';
  romance?: ('WOMAN' | 'MAN' | 'NON_BINARY')[];
  /** Sous-choix secret (jamais visible). */
  seriousness?: 'SERIOUS' | 'SEE_HOW_IT_GOES';
}

const ok = <T>(r: { ok: boolean; status: number; data: T; code: string | null }, what: string): T => {
  if (!r.ok) throw new Error(`${what}: ${r.status} ${r.code} ${JSON.stringify(r.data)}`);
  return r.data;
};

/** Personne V5 : onboarding par l'API, quartier, consentement art. 9, intentions, photo, téléphone WS. */
export async function v5Person(w: World, spec: V5Spec, c: City): Promise<Person> {
  const p = new Person(w, spec);
  await p.onboard();
  return v5Setup(p, spec, c);
}

/** Complète une personne déjà onboardée (V4) pour les sorties V5 : quartier, intentions, photo, téléphone WS. */
export async function v5Setup(p: Person, spec: V5Spec, c: City): Promise<Person> {
  ok(await p.call('PUT', '/v1/me/neighborhood', { neighborhoodId: c.neighborhoodId }), 'quartier');
  const story = spec.looking !== 'FRIENDS';
  if (story) ok(await p.call('POST', '/v1/consents', { items: [{ purpose: 'SENSITIVE_PREFERENCES', version: '2026-11', granted: true }] }), 'consentement art. 9');
  ok(
    await p.call('PUT', '/v1/preferences/intentions', { lookingFor: spec.looking, storySeriousness: story ? (spec.seriousness ?? 'SEE_HOW_IT_GOES') : null, kidsSomeday: null, meetingMode: 'BOTH', meetGenders: [], romanceGenders: story ? (spec.romance ?? []) : [] }),
    'intentions',
  );
  const photo = await upload(p, { purpose: 'PROFILE_PHOTO', bytes: await synthImage({ color: '#7a9' }) });
  expect(photo.view?.status, `photo de ${spec.displayName}`).toBe('READY');
  await p.device(`${spec.key}-phone`);
  return p;
}

export async function at(w: World, d: Date) {
  w.clock.set(d);
  await w.drain();
}

export const week = (p: Person) => p.call('GET', '/v1/outings/week');
export const outing = (p: Person, id: string) => p.call('GET', `/v1/outings/${id}`);
export const request = (p: Person, body: unknown = {}) => p.call('PUT', `/v1/outings/requests/${CYCLE.weekKey}`, body);
export const accept = (p: Person, id: string, key = randomUUID()) => p.call('POST', `/v1/outings/${id}/seat/accept`, { funding: 'AUTO' }, key);
/** V5.5 (D-062) : code du chevalet de la sortie (celui que montre l'espace lieu) — seul moyen de check-in. */
export async function venueCodeOf(w: World, outingId: string): Promise<string> {
  const o = await w.db.outing.findUniqueOrThrow({ where: { id: outingId }, include: { venue: { select: { checkinSecretRef: true } } } });
  const port = w.app.get<{ venueCode(ref: string, at: Date): string }>(OUTING_ADMIN_PORT, { strict: false });
  return port.venueCode(o.venue.checkinSecretRef, o.startsAt);
}
/** V5.5 (D-062) : code du chevalet d'un RDV duo (table de 2). */
export async function duoCodeOf(w: World, dateId: string): Promise<string> {
  const d = await w.db.duoDate.findUniqueOrThrow({ where: { id: dateId }, include: { venue: { select: { checkinSecretRef: true } } } });
  return w.app.get<{ venueCode(ref: string, at: Date): string }>(OUTING_ADMIN_PORT, { strict: false }).venueCode(d.venue.checkinSecretRef, d.startsAt);
}
/** Check-in au code du chevalet (V5.5) ; `code` explicite pour tester un mauvais code. */
export const checkIn = async (p: Person, id: string, code?: string) => p.call('POST', `/v1/outings/${id}/check-in`, { code: code ?? (await venueCodeOf(p.world, id)) });
export const votes = (p: Person, id: string) => p.call('GET', `/v1/outings/${id}/votes`);
export const vote = (p: Person, id: string, choices: Record<string, 'FRIEND' | 'PLUS' | 'NO'>) => p.call('PUT', `/v1/outings/${id}/votes`, { choices });

/** Clés qui ne doivent JAMAIS apparaître dans ce que reçoit un autre acteur. */
export const FORBIDDEN_KEYS = ['lookingFor', 'romanceGenders', 'meetGenders', 'storySeriousness', 'kidsSomeday', 'meetingMode', 'birthDate', '"gender"', '"age"', 'seekingGenders', '"choice"', 'noShows', 'lateCancels', 'cancelKind', 'paymentRef'];
export const leaksIn = (v: unknown, extra: string[] = []) => [...FORBIDDEN_KEYS, ...extra].filter((k) => JSON.stringify(v ?? null).includes(k));

/** Forme une sortie de 5 : demandes, composition, « Je viens » de tous. */
export async function formOuting(w: World, people: Person[]): Promise<string> {
  await at(w, CYCLE.monday);
  for (const p of people) ok(await request(p), `demande ${p.name}`);
  await at(w, CYCLE.composed);
  await w.runJob('outings.compose');
  const ids = new Set<string>();
  for (const p of people) ids.add(ok(await week(p), 'semaine').myOutingId);
  expect(ids.size, 'une seule sortie pour les 5').toBe(1);
  const id = [...ids][0]!;
  for (const p of people) ok(await accept(p, id), `Je viens ${p.name}`);
  await w.drain();
  return id;
}
