import type { Clock } from './clock';

/** Limiteur en mémoire à fenêtre fixe (suffisant pour une instance ; à déporter si on en lance plusieurs). */
export class RateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly clock: Clock,
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  /** Faux si la clé a dépassé son quota dans la fenêtre courante. */
  take(key: string): boolean {
    const now = this.clock.now().getTime();
    const hit = this.hits.get(key);
    if (!hit || hit.resetAt <= now) {
      if (this.hits.size > 10_000) this.sweep(now);
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    hit.count += 1;
    return hit.count <= this.max;
  }

  private sweep(now: number): void {
    for (const [key, hit] of this.hits) if (hit.resetAt <= now) this.hits.delete(key);
  }
}
