import { createDb, type Db } from '@blowy/database';

/** Jeton d'injection du client Prisma (un seul pool par processus). */
export const DB = Symbol('Db');

export function createDbFromUrl(url: string): Db {
  return createDb({ connectionString: url });
}
