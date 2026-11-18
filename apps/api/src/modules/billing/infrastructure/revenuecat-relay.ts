/**
 * Port `AppleNotificationRelay` : relais des notifications App Store Server V2 vers RevenueCat (tableaux de bord
 * seulement, aucun SDK dans l'app ; docs/BLOWY-PLUS.md §6).
 * - réel `HttpAppleNotificationRelay` : POST du corps reçu, tel quel, délai de 5 s, un nouvel essai sur erreur réseau,
 *   délai dépassé ou réponse 5xx ; ne lève jamais ; journalise l'échec sans le contenu (ni jeton ni transaction) ;
 * - mémoire `MemoryAppleNotificationRelay` : garde les envois (tests, local), peut simuler une panne ;
 * - `DisabledAppleNotificationRelay` : sans `REVENUECAT_APPLE_NOTIFICATIONS_URL`, rien ne part.
 */
import { Logger } from '@nestjs/common';
import type { AppleNotificationRelay } from '../ports';

export interface HttpRelayOptions {
  url: string;
  /** Délai de chaque essai (défaut 5 s). */
  timeoutMs?: number;
  /** Nouveaux essais après le premier (défaut 1). */
  retries?: number;
  fetch?: typeof fetch;
  logger?: Pick<Logger, 'warn'>;
}

export class HttpAppleNotificationRelay implements AppleNotificationRelay {
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly doFetch: typeof fetch;
  private readonly logger: Pick<Logger, 'warn'>;
  /** Hôte seulement dans les journaux : le chemin de l'URL de RevenueCat contient un identifiant de l'app. */
  private readonly host: string;

  constructor(private readonly options: HttpRelayOptions) {
    this.timeoutMs = options.timeoutMs ?? 5_000;
    this.retries = options.retries ?? 1;
    this.doFetch = options.fetch ?? fetch;
    this.logger = options.logger ?? new Logger('RevenueCat');
    this.host = new URL(options.url).host;
  }

  async forward(rawBody: string): Promise<void> {
    let last = '';
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const res = await this.doFetch(this.options.url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: rawBody,
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        await res.body?.cancel().catch(() => undefined);
        if (res.ok) return;
        last = `HTTP ${res.status}`;
        // 4xx : la même requête échouerait encore (URL ou réglage RevenueCat) ; pas de nouvel essai.
        if (res.status < 500) break;
      } catch (err) {
        last = err instanceof Error ? (err.name === 'TimeoutError' ? `délai de ${this.timeoutMs} ms dépassé` : err.name) : 'erreur inconnue';
      }
    }
    this.logger.warn(`relais de la notification Apple vers ${this.host} en échec (${last}) ; notre traitement n'est pas touché`);
  }
}

export class MemoryAppleNotificationRelay implements AppleNotificationRelay {
  /** Corps relayés (ou tentés, si `failing`), dans l'ordre. */
  readonly sent: { url: string; body: string; ok: boolean }[] = [];
  /**
   * Simule le pire : l'envoi est noté en échec et la promesse est rejetée (le port promet de ne jamais lever ; la route
   * s'en garde quand même). Sert à vérifier qu'une panne du relais ne touche pas notre traitement.
   */
  failing = false;

  constructor(readonly url: string) {}

  async forward(rawBody: string): Promise<void> {
    this.sent.push({ url: this.url, body: rawBody, ok: !this.failing });
    if (this.failing) throw new Error('relais en panne (simulé)');
  }
}

export class DisabledAppleNotificationRelay implements AppleNotificationRelay {
  async forward(): Promise<void> {
    /* REVENUECAT_APPLE_NOTIFICATIONS_URL absente : rien n'est relayé. */
  }
}
