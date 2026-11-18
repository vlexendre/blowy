/**
 * Présence de l'app (premier plan, conversation ouverte), signalée par l'app (`POST /v1/notifications/presence`) et
 * gardée 150 secondes dans le cache : l'app la renouvelle toutes les 2 minutes au premier plan et l'efface en partant.
 * Une app tuée sans prévenir redevient « en arrière-plan » au plus 150 s après.
 * Limite : le cache est celui du processus (`MemoryCache`) ; avec plusieurs instances de l'API, brancher un cache
 * partagé sur le jeton CACHE (sans quoi une présence peut être ignorée : la personne reçoit alors le push, comme avant).
 */
import { Inject, Injectable } from '@nestjs/common';
import { CACHE, type Cache } from '../../shared/cache';

export const PRESENCE_TTL_MS = 150_000;

export interface Presence {
  /** Conversation ouverte (lien ou groupe), ou null. */
  key: string | null;
}

@Injectable()
export class NotificationPresence {
  constructor(@Inject(CACHE) private readonly cache: Cache) {}

  async set(userId: string, input: { foreground: boolean; linkId?: string; groupId?: string }): Promise<void> {
    const cacheKey = `notif:presence:${userId}`;
    if (!input.foreground) return this.cache.delete(cacheKey);
    await this.cache.set<Presence>(cacheKey, { key: input.linkId ?? input.groupId ?? null }, PRESENCE_TTL_MS);
  }

  /** Au premier plan (signal de moins de 150 s), ou null. */
  async of(userId: string): Promise<Presence | null> {
    return (await this.cache.get<Presence>(`notif:presence:${userId}`)) ?? null;
  }
}
