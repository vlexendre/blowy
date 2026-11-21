/**
 * Vérifie des univers écrits d'un bloc (`packs/*.ts`) : `npx tsx apps/api/src/modules/chemin/seed/packs/check.ts <fichiers…>`
 * (sans fichier : tous ceux de `index.ts`). Mêmes règles que le test `packs.test.ts`.
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { checkPack } from './rules';
import type { SeedPack } from './pack';

async function main(): Promise<number> {
  const files = process.argv.slice(2);
  let packs: readonly SeedPack[];
  if (files.length === 0) packs = (await import('./index')).SEED_PACKS;
  else packs = await Promise.all(files.map(async (f) => ((await import(pathToFileURL(resolve(f)).href)) as { pack: SeedPack }).pack));
  let bad = 0;
  const seen = new Set<string>();
  for (const p of packs) {
    const errors = checkPack(p, seen);
    if (errors.length) {
      bad += errors.length;
      console.log(`✗ ${p.id}\n  ${errors.slice(0, 40).join('\n  ')}`);
    } else console.log(`✓ ${p.id} : ${p.steps.length} étapes, ${p.steps.reduce((n, s) => n + s.questions.length, 0)} questions`);
  }
  return bad ? 1 : 0;
}
void main().then((code) => process.exit(code));
