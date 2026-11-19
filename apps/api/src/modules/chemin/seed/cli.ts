/**
 * `pnpm --filter @blowy/api chemin:seed` : charge le contenu de départ de Ton chemin (docs/CHEMIN.md) dans une base
 * Supabase donnée par SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (lus dans le shell, jamais écrits dans le code),
 * après la migration 20261121100000_chemin.
 *
 * Idempotent : par défaut, n'insère que ce qui manque (une question modifiée dans l'administration n'est pas
 * écrasée). `--update` réécrit aussi les unités, étapes et questions de départ existantes (textes, options, ordre ;
 * le statut est gardé). `--dry-run` : compte sans rien écrire.
 */
import { createServiceClient } from '../../../persistence/supabase';
import type { Json } from '../../../persistence/database.types';
import { buildSeedContent } from './build';

async function main(): Promise<number> {
  const args = new Set(process.argv.slice(2));
  const update = args.has('--update');
  const dryRun = args.has('--dry-run');
  const content = buildSeedContent(new Date().toISOString());
  const counts = { units: content.units.length, steps: content.units.reduce((n, u) => n + u.steps.length, 0), questions: content.questions.length, scenes: content.scenes.length };
  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, ...counts }, null, 2));
    return 0;
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont nécessaires (dans le shell).');
    return 2;
  }
  const db = createServiceClient(url, key);
  /** Insère ce qui manque ; avec --update, réécrit aussi l'existant, statut gardé (jamais réécrit). */
  const write = async (table: 'chemin_units' | 'chemin_steps' | 'chemin_questions' | 'chemin_scenes', row: Record<string, unknown>): Promise<void> => {
    const insert = await db.from(table).upsert(row as never, { onConflict: 'id', ignoreDuplicates: true });
    if (insert.error) throw new Error(`${table} ${String(row.id)} : ${insert.error.message}`);
    if (!update) return;
    const { status: _status, ...rest } = row;
    const again = await db.from(table).upsert(rest as never, { onConflict: 'id' });
    if (again.error) throw new Error(`${table} ${String(row.id)} : ${again.error.message}`);
  };
  for (const u of content.units) {
    await write('chemin_units', { id: u.id, position: u.position, icon: u.icon, min_build: u.minBuild, status: u.status, texts: u.texts as unknown as Json });
    for (const s of u.steps) await write('chemin_steps', { id: s.id, unit_id: u.id, position: s.position, status: s.status, texts: s.texts as unknown as Json });
  }
  for (const q of content.questions) {
    await write('chemin_questions', {
      id: q.id,
      step_id: q.stepId,
      position: q.position,
      format: q.format,
      axis: q.axis,
      direction: q.direction,
      min_build: q.minBuild,
      legacy_test_id: q.legacyTestId,
      status: q.status,
      texts: q.texts as unknown as Json,
      options: q.options as unknown as Json,
      updated_by: 'chemin:seed',
    });
  }
  for (const sc of content.scenes) await write('chemin_scenes', { id: sc.id, kind: sc.kind, animation: sc.animation, min_build: sc.minBuild, status: sc.status });
  console.log(JSON.stringify({ update, ...counts }, null, 2));
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  },
);
