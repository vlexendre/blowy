/** Relais same-origin (CSP connect-src 'self') de l'abonnement Web Push vers l'API ; rien n'est journalisé. */
import { GuardianTokenSchema } from '@blowy/api-contract';
import { publicApi } from '../../../../lib/api';

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const headers = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' };
  if (!GuardianTokenSchema.safeParse(token).success) return new Response(null, { status: 404, headers });
  let body: { subscription?: { endpoint?: unknown } };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(null, { status: 400, headers });
  }
  const endpoint = body.subscription?.endpoint;
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://') || endpoint.length > 2048) return new Response(null, { status: 400, headers });
  const r = await publicApi('POST', `/v1/public/guardian/${token}/push`, { body: { subscription: { endpoint } }, forwardedFor: req.headers.get('x-forwarded-for') });
  return new Response(null, { status: r.ok ? 204 : r.status === 404 ? 404 : 502, headers });
}
