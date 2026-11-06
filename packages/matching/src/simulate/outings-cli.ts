/**
 * Simulateur de composition `pnpm --filter @blowy/matching simulate:outings` (spec-v5 §4.7) :
 * seed `blowy-outings-2026`, 300 et 600 candidats, 3 créneaux. Rapporte taux de placement,
 * score moyen, couverture romance, déséquilibre de genre, durée. Résultats : docs/engine-rules.md §12.
 */
import { DEFAULT_TUNING } from '@blowy/tuning';
import { composeOutings, compositionSeed } from '../groups/index.js';
import { population } from './population.js';

const sizes = process.argv.slice(2).map(Number).filter((n) => n > 0);
const seed = 'blowy-outings-2026';
const rows = [];
for (const n of sizes.length > 0 ? sizes : [300, 600]) {
  const p = population({ n, seed });
  const t0 = performance.now();
  const r = composeOutings({ ...p, seed: compositionSeed('simulation', '2026-W47', DEFAULT_TUNING.version), tuning: DEFAULT_TUNING });
  const ms = Math.round(performance.now() - t0);
  const reasons: Record<string, number> = {};
  for (const u of r.unplaced) reasons[u.reason] = (reasons[u.reason] ?? 0) + 1;
  const sizesHist: Record<number, number> = {};
  for (const g of r.groups) sizesHist[g.memberUserIds.length] = (sizesHist[g.memberUserIds.length] ?? 0) + 1;
  rows.push({
    candidats: n,
    placés: `${r.stats.placed} (${Math.round((1000 * r.stats.placed) / n) / 10} %)`,
    groupes: r.stats.groups,
    tailles: JSON.stringify(sizesHist),
    scoreMoyen: r.stats.meanPairScore,
    couvertureRomance: `${r.stats.romanceCoverage / 10} %`,
    groupesDéséquilibrés: `${r.stats.genderImbalancedGroups} (${Math.round((1000 * r.stats.genderImbalancedGroups) / Math.max(1, r.stats.groups)) / 10} %)`,
    nonPlacés: JSON.stringify(reasons),
    passes: r.stats.iterations,
    ms,
  });
}
// eslint-disable-next-line no-console -- sortie du simulateur (CLI)
console.table(rows);
