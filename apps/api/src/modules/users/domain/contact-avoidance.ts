/**
 * V5.4 (A.6, D-049, spec-v5 §4.5) — « éviter les personnes que je connais » : protocole `oprf-p256-v1`.
 *
 * OPRF (fonction pseudo-aléatoire « aveugle ») sur la courbe P-256, coordonnée x seulement :
 *   - `H2C(e164)` : projection d'un numéro E.164 sur la courbe (essai-incrément, point d'ordonnée paire) ;
 *   - appareil : sel aléatoire `r` (par personne et par lot) → `B = r·H2C(e164)` (indistinguable d'un point au hasard) ;
 *   - serveur : `E = x(k·B)` avec la clé secrète `k` (jamais envoyée) ;
 *   - appareil : `T = x(r⁻¹·E) = x(k·H2C(e164))` — jeton du numéro, identique pour tout le monde ;
 *   - serveur : `HMAC(clé, T)` comparé aux numéros VÉRIFIÉS enregistrés (`PhoneIdentity.tokenDigest`).
 * Le serveur ne reçoit jamais un numéro ni un condensé de numéro (seulement `B`, puis `T` qu'il ne peut
 * relier à un numéro qu'en recalculant `k·H2C` pour chaque numéro candidat : coût d'une multiplication de
 * courbe par essai, et `k` reste côté serveur). Rien n'est stocké hormis le condensé du numéro VÉRIFIÉ de la
 * personne elle-même et les paires à éviter.
 *
 * Fonctions PURES (aucune E/S, aucune horloge) ; `blind`/`unblind` sont l'implémentation de référence côté
 * appareil (le mobile utilise la même construction ; ici pour les tests et la documentation).
 */
import { createECDH, createHash, createHmac } from 'node:crypto';

export const CONTACT_PROTOCOL = 'oprf-p256-v1' as const;
const CURVE = 'prime256v1';
/** Ordre du groupe de P-256. */
const N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
const DOMAIN = 'blowy-contact-v1|';

const b64u = (b: Buffer) => b.toString('base64url');
const fromB64u = (s: string) => Buffer.from(s, 'base64url');
const toBuf32 = (v: bigint) => Buffer.from(v.toString(16).padStart(64, '0'), 'hex');
const toBig = (b: Buffer) => BigInt(`0x${b.toString('hex') || '0'}`);

/** Numéro E.164 (`+` puis 8 à 15 chiffres). La normalisation des contacts se fait sur l'appareil. */
export const E164 = /^\+[1-9]\d{7,14}$/;

/** Multiplication scalaire sur P-256, coordonnée x seulement (`point` compressé ou non). Lève si point invalide. */
function mulX(scalar: bigint, point: Buffer): Buffer {
  const e = createECDH(CURVE);
  e.setPrivateKey(toBuf32(scalar));
  return e.computeSecret(point);
}

/** Point compressé d'ordonnée paire depuis une abscisse (on ne garde que x : ±P donnent le même x(k·P)). */
const fromX = (x: Buffer): Buffer => Buffer.concat([Buffer.from([0x02]), x]);

/** `H2C(e164)` : essai-incrément, 1ʳᵉ abscisse valide de SHA-256(DOMAIN ‖ e164 ‖ "|" ‖ i). */
export function hashToCurve(e164: string): Buffer {
  if (!E164.test(e164)) throw new Error('numéro E.164 attendu');
  for (let i = 0; i < 256; i++) {
    const x = createHash('sha256').update(`${DOMAIN}${e164}|${i}`).digest();
    const p = fromX(x);
    try {
      mulX(1n, p); // valide le point (sur la courbe)
      return p;
    } catch {
      /* abscisse hors courbe : essai suivant */
    }
  }
  throw new Error('H2C : aucune abscisse valide');
}

/** Clé OPRF du serveur, dérivée du secret de déploiement (`CONTACT_AVOIDANCE_SECRET`) : 1 ≤ k < n. */
export function deriveOprfKey(secret: string): bigint {
  const h = createHmac('sha256', secret).update('blowy:contact-avoidance:oprf-key:v1').digest();
  return (toBig(h) % (N - 1n)) + 1n;
}

/** Clé du condensé stocké (`PhoneIdentity.tokenDigest`). */
export const deriveDigestKey = (secret: string): Buffer => createHmac('sha256', secret).update('blowy:contact-avoidance:digest-key:v1').digest();

/** Serveur : `x(k·B)` pour un point aveuglé reçu (base64url, 33 octets compressé). Lève si invalide. */
export function evaluateBlinded(k: bigint, blindedB64: string): string {
  const b = fromB64u(blindedB64);
  if (b.length !== 33 || (b[0] !== 0x02 && b[0] !== 0x03)) throw new Error('point compressé attendu');
  return b64u(mulX(k, b));
}

/** Serveur : jeton du numéro VÉRIFIÉ de la personne (le serveur connaît `k` ; le numéro est oublié aussitôt). */
export const tokenForNumber = (k: bigint, e164: string): Buffer => mulX(k, hashToCurve(e164));

/** Condensé stocké d'un jeton (32 octets) : HMAC-SHA256(clé, T), base64url. */
export function digestOfToken(digestKey: Buffer, token: Buffer | string): string {
  const t = typeof token === 'string' ? fromB64u(token) : token;
  if (t.length !== 32) throw new Error('jeton de 32 octets attendu');
  return b64u(createHmac('sha256', digestKey).update(t).digest());
}

// ------------------------------------------------------------------ implémentation de référence (appareil)
/** Inverse modulaire (Euclide étendu). */
function invMod(a: bigint, m: bigint): bigint {
  let [r0, r1] = [((a % m) + m) % m, m];
  let [s0, s1] = [1n, 0n];
  while (r1 !== 0n) {
    const q = r0 / r1;
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
  }
  if (r0 !== 1n) throw new Error('non inversible');
  return ((s0 % m) + m) % m;
}

/** Sel d'aveuglement `r` (1 ≤ r < n) depuis 32 octets aléatoires de l'appareil. */
export const blindingScalar = (random32: Buffer): bigint => (toBig(random32) % (N - 1n)) + 1n;

/** Appareil : `B = r·H2C(e164)` (compressé, base64url). */
export function blind(e164: string, r: bigint): string {
  // x(r·P) puis point compressé d'ordonnée paire (= ±r·P : sans effet sur le jeton final, x seulement).
  const x = mulX(r, hashToCurve(e164));
  return b64u(fromX(x));
}

/** Appareil : `T = x(r⁻¹·E)` (base64url, 32 octets) — le jeton final du contact. */
export function unblind(evaluatedB64: string, r: bigint): string {
  const x = fromB64u(evaluatedB64);
  if (x.length !== 32) throw new Error('abscisse de 32 octets attendue');
  return b64u(mulX(invMod(r, N), fromX(x)));
}
