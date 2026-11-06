/**
 * Réécriture des liens système (universels https://blowy.app/..., schéma blowy://, widget)
 * vers les routes internes. Ne lève jamais : un lien inconnu mène au Nid.
 */
import { resolveIncomingUrl } from '../src/core/navigation/paths';

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    // Liens du development client : ne pas réécrire.
    if (path.includes('expo-development-client')) return path;
    const url = /^[a-z][a-z0-9+.-]*:/i.test(path) ? path : `https://blowy.app${path.startsWith('/') ? '' : '/'}${path}`;
    return resolveIncomingUrl(url);
  } catch {
    return '/home';
  }
}
