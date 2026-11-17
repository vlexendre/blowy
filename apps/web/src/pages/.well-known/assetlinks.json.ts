import type { APIRoute } from 'astro';
import { ANDROID_SHA256, androidAssetLinks } from '../../config/apple';

/** Liens d'app Android vérifiés (`autoVerify`, apps/mobile/app.config.ts) : empreintes lues dans `ANDROID_SHA256`. */
export const prerender = true;

export const GET: APIRoute = () => {
  const links = androidAssetLinks();
  if (ANDROID_SHA256 && links.length === 0) {
    console.warn('[assetlinks.json] ANDROID_SHA256 illisible (attendu : AA:BB:… sur 32 octets, séparées par des virgules).');
  }
  return new Response(JSON.stringify(links, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
