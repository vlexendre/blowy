import type { RealtimePublisher } from '../../application/ports/realtime.port.js';

/** Publication temps réel désactivée (processus sans Redis/WS). */
export class NoopRealtimePublisher implements RealtimePublisher {
  async notify(): Promise<void> {}
  async revoke(): Promise<void> {}
}
