/** Aiguillage de lancement : selon la session, on part vers l'inscription, la fin du profil ou l'app. */
import { space } from '@blowy/tokens';
import { EmptyState, PetEntrance, ScreenTemplate, Text } from '@blowy/ui';
import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { usePendingInvite } from '@/features/encounters';
import { resumeOnboarding, useDraft } from '@/features/onboarding';
import { useGate, useRetryGate } from '@/features/session';
import { common } from '@/locales/common';

export default function Gate() {
  const gate = useGate();
  const retry = useRetryGate();
  const species = useDraft((d) => d.species);
  const pendingInvite = usePendingInvite((p) => p.code);

  switch (gate) {
    case 'signedOut':
      return <Redirect href="/(onboarding)/welcome" />;
    case 'needsOnboarding':
      // Un compte sans pet doit d'abord le créer ; si le brouillon est complet, on reprend à la préparation.
      return <Redirect href={resumeOnboarding()} />;
    case 'ready':
      return pendingInvite ? <Redirect href={{ pathname: '/i/[code]', params: { code: pendingInvite } }} /> : <Redirect href="/(tabs)/pet" />;
    case 'offline':
      return (
        <ScreenTemplate scroll={false}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState peek species={species} mood="triste" title={common.offlineTitle.toUpperCase()} text={common.offlineText} actionLabel={common.retry} onAction={retry} />
          </View>
        </ScreenTemplate>
      );
    default:
      return (
        <ScreenTemplate scroll={false}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg }} accessibilityLabel={common.gate.sleeping} accessible>
            {/* Le pet arrive en courant et se pose ; la navigation n'attend pas la fin. */}
            <PetEntrance species={species} size={180} />
            <Text muted center>
              {common.gate.sleeping}
            </Text>
          </View>
        </ScreenTemplate>
      );
  }
}
