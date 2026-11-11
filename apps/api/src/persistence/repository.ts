import type { Provider } from '@nestjs/common';
import type { Db } from './database.types';
import { MEMORY_DB, SUPABASE } from '../shared/tokens';
import type { MemoryDb } from './memory-db';

export type Adapters = 'memory' | 'supabase';

/** Fournisseur d'un dépôt : l'adaptateur mémoire ou Supabase selon BLOWY_ADAPTERS. */
export function repository<T>(
  token: symbol,
  adapters: Adapters,
  memory: (db: MemoryDb) => T,
  supabase: (client: Db) => T,
): Provider {
  return adapters === 'memory'
    ? { provide: token, useFactory: memory, inject: [MEMORY_DB] }
    : { provide: token, useFactory: supabase, inject: [SUPABASE] };
}
