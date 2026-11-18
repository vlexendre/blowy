import type { APIRoute } from 'astro';
import { appSiteAssociation } from '../config/apple';

/** Même fichier qu'à `/.well-known/apple-app-site-association` (anciens appareils, outils de vérification). */
export const prerender = true;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(appSiteAssociation(), null, 2), { headers: { 'Content-Type': 'application/json' } });
