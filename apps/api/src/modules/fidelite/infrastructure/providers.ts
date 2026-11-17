import type { Provider } from '@nestjs/common';
import { type Adapters, repository } from '../../../persistence/repository';
import { FIDELITE_PEOPLE, type FidelitePeople, LIFECYCLE_LOG, type LifecycleLog } from '../ports';
import { MemoryFidelitePeople, MemoryLifecycleLog } from './memory-fidelite.repositories';
import { SupabaseFidelitePeople, SupabaseLifecycleLog } from './supabase-fidelite.repositories';

/** Globaux (CoreModule) : le journal sert aussi à Minimoa+ (bienvenue, paiement refusé, au revoir, relance). */
export const fideliteProviders = (adapters: Adapters): Provider[] => [
  repository<LifecycleLog>(LIFECYCLE_LOG, adapters, (db) => new MemoryLifecycleLog(db), (c) => new SupabaseLifecycleLog(c)),
  repository<FidelitePeople>(FIDELITE_PEOPLE, adapters, (db) => new MemoryFidelitePeople(db), (c) => new SupabaseFidelitePeople(c)),
];
