/**
 * Adaptateur Veriff RÉEL (documentation devdocs.veriff.com consultée le 2026-11-01) :
 *  - POST {base}/v1/sessions, en-têtes `X-AUTH-CLIENT: <clé API>`, `Content-Type: application/json`
 *    (POST /sessions ne requiert pas de signature) ; corps `{ verification: { callback, vendorData,
 *    endUserId } }` — uniquement des identifiants NON sémantiques (aucun nom ni date de naissance
 *    envoyés) ; réponse `{ status: 'success', verification: { id, url, sessionToken } }` ;
 *  - webhook de décision : en-tête `X-HMAC-SIGNATURE` = HMAC-SHA256 hex minuscule du CORPS BRUT
 *    avec la clé secrète partagée ; `X-AUTH-CLIENT` = clé API ;
 *  - décision : `verification.status ∈ approved | declined | resubmission_requested | review |
 *    expired | abandoned`, `verification.code`, `verification.vendorData`, `decisionTime`,
 *    `person.dateOfBirth` (utilisée uniquement pour le contrôle 18+, jamais stockée).
 * L'URL de base est fournie par configuration (l'intégration Veriff indique l'URL API).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { IdentityVerificationProvider, VerificationDecision, VerificationSessionCreated } from '../../../shared/application/ports/identity-verification.port.js';

export interface VeriffConfig {
  apiKey: string;
  sharedSecret: string;
  baseUrl: string;
  callbackUrl: string;
  environment: 'PRODUCTION' | 'SANDBOX';
  fetch?: typeof fetch;
  timeoutMs?: number;
}

const SessionResponseSchema = z.object({
  status: z.literal('success'),
  verification: z.object({ id: z.string().min(8), url: z.string().url() }).passthrough(),
});

const DecisionSchema = z
  .object({
    status: z.string(),
    verification: z
      .object({
        id: z.string(),
        attemptId: z.string().nullish(),
        code: z.number().int().nullish(),
        status: z.string(),
        reason: z.string().nullish(),
        reasonCode: z.union([z.number(), z.string()]).nullish(),
        vendorData: z.string().nullish(),
        endUserId: z.string().nullish(),
        decisionTime: z.string().nullish(),
        acceptanceTime: z.string().nullish(),
        person: z.object({ dateOfBirth: z.string().nullish() }).passthrough().nullish(),
      })
      .passthrough(),
  })
  .passthrough();

export function veriffSignature(secret: string, payload: Buffer | string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export class VeriffIdentityProvider implements IdentityVerificationProvider {
  readonly name = 'veriff' as const;
  readonly environment: 'PRODUCTION' | 'SANDBOX';
  constructor(private readonly cfg: VeriffConfig) {
    this.environment = cfg.environment;
  }

  async createSession(input: { localSessionId: string }, signal?: AbortSignal): Promise<VerificationSessionCreated> {
    const body = JSON.stringify({ verification: { callback: this.cfg.callbackUrl, vendorData: input.localSessionId, endUserId: input.localSessionId } });
    const f = this.cfg.fetch ?? fetch;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.cfg.timeoutMs ?? 10_000);
    signal?.addEventListener('abort', () => ctrl.abort(), { once: true });
    try {
      const res = await f(`${this.cfg.baseUrl.replace(/\/$/, '')}/v1/sessions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-auth-client': this.cfg.apiKey },
        body,
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`veriff_session_http_${res.status}`);
      const text = await res.text();
      // La réponse est signée : on vérifie la signature si elle est présente.
      const sig = res.headers.get('x-hmac-signature');
      if (sig && !this.safeEqual(sig, veriffSignature(this.cfg.sharedSecret, text))) throw new Error('veriff_session_bad_signature');
      const parsed = SessionResponseSchema.parse(JSON.parse(text));
      return { providerRef: parsed.verification.id, sessionUrl: parsed.verification.url };
    } finally {
      clearTimeout(t);
    }
  }

  private safeEqual(a: string, b: string): boolean {
    const x = Buffer.from(a.trim().toLowerCase(), 'utf8');
    const y = Buffer.from(b.trim().toLowerCase(), 'utf8');
    return x.length === y.length && timingSafeEqual(x, y);
  }

  verifyWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): boolean {
    const h = (k: string) => {
      const v = headers[k];
      return Array.isArray(v) ? v[0] : v;
    };
    const sig = h('x-hmac-signature');
    const client = h('x-auth-client');
    if (!sig || !client || client !== this.cfg.apiKey) return false;
    return this.safeEqual(sig, veriffSignature(this.cfg.sharedSecret, rawBody));
  }

  parseDecision(body: unknown): VerificationDecision | null {
    const p = DecisionSchema.safeParse(body);
    if (!p.success) return null;
    const v = p.data.verification;
    return {
      providerRef: v.id,
      eventId: `${v.id}:${v.attemptId ?? ''}:${v.status}:${v.decisionTime ?? ''}`,
      status: v.status,
      code: v.code ?? null,
      vendorData: v.vendorData ?? null,
      decisionTime: v.decisionTime ?? null,
      dateOfBirth: v.person?.dateOfBirth ?? null,
      reasonCode: v.reasonCode !== undefined && v.reasonCode !== null ? String(v.reasonCode) : null,
    };
  }
}
