/**
 * Génère public/geo/quartiers.json : les contours de la carte « Ouvre ton quartier », projetés et simplifiés.
 * Source : Natural Earth 1:50m (domaine public) via le paquet `world-atlas` (TopoJSON). Le fichier produit est
 * versionné : à relancer seulement pour changer le cadrage ou les pays.
 *
 *   pnpm --filter @blowy/web exec tsx scripts/quartier-map.mts
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
import { MAP_H, MAP_W, project, type QuartierMapData } from '../src/lib/quartier-map';

type Ring = [number, number][];
type Geometry = { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] };

const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'));

/** Pays de Minimoa (codes ISO numériques). */
const MAIN: Record<string, string> = { '250': 'fr', '056': 'be', '528': 'nl', '442': 'lu', '756': 'ch', '724': 'es', '620': 'pt' };
/** Voisins dessinés en estompé, pour situer. */
const CONTEXT = new Set(['276', '380', '826', '372', '040', '504', '012', '208', '203', '020', '492', '438', '788', '705', '616', '191', '674', '336']);

/** Garde les morceaux de territoire dans le cadre (pas la Guyane, les Canaries, les Açores, les Antilles…). */
const inFrame = (ring: Ring): boolean => ring.some(([lng, lat]) => lng > -11 && lng < 18 && lat > 34.5 && lat < 55.5);

/** Hors du cadre, les points sont ramenés sur sa marge (le contour reste fermé, le fichier reste léger). */
const M = 40;
const clamp = (n: number, max: number): number => Math.min(max + M, Math.max(-M, n));

function ringPath(ring: Ring, step: number): string {
  const pts: [number, number][] = [];
  for (const [lng, lat] of ring) {
    const [px, py] = project(lat, lng);
    const x = clamp(px, MAP_W);
    const y = clamp(py, MAP_H);
    const last = pts.at(-1);
    if (last && Math.hypot(x - last[0], y - last[1]) < step) continue;
    pts.push([x, y]);
  }
  if (pts.length < 4) return '';
  const r = (n: number) => Math.round(n * 10) / 10;
  return `M${pts.map(([x, y]) => `${r(x)} ${r(y)}`).join('L')}Z`;
}

function pathOf(g: Geometry, step = 1.1): string {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  return polys
    .filter((p) => p[0] && inFrame(p[0]))
    .map((p) => p.map((r) => ringPath(r, step)).join(''))
    .join('');
}

const fc = feature(topo, topo.objects.countries) as unknown as { features: { id: string; geometry: Geometry | null }[] };
const countries: QuartierMapData['countries'] = [];
let context = '';
for (const f of fc.features) {
  if (!f.geometry) continue;
  if (MAIN[f.id]) countries.push({ id: MAIN[f.id]!, d: pathOf(f.geometry) });
  else if (CONTEXT.has(f.id)) context += pathOf(f.geometry, 2);
}
const data: QuartierMapData = { w: MAP_W, h: MAP_H, countries, context };
const out = new URL('../public/geo/', import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL('quartiers.json', out), JSON.stringify(data));
console.log(`public/geo/quartiers.json : ${countries.length} pays, ${(JSON.stringify(data).length / 1024).toFixed(1)} Ko`);
