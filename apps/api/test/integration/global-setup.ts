/**
 * Setup global d'intégration :
 *  1. applique les migrations sur blowy_test ;
 *  2. prend un VERROU CONSULTATIF PostgreSQL de session pour toute la durée de la suite :
 *     deux exécutions concurrentes (plusieurs agents/CI sur la même base) sont sérialisées
 *     au lieu de se tronquer mutuellement les tables.
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const LOCK_KEY = 0x0b10_7e57; // clé arbitraire stable « blowy test »

export default async function setup(): Promise<() => Promise<void>> {
  const url = process.env.DATABASE_URL_TEST ?? 'postgresql://blowy:blowy@localhost:5432/blowy_test';
  if (!/blowy_test/.test(url)) throw new Error(`Base de test attendue (blowy_test), reçu ${url}`);
  const lock = new pg.Client({ connectionString: url });
  await lock.connect();
  await lock.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
  const dbDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../packages/database');
  execSync('npx prisma migrate deploy', { cwd: dbDir, env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' });
  return async () => {
    await lock.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => undefined);
    await lock.end();
  };
}
