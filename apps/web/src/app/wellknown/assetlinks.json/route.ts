/**
 * Digital Asset Links (Android App Links blowy.app). Empreintes SHA-256 du certificat de
 * signature requises : absentes → 404 en production ; hors production, liste vide explicite.
 */
import { IS_LOCAL } from '../../../lib/config';

export const dynamic = 'force-dynamic';

export function GET() {
  const prints = (process.env.ANDROID_SHA256_FINGERPRINTS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!prints.length && !IS_LOCAL) return new Response('ANDROID_SHA256_FINGERPRINTS non configuré', { status: 404 });
  const body = [{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: process.env.ANDROID_PACKAGE ?? 'app.blowy', sha256_cert_fingerprints: prints } }];
  return Response.json(body, { headers: { 'cache-control': 'public, max-age=3600' } });
}
