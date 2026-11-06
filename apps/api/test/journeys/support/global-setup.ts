/**
 * Base dédiée aux parcours : `blowy_journeys` est SUPPRIMÉE puis recréée à chaque exécution
 * (base fraîche), puis `prisma migrate deploy`. Ne touche jamais `blowy` ni `blowy_test`.
 * Verrou consultatif pour sérialiser deux exécutions concurrentes (plusieurs agents).
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

export const JOURNEYS_DB_URL = process.env.DATABASE_URL_JOURNEYS ?? 'postgresql://blowy:blowy@localhost:5432/blowy_journeys';
const LOCK_KEY = 0x0b10_7e58;

export default async function setup(): Promise<() => Promise<void>> {
  const url = new URL(JOURNEYS_DB_URL);
  const dbName = url.pathname.replace(/^\//, '');
  if (dbName !== 'blowy_journeys') throw new Error(`Base des parcours attendue (blowy_journeys), reçu ${dbName}`);
  const admin = new URL(JOURNEYS_DB_URL);
  admin.pathname = '/postgres';
  const lock = new pg.Client({ connectionString: admin.toString() });
  await lock.connect();
  await lock.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
  await lock.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`, [dbName]);
  await lock.query(`DROP DATABASE IF EXISTS "${dbName}"`);
  await lock.query(`CREATE DATABASE "${dbName}"`);
  const dbDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../packages/database');
  execSync('npx prisma migrate deploy', { cwd: dbDir, env: { ...process.env, DATABASE_URL: JOURNEYS_DB_URL }, stdio: 'pipe' });
  return async () => {
    await lock.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => undefined);
    await lock.end();
  };
}
