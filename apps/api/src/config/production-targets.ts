/**
 * Ce qui désigne la production (docs/ENVIRONNEMENTS.md) : son projet Supabase et ses adresses publiques. Lu par la
 * validation de la configuration (une API `staging` refuse d'y pointer) et par les garde-fous du semis.
 * Les adresses du dev (dev.minimoa.app, api-dev.minimoa.app, admin-dev.minimoa.app) n'en sont pas.
 */

/** Projet Supabase de production. */
export const PRODUCTION_SUPABASE_REF = 'sqxebllmatfflopqddaw';
/** Domaine de la production. */
export const PRODUCTION_DOMAIN = 'minimoa.app';
/** Hôtes de la production : site, www, API, administration. */
export const PRODUCTION_HOSTS: readonly string[] = ['minimoa.app', 'www.minimoa.app', 'api.minimoa.app', 'admin.minimoa.app'];

export const isProductionHost = (host: string): boolean => PRODUCTION_HOSTS.includes(host.trim().toLowerCase().replace(/\.$/, ''));

/** Hôtes d'une valeur qui contient une ou plusieurs adresses (séparées par des virgules, espaces ou points-virgules). */
export function hostsOf(value: string): string[] {
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

/** Référence de projet inscrite dans une clé Supabase au format JWT (clés « anon » et « service_role » historiques). */
export function jwtRef(key: string): string | null {
  const parts = key.split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) as { ref?: unknown };
    return typeof payload.ref === 'string' ? payload.ref : null;
  } catch {
    return null;
  }
}

/** La valeur désigne-t-elle le projet Supabase de production (adresse, hôte de base, clé JWT) ? */
export const namesProductionSupabase = (raw: string): boolean => raw.toLowerCase().includes(PRODUCTION_SUPABASE_REF) || jwtRef(raw) === PRODUCTION_SUPABASE_REF;
