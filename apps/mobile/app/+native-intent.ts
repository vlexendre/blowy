/**
 * Liens reçus par le système (iOS, Android) : liens universels https://minimoa.app/…, liens d'app Android, schémas
 * `minimoa://` et `blowy://`. Les adresses courtes (/i, /m, /g, /r, /l, /plus, /defi, /habitudes, /carte) deviennent
 * des chemins de l'app ; un écran qui demande un compte attend la fin du démarrage ou de l'inscription
 * (`useDeepLink`, ouvert par les onglets). Tableau des chemins : docs/DEEPLINKS.md.
 */
import { useDeepLink } from '@/features/notifications/deeplink';
import { routeIncomingUrl } from '@/features/notifications/url';

export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }): string {
  try {
    const state = useDeepLink.getState();
    const { open, park } = routeIncomingUrl(path, { initial, ready: state.ready });
    if (park) state.park(park);
    return open;
  } catch {
    return path;
  }
}
