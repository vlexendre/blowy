import { router } from 'expo-router';
import { paths } from '../../src/core/navigation/paths';
import { DevLoginScreen } from '../../src/features/account';
import { useOnboarding } from '../../src/features/onboarding';

/** Connexion locale (comptes de démo) — visible seulement en mode auth local hors production. */
export default function DevLoginRoute() {
  const patch = useOnboarding((s) => s.patch);
  return (
    <DevLoginScreen
      onSignedIn={(onboardingRequired) => {
        if (onboardingRequired) {
          router.replace(paths.root);
          return;
        }
        patch({ completed: true, petCreated: true });
        router.replace(paths.nest);
      }}
    />
  );
}
