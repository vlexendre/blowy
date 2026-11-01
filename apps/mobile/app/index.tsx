/**
 * Aiguillage de démarrage : profil serveur onboardé → Nid ; sinon onboarding repris là où il
 * s'était arrêté (brouillon local persistant).
 */
import { LoadingState } from '@blowy/ui-mobile';
import { Redirect } from 'expo-router';
import { paths } from '../src/core/navigation/paths';
import { useSession } from '../src/core/session/session-store';
import { useMe } from '../src/features/account';
import { resumeStep, routeFor, useOnboarding } from '../src/features/onboarding';
import { t } from '../src/i18n';

export default function Index() {
  const session = useSession((s) => s.status);
  const draft = useOnboarding();
  const me = useMe();
  if (session === 'unknown' || !draft.hydrated || (session === 'signedIn' && me.isLoading)) return <LoadingState label={t('common.loading')} />;
  if (session === 'signedIn' && (me.data?.onboarded || draft.completed)) return <Redirect href={paths.nest} />;
  return <Redirect href={routeFor(resumeStep(draft, session === 'signedIn')) as never} />;
}
