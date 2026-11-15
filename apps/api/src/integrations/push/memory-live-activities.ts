import type { LiveActivityPusher, LiveActivityResult, LiveActivitySend } from './live-activity';

/** Adaptateur mémoire (tests, local) : garde chaque envoi ; un jeton peut être déclaré mort (réponse 410). */
export class MemoryLiveActivities implements LiveActivityPusher {
  readonly enabled = true;
  readonly outbox: LiveActivitySend[] = [];
  private readonly dead = new Set<string>();

  markDead(token: string): void {
    this.dead.add(token);
  }

  async send(push: LiveActivitySend): Promise<LiveActivityResult> {
    if (this.dead.has(push.token)) return { ok: false, status: 410, reason: 'Unregistered', invalidToken: true };
    this.outbox.push(JSON.parse(JSON.stringify(push)) as LiveActivitySend);
    return { ok: true };
  }
}
