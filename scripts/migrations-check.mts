/**
 * `pnpm migrations:check` — migrations non destructives (docs/VERSIONING.md), lancé par `pnpm test`.
 *
 * Analyse les migrations de `supabase/migrations` plus récentes que la dernière appliquée en production
 * (`supabase/production-baseline.json`) et échoue (code 1) sur ce qui détruit ou bloque : drop table / column,
 * rename, changement de type, set not null sans contrainte préalable, not null sans default, drop default,
 * drop constraint, contrainte validée d'emblée, index bloquant, truncate, delete ou update sans where…
 * Échappatoire, juste au-dessus de l'instruction : `-- destructive-ok: <raison> (contract, build ≥ N)`.
 * `--all` analyse aussi les migrations déjà appliquées (pour information, jamais bloquant).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Finding, type MigrationContext, analyzeMigration, collectContext } from '../apps/api/scripts/migration-safety';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'supabase/migrations');
const baseline = (JSON.parse(fs.readFileSync(path.join(root, 'supabase/production-baseline.json'), 'utf8')) as { lastAppliedInProduction: string }).lastAppliedInProduction;
const all = process.argv.includes('--all');

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
if (!files.includes(baseline)) {
  console.error(`migrations:check — ${baseline} (supabase/production-baseline.json) n'existe pas dans supabase/migrations.`);
  process.exit(1);
}
const ctx: MigrationContext = { newTables: new Set(), newIndexes: new Set(), notNullChecks: new Set() };
const isNew = (f: string) => f > baseline;
const fresh = files.filter(isNew);
const report: { file: string; findings: Finding[]; enforced: boolean }[] = [];
for (const f of files) {
  const sql = fs.readFileSync(path.join(dir, f), 'utf8');
  collectContext(sql, ctx, all || isNew(f));
  if (all || isNew(f)) report.push({ file: f, findings: analyzeMigration(sql, ctx), enforced: isNew(f) });
}

let blocking = 0;
for (const { file, findings, enforced } of report) {
  for (const f of findings) {
    const where = `${file}:${f.line}`;
    if (f.escape !== undefined) console.log(`  accepté (destructive-ok) ${where} [${f.rule}] ${f.message}\n      raison : ${f.escape}`);
    else if (enforced) {
      blocking++;
      console.error(`  ✗ ${where} [${f.rule}] ${f.message}\n      ${f.statement}`);
    } else console.log(`  (déjà en production) ${where} [${f.rule}] ${f.message}`);
  }
}
if (blocking > 0) {
  console.error(
    [
      '',
      `migrations:check — ${blocking} instruction(s) destructive(s) dans les nouvelles migrations.`,
      'Expand → migrate → contract (docs/VERSIONING.md) : ajouter d’abord, retirer plus tard. Pour la phase « contract »,',
      'une ligne `-- destructive-ok: <raison> (contract, build ≥ N)` juste au-dessus de l’instruction.',
    ].join('\n'),
  );
  process.exit(1);
}
console.log(`migrations:check — ${fresh.length} nouvelle(s) migration(s) après ${baseline}, rien de destructif.`);
