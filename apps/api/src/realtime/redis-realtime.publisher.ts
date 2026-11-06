/** RealtimePublisher côté worker : publie sur Redis ; l'API relaie aux sockets. */
import type { Redis } from 'ioredis';
import type { OutboxEffect, OutboxEnvelope } from '../shared/application/outbox-consumer.js';
import { RT_CHANNEL, type RtMessage } from './realtime.gateway.js';

const ids = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** Effet outbox : `realtime.deliver` / `realtime.revoke` → Redis pub/sub (au moins une fois). */
export class RealtimeRelayEffect implements OutboxEffect {
  readonly name = 'realtime.relay';
  readonly topics = ['realtime.deliver', 'realtime.revoke', 'realtime.disconnect'] as const;
  constructor(private readonly publish: (m: RtMessage) => Promise<void>) {}
  async run(e: OutboxEnvelope): Promise<void> {
    if (e.topic === 'realtime.deliver') await this.publish({ kind: 'deliver', recipients: ids(e.payload.recipients) });
    else if (e.topic === 'realtime.disconnect') {
      // `sessionIds` présent : seulement les sockets de ces sessions ; absent : toutes celles du compte.
      const sessions = ids(e.payload.sessionIds);
      await this.publish({ kind: 'disconnect', recipients: [e.aggregateId], ...(sessions.length ? { sessions } : {}) });
    }
    else await this.publish({ kind: 'revoke', recipients: [e.aggregateId], rooms: ids(e.payload.rooms) });
  }
}

export function redisPublish(redis: Redis) {
  return async (m: RtMessage) => {
    await redis.publish(RT_CHANNEL, JSON.stringify(m));
  };
}
