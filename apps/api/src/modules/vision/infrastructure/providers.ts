import type { Provider } from '@nestjs/common';
import { type Adapters, repository } from '../../../persistence/repository';
import { VisionRecorder } from '../application/vision-recorder';
import type { MatchCacheRepository, PlacesRepository, VisionStore } from '../ports';
import { MATCH_CACHE, PLACES, VISION_READER, VISION_SIGNALS, VISION_STORE } from '../tokens';
import { MemoryMatchCache, MemoryPlacesRepository, MemoryVisionStore } from './memory-vision.repositories';
import { SupabaseMatchCache, SupabasePlacesRepository, SupabaseVisionStore } from './supabase-vision.repositories';

/**
 * Dépôts de la vision et ports partagés (globaux, via CoreModule) : VISION_SIGNALS pour écrire des observations,
 * VISION_READER pour lire un profil ou la dernière sortie.
 */
export const visionProviders = (adapters: Adapters): Provider[] => [
  repository<VisionStore>(VISION_STORE, adapters, (db) => new MemoryVisionStore(db), (c) => new SupabaseVisionStore(c)),
  repository<PlacesRepository>(PLACES, adapters, (db) => new MemoryPlacesRepository(db), (c) => new SupabasePlacesRepository(c)),
  repository<MatchCacheRepository>(MATCH_CACHE, adapters, (db) => new MemoryMatchCache(db), (c) => new SupabaseMatchCache(c)),
  VisionRecorder,
  { provide: VISION_SIGNALS, useExisting: VisionRecorder },
  { provide: VISION_READER, useExisting: VisionRecorder },
];
