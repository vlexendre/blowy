/**
 * apple-app-site-association (Universal Links blowy.app) — servi en JSON sans extension, sans
 * redirection. APPLE_TEAM_ID requis : absent → 404 en production (jamais un faux Team ID),
 * valeur de démonstration explicite hors production.
 */
import { IS_LOCAL } from '../../../lib/config';

export const dynamic = 'force-dynamic';

export function GET() {
  const team = process.env.APPLE_TEAM_ID || (IS_LOCAL ? 'LOCALTEAMID' : '');
  if (!team) return new Response('APPLE_TEAM_ID non configuré', { status: 404 });
  const ids = (process.env.IOS_BUNDLE_IDS ?? 'app.blowy').split(',').map((s) => `${team}.${s.trim()}`).filter(Boolean);
  const body = {
    applinks: {
      details: [{ appIDs: ids, components: [{ '/': '/invite/*', comment: 'Invitations' }, { '/': '/r/*' }, { '/': '/c/*' }] }],
    },
    webcredentials: { apps: ids },
  };
  return Response.json(body, { headers: { 'cache-control': 'public, max-age=3600' } });
}
