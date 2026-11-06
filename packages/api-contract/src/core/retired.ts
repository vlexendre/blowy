/**
 * Routes V4 retirées en V5 : `410 GONE {reason:"RETIRED_IN_V5"}` à partir de T2 (spec-v5 §7.7, D-020, D-034).
 * Motifs `:param` = segments dynamiques. Les routes conservées en lecture seule ne figurent pas ici.
 */
export const RETIRED_V4_ROUTES = [
  { method: 'POST', path: '/v1/pets/:id/actions' },
  { method: 'POST', path: '/v1/pets/:id/move' },
  { method: 'POST', path: '/v1/relationships/:id/move-in' },
  { method: 'POST', path: '/v1/relationships/:id/consents/respond' },
  { method: 'POST', path: '/v1/relationships/:id/branch/ballot' },
  { method: 'POST', path: '/v1/relationships/:id/branch/downgrade' },
  { method: 'POST', path: '/v1/relationships/:id/pause' },
  { method: 'GET', path: '/v1/relationships/:id/photo-reveal' },
  { method: 'POST', path: '/v1/relationships/:id/photo-reveal' },
  { method: 'POST', path: '/v1/streak-freezes/use' },
  { method: 'POST', path: '/v1/catalog/:itemId/purchase' },
  { method: 'GET', path: '/v1/me/anonymous-responses/:id/hints' },
] as const;
/** Familles retirées en bloc (préfixes) : missions, ligues, carte, fil du Quartier. */
export const RETIRED_V4_ROUTE_PREFIXES = ['/v1/missions', '/v1/leagues', '/v1/map', '/v1/neighborhood-feed'] as const;
