/**
 * Parrainage (P-5.9) — règles pures.
 *  - lien : jeton signé `i1.<code>.<exp>.<sig>` (HMAC) + code court de repli (même code) ;
 *  - claim : uniquement par un compte authentifié, une seule fois par filleul (UNIQUE refereeUserId),
 *    jamais par le parrain lui-même, jamais par un compte plus ancien que le lien (pas d'attribution
 *    rétroactive d'un utilisateur existant) ;
 *  - activation admissible : compte éligible (actif, 18+), pet principal, vérification RÉELLE
 *    (provenance PROVIDER ou STAFF ; LOCAL_DEMO admis seulement hors production = fixture
 *    explicite), première action valide (soin, jeu, message publié…) ;
 *  - récompense : événement `referral.activated`, crédité par economy (ledger, une fois).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const sign = (secret: string, body: string) => createHmac('sha256', secret).update(`invite:${body}`).digest('base64url').slice(0, 22);
const eq = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;

export function signInvite(secret: string, code: string, expiresAt: Date): string {
  const body = `${code}.${Math.floor(expiresAt.getTime() / 1000)}`;
  return `i1.${body}.${sign(secret, body)}`;
}

export type InviteRef = { kind: 'TOKEN'; code: string; expiresAt: Date } | { kind: 'CODE'; code: string } | { kind: 'INVALID'; reason: 'INVALID_SIGNATURE' | 'UNKNOWN' };

/** Interprète `ref` = jeton signé OU code court. La signature est vérifiée avant toute lecture en base. */
export function parseInviteRef(secret: string, ref: string): InviteRef {
  if (ref.startsWith('i1.')) {
    const [, code, exp, sig] = ref.split('.');
    if (!code || !exp || !sig || !CODE_RE.test(code) || !/^\d+$/.test(exp)) return { kind: 'INVALID', reason: 'UNKNOWN' };
    if (!eq(sign(secret, `${code}.${exp}`), sig)) return { kind: 'INVALID', reason: 'INVALID_SIGNATURE' };
    return { kind: 'TOKEN', code, expiresAt: new Date(Number(exp) * 1000) };
  }
  const code = ref.toUpperCase();
  return CODE_RE.test(code) ? { kind: 'CODE', code } : { kind: 'INVALID', reason: 'UNKNOWN' };
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function codeFromHex(hex: string): string {
  let out = '';
  for (let i = 0; i < 8; i++) out += ALPHABET[parseInt(hex.slice(i * 2, i * 2 + 2), 16) % ALPHABET.length];
  return out;
}

export type ActivationRequirement = 'ACCOUNT_ELIGIBLE' | 'PRIMARY_PET' | 'VERIFICATION' | 'FIRST_ACTION';

export interface ActivationFacts {
  accountActive: boolean;
  adult: boolean;
  hasPrimaryPet: boolean;
  verifications: { provenance: 'PROVIDER' | 'STAFF' | 'LOCAL_DEMO'; status: string }[];
  hasFirstAction: boolean;
}

export function missingForActivation(f: ActivationFacts, allowLocalDemo: boolean): ActivationRequirement[] {
  const missing: ActivationRequirement[] = [];
  if (!f.accountActive || !f.adult) missing.push('ACCOUNT_ELIGIBLE');
  if (!f.hasPrimaryPet) missing.push('PRIMARY_PET');
  const realVerified = f.verifications.some((v) => v.status === 'VERIFIED' && (v.provenance !== 'LOCAL_DEMO' || allowLocalDemo));
  if (!realVerified) missing.push('VERIFICATION');
  if (!f.hasFirstAction) missing.push('FIRST_ACTION');
  return missing;
}
