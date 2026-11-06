/**
 * Aiguillage de démarrage : profil serveur onboardé → Accueil ; sinon onboarding repris là où il
 * s'était arrêté (brouillon local persistant).
 */
import { Redirect } from 'expo-router';
import { paths } from '../src/core/navigation/paths';
import { useSession } from '../src/core/session/session-store';
import { useMe } from '../src/features/account';
import { useOnboarding } from '../src/features/onboarding';
import { LoadingScreen } from '../src/features/system';

export default function Index() {
  const session = useSession((s) => s.status);
  const draft = useOnboarding();
  const me = useMe();
  if (!draft.hydrated || (session === 'signedIn' && me.isLoading)) return <LoadingScreen />;
  if (session === 'signedIn' && me.data?.onboarded) return <Redirect href={paths.home} />;
  if (session === 'signedIn' && draft.completed) return <Redirect href={paths.found} />;
  return <Redirect href={paths.onboarding(draft.step)} />;
}
