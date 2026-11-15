/**
 * Cache des lectures fréquentes (réglages, accords, dépense IA du jour…), en mémoire du processus.
 * Interface asynchrone exprès : pour plusieurs instances, remplacer `MemoryCache` par un adaptateur partagé
 * (Redis, Upstash…) dans `PlatformModule` (jeton CACHE) sans toucher aux appelants.
 * Règle : on ne met en cache que des valeurs qu'on accepte de voir vieilles de `ttlMs`, et on `delete` après une écriture.
 */
import type { Clock } from './clock';

export const CACHE = Symbol('CACHE');

export interface Cache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
  delete(key: string): Promise<void>;
  /** Valeur en cache, ou chargée puis gardée `ttlMs`. */
  wrap<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T>;
}

export class MemoryCache implements Cache {
  private readonly entries = new Map<string, { value: unknown; until: number }>();

  constructor(
    private readonly clock: Clock,
    private readonly maxEntries = 10_000,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    const hit = this.entries.get(key);
    if (!hit) return undefined;
    if (hit.until <= this.clock.now().getTime()) {
      this.entries.delete(key);
      return undefined;
    }
    return hit.value as T;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    if (this.entries.size >= this.maxEntries) {
      // Les plus anciennes insertions partent d'abord (ordre d'insertion de Map).
      const oldest = this.entries.keys().next();
      if (!oldest.done) this.entries.delete(oldest.value);
    }
    this.entries.delete(key);
    this.entries.set(key, { value, until: this.clock.now().getTime() + ttlMs });
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key);
  }

  async wrap<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
    const hit = await this.get<T>(key);
    if (hit !== undefined) return hit;
    const value = await load();
    await this.set(key, value, ttlMs);
    return value;
  }
}
