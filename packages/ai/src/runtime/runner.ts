/**
 * Exécuteur de tâches IA (§9 « Exécution ») — indépendant de la base et de la file :
 *  - timeout par tâche (AbortController) ;
 *  - tentatives bornées avec backoff exponentiel (erreurs « retryable » seulement) ;
 *  - circuit breaker par fournisseur (N échecs consécutifs → ouvert pendant `cooldownMs`) ;
 *  - plafonds : utilisateur/jour, relation/jour, global/jour en appels et en coût estimé ;
 *  - cache par clé = hash(contenu + version de prompt + périmètre d'accès) ;
 *  - journalisation via `AiJournal` : modèle, version, durée, tokens, coût — JAMAIS le texte.
 * La file (BullMQ côté worker) appelle ce runner ; il ne publie rien lui-même : la
 * publication d'un résultat tardif est recontrôlée par l'appelant (autorisation actuelle).
 */
import { createHash } from 'node:crypto';
import { AiError, toAiError } from '../errors.js';
import type { AiCall, AiUsage, CallOptions } from '../providers.js';

export interface AiTaskSpec<T> {
  /** Type de tâche (ex. moderation.text, vision.mission). */
  kind: string;
  provider: string;
  promptVersion: string;
  /** Sujet traité (message, média…) pour l'invalidation. */
  subject: { type: string; id: string };
  /** Auteur du contenu (plafond utilisateur, invalidation sur retrait de consentement). */
  userId: string | null;
  /** Relation concernée (plafond relation, invalidation sur blocage). */
  contextId: string | null;
  /** Empreinte du contenu (jamais le contenu) + périmètre d'accès → clé de cache. */
  contentHash: string;
  accessScope: string;
  /** Cache autorisé et durée de validité (ms). 0 = pas de cache. */
  cacheTtlMs: number;
  call: (opts: CallOptions) => Promise<AiCall<T>>;
  /** Validation finale (Zod) de la valeur mise en cache ou relue. */
  validate: (v: unknown) => T;
}

export interface AiLimits {
  timeoutMs: number;
  maxAttempts: number;
  backoffBaseMs: number;
  breakerThreshold: number;
  breakerCooldownMs: number;
  perUserPerDay: number;
  perContextPerDay: number;
  globalCallsPerDay: number;
  globalCostMicrosPerDay: number;
}

export const DEFAULT_AI_LIMITS: AiLimits = {
  timeoutMs: 20_000,
  maxAttempts: 3,
  backoffBaseMs: 500,
  breakerThreshold: 5,
  breakerCooldownMs: 60_000,
  perUserPerDay: 400,
  perContextPerDay: 600,
  globalCallsPerDay: 200_000,
  globalCostMicrosPerDay: 50_000_000,
};

export interface JournalEntry {
  jobKey: string;
  kind: string;
  provider: string;
  promptVersion: string;
  subjectType: string;
  subjectId: string;
  userId: string | null;
  contextId: string | null;
}

/** Persistance du journal / cache / compteurs (Prisma côté API ; mémoire en test). */
export interface AiJournal {
  /** Résultat validé en cache pour cette clé (non invalidé, non expiré), sinon null. */
  cached(jobKey: string, now: Date): Promise<unknown | null>;
  /**
   * Enregistre le début d'une NOUVELLE exécution (l'appelant a revérifié l'autorisation actuelle).
   * Renvoie false si une annulation explicite est en attente pour cette clé.
   */
  start(e: JournalEntry, now: Date): Promise<boolean>;
  succeed(jobKey: string, usage: AiUsage, attempts: number, output: unknown, expiresAt: Date | null, now: Date): Promise<void>;
  fail(jobKey: string, code: string, attempts: number, usage: Partial<AiUsage>, now: Date): Promise<void>;
  /** Incrémente atomiquement les compteurs et renvoie false si un plafond est dépassé. */
  reserve(keys: { key: string; limit: number }[], costLimit: { key: string; limitMicros: number }, day: string): Promise<boolean>;
  addCost(key: string, day: string, costMicros: number): Promise<void>;
  isCancelled(jobKey: string): Promise<boolean>;
}

export interface RunnerDeps {
  journal: AiJournal;
  limits: AiLimits;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
  /** Horloge monotone du circuit breaker (temps réel, indépendant de l'horloge métier). */
  monoMs?: () => number;
}

class CircuitBreaker {
  private failures = 0;
  private openUntil = 0;
  constructor(
    private readonly threshold: number,
    private readonly cooldownMs: number,
  ) {}
  check(nowMs: number) {
    if (this.openUntil > nowMs) throw new AiError('CIRCUIT_OPEN', 'fournisseur temporairement coupé');
  }
  success() {
    this.failures = 0;
    this.openUntil = 0;
  }
  failure(nowMs: number) {
    this.failures++;
    if (this.failures >= this.threshold) this.openUntil = nowMs + this.cooldownMs;
  }
  get state() {
    return { failures: this.failures, open: this.openUntil > 0 };
  }
}

export function jobKeyOf(kind: string, promptVersion: string, contentHash: string, accessScope: string): string {
  return createHash('sha256').update(`${kind}\n${promptVersion}\n${contentHash}\n${accessScope}`).digest('hex');
}

export function sha256(data: string | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

export class AiRunner {
  private readonly breakers = new Map<string, CircuitBreaker>();
  constructor(private readonly d: RunnerDeps) {}

  private mono(): number {
    return this.d.monoMs ? this.d.monoMs() : performance.now();
  }

  breaker(provider: string): CircuitBreaker {
    let b = this.breakers.get(provider);
    if (!b) this.breakers.set(provider, (b = new CircuitBreaker(this.d.limits.breakerThreshold, this.d.limits.breakerCooldownMs)));
    return b;
  }

  async run<T>(t: AiTaskSpec<T>): Promise<{ value: T; cached: boolean; jobKey: string }> {
    // Périmètre d'accès = auteur + relation + portée : aucune annulation/cache ne fuit entre personnes.
    const jobKey = jobKeyOf(t.kind, t.promptVersion, t.contentHash, `${t.accessScope}|u:${t.userId ?? '-'}|c:${t.contextId ?? '-'}`);
    const now = this.d.now();
    if (t.cacheTtlMs > 0) {
      const hit = await this.d.journal.cached(jobKey, now);
      if (hit !== null) {
        try {
          return { value: t.validate(hit), cached: true, jobKey };
        } catch {
          // cache non conforme (ancienne version) : on recalcule
        }
      }
    }
    const lim = this.d.limits;
    this.breaker(t.provider).check(this.mono());
    const day = now.toISOString().slice(0, 10);
    const keys = [{ key: `global:${day}`, limit: lim.globalCallsPerDay }];
    if (t.userId) keys.push({ key: `user:${t.userId}:${day}`, limit: lim.perUserPerDay });
    if (t.contextId) keys.push({ key: `ctx:${t.contextId}:${day}`, limit: lim.perContextPerDay });
    if (!(await this.d.journal.reserve(keys, { key: `cost:${day}`, limitMicros: lim.globalCostMicrosPerDay }, day))) throw new AiError('BUDGET_EXCEEDED', 'plafond IA atteint');
    if (!(await this.d.journal.start({ jobKey, kind: t.kind, provider: t.provider, promptVersion: t.promptVersion, subjectType: t.subject.type, subjectId: t.subject.id, userId: t.userId, contextId: t.contextId }, now))) {
      throw new AiError('CANCELLED', 'tâche annulée');
    }

    let attempt = 0;
    let last: AiError | null = null;
    while (attempt < lim.maxAttempts) {
      attempt++;
      if (await this.d.journal.isCancelled(jobKey)) {
        last = new AiError('CANCELLED', 'tâche annulée');
        break;
      }
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), lim.timeoutMs);
      try {
        const res = await Promise.race([
          t.call({ signal: ctrl.signal }),
          new Promise<never>((_, rej) => ctrl.signal.addEventListener('abort', () => rej(new AiError('TIMEOUT', 'délai de tâche dépassé')), { once: true })),
        ]);
        clearTimeout(timer);
        const value = t.validate(res.value);
        // Résultat tardif : annulé pendant l'appel (retrait de consentement, blocage, suppression) → jeté.
        if (await this.d.journal.isCancelled(jobKey)) throw new AiError('CANCELLED', 'résultat tardif ignoré');
        this.breaker(t.provider).success();
        const finished = this.d.now();
        await this.d.journal.addCost(`cost:${day}`, day, res.usage.costMicros);
        await this.d.journal.succeed(jobKey, res.usage, attempt, value, t.cacheTtlMs > 0 ? new Date(finished.getTime() + t.cacheTtlMs) : null, finished);
        return { value, cached: false, jobKey };
      } catch (e) {
        clearTimeout(timer);
        last = toAiError(e, t.provider);
        if (last.code === 'CANCELLED') break;
        if (last.code !== 'REFUSED' && last.code !== 'INVALID_FORMAT') this.breaker(t.provider).failure(this.mono());
        if (!last.retryable || attempt >= lim.maxAttempts) break;
        await this.d.sleep(lim.backoffBaseMs * 2 ** (attempt - 1));
      }
    }
    await this.d.journal.fail(jobKey, last?.code ?? 'PROVIDER_ERROR', attempt, { provider: t.provider, promptVersion: t.promptVersion }, this.d.now());
    throw last ?? new AiError('PROVIDER_ERROR', 'échec');
  }
}

/** Journal en mémoire (tests unitaires, évaluations). */
export class MemoryAiJournal implements AiJournal {
  readonly entries = new Map<string, { e: JournalEntry; status: string; output?: unknown; expiresAt?: Date | null; usage?: Partial<AiUsage>; attempts?: number; code?: string }>();
  readonly counters = new Map<string, number>();
  readonly cancelled = new Set<string>();
  readonly cancelledDuringRun = new Set<string>();
  async cached(k: string, now: Date) {
    const x = this.entries.get(k);
    return x && x.status === 'SUCCEEDED' && (!x.expiresAt || x.expiresAt > now) ? (x.output ?? null) : null;
  }
  async start(e: JournalEntry) {
    if (this.cancelled.has(e.jobKey)) return false;
    this.cancelledDuringRun.delete(e.jobKey);
    this.entries.set(e.jobKey, { e, status: 'RUNNING' });
    return true;
  }
  async succeed(k: string, usage: AiUsage, attempts: number, output: unknown, expiresAt: Date | null) {
    const x = this.entries.get(k)!;
    Object.assign(x, { status: 'SUCCEEDED', usage, attempts, output, expiresAt });
  }
  async fail(k: string, code: string, attempts: number, usage: Partial<AiUsage>) {
    const x = this.entries.get(k);
    if (x) Object.assign(x, { status: 'FAILED', code, attempts, usage });
  }
  async reserve(keys: { key: string; limit: number }[], cost: { key: string; limitMicros: number }) {
    if ((this.counters.get(cost.key) ?? 0) >= cost.limitMicros) return false;
    if (keys.some((k) => (this.counters.get(k.key) ?? 0) >= k.limit)) return false;
    for (const k of keys) this.counters.set(k.key, (this.counters.get(k.key) ?? 0) + 1);
    return true;
  }
  async addCost(key: string, _day: string, c: number) {
    this.counters.set(key, (this.counters.get(key) ?? 0) + c);
  }
  async isCancelled(k: string) {
    return this.cancelled.has(k) || this.cancelledDuringRun.has(k);
  }
}
