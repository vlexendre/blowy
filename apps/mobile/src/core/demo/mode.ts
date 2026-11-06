/**
 * Mode démo LOCAL (banc visuel `pnpm qa:visual`, revue de maquettes) : `?demo=<scénario>` sur
 * l'export web. Les requêtes HTTP sont servies par des fixtures conformes aux contrats
 * `@blowy/api-contract` (validées par les mêmes schémas Zod que l'API réelle), l'horloge est figée
 * à l'instant de la maquette. Refusé hors `EXPO_PUBLIC_BLOWY_ENV=local` : jamais en staging ni en
 * production (aucun adaptateur factice actif en production, AGENTS.md).
 */
export interface DemoRequest {
  scenario: string;
}

export function readDemoRequest(
  blowyEnv: string,
  search: string | undefined | null,
): DemoRequest | null {
  if (blowyEnv !== 'local' || !search) return null;
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const scenario = q.get('demo');
  return scenario && /^[a-z0-9-]{1,48}$/.test(scenario) ? { scenario } : null;
}

/** Recherche de l'URL au démarrage (web seulement ; le natif n'active jamais le mode démo). */
export function launchSearch(): string | null {
  const loc = (globalThis as { location?: { search?: string } }).location;
  return typeof loc?.search === 'string' ? loc.search : null;
}
