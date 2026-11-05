// Agrège un tour du jury : node tooling/jury/aggregate.mjs <N>
// Écrit docs/research/jury/round-<N>/_synthese.md (notes par membre, écrans bloquants, pires écrans).
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const n = process.argv[2];
const dir = new URL(`../../docs/research/jury/round-${n}/`, import.meta.url).pathname;
const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
const members = [];
for (const f of files) {
  try { members.push(JSON.parse(await readFile(join(dir, f), 'utf8'))); } catch (e) { console.error('JSON invalide', f, e.message); }
}
const crit = ['comprehension', 'cognitive', 'desire', 'meet', 'safety', 'virality', 'money', 'visual'];
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const screens = {};
for (const m of members) for (const [s, v] of Object.entries(m.screens ?? {})) (screens[s] ??= []).push({ member: m.member, ...v });
let md = `# Jury — tour ${n} : synthèse\n\n${members.length} membres.\n\n| Membre | Global | ${crit.join(' | ')} |\n|---|---|${crit.map(() => '---').join('|')}|\n`;
for (const m of members.sort((a, b) => a.global - b.global)) md += `| ${m.member} | **${m.global}** | ${crit.map((c) => m.criteria?.[c] ?? '–').join(' | ')} |\n`;
md += `| **Moyenne** | **${avg(members.map((m) => m.global)).toFixed(1)}** | ${crit.map((c) => avg(members.map((m) => m.criteria?.[c] ?? 0)).toFixed(1)).join(' | ')} |\n`;
md += `| **Minimum** | **${Math.min(...members.map((m) => m.global))}** | ${crit.map((c) => Math.min(...members.map((m) => m.criteria?.[c] ?? 0))).join(' | ')} |\n\n`;
const rows = Object.entries(screens).map(([s, v]) => ({ s, avg: avg(v.map((x) => x.score)), min: Math.min(...v.map((x) => x.score)), block: v.filter((x) => x.blocking) }));
md += `## Écrans (du pire au meilleur)\n\n| Écran | Moy. | Min | Bloquants |\n|---|---|---|---|\n`;
for (const r of rows.sort((a, b) => a.avg - b.avg)) md += `| ${r.s} | ${r.avg.toFixed(1)} | ${r.min} | ${r.block.length} |\n`;
md += `\n## Bloquants\n\n`;
for (const r of rows) for (const b of r.block) md += `- **${r.s}** (${b.member}) : ${b.issue} → ${b.fix}\n`;
md += `\n## Condition du 10 par membre\n\n`;
for (const m of members) md += `- **${m.member}** : ${m.tenIf}\n`;
await writeFile(join(dir, '_synthese.md'), md);
console.log(md.split('\n').slice(0, 30).join('\n'));
