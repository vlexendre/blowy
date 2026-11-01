/**
 * Réinitialisation contrôlée (tests / seed --reset) : TRUNCATE de toutes les tables applicatives.
 * Refusée hors local/test et si l'URL ne cible pas une base locale.
 */
import type { Db } from './client.js';

export async function truncateAll(db: Db, env: string | undefined): Promise<void> {
  if (env !== 'local' && env !== 'test') throw new Error(`truncateAll refusé pour BLOWY_ENV=${env ?? 'unset'}`);
  const rows = await db.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = current_schema() AND tablename <> '_prisma_migrations'`,
  );
  if (rows.length === 0) return;
  await db.$executeRawUnsafe(`TRUNCATE ${rows.map((r) => `"${r.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`);
}
