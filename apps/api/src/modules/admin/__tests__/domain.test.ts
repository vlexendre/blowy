import { describe, expect, it } from 'vitest';
import { can, ROLE_PERMISSIONS } from '../domain/permissions.js';
import { base32Decode, base32Encode, totpAt, verifyTotp } from '../domain/totp.js';
import { renderPreview, validateContentEntry } from '../domain/content-rules.js';
import { csrfFor, issuePendingToken, verifyCsrf, verifyPendingToken } from '../domain/staff-tokens.js';
import { normalizeWords, issueFormToken, verifyFormToken } from '../../social/domain/anonymous.js';
import { missingForActivation, parseInviteRef, signInvite } from '../../social/domain/referral.js';

describe('permissions staff', () => {
  it('analyst ne lit ni messages ni selfies ; finance ne lit pas le chat ; support ne sanctionne pas', () => {
    for (const p of ['moderation.context', 'verification.read', 'users.read', 'economy.read'] as const) expect(can(['analyst'], p)).toBe(false);
    expect(can(['finance'], 'moderation.context')).toBe(false);
    expect(can(['finance'], 'economy.correct')).toBe(true);
    for (const p of ['users.warn', 'users.suspend', 'users.ban', 'moderation.decide'] as const) expect(can(['support'], p)).toBe(false);
    expect(can(['moderator'], 'users.ban')).toBe(false);
    expect(can(['trust_lead'], 'users.ban')).toBe(true);
    // Aucune permission « vote » ni « imposer relation » n'existe.
    expect(Object.values(ROLE_PERMISSIONS).flat().some((p) => /vote|ballot|force/.test(p))).toBe(false);
  });
});

describe('TOTP RFC 6238', () => {
  it('vecteur de test RFC (SHA-1, T=59 s → 94287082 tronqué à 6 chiffres = 287082)', () => {
    const secret = Buffer.from('12345678901234567890');
    expect(totpAt(secret, 1)).toBe('287082');
    expect(base32Decode(base32Encode(secret)).equals(secret)).toBe(true);
    expect(verifyTotp(secret, '287082', new Date(59_000))).toBe(1);
    expect(verifyTotp(secret, '287082', new Date(59_000 + 120_000))).toBeNull();
  });
});

describe('jetons staff', () => {
  it('pending signé et expirant ; CSRF lié à la session', () => {
    const now = new Date('2026-11-02T10:00:00Z');
    const p = issuePendingToken('s'.repeat(40), 'u1', 'n1', now);
    expect(verifyPendingToken('s'.repeat(40), p.token, now)?.userId).toBe('u1');
    expect(verifyPendingToken('t'.repeat(40), p.token, now)).toBeNull();
    expect(verifyPendingToken('s'.repeat(40), p.token, new Date(now.getTime() + 6 * 60_000))).toBeNull();
    expect(verifyCsrf('k'.repeat(40), 'sess', csrfFor('k'.repeat(40), 'sess'))).toBe(true);
    expect(verifyCsrf('k'.repeat(40), 'other', csrfFor('k'.repeat(40), 'sess'))).toBe(false);
  });
});

describe('contenus', () => {
  it('variables allowlistées, aucune balise, aucune clé nouvelle', () => {
    expect(validateContentEntry('notif.message', 'Nouveau message de {autrePet}', 'Message de {autrePet} !')).toEqual([]);
    expect(validateContentEntry('notif.message', 'Nouveau message de {autrePet}', '<script>x</script>')).not.toEqual([]);
    expect(validateContentEntry('notif.message', 'Nouveau message de {autrePet}', 'Salut {email}')).not.toEqual([]);
    expect(validateContentEntry('cle.inexistante', undefined, 'texte')).not.toEqual([]);
    expect(renderPreview('{pet} attend {autrePet}')).toBe('Nino attend Suzie');
  });
});

describe('mots anonymes et parrainage', () => {
  it('bornes 1–3 parmi les 12, ordre canonique', () => {
    expect(normalizeWords(['SOLAIRE', 'DROLE'])).toEqual(['DROLE', 'SOLAIRE']);
    expect(() => normalizeWords(['SUPER'])).toThrow();
    expect(() => normalizeWords(['DROLE', 'LOYAL', 'SOLAIRE', 'FIABLE'])).toThrow();
    expect(() => normalizeWords([])).toThrow();
  });
  it('jeton de formulaire signé et expirant', () => {
    const now = new Date('2026-11-02T10:00:00Z');
    const f = issueFormToken('x'.repeat(40), 'target', 'nonce', now);
    expect(verifyFormToken('x'.repeat(40), f.token, now)).toEqual({ targetUserId: 'target', nonce: 'nonce' });
    expect(verifyFormToken('x'.repeat(40), f.token, new Date(now.getTime() + 31 * 60_000))).toBeNull();
  });
  it('lien d’invitation signé ; activation exige une vérification réelle hors démo', () => {
    const t = signInvite('y'.repeat(40), 'ABCDEFGH', new Date('2026-12-01T00:00:00Z'));
    expect(parseInviteRef('y'.repeat(40), t)).toMatchObject({ kind: 'TOKEN', code: 'ABCDEFGH' });
    expect(parseInviteRef('z'.repeat(40), t)).toEqual({ kind: 'INVALID', reason: 'INVALID_SIGNATURE' });
    expect(parseInviteRef('y'.repeat(40), 'abcdefgh')).toEqual({ kind: 'CODE', code: 'ABCDEFGH' });
    const facts = { accountActive: true, adult: true, hasPrimaryPet: true, verifications: [{ provenance: 'LOCAL_DEMO' as const, status: 'VERIFIED' }], hasFirstAction: true };
    expect(missingForActivation(facts, false)).toEqual(['VERIFICATION']);
    expect(missingForActivation(facts, true)).toEqual([]);
  });
});
