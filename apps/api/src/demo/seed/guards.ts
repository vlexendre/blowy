/**
 * Garde-fous du semis d'un environnement de test (docs/SEED-TEST.md). Pur : lit une copie de l'environnement et rend
 * les raisons de refus, en français. Aucune option ne les contourne (pas de `--force`) : le semis ne doit jamais
 * pouvoir toucher la production, où de faux comptes présentés comme vrais tromperaient les gens.
 */

/** Domaine réservé (RFC 2606 : `.invalid` n'existe jamais) : toute adresse du semis en est. */
export const SEED_DOMAIN = 'seed.minimoa.invalid';
/** Identifiants du semis : préfixe reconnaissable (comptes, inscriptions de quartier), même une fois l'adresse effacée. */
export const SEED_ID_PREFIX = '5eed5eed-';
/** Monde des comptes du semis (`profiles.review_world`) : `Audience` ne les montre qu'à ce monde. */
export const SEED_WORLD_ID = '5eed5eed-0000-4000-8000-000000000000';
export const SEED_WORLD_EMAIL = `monde@${SEED_DOMAIN}`;
/** Date de création posée sur un quartier créé par le semis (reconnu à la purge). */
export const SEED_ZONE_CREATED_AT = '2000-01-01T00:00:00.000Z';
/** Projet Supabase de production. */
export const PRODUCTION_SUPABASE_REF = 'sqxebllmatfflopqddaw';
/** Domaine de production (et tous ses sous-domaines). */
export const PRODUCTION_DOMAIN = 'minimoa.app';
/** Environnements où le semis peut tourner. */
export const SEED_ENVS = ['local', 'test', 'staging'] as const;
/** Au-delà de ce nombre de comptes qui ressemblent à de vrais comptes, la base n'est pas une base de test : refus. */
export const FOREIGN_ACCOUNT_LIMIT = 20;
/** Adresses des personnes fictives du compte de revue d'Apple (`review/review-auth.ts`). */
const REVIEW_FIXTURE_DOMAIN = 'review.blowy.invalid';

export type SeedTargetMode = 'memory' | 'supabase';
export type EnvSource = Readonly<Record<string, string | undefined>>;

/** Le semis refuse de tourner : chaque raison est une phrase en français. */
export class SeedRefused extends Error {
  constructor(readonly reasons: readonly string[]) {
    super(`Semis refusé :\n${reasons.map((r) => `- ${r}`).join('\n')}`);
    this.name = 'SeedRefused';
  }
}

export const isSeedEmail = (email: string | null | undefined): boolean => !!email && email.trim().toLowerCase().endsWith(`@${SEED_DOMAIN}`);
export const isSeedId = (id: string | null | undefined): boolean => !!id && id.toLowerCase().startsWith(SEED_ID_PREFIX);
export const seedEmail = (slug: string): string => `${slug}@${SEED_DOMAIN}`;

/** Compte « attendu » dans une base de test : semis, personnes fictives de revue, compte de revue configuré. */
export function isExpectedAccount(email: string | null | undefined, reviewEmail: string | null): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  return isSeedEmail(e) || e.endsWith(`@${REVIEW_FIXTURE_DOMAIN}`) || (!!reviewEmail && e === reviewEmail.trim().toLowerCase());
}

const URL_KEY = /(URL|URI|HOST|ORIGIN|ORIGINS|ENDPOINT)$/i;

function hostsOf(value: string): string[] {
  const out: string[] = [];
  for (const part of value.split(/[\s,;]+/)) {
    if (!part) continue;
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(part) ? part : `http://${part}`;
    try {
      out.push(new URL(withScheme).hostname.toLowerCase());
    } catch {
      // pas une adresse : ignorée
    }
  }
  return out;
}

const isProductionHost = (host: string): boolean => host === PRODUCTION_DOMAIN || host.endsWith(`.${PRODUCTION_DOMAIN}`);

/** Référence de projet inscrite dans une clé Supabase au format JWT (clés « anon » et « service_role » historiques). */
function jwtRef(key: string): string | null {
  const parts = key.split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) as { ref?: unknown };
    return typeof payload.ref === 'string' ? payload.ref : null;
  } catch {
    return null;
  }
}

/**
 * Garde-fous qui se lisent dans la configuration (1 à 3). Le quatrième (la base contient-elle déjà de vrais comptes ?)
 * demande la base : `Seeder` le vérifie juste après.
 * 1. `BLOWY_ENV` vaut `local`, `test` ou `staging` (obligatoire avec Supabase ; absent en mémoire : `local`) ;
 * 2. aucune variable ne désigne le projet Supabase de production (adresse, hôte de base, clé) ;
 * 3. aucune adresse configurée ne pointe vers `minimoa.app` ou un de ses sous-domaines.
 */
export function configRefusals(source: EnvSource, mode: SeedTargetMode): string[] {
  const reasons: string[] = [];
  const env = source.BLOWY_ENV?.trim().toLowerCase();
  if (!env) {
    if (mode === 'supabase') reasons.push('BLOWY_ENV manquant : indique local, test ou staging (le semis ne tourne jamais en production).');
  } else if (!(SEED_ENVS as readonly string[]).includes(env)) {
    reasons.push(`BLOWY_ENV=${env} : le semis ne tourne qu’en local, test ou staging, jamais en production.`);
  }
  for (const [key, raw] of Object.entries(source)) {
    if (typeof raw !== 'string' || raw === '') continue;
    const value = raw.toLowerCase();
    if (value.includes(PRODUCTION_SUPABASE_REF) || jwtRef(raw) === PRODUCTION_SUPABASE_REF) {
      reasons.push(`${key} désigne le projet Supabase de production (${PRODUCTION_SUPABASE_REF}) : retire cette variable ou pointe vers un projet de test.`);
      continue;
    }
    if (URL_KEY.test(key) && hostsOf(raw).some(isProductionHost)) {
      reasons.push(`${key} pointe vers ${PRODUCTION_DOMAIN} (production) : utilise une adresse de test ou locale.`);
    }
  }
  return reasons;
}

/** Garde-fou 4 : trop de comptes qui ressemblent à de vrais comptes. */
export function foreignAccountsRefusal(count: number): string | null {
  return count > FOREIGN_ACCOUNT_LIMIT
    ? `La base contient déjà ${count} comptes qui ne viennent ni du semis ni du compte de revue (plus de ${FOREIGN_ACCOUNT_LIMIT}) : elle ressemble à une base réelle. Semis arrêté.`
    : null;
}

/** Lève `SeedRefused` si la configuration est refusée. */
export function assertConfigAllowed(source: EnvSource, mode: SeedTargetMode): void {
  const reasons = configRefusals(source, mode);
  if (reasons.length > 0) throw new SeedRefused(reasons);
}
