/**
 * Port ObjectStorage (agent E) : stockage PRIVÉ des médias. Aucune URL publique : la
 * livraison passe toujours par l'API (ACL à chaque accès) ou un jeton court révocable.
 * Préfixes : `quarantine/` (brut non contrôlé), `media/` (dérivés), `exports/` (archives).
 */
export interface StoredObject {
  bytes: Uint8Array;
  contentType: string;
}

export interface ObjectStorage {
  readonly driver: 's3' | 'fs';
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
  deletePrefix(prefix: string): Promise<number>;
  exists(key: string): Promise<boolean>;
}
export const OBJECT_STORAGE = Symbol('ObjectStorage');
