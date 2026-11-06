/** Retrait V4 (spec-v5 §7.7) : la liste `RETIRED_V4_ROUTES` répond 410 ; aucune route V5 n'est couverte. */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RETIRED_V4_ROUTES } from '@blowy/api-contract';
import { isRetiredRoute } from '../../src/shared/interface/retired-routes.middleware.js';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/modules');
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : [path.join(d, f)]));

describe('routes V4 retirées → 410', () => {
  it('chaque route listée (paramètres remplacés) est retirée', () => {
    for (const r of RETIRED_V4_ROUTES) expect(isRetiredRoute(r.method, r.path.replace(/:[^/]+/g, '0190b6a2-0000-7000-8000-000000000001')), `${r.method} ${r.path}`).toBe(true);
    expect(isRetiredRoute('GET', '/v1/missions/today')).toBe(true);
    expect(isRetiredRoute('POST', '/v1/leagues/abc/join')).toBe(true);
    expect(isRetiredRoute('GET', '/v1/map')).toBe(true);
  });

  it('méthode et chemin exacts : les voisins V5 ne sont pas touchés', () => {
    expect(isRetiredRoute('GET', '/v1/pets/mine')).toBe(false);
    expect(isRetiredRoute('PUT', '/v1/pets/mine/accessories')).toBe(false);
    expect(isRetiredRoute('GET', '/v1/relationships/abc')).toBe(false);
    expect(isRetiredRoute('POST', '/v1/relationships/abc/leave')).toBe(false);
    expect(isRetiredRoute('GET', '/v1/missionsx')).toBe(false);
    expect(isRetiredRoute('GET', '/v1/pets/abc/actions')).toBe(false); // seule la méthode listée (POST)
  });

  it('aucune route V5 déclarée par un contrôleur n’est couverte par la liste', () => {
    const v5Prefixes = ['outings', 'teams', 'band', 'duos', 'duo-lane', 'safety', 'public', 'neighborhoods', 'me', 'preferences', 'webhooks', 'outing-credits', 'subscriptions', 'purchases'];
    const routes: Array<[string, string]> = [];
    for (const f of walk(SRC).filter((x) => x.endsWith('.controller.ts'))) {
      const src = readFileSync(f, 'utf8');
      const base = /@Controller\('([^']*)'\)/.exec(src)?.[1] ?? '';
      for (const m of src.matchAll(/@(Get|Post|Put|Delete|Patch)\('([^']*)'\)/g)) routes.push([m[1]!.toUpperCase(), `/${[base, m[2]].filter(Boolean).join('/')}`]);
    }
    const v5 = routes.filter(([, p]) => v5Prefixes.some((x) => p.startsWith(`/v1/${x}`)));
    expect(v5.length).toBeGreaterThan(20);
    for (const [m, p] of v5) expect(isRetiredRoute(m, p.replace(/:[^/]+/g, 'x')), `${m} ${p}`).toBe(false);
  });
});
