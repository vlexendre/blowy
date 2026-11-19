/**
 * `pnpm contract:check` — garde-fou du contrat de l'API (docs/VERSIONING.md), lancé par `pnpm test`.
 *
 * Compare le contrat actuel (`packages/contract`, appels de `packages/api-client`) au dernier instantané publié
 * (`packages/contract/snapshot/contract.json`) et échoue (code 1) si un build de l'app déjà installé casserait :
 * route ou appel retiré, champ de réponse retiré ou devenu facultatif, type changé, champ de requête devenu
 * obligatoire, valeur d'enum retirée d'une requête, valeur d'enum ajoutée là où l'app ne sait pas l'écarter.
 *
 * `pnpm contract:snapshot` (`--write`) régénère l'instantané : à faire à chaque sortie de l'app, ou quand
 * `minSupportedBuild` dépasse les builds qui dépendaient de l'ancienne forme.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Policy, type Snapshot, buildSnapshot, compareSnapshots } from '../packages/contract/compat/snapshot';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'packages/contract/snapshot');
const snapshotFile = path.join(dir, 'contract.json');
const policyFile = path.join(dir, 'policy.json');
const write = process.argv.includes('--write');

const client = fs.readFileSync(path.join(root, 'packages/api-client/src/index.ts'), 'utf8');
const current = buildSnapshot(client);
const policy = JSON.parse(fs.readFileSync(policyFile, 'utf8')) as Policy;

if (write) {
  if (fs.existsSync(snapshotFile)) {
    const report = compareSnapshots(JSON.parse(fs.readFileSync(snapshotFile, 'utf8')) as Snapshot, current, policy);
    if (report.breaking.length > 0) {
      console.log(`Attention : ${report.breaking.length} changement(s) cassant(s) entrent dans l'instantané :`);
      for (const b of report.breaking) console.log(`  - ${b}`);
      console.log('Seulement si plus aucun build servi n’en dépend (minSupportedBuild au-dessus) ou si la route est nouvelle et jamais publiée.\n');
    }
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(snapshotFile, `${JSON.stringify(current, null, 1)}\n`);
  console.log(`Instantané du contrat écrit : ${path.relative(root, snapshotFile)} (${Object.keys(current.endpoints).length} appels, ${Object.keys(current.requests).length} requêtes).`);
  process.exit(0);
}

if (!fs.existsSync(snapshotFile)) {
  console.error('contract:check — aucun instantané publié : lance `pnpm contract:snapshot`.');
  process.exit(1);
}
const published = JSON.parse(fs.readFileSync(snapshotFile, 'utf8')) as Snapshot;
const report = compareSnapshots(published, current, policy);

if (report.added.length > 0) console.log(`contract:check — ${report.added.length} ajout(s) depuis l'instantané (sans risque).`);
for (const t of report.tolerable) console.log(`  toléré : ${t}`);
if (report.breaking.length > 0) {
  console.error(`\ncontract:check — ${report.breaking.length} changement(s) cassant(s) pour les apps déjà installées :`);
  for (const b of report.breaking) console.error(`  ✗ ${b}`);
  console.error(
    [
      '',
      'Un contrat ne change que par ajout (docs/VERSIONING.md) : champ facultatif en plus, nouvelle route.',
      'Pour casser : nouvelle route (/v2/…) ou réponse adaptée au build (`clientApp()`), l’ancienne reste servie',
      'jusqu’à ce que minSupportedBuild dépasse les vieux builds ; alors seulement `pnpm contract:snapshot`.',
    ].join('\n'),
  );
  process.exit(1);
}
console.log('contract:check — aucun changement cassant.');
