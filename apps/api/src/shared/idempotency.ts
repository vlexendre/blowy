/**
 * Envois rejouables (envoi optimiste de l'app) : une requête qui porte une clé d'idempotence (`clientId`) n'est
 * exécutée qu'une fois par personne et par portée. Un réessai (réponse perdue, coupure, app relancée) rend la réponse
 * de la première exécution ; deux requêtes simultanées avec la même clé attendent la même exécution.
 *
 * Gardé dans son propre cache borné (mémoire du processus, comme `CACHE` : il ne fait pas tourner les autres entrées ;
 * pour plusieurs instances, remplacer `MemoryCache` par un adaptateur partagé, rien d'autre ne change). Une erreur n'est pas gardée : un refus (filtre, lien endormi) se rejoue tel quel, et un
 * envoi raté peut être retenté avec la même clé.
 */
import { Inject, Injectable } from '@nestjs/common';
import { type Cache, MemoryCache } from './cache';
import type { Clock } from './clock';
import { CLOCK } from './tokens';

/** Assez long pour couvrir un réessai après une coupure ou une relance de l'app. */
export const IDEMPOTENCY_TTL_MS = 12 * 3_600_000;
/** Réponses gardées au plus (les plus anciennes partent d'abord). */
const MAX_ENTRIES = 50_000;

@Injectable()
export class Idempotency {
  private readonly running = new Map<string, Promise<unknown>>();
  private readonly cache: Cache;

  constructor(@Inject(CLOCK) clock: Clock) {
    this.cache = new MemoryCache(clock, MAX_ENTRIES);
  }

  /** Exécute `run` une seule fois pour (`scope`, `key`) ; sans clé, l'exécute simplement. */
  async once<T>(scope: string, key: string | undefined, run: () => Promise<T>): Promise<T> {
    if (!key) return run();
    const id = `idem:${scope}:${key}`;
    const done = await this.cache.get<T>(id);
    if (done !== undefined) return done;
    const pending = this.running.get(id);
    if (pending) return pending as Promise<T>;
    const work = (async () => {
      try {
        const value = await run();
        await this.cache.set(id, value, IDEMPOTENCY_TTL_MS);
        return value;
      } finally {
        this.running.delete(id);
      }
    })();
    this.running.set(id, work);
    return work;
  }
}
