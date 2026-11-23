/**
 * Liens reçus par le système (iOS, Android) : liens universels https://minimoa.app/…, liens d'app Android, schémas
 * `minimoa://` et `blowy://`. Les adresses courtes (/i, /m, /r, /l, /plus, /carte…) deviennent des chemins de l'app ;
 * celles des écrans supprimés mènent à l'accueil ou à Moi (`src/features/notifications/url.ts`). Un écran qui demande
 * un compte attend la fin du démarrage ou de l'inscription (`useDeepLink`, ouvert par les onglets). Tableau des chemins : docs/DEEPLINKS.md.
 */
import { useDeepLink } from '@/features/notifications/deeplink';
import { captureUrl } from '@/features/growth/attribution';
import { routeIncomingUrl } from '@/features/notifications/url';

export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }): string {
  try {
    // Source d'arrivée (créateur, 3 mots, groupe, invitation) : gardée avant l'inscription (docs/VIRALITE.md).
    captureUrl(path);
    const state = useDeepLink.getState();
    const { open, park } = routeIncomingUrl(path, { initial, ready: state.ready });
    if (park) state.park(park);
    return open;
  } catch {
    return path;
  }
}
