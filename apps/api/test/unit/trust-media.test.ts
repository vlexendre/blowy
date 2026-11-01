/** Tests unitaires agent E : adaptateur Veriff (contrat HTTP mocké), ACL médias, sniffing, vérification. */
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { VeriffIdentityProvider, veriffSignature } from '../../src/modules/trust/infrastructure/veriff.provider.js';
import { badgeOf, canApplyVerification, isAdultOn, mapVeriffDecision } from '../../src/modules/trust/domain/verification.js';
import { staffCan } from '../../src/modules/trust/domain/staff.js';
import { decideAccess, sniff, type AccessFacts } from '../../src/modules/media/domain/media-policy.js';

describe('Veriff (contrat, HTTP mocké)', () => {
  it('vecteur de test HMAC de la documentation', () => {
    // Doc Veriff « HMAC authentication » : clé abcdef12-…, charge utile `{"verification":{"callback":"https://veriff.com","person":{"firstName":"John","lastName":"Smith"},"document":{"type":"PASSPORT","country":"EE"},"vendorData":"unique id of the end-user","timestamp":"2016-05-19T08:30:25.597Z"}}`
    const payload = '{"verification":{"callback":"https://veriff.com","person":{"firstName":"John","lastName":"Smith"},"document":{"type":"PASSPORT","country":"EE"},"vendorData":"unique id of the end-user","timestamp":"2016-05-19T08:30:25.597Z"}}';
    expect(veriffSignature('abcdef12-abcd-abcd-abcd-abcdef012345', payload)).toBe('0dcab73ddd20062616d104231c7439657546a5c24e4691977da93bb854c31e25');
  });
  it('création de session : X-AUTH-CLIENT, aucun nom ni date de naissance envoyés', async () => {
    let seen: { url: string; headers: Record<string, string>; body: unknown } | null = null;
    const f = (async (url: string, init: RequestInit) => {
      seen = { url, headers: Object.fromEntries(new Headers(init.headers).entries()), body: JSON.parse(String(init.body)) };
      const text = JSON.stringify({ status: 'success', verification: { id: '11111111-2222-4333-8444-555555555555', url: 'https://magic.veriff.me/v/x' } });
      return new Response(text, { status: 201, headers: { 'x-hmac-signature': createHmac('sha256', 's3cret').update(text).digest('hex') } });
    }) as unknown as typeof fetch;
    const p = new VeriffIdentityProvider({ apiKey: 'pub', sharedSecret: 's3cret', baseUrl: 'https://api.veriff.test/', callbackUrl: 'https://app/cb', environment: 'SANDBOX', fetch: f });
    const r = await p.createSession({ localSessionId: 'local-1' });
    expect(r).toEqual({ providerRef: '11111111-2222-4333-8444-555555555555', sessionUrl: 'https://magic.veriff.me/v/x' });
    expect(seen!.url).toBe('https://api.veriff.test/v1/sessions');
    expect(seen!.headers['x-auth-client']).toBe('pub');
    expect(seen!.body).toEqual({ verification: { callback: 'https://app/cb', vendorData: 'local-1', endUserId: 'local-1' } });
  });
  it('webhook : signature du corps brut, clé API, comparaison insensible à la casse', () => {
    const p = new VeriffIdentityProvider({ apiKey: 'pub', sharedSecret: 's3cret', baseUrl: 'x', callbackUrl: 'y', environment: 'SANDBOX' });
    const body = Buffer.from('{"status":"success"}');
    const sig = createHmac('sha256', 's3cret').update(body).digest('hex');
    expect(p.verifyWebhook(body, { 'x-auth-client': 'pub', 'x-hmac-signature': sig.toUpperCase() })).toBe(true);
    expect(p.verifyWebhook(Buffer.from('{"status": "success"}'), { 'x-auth-client': 'pub', 'x-hmac-signature': sig })).toBe(false);
    expect(p.verifyWebhook(body, { 'x-auth-client': 'other', 'x-hmac-signature': sig })).toBe(false);
    expect(p.parseDecision({ nope: true })).toBeNull();
  });
  it('états : décisions mappées, état final non réversible, badge exact', () => {
    expect(['approved', 'declined', 'resubmission_requested', 'review', 'expired', 'abandoned'].map(mapVeriffDecision)).toEqual(['VERIFIED', 'REJECTED', 'NEEDS_RETRY', 'HUMAN_REVIEW', 'EXPIRED', 'EXPIRED']);
    expect(canApplyVerification('VERIFIED', 'REJECTED')).toBe(false);
    expect(canApplyVerification('PENDING', 'NEEDS_RETRY')).toBe(true);
    expect(badgeOf({ status: 'VERIFIED', kind: 'SELFIE_HUMAN_REVIEW', provenance: 'STAFF' })).toBe('SELFIE_CHECKED');
    expect(badgeOf({ status: 'VERIFIED', kind: 'IDENTITY_AGE', provenance: 'STAFF' })).toBe('SELFIE_CHECKED');
    expect(badgeOf({ status: 'VERIFIED', kind: 'IDENTITY_AGE', provenance: 'PROVIDER' })).toBe('AGE_VERIFIED');
    expect(badgeOf({ status: 'VERIFIED', kind: 'SELFIE_QUALITY', provenance: 'LOCAL_DEMO' })).toBe('DEMO');
    expect(isAdultOn('2008-11-03', '2026-11-02')).toBe(false);
    expect(isAdultOn('2008-11-02', '2026-11-02')).toBe(true);
  });
  it('rôles staff : la protection des mineurs est réservée au trust_lead', () => {
    expect(staffCan(['admin'], 'cases.restricted')).toBe(false);
    expect(staffCan(['support'], 'cases.decide')).toBe(false);
    expect(staffCan(['trust_lead'], 'users.sanction')).toBe(true);
  });
});

describe('médias : type réel et ACL', () => {
  it('sniffing : SVG/HTML actifs détectés, signature prime sur le type déclaré', () => {
    expect(sniff(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBe('image/svg+xml');
    expect(sniff(Buffer.from('   <!DOCTYPE html><html>'))).toBe('image/svg+xml');
    expect(sniff(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniff(Buffer.from('GIF89a'))).toBe('unknown');
  });
  const base = (o: Partial<AccessFacts> = {}): AccessFacts => ({
    viewerId: 'b',
    asset: { ownerUserId: 'a', purpose: 'PROFILE_PHOTO', status: 'READY', restricted: false, visibility: 'PRIVATE', contextId: null },
    variant: 'normalized',
    relation: { id: 'r', status: 'ACTIVE', branch: 'FRIEND', reachedLevel: 4, paused: false, photosAllowedByBoth: true, movedIn: true, participants: ['a', 'b'] },
    blocked: false,
    ownerPhotoPreference: 'FROM_LEVEL_4_WITH_CONSENT',
    revealAccepted: true,
    originalAccepted: false,
    voiceDeliverable: false,
    isCurrentProfilePhoto: true,
    ...o,
  });
  it('Ami N4 + accord : clair ; N3 : rien ; « jamais » et blocage priment ; paiement sans effet', () => {
    expect(decideAccess(base())).toEqual({ allow: true, variant: 'normalized' });
    expect(decideAccess(base({ relation: { ...base().relation!, reachedLevel: 3 } })).allow).toBe(false);
    expect(decideAccess(base({ revealAccepted: false })).allow).toBe(false);
    expect(decideAccess(base({ ownerPhotoPreference: 'NEVER' })).allow).toBe(false);
    expect(decideAccess(base({ blocked: true })).allow).toBe(false);
    expect(decideAccess(base({ isCurrentProfilePhoto: false })).allow).toBe(false);
  });
  it('Plus N4 : flou seulement ; Plus N5 + double accord : original', () => {
    const plus4 = base({ relation: { ...base().relation!, branch: 'PLUS' } });
    expect(decideAccess(plus4)).toEqual({ allow: true, variant: 'blurred' });
    expect(decideAccess({ ...plus4, variant: 'blurred_medium' })).toEqual({ allow: true, variant: 'blurred_medium' });
    const plus5 = base({ relation: { ...base().relation!, branch: 'PLUS', reachedLevel: 5 }, originalAccepted: true });
    expect(decideAccess(plus5)).toEqual({ allow: true, variant: 'normalized' });
    expect(decideAccess({ ...plus5, originalAccepted: false })).toEqual({ allow: true, variant: 'blurred' });
  });
  it('selfie jamais partagé ; preuve privée par défaut ; vocal seulement si livré', () => {
    expect(decideAccess(base({ asset: { ...base().asset, purpose: 'VERIFICATION_SELFIE' }, relation: { ...base().relation!, reachedLevel: 7 } })).allow).toBe(false);
    expect(decideAccess(base({ asset: { ...base().asset, purpose: 'MISSION_PROOF', contextId: 'r' } })).allow).toBe(false);
    expect(decideAccess(base({ asset: { ...base().asset, purpose: 'VOICE_MESSAGE' }, variant: 'audio' })).allow).toBe(false);
    expect(decideAccess(base({ asset: { ...base().asset, purpose: 'VOICE_MESSAGE' }, variant: 'audio', voiceDeliverable: true })).allow).toBe(true);
    expect(decideAccess(base({ asset: { ...base().asset, restricted: true }, viewerId: 'a' })).allow).toBe(false);
  });
});
