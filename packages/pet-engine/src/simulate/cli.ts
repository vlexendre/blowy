/**
 * `pnpm simulate:balance [--relationships N] [--days D] [--seed S] [--out fichier.json]`
 * Sortie : JSON complet (stdout ou fichier) + résumé texte (stderr).
 */
import { writeFileSync } from 'node:fs';
import { simulate, type SimulationReport } from './run.js';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}

function summary(r: SimulationReport): string {
  const pct = (v: number) => `${(v * 100).toFixed(1)} %`;
  const d = (v: number | null) => (v === null ? 'non atteint' : `${v} j`);
  const lines = [
    `Simulation Blowy — ${r.relationships} relations × ${r.days} j (seed ${r.seed}, ${r.tuningVersion}, ${r.engineVersion})`,
    `Temps médian (relations ayant atteint) : N2 ${d(r.medianDaysToLevel.N2)} · N3 ${d(r.medianDaysToLevel.N3)} · N5 ${d(r.medianDaysToLevel.N5)} · N7 ${d(r.medianDaysToLevel.N7)}`,
    `Part atteinte à J${r.days} : N2 ${pct(r.reachedShare.N2)} · N3 ${pct(r.reachedShare.N3)} · N5 ${pct(r.reachedShare.N5)} · N7 ${pct(r.reachedShare.N7)}`,
    `N3 à J14 : ${pct(r.n3ByDay14Share)} (hypothèse produit ${pct(r.n3ByDay14Hypothesis)} ; seuil 500 inchangé)`,
    ...Object.entries(r.byProfile).map(([k, v]) => `  · ${k.padEnd(12)} ${String(v.relationships).padStart(5)} rel. · N3@J14 ${pct(v.n3ByDay14Share)} · médiane N3 ${d(v.medianDaysToN3)}`),
    `Pièces : créées ${r.coins.created} · dépensées ${r.coins.spent} · ${r.coins.createdPerPersonPerDay}/pers./j · ${JSON.stringify(r.coins.byReason)}`,
    `Maladie (pets de joueurs actifs) : ${pct(r.sickness.relationshipsWithSickActivePetShare)} des relations touchées · ${pct(r.sickness.sickPetHoursShare)} du temps-pet actif malade`,
    `Sorties silencieuses (clôture 14 j) : ${pct(r.silentExitShare)}`,
    `Durée : ${r.elapsedMs} ms`,
  ];
  return lines.join('\n');
}

const report = simulate({ relationships: Number(arg('relationships', '2000')), days: Number(arg('days', '60')), seed: arg('seed', 'blowy-balance-2026') });
const json = JSON.stringify(report, null, 2);
const out = arg('out', '');
if (out) writeFileSync(out, json);
else process.stdout.write(`${json}\n`);
process.stderr.write(`${summary(report)}\n`);
