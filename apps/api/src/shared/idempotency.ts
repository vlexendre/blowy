/**
 * Envois rejouables (envoi optimiste de l'app) : une requête qui porte une clé d'idempotence (`clientId`) n'est
 * exécutée qu'une fois par personne et par portée. Un réessai (réponse perdue, coupure, app relancée) rend la réponse
 * de la première exécution ; deux requêtes simultanées avec la même clé attendent la même exécution.
 *
 * Gardé dans `CACHE` (mémoire du processus, comme les autres caches : pour plusieurs instances, un adaptateur partagé
 * suffit, rien ne change ici). Une erreur n'est pas gardée : un refus (filtre, lien endormi) se rejoue tel quel, et un
 * envoi raté peut être retenté avec la même clé.
 */
import { Inject, Injectable } from '@nestjs/common';
import { CACHE, type Cache } from './cache';

/** Assez long pour couvrir un réessai après une coupure ou une relance de l'app. */
export const IDEMPOTENCY_TTL_MS = 24 * 3_600_000;

@Injectable()
export class Idempotency {
  private readonly running = new Map<string, Promise<unknown>>();

  constructor(@Inject(CACHE) private readonly cache: Cache) {}

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
