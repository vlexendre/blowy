/** Aiguillage de démarrage : onboarding repris là où il s'était arrêté, sinon le Nid. */
import { LoadingState } from '@blowy/ui-mobile';
import { Redirect } from 'expo-router';
import { paths } from '../src/core/navigation/paths';
import { useSession } from '../src/core/session/session-store';
import { resumeStep, routeFor, useOnboarding } from '../src/features/onboarding';
import { t } from '../src/i18n';

export default function Index() {
  const session = useSession((s) => s.status);
  const draft = useOnboarding();
  if (session === 'unknown' || !draft.hydrated) return <LoadingState label={t('common.loading')} />;
  if (draft.completed && session === 'signedIn') return <Redirect href={paths.nest} />;
  return <Redirect href={routeFor(resumeStep(draft, session === 'signedIn')) as never} />;
}
