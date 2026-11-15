import { Inject, Injectable, Logger } from '@nestjs/common';
import { moderationText } from '@blowy/content';
import type { AuthUser } from '../../../integrations/auth/ports';
import { type Clock, todayOf } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK } from '../../../shared/tokens';
import type { ActivityRepository, SuspensionsRepository } from '../ports';
import { ACTIVITY, SUSPENSIONS } from '../tokens';

const CACHE_TTL_MS = 30_000;
const CACHE_MAX = 20_000;

/** Ce qu'un compte suspendu peut encore faire : supprimer son compte (droit à l'effacement). */
const ALLOWED_WHEN_SUSPENDED: ReadonlyArray<{ method: string; path: RegExp }> = [{ method: 'DELETE', path: /^\/v1\/me\/?$/ }];

export interface GateRequest {
  method: string;
  path: string;
}

/**
 * Appelée par la garde d'authentification après chaque jeton vérifié :
 * 1. un compte suspendu reçoit `suspended` (403) avec un message clair (jusqu'à quand, qui contacter) ;
 * 2. le jour d'activité est noté, au plus une écriture par personne et par jour et par instance.
 * La suspension est gardée 30 s en cache par instance ; une action de modération vide le cache localement.
 */
@Injectable()
export class AccountGate {
  private readonly logger = new Logger('Comptes');
  private readonly suspensions = new Map<string, { until: number | null; suspended: boolean; at: number }>();
  private seenDay = '';
  private readonly seen = new Set<string>();

  constructor(
    @Inject(SUSPENSIONS) private readonly repo: SuspensionsRepository,
    @Inject(ACTIVITY) private readonly activity: ActivityRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async check(user: AuthUser, req: GateRequest): Promise<void> {
    if (req.path.startsWith('/admin')) return;
    const now = this.clock.now().getTime();
    const s = await this.suspension(user.userId, now);
    if (s.suspended && (s.until === null || s.until > now)) {
      if (!ALLOWED_WHEN_SUSPENDED.some((a) => a.method === req.method && a.path.test(req.path))) {
        throw new DomainError('suspended', moderationText.suspended(s.until === null ? null : new Date(s.until).toISOString()));
      }
      return;
    }
    this.touch(user.userId);
  }

  /** Après une suspension ou une levée (même instance) : effet immédiat. */
  invalidate(userId: string): void {
    this.suspensions.delete(userId);
  }

  private async suspension(userId: string, now: number): Promise<{ until: number | null; suspended: boolean }> {
    const hit = this.suspensions.get(userId);
    if (hit && now - hit.at < CACHE_TTL_MS) return hit;
    const record = await this.repo.find(userId);
    const value = { suspended: record !== null, until: record?.until ? Date.parse(record.until) : null, at: now };
    if (this.suspensions.size >= CACHE_MAX) this.suspensions.clear();
    this.suspensions.set(userId, value);
    return value;
  }

  private touch(userId: string): void {
    const day = todayOf(this.clock);
    if (day !== this.seenDay) {
      this.seenDay = day;
      this.seen.clear();
    }
    if (this.seen.has(userId)) return;
    this.seen.add(userId);
    this.activity.touch(userId, day).catch((err: unknown) => {
      this.seen.delete(userId);
      this.logger.warn(`jour d’activité non noté : ${err instanceof Error ? err.message : 'erreur'}`);
    });
  }
}
