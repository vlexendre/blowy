/**
 * Client Prisma 7 (driver adapter pg). Server-only : interdit côté mobile/web (règle ESLint).
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

export type Db = PrismaClient;

export interface CreateDbOptions {
  connectionString: string;
  /** Taille max du pool pg. */
  max?: number;
}

export function createDb(opts: CreateDbOptions): Db {
  const adapter = new PrismaPg({ connectionString: opts.connectionString, max: opts.max ?? 10 });
  return new PrismaClient({ adapter });
}
