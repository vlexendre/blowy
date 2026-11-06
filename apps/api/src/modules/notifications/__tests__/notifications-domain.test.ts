/**
 * Domaine pur des notifications V5 (T8) : catalogue ↔ contenu, rendu discret, heures calmes,
 * plafonds, pause, préférences, adaptateurs d'envoi (sans réseau réel).
 */
import { describe, expect, it } from 'vitest';
import { NOTIFICATION_TEMPLATES_V5 } from '@blowy/content';
import { DEFAULT_TUNING } from '@blowy/tuning';
import { PushDataSchema } from '@blowy/api-contract';
import { PUSH_KINDS, isPushKey, templateOf, type PushKey } from '../domain/catalog.js';
import { decide, type RecipientState } from '../domain/policy.js';
import { renderPush } from '../domain/render.js';
import { formatHour, formatLongDay, formatWeekday, inQuietHours, localDay, placeOutsideQuiet, quietEndAfter, zonedToUtc } from '../domain/time.js';
import { DisabledPushSender, ExpoPushSender, LocalInboxPushSender, readPushConfig, selectPushSender } from '../infrastructure/push-senders.js';
import type { PushMessage } from '../application/ports.js';

const T = DEFAULT_TUNING.notifications.v5;
const TZ = 'Europe/Paris';
const NID = '0190f000-0000-7000-8000-000000000001';
const state = (o: Partial<RecipientState> = {}): RecipientState => ({ tz: TZ, paused: false, disabled: new Set(), sentToday: 0, outingToday: false, hasDevice: true, ...o });
const yes = { relevant: true as const };
const silentLogger = { info: () => undefined, warn: () => undefined, error: () => undefined } as never;
const clock = { now: () => new Date('2026-11-19T15:31:00Z') };

describe('catalogue', () => {
  it('chaque clé push a ses textes dans @blowy/content ; les clés retirées ne sont jamais envoyables', () => {
    for (const k of Object.keys(PUSH_KINDS) as PushKey[]) expect(() => templateOf(k), k).not.toThrow();
    for (const k of ['outing.request_open', 'outing.request_last_call', 'neighborhood.launched', 'duo.proposal', 'pet.memory', 'outing.venue_revealed', 'outing.today']) expect(isPushKey(k), k).toBe(false);
  });
  it('transactionnels du tuning = classe TRANSACTIONAL ; sécurité seule en SAFETY', () => {
    for (const k of T.transactionalKeys) expect(PUSH_KINDS[k as PushKey].klass, k).toBe('TRANSACTIONAL');
    expect(Object.entries(PUSH_KINDS).filter(([, v]) => v.klass === 'SAFETY').map(([k]) => k)).toEqual(['safety.alert_sent']);
  });
  it('variantes discrètes : neutres (ni « rencontre », ni sortie, duo, prénom, pet, lieu)', () => {
    for (const n of NOTIFICATION_TEMPLATES_V5) {
      expect(n.discreetFr, n.key).not.toMatch(/rencontr|sortie|duo|rendez-vous|bande|pet|vote|\{(prenom|pet|autrePet|lieu|jour|quartier)\}/i);
    }
  });
});

describe('rendu', () => {
  it('normal : texte rempli, titre Blowy, clé et catégorie dans data', () => {
    const r = renderPush('outing.faces', { notificationId: NID, vars: { heure: '19 h 30', lieu: 'Café des Oiseaux' }, discreet: false, route: '/outings/x' });
    expect(r).toMatchObject({ title: 'Blowy', body: 'Les visages de ta bande sont visibles. À tout à l’heure, 19 h 30 au Café des Oiseaux.', channelId: 'default' });
    expect(PushDataSchema.parse(r.data)).toMatchObject({ key: 'outing.faces', category: 'OUTING', icon: 'blowy', discreet: false });
  });
  it('discret : « Rappel », corps neutre limité à {heure}, data sans clé ni catégorie, icône neutre', () => {
    const r = renderPush('outing.confirmed', { notificationId: NID, vars: { jour: 'jeudi', heure: '19 h 30', lieu: 'Café des Oiseaux' }, discreet: true, route: '/outings/x' });
    expect(r).toMatchObject({ title: 'Rappel', body: 'Rappel pour demain à 19 h 30.', channelId: 'discreet' });
    expect(r.data).toEqual({ v: 1, notificationId: NID, discreet: true, icon: 'neutral', route: '/outings/x' });
    const m = renderPush('message.human', { notificationId: NID, vars: { prenom: 'Hugo' }, discreet: true, route: '/conversations/c' });
    expect(m.body).toBe('Tu as du nouveau.');
    expect(JSON.stringify(m)).not.toContain('Hugo');
  });
  it('variable manquante : jamais de texte troué, repli sur la variante discrète', () => {
    const r = renderPush('connection.friend', { notificationId: NID, vars: {}, discreet: false, route: '/band' });
    expect(r.body).toBe('Tu as du nouveau.');
    expect(r.title).toBe('Rappel');
  });
  it('sécurité : texte 112 et canal safety, même en mode discret', () => {
    const r = renderPush('safety.alert_sent', { notificationId: NID, vars: {}, discreet: true, route: '/safety' });
    expect(r.body).toContain('112');
    expect(r.channelId).toBe('safety');
    expect(r.urgent).toBe(true);
  });
});

describe('temps local', () => {
  it('jour, heure, formats français (Paris, UTC+1 en novembre)', () => {
    const d = new Date('2026-11-19T18:30:00Z');
    expect(localDay(d, TZ)).toBe('2026-11-19');
    expect(formatWeekday(d, TZ)).toBe('jeudi');
    expect(formatHour(d, TZ)).toBe('19 h 30');
    expect(formatHour(new Date('2026-11-19T18:00:00Z'), TZ)).toBe('19 h');
    expect(formatLongDay(new Date('2026-11-26T10:00:00Z'), TZ)).toBe('jeudi 26 novembre');
    expect(zonedToUtc(2026, 11, 19, 8, 0, TZ).toISOString()).toBe('2026-11-19T07:00:00.000Z');
    expect(zonedToUtc(2026, 7, 1, 8, 0, TZ).toISOString()).toBe('2026-07-01T06:00:00.000Z');
  });
  it('heures calmes 23 h–8 h : rappel avancé à 22 h 30, sinon reporté à 8 h', () => {
    const night = new Date('2026-11-20T01:30:00Z'); // 2 h 30 locale
    expect(inQuietHours(night, TZ, T)).toBe(true);
    expect(inQuietHours(new Date('2026-11-19T21:59:00Z'), TZ, T)).toBe(false); // 22 h 59
    expect(quietEndAfter(night, TZ, T).toISOString()).toBe('2026-11-20T07:00:00.000Z');
    expect(placeOutsideQuiet(night, TZ, T, { advanceable: true, notBefore: new Date('2026-11-19T10:00:00Z') }).toISOString()).toBe('2026-11-19T21:30:00.000Z');
    // L'avance est déjà passée : report au matin.
    expect(placeOutsideQuiet(night, TZ, T, { advanceable: true, notBefore: new Date('2026-11-19T23:00:00Z') }).toISOString()).toBe('2026-11-20T07:00:00.000Z');
    expect(placeOutsideQuiet(night, TZ, T, { advanceable: false, notBefore: new Date('2026-11-19T10:00:00Z') }).toISOString()).toBe('2026-11-20T07:00:00.000Z');
    const day = new Date('2026-11-19T12:00:00Z');
    expect(placeOutsideQuiet(day, TZ, T, { advanceable: true, notBefore: day })).toEqual(day);
  });
});

describe('politique de rythme', () => {
  const now = new Date('2026-11-19T12:00:00Z');
  const night = new Date('2026-11-19T23:30:00Z');
  const base = { now, expiresAt: null, relevance: yes, tuning: T };
  it('sécurité : envoyée la nuit, en pause, au-delà du plafond, catégorie coupée', () => {
    expect(decide('safety.alert_sent', { ...base, now: night, state: state({ paused: true, sentToday: 99, disabled: new Set(['SAFETY']) }) })).toEqual({ action: 'SEND' });
  });
  it('pause : tout est supprimé sauf transactionnels et sécurité', () => {
    expect(decide('outing.formed', { ...base, state: state({ paused: true }) })).toEqual({ action: 'SUPPRESS', reason: 'PAUSED' });
    expect(decide('message.human', { ...base, state: state({ paused: true }) })).toEqual({ action: 'SUPPRESS', reason: 'PAUSED' });
    expect(decide('outing.checkin_open', { ...base, state: state({ paused: true }) })).toEqual({ action: 'SEND' });
  });
  it('préférences : catégorie coupée → supprimée (transactionnel excepté)', () => {
    expect(decide('duo.matched', { ...base, state: state({ disabled: new Set(['DUO']) }) })).toEqual({ action: 'SUPPRESS', reason: 'PREFERENCE' });
    expect(decide('outing.cancelled', { ...base, state: state({ disabled: new Set(['OUTING']) }) })).toEqual({ action: 'SEND' });
  });
  it('heures calmes : différée au matin, ou supprimée si elle serait échue', () => {
    expect(decide('message.human', { ...base, now: night, state: state() })).toEqual({ action: 'DEFER', until: new Date('2026-11-20T07:00:00Z') });
    expect(decide('outing.checkin_open', { ...base, now: night, expiresAt: new Date('2026-11-20T00:30:00Z'), state: state() })).toEqual({ action: 'SUPPRESS', reason: 'QUIET_HOURS' });
  });
  it('plafond : 3 par jour, 4 le jour d\'une sortie ; un transactionnel passe jusqu\'à 4', () => {
    expect(decide('message.human', { ...base, state: state({ sentToday: 3 }) })).toEqual({ action: 'SUPPRESS', reason: 'DAILY_CAP' });
    expect(decide('message.human', { ...base, state: state({ sentToday: 3, outingToday: true }) })).toEqual({ action: 'SEND' });
    expect(decide('outing.cancelled', { ...base, state: state({ sentToday: 3 }) })).toEqual({ action: 'SEND' });
    expect(decide('outing.cancelled', { ...base, state: state({ sentToday: 4 }) })).toEqual({ action: 'SUPPRESS', reason: 'DAILY_CAP' });
  });
  it('échue, non pertinente, en modération, sans appareil', () => {
    expect(decide('outing.faces', { ...base, expiresAt: new Date(now.getTime() - 1), state: state() })).toEqual({ action: 'SUPPRESS', reason: 'EXPIRED' });
    expect(decide('outing.faces', { ...base, relevance: { relevant: false }, state: state() })).toEqual({ action: 'SUPPRESS', reason: 'NOT_RELEVANT' });
    const retryAt = new Date(now.getTime() + 60_000);
    expect(decide('message.human', { ...base, relevance: { relevant: false, retryAt }, state: state() })).toEqual({ action: 'DEFER', until: retryAt });
    expect(decide('outing.formed', { ...base, state: state({ hasDevice: false }) })).toEqual({ action: 'SUPPRESS', reason: 'NO_DEVICE' });
  });
});

describe('adaptateurs d\'envoi', () => {
  const msg = (to: string): PushMessage => ({ to, userId: NID, ttlSeconds: 60, push: renderPush('votes.opened', { notificationId: NID, vars: {}, discreet: false, route: '/outings/x' }) });
  it('sélection : sans jeton d\'accès, boîte locale hors prod, désactivé en prod ; Expo avec jeton', () => {
    expect(selectPushSender(readPushConfig({}, false), clock, silentLogger)).toBeInstanceOf(LocalInboxPushSender);
    expect(selectPushSender(readPushConfig({}, true), clock, silentLogger)).toBeInstanceOf(DisabledPushSender);
    expect(selectPushSender(readPushConfig({ EXPO_ACCESS_TOKEN: 'expo-test-token' }, true), clock, silentLogger)).toBeInstanceOf(ExpoPushSender);
    expect(readPushConfig({ NOTIFICATIONS_LOCAL_INBOX_FILE: '/tmp/x.jsonl' }, true).localInboxFile).toBeNull();
  });
  it('désactivé : rien ne part (échec permanent)', async () => {
    expect(await new DisabledPushSender().send([msg('ExponentPushToken[aaaaaaaaaa]')])).toEqual([{ ok: false, permanent: true, deviceGone: false }]);
  });
  it('boîte locale : lisible par personne', async () => {
    const s = new LocalInboxPushSender(clock, null);
    await s.send([msg('ExponentPushToken[aaaaaaaaaa]')]);
    expect(await s.inbox(NID)).toEqual([expect.objectContaining({ title: 'Blowy', channelId: 'default' })]);
    expect(await s.inbox('0190f000-0000-7000-8000-000000000002')).toEqual([]);
  });
  it('Expo : lot POST, Bearer, tickets ok / DeviceNotRegistered / 5xx réessayable', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const orig = globalThis.fetch;
    let mode: 'ok' | '500' = 'ok';
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (mode === '500') return new Response('oops', { status: 503 });
      return new Response(JSON.stringify({ data: [{ status: 'ok', id: 't1' }, { status: 'error', message: 'x', details: { error: 'DeviceNotRegistered' } }] }), { status: 200 });
    }) as typeof fetch;
    try {
      const s = new ExpoPushSender('expo-test-token', silentLogger, 'https://push.test');
      const r = await s.send([msg('ExponentPushToken[aaaaaaaaaa]'), msg('ExponentPushToken[bbbbbbbbbb]')]);
      expect(r).toEqual([{ ok: true }, { ok: false, permanent: true, deviceGone: true }]);
      expect(calls[0]!.url).toBe('https://push.test/--/api/v2/push/send');
      expect((calls[0]!.init.headers as Record<string, string>).authorization).toBe('Bearer expo-test-token');
      const body = JSON.parse(String(calls[0]!.init.body));
      expect(body[0]).toMatchObject({ to: 'ExponentPushToken[aaaaaaaaaa]', title: 'Blowy', channelId: 'default', priority: 'default' });
      mode = '500';
      expect(await s.send([msg('ExponentPushToken[aaaaaaaaaa]')])).toEqual([{ ok: false, permanent: false, deviceGone: false }]);
    } finally {
      globalThis.fetch = orig;
    }
  });
});
