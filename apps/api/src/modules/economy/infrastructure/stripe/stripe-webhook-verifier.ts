/**
 * Vérificateur du webhook Stripe : signature sur le corps brut (stripe-signature.ts), puis forme
 * minimale de l'événement (Zod). `client_secret` est retiré de la copie conservée en base.
 */
import { z } from 'zod';
import { AppError } from '../../../../shared/domain/errors.js';
import type { SignedWebhookVerifier, VerifiedProviderEvent } from '../../application/payments/ports.js';
import { verifyStripeSignature } from './stripe-signature.js';

const EventSchema = z.object({
  id: z.string().min(1).max(255),
  type: z.string().min(1).max(255),
  created: z.number().int().nonnegative(),
  livemode: z.boolean(),
  data: z.object({ object: z.record(z.string(), z.unknown()) }),
});

const SECRET_FIELDS = new Set(['client_secret']);
export function redactStripePayload(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(redactStripePayload);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, SECRET_FIELDS.has(k) ? '[redacted]' : redactStripePayload(x)]));
  return v;
}

const invalidSignature = () => new AppError('UNAUTHENTICATED', 'Webhook non authentifié.', { detailsSafe: { reason: 'WEBHOOK_SIGNATURE_INVALID' } });

export class StripeWebhookVerifier implements SignedWebhookVerifier {
  constructor(
    private readonly secret: string | null,
    private readonly toleranceSeconds: number,
    /** En production, un événement `livemode=false` (mode test) est refusé. */
    private readonly requireLivemode: boolean,
  ) {}

  verify(rawBody: Buffer, signatureHeader: string | undefined, now: Date): VerifiedProviderEvent {
    if (!this.secret) throw invalidSignature();
    const r = verifyStripeSignature({ secret: this.secret, rawBody, header: signatureHeader, nowMs: now.getTime(), toleranceSeconds: this.toleranceSeconds });
    if (!r.ok) throw invalidSignature();
    let json: unknown;
    try {
      json = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new AppError('VALIDATION_FAILED', 'Corps de webhook invalide', { detailsSafe: { reason: 'MALFORMED_EVENT' } });
    }
    const e = EventSchema.safeParse(json);
    if (!e.success) throw new AppError('VALIDATION_FAILED', 'Événement Stripe invalide', { detailsSafe: { reason: 'MALFORMED_EVENT' } });
    if (this.requireLivemode && !e.data.livemode) throw new AppError('PRECONDITION_FAILED', 'Événement de test refusé en production', { detailsSafe: { reason: 'TEST_MODE_EVENT' } });
    return { id: e.data.id, type: e.data.type, createdAt: new Date(e.data.created * 1000), livemode: e.data.livemode, object: e.data.data.object, redacted: redactStripePayload(json) };
  }
}
