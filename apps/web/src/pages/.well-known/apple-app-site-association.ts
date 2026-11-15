import type { APIRoute } from 'astro';
import { APPLE_TEAM_ID, appSiteAssociation, teamIdValid } from '../../config/apple';

/** Fichier statique généré au build (Cloudflare Pages le sert en JSON : `public/_headers`). */
export const prerender = true;

export const GET: APIRoute = () => {
  if (!teamIdValid(APPLE_TEAM_ID)) {
    console.warn(
      '[apple-app-site-association] APPLE_TEAM_ID absent ou invalide : liens universels désactivés (aucune app déclarée). ' +
        'À définir dans les variables du build avant la soumission (docs/APP-STORE-CONNECT.md).',
    );
  }
  return new Response(JSON.stringify(appSiteAssociation(), null, 2), { headers: { 'Content-Type': 'application/json' } });
};
