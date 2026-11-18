/**
 * Garde-fous du semis d'un environnement de test (docs/SEED-TEST.md). Pur : lit une copie de l'environnement et rend
 * les raisons de refus, en français. Aucune option ne les contourne (pas de `--force`) : le semis ne doit jamais
 * pouvoir toucher la production, où de faux comptes présentés comme vrais tromperaient les gens.
 */
import { PRODUCTION_SUPABASE_REF, hostsOf, isProductionHost, namesProductionSupabase } from '../../config/production-targets';

export { PRODUCTION_DOMAIN, PRODUCTION_HOSTS, PRODUCTION_SUPABASE_REF } from '../../config/production-targets';

/** Domaine réservé (RFC 2606 : `.invalid` n'existe jamais) : toute adresse du semis en est. */
export const SEED_DOMAIN = 'seed.minimoa.invalid';
/** Identifiants du semis : préfixe reconnaissable (comptes, inscriptions de quartier), même une fois l'adresse effacée. */
export const SEED_ID_PREFIX = '5eed5eed-';
/** Monde des comptes du semis (`profiles.review_world`) : `Audience` ne les montre qu'à ce monde. */
export const SEED_WORLD_ID = '5eed5eed-0000-4000-8000-000000000000';
export const SEED_WORLD_EMAIL = `monde@${SEED_DOMAIN}`;
/** Date de création posée sur un quartier créé par le semis (reconnu à la purge). */
export const SEED_ZONE_CREATED_AT = '2000-01-01T00:00:00.000Z';
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

/**
 * Garde-fous qui se lisent dans la configuration (1 à 3). Le quatrième (la base contient-elle déjà de vrais comptes ?)
 * demande la base : `Seeder` le vérifie juste après.
 * 1. `BLOWY_ENV` vaut `local`, `test` ou `staging` (obligatoire avec Supabase ; absent en mémoire : `local`) ;
 * 2. aucune variable ne désigne le projet Supabase de production (adresse, hôte de base, clé) ;
 * 3. aucune adresse configurée ne pointe vers un hôte de la production (`minimoa.app`, `www.`, `api.`, `admin.`) ;
 *    celles du dev (`dev.minimoa.app`, `api-dev.minimoa.app`, `admin-dev.minimoa.app`) sont permises.
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
    if (namesProductionSupabase(raw)) {
      reasons.push(`${key} désigne le projet Supabase de production (${PRODUCTION_SUPABASE_REF}) : retire cette variable ou pointe vers un projet de test.`);
      continue;
    }
    const prod = URL_KEY.test(key) ? hostsOf(raw).find(isProductionHost) : undefined;
    if (prod) {
      reasons.push(`${key} pointe vers ${prod} (production) : utilise une adresse de test (dev.minimoa.app, api-dev.minimoa.app…) ou locale.`);
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
