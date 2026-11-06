/** V5.4 (A.6) — protocole `oprf-p256-v1` : propriétés de l'OPRF (pur, sans base). */
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { blind, blindingScalar, deriveDigestKey, deriveOprfKey, digestOfToken, evaluateBlinded, hashToCurve, tokenForNumber, unblind } from '../domain/contact-avoidance.js';

const k = deriveOprfKey('secret-de-test-0123456789abcdef0123456789');
const dk = deriveDigestKey('secret-de-test-0123456789abcdef0123456789');
const device = (e164: string) => {
  const r = blindingScalar(randomBytes(32));
  const b = blind(e164, r);
  return { b, finish: (evaluated: string) => unblind(evaluated, r) };
};

describe('« éviter les personnes que je connais » — OPRF P-256 (V5.4 A.6)', () => {
  it('le jeton de l’appareil (aveuglé puis désaveuglé) = le jeton calculé par le serveur pour le numéro vérifié', () => {
    for (const n of ['+33612345678', '+33700000001', '+14155550123']) {
      const d = device(n);
      const t = d.finish(evaluateBlinded(k, d.b));
      expect(t).toBe(tokenForNumber(k, n).toString('base64url'));
      expect(digestOfToken(dk, t)).toBe(digestOfToken(dk, tokenForNumber(k, n)));
    }
  });
  it('le serveur ne voit ni le numéro ni H2C(numéro) : deux aveuglements du même numéro diffèrent, sans lien visible', () => {
    const a = device('+33612345678');
    const b = device('+33612345678');
    expect(a.b).not.toBe(b.b);
    expect(a.b).not.toContain('33612345678');
    expect(a.b).not.toBe(hashToCurve('+33612345678').toString('base64url'));
    // Mais le jeton final est le même (comparaison possible côté serveur, sans clair).
    expect(a.finish(evaluateBlinded(k, a.b))).toBe(b.finish(evaluateBlinded(k, b.b)));
  });
  it('numéros différents → jetons différents ; autre clé serveur → autres jetons', () => {
    const t1 = tokenForNumber(k, '+33612345678').toString('base64url');
    const t2 = tokenForNumber(k, '+33612345679').toString('base64url');
    expect(t1).not.toBe(t2);
    expect(tokenForNumber(deriveOprfKey('autre-secret-0123456789abcdef0123456789'), '+33612345678').toString('base64url')).not.toBe(t1);
  });
  it('refuse un point invalide ou un numéro non E.164', () => {
    expect(() => evaluateBlinded(k, Buffer.concat([Buffer.from([2]), Buffer.alloc(32, 0x11)]).toString('base64url'))).toThrow();
    expect(() => evaluateBlinded(k, Buffer.alloc(10).toString('base64url'))).toThrow();
    expect(() => hashToCurve('0612345678')).toThrow();
  });
});
