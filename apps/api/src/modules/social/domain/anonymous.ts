/**
 * Réponses anonymes « Décris-moi en 3 mots » (§15, P-5.18) — règles pures.
 *  - 1 à 3 mots distincts parmi les 12 validés ; aucun texte libre ;
 *  - jeton de formulaire signé (cible + nonce + échéance), consommé une seule fois (anti-rejeu) ;
 *  - un visiteur ne répond qu'une fois par cible (HMAC du jeton visiteur, jamais l'IP) ;
 *  - quotas par cible/jour et par visiteur/jour ; réputation non farmable : un visiteur compte
 *    pour UN répondant, quel que soit le nombre de rechargements.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ANONYMOUS_WORDS, type AnonymousWord } from '@blowy/domain';

export const FORM_TOKEN_TTL_MS = 30 * 60_000;
/** Quotas initiaux (P-5.20 : paramètres produit, à verser au tuning par B — handoff F). */
export const ANONYMOUS_LIMITS = {
  perTargetPerDay: 50,
  perVisitorPerDay: 10,
  /** Jetons de formulaire émis par visiteur/heure (throttling de la page). */
  formTokensPerVisitorPerHour: 30,
} as const;

const sign = (secret: string, body: string) => createHmac('sha256', secret).update(`anon-form:${body}`).digest('base64url');
const eq = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function issueFormToken(secret: string, targetUserId: string, nonce: string, now: Date): { token: string; expiresAt: Date; nonce: string } {
  const expiresAt = new Date(now.getTime() + FORM_TOKEN_TTL_MS);
  const body = `${targetUserId}.${nonce}.${expiresAt.getTime()}`;
  return { token: `f1.${Buffer.from(body).toString('base64url')}.${sign(secret, body)}`, expiresAt, nonce };
}

export function verifyFormToken(secret: string, token: string, now: Date): { targetUserId: string; nonce: string } | null {
  const [v, b, s] = token.split('.');
  if (v !== 'f1' || !b || !s) return null;
  const body = Buffer.from(b, 'base64url').toString('utf8');
  if (!eq(sign(secret, body), s)) return null;
  const [targetUserId, nonce, exp] = body.split('.');
  if (!targetUserId || !nonce || !exp || Number(exp) <= now.getTime()) return null;
  return { targetUserId, nonce };
}

/** Empreinte visiteur : HMAC (secret serveur, cible) — non réversible, non corrélable entre cibles. */
export function visitorHash(secret: string, visitorToken: string, targetUserId: string): string {
  return createHmac('sha256', secret).update(`anon-visitor:${targetUserId}:${visitorToken}`).digest('hex');
}

/** Empreinte globale (quota visiteur toutes cibles) : distincte de la précédente. */
export function visitorQuotaKey(secret: string, visitorToken: string): string {
  return createHmac('sha256', secret).update(`anon-quota:${visitorToken}`).digest('hex').slice(0, 32);
}

const WORDS = new Set<string>(ANONYMOUS_WORDS);
export function normalizeWords(words: readonly string[]): AnonymousWord[] {
  const uniq = [...new Set(words)];
  if (uniq.length < 1 || uniq.length > 3 || uniq.length !== words.length) throw new Error('WORDS_COUNT');
  if (!uniq.every((w) => WORDS.has(w))) throw new Error('WORDS_UNKNOWN');
  // Ordre canonique du référentiel (aucune information sur l'ordre de clic).
  return ANONYMOUS_WORDS.filter((w) => uniq.includes(w));
}

/** Agrégat de réputation recalculé depuis les réponses visibles (pas d'incrément cumulatif farmable). */
export function aggregateWords(responses: readonly { words: readonly string[] }[]): { wordCounts: Record<string, number>; respondents: number; totalWords: number } {
  const wordCounts: Record<string, number> = {};
  let totalWords = 0;
  for (const r of responses) for (const w of r.words) {
    wordCounts[w] = (wordCounts[w] ?? 0) + 1;
    totalWords++;
  }
  return { wordCounts, respondents: responses.length, totalWords };
}

/**
 * Candidat de slug public pour la page « 3 mots » — V5.2 (D.13) : ALÉATOIRE, jamais le prénom
 * (ex. `blowy.app/m/k7f2qx`). Base36 non devinable, ne révèle aucun identifiant interne ; respecte
 * `PublicSlugSchema`. `displayName` n'est plus utilisé (signature conservée pour les appelants).
 */
export function publicSlugCandidate(_displayName: string, randomHex: string): string {
  const n = BigInt(`0x${randomHex || '0'}`).toString(36).padStart(8, '0').slice(-8);
  // Toujours une lettre en tête (jamais un segment purement numérique).
  return `m${n}`;
}
