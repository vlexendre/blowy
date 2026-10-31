#!/usr/bin/env node
// Création NON destructive des fichiers .env locaux à partir des .env.example.
import { copyFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['apps', 'packages'];
let created = 0;
for (const root of roots) {
  if (!existsSync(root)) continue;
  for (const dir of readdirSync(root)) {
    const example = join(root, dir, '.env.example');
    const target = join(root, dir, '.env');
    if (existsSync(example) && !existsSync(target)) {
      copyFileSync(example, target);
      created++;
      console.warn(`créé ${target}`);
    }
  }
}
console.warn(`${created} fichier(s) .env créé(s). Aucun fichier existant modifié.`);
console.warn(`Prérequis : Node 22, pnpm 10, Docker (pnpm infra:up) OU Postgres 16 + Redis 7 locaux.`);
console.warn(`Ensuite : pnpm install && pnpm db:migrate && pnpm db:seed && pnpm dev`);
