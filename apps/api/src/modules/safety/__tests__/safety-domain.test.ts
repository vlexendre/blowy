/**
 * Règles pures du module safety : fenêtre du lien, projecteur de la page du proche (table « qui voit
 * quoi », §3.2 + V5.3 A.4 : jamais de position), purge de position, signal d'abus ; VAPID (JWT ES256
 * vérifiable avec la clé publique) ; filigrane (octets modifiés, sans métadonnée).
 */
import { generateKeyPairSync, verify } from 'node:crypto';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { DEFAULT_TUNING } from '@blowy/tuning';
import { GuardianPageViewSchema } from '@blowy/api-contract';
import { guardianWindow, inWindow, linkServable, positionPurgeDue, projectGuardianPage, removalAbuse, type AlertFacts, type SubjectFacts } from '../domain/guardian.js';
import { vapidAuthorization, vapidKey } from '../infrastructure/web-push.sender.js';
import { SharpWatermarker } from '../../media/infrastructure/sharp-image.processor.js';

const t = DEFAULT_TUNING.safety;
const H = 3_600_000;
const startsAt = new Date('2026-11-19T18:30:00Z');
const subject: SubjectFacts = {
  kind: 'OUTING',
  id: '00000000-0000-7000-8000-000000000001',
  ownerUserId: 'u1',
  ownerFirstName: 'Léa',
  confirmed: true,
  cancelled: false,
  startsAt,
  endsAt: new Date(startsAt.getTime() + 2 * H),
  venueRevealAt: new Date('2026-11-18T17:00:00Z'),
  venue: { name: 'Café des Oiseaux', address: '12 rue Oberkampf, 75011 Paris' },
  checkedInAt: new Date(startsAt.getTime() + 4 * 60_000),
};
const w = guardianWindow(subject, t);
const link = { ...w, revokedAt: null };
const alert = (o: Partial<AlertFacts> = {}): AlertFacts => ({ id: 'a1', status: 'OPEN', createdAt: new Date(startsAt.getTime() + 90 * 60_000), resolvedAt: null, position: { lat: 48.8, lng: 2.3, accuracyM: 10 }, ...o });
const page = (now: Date, extra: Partial<Parameters<typeof projectGuardianPage>[0]> = {}) => GuardianPageViewSchema.parse(projectGuardianPage({ link, subject, oks: [], alerts: [], now, ...extra }));

describe('fenêtre du lien gardien', () => {
  it('active de startsAt − 2 h à endsAt + 3 h (≤ 18 h, contrainte SQL)', () => {
    expect(w.activeFrom.toISOString()).toBe('2026-11-19T16:30:00.000Z');
    expect(w.expiresAt.toISOString()).toBe('2026-11-19T23:30:00.000Z');
    expect(w.expiresAt.getTime() - w.activeFrom.getTime()).toBeLessThanOrEqual(18 * H);
    expect(inWindow(w, new Date('2026-11-19T16:29:59Z'))).toBe(false);
    expect(inWindow(w, new Date('2026-11-19T16:30:00Z'))).toBe(true);
    expect(inWindow(w, w.expiresAt)).toBe(false);
  });
  it('servable : ni révoqué, ni expiré, sujet non annulé', () => {
    const now = new Date('2026-11-19T19:00:00Z');
    expect(linkServable(link, subject, now)).toBe(true);
    expect(linkServable({ ...link, revokedAt: now }, subject, now)).toBe(false);
    expect(linkServable(link, { ...subject, cancelled: true }, now)).toBe(false);
    expect(linkServable(link, null, now)).toBe(false);
    expect(linkServable(link, subject, w.expiresAt)).toBe(false);
  });
});

describe('page du proche (projecteur)', () => {
  it('avant le verrouillage : rendez-vous seulement (ni lieu, ni chronologie)', () => {
    const v = page(new Date('2026-11-18T10:00:00Z'));
    expect(v).toMatchObject({ ownerFirstName: 'Léa', active: false, timeline: [] });
    expect(v.venue).toBeUndefined();
  });
  it('une demande d\'aide n\'est jamais masquée par l\'horaire (même avant la fenêtre)', () => {
    const now = new Date('2026-11-18T20:00:00Z');
    const v = page(now, { alerts: [alert({ createdAt: new Date('2026-11-18T19:58:00Z') })] });
    expect(v.alert).toEqual({ at: '2026-11-18T19:58:00.000Z' });
    expect(v.timeline).toEqual([{ type: 'ALERT', at: '2026-11-18T19:58:00.000Z' }]);
  });
  it('après le verrouillage, avant la fenêtre : lieu, toujours aucune chronologie', () => {
    const v = page(new Date('2026-11-18T18:00:00Z'), { oks: [new Date('2026-11-18T17:30:00Z')] });
    expect(v.venue?.name).toBe('Café des Oiseaux');
    expect(v.timeline).toEqual([]);
  });
  it('pendant : arrivé·e, tout va bien, alerte SANS position (V5.3 A.4), terminé', () => {
    const v = page(new Date(subject.endsAt.getTime() + 10 * 60_000), { oks: [new Date(startsAt.getTime() + 30 * 60_000)], alerts: [alert()] });
    expect(v.timeline.map((e) => e.type)).toEqual(['CHECKED_IN', 'OK', 'ALERT', 'ENDED']);
    expect(v.alert).toEqual({ at: alert().createdAt.toISOString() });
    expect(JSON.stringify(v)).not.toMatch(/lat|lng|accuracy|position/);
  });
  it('alerte résolue : plus d\'alerte ouverte ; départ « mal à l\'aise » choisi → terminé à l\'heure du départ', () => {
    const left = new Date(startsAt.getTime() + 95 * 60_000);
    const v = page(new Date(startsAt.getTime() + 100 * 60_000), { alerts: [alert({ status: 'SAFE' })], subject: { ...subject, leftAt: left } });
    expect(v.alert).toBeUndefined();
    expect(v.timeline.at(-1)).toEqual({ type: 'ENDED', at: left.toISOString() });
  });
  it('aucun champ hors contrat (strict) : pas d\'autre participant, pas de fiabilité', () => {
    const v = page(new Date(startsAt.getTime() + 60 * 60_000));
    expect(Object.keys(v).sort()).toEqual(['active', 'emergencyNumbers', 'endsAt', 'expiresAt', 'kind', 'ownerFirstName', 'startsAt', 'timeline', 'venue']);
  });
});

describe('rétention et abus', () => {
  const now = new Date('2026-11-23T00:00:00Z');
  it('position : purgée à échéance, retenue tant que le dossier est ouvert', () => {
    expect(positionPurgeDue({ positionPurgeAfter: new Date('2026-11-22T00:00:00Z'), positionPurgedAt: null, caseOpen: false }, now)).toBe(true);
    expect(positionPurgeDue({ positionPurgeAfter: new Date('2026-11-22T00:00:00Z'), positionPurgedAt: null, caseOpen: true }, now)).toBe(false);
    expect(positionPurgeDue({ positionPurgeAfter: new Date('2026-11-24T00:00:00Z'), positionPurgedAt: null, caseOpen: false }, now)).toBe(false);
  });
  it('signal staff à partir de [T] safety.removalAbuseThreshold retraits', () => {
    expect(removalAbuse(t.removalAbuseThreshold - 1, t)).toBe(false);
    expect(removalAbuse(t.removalAbuseThreshold, t)).toBe(true);
  });
});

describe('Web Push VAPID (sans contenu)', () => {
  it('JWT ES256 vérifiable avec la clé publique, audience = origine de l\'endpoint', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const jwk = privateKey.export({ format: 'jwk' }) as { d: string; x: string; y: string };
    const pub = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')]).toString('base64url');
    const header = vapidAuthorization('https://fcm.googleapis.com/fcm/send/abc', vapidKey(pub, jwk.d), pub, 'mailto:securite@blowy.app', 1_800_000_000);
    const m = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(header)!;
    expect(m[4]).toBe(pub);
    expect(JSON.parse(Buffer.from(m[2]!, 'base64url').toString())).toEqual({ aud: 'https://fcm.googleapis.com', exp: 1_800_000_000 + 12 * 3600, sub: 'mailto:securite@blowy.app' });
    expect(verify('sha256', Buffer.from(`${m[1]}.${m[2]}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(m[3]!, 'base64url'))).toBe(true);
  });
});

describe('filigrane du regardeur', () => {
  it('ré-encode en JPEG sans EXIF, octets différents', async () => {
    const src = await sharp({ create: { width: 320, height: 320, channels: 3, background: '#77aa99' } }).withMetadata({ exif: { IFD0: { Copyright: 'x' } } }).jpeg().toBuffer();
    const out = await new SharpWatermarker().apply(new Uint8Array(src), 'Léa <script>');
    expect(out.contentType).toBe('image/jpeg');
    expect(Buffer.compare(Buffer.from(out.bytes), src)).not.toBe(0);
    const meta = await sharp(Buffer.from(out.bytes)).metadata();
    expect(meta.exif).toBeUndefined();
    expect(meta.width).toBe(320);
  });
});
